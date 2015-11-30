define(["underscore", "jquery", "jstree", "layout", "jstree_attach_observable_getters", "shortcuts"], function (_, $, jstree, layout, jstree_attach_observable_getters, shortcuts) {
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

      this._jstree_key = shortcuts.randint().toString();
      var results = jstree_attach_observable_getters.build_jstree_with_observable_getters_attached(this._$container, [
            function (e, elem_owner) {
                return {observable: self, context: self};
            },
            function (e, elem_owner) {
                self._immediate_action_to_hack_jstree(e, elem_owner);
                var ids = self._get_data_from_selected();

                if (ids === null || ids === undefined) {
                    return null;
                }

                var debugger_id =  ids.debugger_id;
                var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                return {observable: debugger_obj, context: self};
            },
            function (e, elem_owner) {
                self._immediate_action_to_hack_jstree(e, elem_owner);
                var ids = self._get_data_from_selected();

                if (ids === null || ids === undefined) {
                    return null;
                }

                var debugger_id = ids['debugger_id'];
                var thread_group_id = ids['thread_group_id'];

                var thread_group = self.debuggee_tracker.get_debugger_with_id(debugger_id).get_thread_group_with_id(thread_group_id);
                return {observable: thread_group, context: self};
            },
            function (e, elem_owner) {
                self._immediate_action_to_hack_jstree(e, elem_owner);
                var ids = self._get_data_from_selected();

                if (ids === null || ids === undefined) {
                    return null;
                }

                var debugger_id = ids['debugger_id'];
                var thread_group_id = ids['thread_group_id'];
                var thread_id = ids['thread_id'];

                var thread = self.debuggee_tracker.get_debugger_with_id(debugger_id).get_thread_group_with_id(thread_group_id).get_thread_with_id(thread_id);
                return {observable: thread, context: self};
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
   };

   DebuggeeTrackerView.prototype.update_tree_data = function () {
      var self = this;

      var data = this.get_data_from_tracker();
      $(this._$container).jstree(true).settings.core.data = data;
      $(this._$container).jstree(true).load_node('#', function (x, is_loaded) {
          if (is_loaded) {
              $(self._$container).jstree(true).restore_state();
          }
      });

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
                              icon: 'fa fa-bug',
                              id: [this._jstree_key, debugger_obj.id, thread_group.id].join("_"),
                              children: _.map(thread_group.your_threads_by_id(),
                                  function (thread) {

                                     // third level
                                     return {
                                         text: thread.get_display_name(),
                                         data: {debugger_id: debugger_obj.id, thread_group_id: thread_group.id, thread_id: thread.id},
                                         id: [this._jstree_key, debugger_obj.id, thread_group.id, thread.id].join("_")
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
