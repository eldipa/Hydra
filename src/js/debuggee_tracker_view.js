define(["underscore", "jquery", "jstree", "layout", "jstree_builder", "shortcuts", "observation"], function (_, $, jstree, layout, jstree_builder, shortcuts, observation) {
   'use strict';

   var DebuggeeTrackerView = function (debuggee_tracker, thread_follower) {  //TODO thread_follower is a hack
      this.super("DebuggeeTrackerView");
      this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');

      this.thread_follower = thread_follower;

      this.debuggee_tracker = debuggee_tracker;
      this.debuggee_tracker.add_observer(this);

      this.update_tree_data_debounced = _.debounce(_.bind(this.update_tree_data, this), 500);

      this.build_tree();
   };

   DebuggeeTrackerView.prototype.__proto__ = layout.Panel.prototype;
   layout.implement_render_and_unlink_methods(DebuggeeTrackerView.prototype);

   DebuggeeTrackerView.prototype.update = function (data, topic, tracker) {
      this.update_tree_data_debounced();
   };

   DebuggeeTrackerView.prototype.build_tree = function () {
      var self = this;
      var Observation = observation.Observation;

      this._jstree_key = shortcuts.randint().toString();
      var results = jstree_builder.build_jstree_with_do_observation_functions_attached(this._$container, [
            function (e, elem_owner) {                              // Level 0: Debuggee Tracker itself
                return new Observation({target: self, context: self}); 
            },
            function (e, elem_owner) {                              // Level 1: Debuggers (GDB)
                self._immediate_action_to_hack_jstree(e, elem_owner);
                var ids = self._get_data_from_selected();

                if (ids === null || ids === undefined) {
                    return null;
                }

                var debugger_id =  ids.debugger_id;
                var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                return new Observation({target: debugger_obj, context: self});
            },
            function (e, elem_owner) {                              // Level 2: Thread Groups (processes)
                self._immediate_action_to_hack_jstree(e, elem_owner);
                var ids = self._get_data_from_selected();

                if (ids === null || ids === undefined) {
                    return null;
                }

                var debugger_id = ids['debugger_id'];
                var thread_group_id = ids['thread_group_id'];

                var thread_group = self.debuggee_tracker.get_debugger_with_id(debugger_id).get_thread_group_with_id(thread_group_id);
                return new Observation({target: thread_group, context: self});
            },
            function (e, elem_owner) {                              // Level 3: Threads
                self._immediate_action_to_hack_jstree(e, elem_owner);
                var ids = self._get_data_from_selected();

                if (ids === null || ids === undefined) {
                    return null;
                }

                var debugger_id = ids['debugger_id'];
                var thread_group_id = ids['thread_group_id'];
                var thread_id = ids['thread_id'];

                var thread = self.debuggee_tracker.get_debugger_with_id(debugger_id).get_thread_group_with_id(thread_group_id).get_thread_with_id(thread_id);
                return new Observation({target: thread, context: self});
            }
          ],
          {
            'core' : {
              "animation" : false,
              "worker": true, 
              "multiple": false,
              "check_callback" : false,
              "themes" : { "url": false, "dots": true, "name": "default-dark", "stripped": true},
              "force_text": true,
              'data' : this.get_data_from_tracker(),
            },
            "plugins" : ["state"],
            'state' : {
                "key": this._jstree_key,
                events: 'open_node.jstree close_node.jstree',
            }
          }
      );

      this._get_data_from_selected = results.getter_for_data_from_selected;
      this._immediate_action_to_hack_jstree = results.immediate_action_to_hack_jstree;
      this._update_tree_data = results.update_tree_data;
      this._is_loading_data_in_the_tree = results.is_loading_data_in_the_tree;
   };

   DebuggeeTrackerView.prototype.update_tree_data = function () {
      var data = this.get_data_from_tracker();
      this._update_tree_data(data);

      if (this.is_in_the_dom()) {
         this.repaint($(this.box));
      }
   };

   DebuggeeTrackerView.prototype.get_data_from_tracker = function () {
      var debuggee_tracker = this.debuggee_tracker;
      var debuggers_by_id =  debuggee_tracker.get_all_debuggers();

      var tree_data = _.map(debuggers_by_id, 
         function (debugger_obj) {   
            var thread_groups_by_id = debugger_obj.your_thread_groups_by_id();

            // first level
            return {
                text: debugger_obj.get_display_name(),
                data: {debugger_id: debugger_obj.id},
                icon: false,
                id: [this._jstree_key, debugger_obj.id].join("_"),
                children: _.map(thread_groups_by_id,
                       function (thread_group) {
                          
                          // second level          
                          return {
                              text: thread_group.get_display_name(),
                              data: {debugger_id: debugger_obj.id, thread_group_id: thread_group.id},
                              icon: false,
                              id: [this._jstree_key, debugger_obj.id, thread_group.id].join("_"),
                              children: _.map(thread_group.your_threads_by_id(),
                                  function (thread) {

                                     // third level
                                     return {
                                         text: thread.get_display_name(),
                                         data: {debugger_id: debugger_obj.id, thread_group_id: thread_group.id, thread_id: thread.id},
                                         id: [this._jstree_key, debugger_obj.id, thread_group.id, thread.id].join("_"),
                                         icon: (thread.state === "running")? 'fa fa-spinner fa-pulse' : 'fa fa-circle'
                                     };
                                  }, this)
                             };
                       }, this)
               };
         }, this);

      return tree_data;
   };

   DebuggeeTrackerView.prototype.get_display_controller = function () {
      var self = this;
      return [{
               text: 'Add debugger',
               action: function (e) {
                  e.preventDefault();
                  self.debuggee_tracker.add_debugger();
               },
              }];
   };

   return {DebuggeeTrackerView: DebuggeeTrackerView};
});
