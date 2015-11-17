define(["underscore", "jquery", "jstree", "layout", "context_menu_for_tree_view"], function (_, $, jstree, layout, context_menu_for_tree_view_module) {
   'use strict';

   var DebuggeeTrackerView = function (debuggee_tracker, thread_follower) {  //TODO thread_follower is a hack
      this.super("DebuggeeTrackerView");

      this.thread_follower = thread_follower;

      this._$container = $('<div style="height: 100%; width: 100%"></div>');
      this._$out_of_dom = this._$container;

      this.debuggee_tracker = debuggee_tracker;
      this.debuggee_tracker.add_observer(this);

      this.update_tree_data_debounced = _.debounce(_.bind(this.update_tree_data, this), 500);

      var results = context_menu_for_tree_view_module.build_jstree_with_a_context_menu(this._$container, [
              this._get_ctxmenu_for_debuggee_tracker(),
              this._get_ctxmenu_for_debuggers(),
              this._get_ctxmenu_for_thread_groups(),
              this._get_ctxmenu_for_threads()
          ], 
          {
            'core' : {
              "animation" : false,
              "worker": true, 
              "multiple": false,
              "check_callback" : false,
              "themes" : { "url": false, "dots": true, "name": "default-dark", "stripped": true},
              "force_text": true,
              'data' : this.get_data(),
            },
          }
      );

      this._get_data_from_selected = results.getter_for_data_from_selected;

   };

   DebuggeeTrackerView.prototype.__proto__ = layout.Panel.prototype;

   DebuggeeTrackerView.prototype.update = function (data, topic, tracker) {
      this.update_tree_data_debounced();
   };

   DebuggeeTrackerView.prototype.update_tree_data = function () {
      var data = this.get_data();
      $(this._$container).jstree(true).settings.core.data = data;
      $(this._$container).jstree(true).refresh();
      
      if (!this._$out_of_dom) {
         this.repaint($(this.box));
      }
   };

   DebuggeeTrackerView.prototype.render = function() {
      if (this._$out_of_dom) {
         this._$out_of_dom.appendTo(this.box);
         this._$out_of_dom = null;
      }
      
   };

   DebuggeeTrackerView.prototype.unlink = function() {
      if (!this.$out_of_dom) {
         this.$out_of_dom = this._$container.detach();
      }
   };


   DebuggeeTrackerView.prototype.get_data = function () {
      var debuggee_tracker = this.debuggee_tracker;
      var debuggers_by_id =  debuggee_tracker.get_all_debuggers();

      var tree_data = _.map(debuggers_by_id, 
         function (debugger_obj) {   
            var thread_groups_by_id = debugger_obj.your_thread_groups_by_id();

            // first level
            return {text: debugger_obj.get_display_name(),
                    data: {debugger_id: debugger_obj.id},
                    icon: false,
                    children: _.map(thread_groups_by_id,
                           function (thread_group) {
                              
                              // second level          
                              return {text: thread_group.get_display_name(),
                                      data: {debugger_id: debugger_obj.id, thread_group_id: thread_group.id},
                                      icon: 'fa fa-bug',
                                      children: _.map(thread_group.your_threads_by_id(),
                                          function (thread) {

                                             // third level
                                             return {text: thread.get_display_name(),
                                                     data: {debugger_id: debugger_obj.id, thread_group_id: thread_group.id, thread_id: thread.id}};
                                          }, this)
                                     };
                           }, this)
                   };
         }, this);

      return tree_data;
   };

   DebuggeeTrackerView.prototype._get_ctxmenu_for_debuggee_tracker = function () {
      var self = this;
      return [{
               text: 'Add debugger',
               action: function (e) {
                  e.preventDefault();
                  self.debuggee_tracker.add_debugger();
               },
              }];
   };

   DebuggeeTrackerView.prototype._get_ctxmenu_for_debuggers = function () {
      var self = this;
      return [{
               text: 'Kill debugger',
               action: function (e) {
                  e.preventDefault();
                  var debugger_id = self._get_data_from_selected().debugger_id;
                  var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                  debugger_obj.kill();
               },
              },{
               text: 'Add thread group',
               action: function (e) {
                  e.preventDefault();
                  var debugger_id = self._get_data_from_selected().debugger_id;
                  var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                  debugger_obj.add_thread_group();
               },
              }];
   };

   DebuggeeTrackerView.prototype._get_ctxmenu_for_thread_groups = function () {
      var self = this;
      return [{
               text: 'Remove thread group',
               action: function (e) {
                  e.preventDefault();
                  var ids = self._get_data_from_selected();
                  var debugger_id = ids['debugger_id'];
                  var thread_group_id = ids['thread_group_id'];

                  var thread_group = self.debuggee_tracker.get_debugger_with_id(debugger_id).get_thread_group_with_id(thread_group_id);
                  thread_group.remove();
               },
              },{
               text: 'Load sources', //TODO attach (and others)
               action: function (e) {
                  e.preventDefault();
                  var ids = self._get_data_from_selected();
                  var debugger_id = ids['debugger_id'];
                  var thread_group_id = ids['thread_group_id'];

                  var thread_group = self.debuggee_tracker.get_debugger_with_id(debugger_id).get_thread_group_with_id(thread_group_id);

                  var input_file_dom = $('<input style="display:none;" type="file" />');
                  input_file_dom.change(function(evt) {
                      var file_exec_path = "" + $(this).val();
                      if (file_exec_path) {
                          thread_group.load_file_exec_and_symbols(file_exec_path);

                          // TODO XXX XXX  HACK, run the process
                          var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                          debugger_obj.execute("-break-insert", ["-t", "main"]); // TODO restrict this breakpoint to the threa group 
                          thread_group.execute("-exec-run");
                      }
                      else {
                          console.log("Loading nothing");
                      }
                  });
                  input_file_dom.trigger('click');
               },
              }];
   };

   DebuggeeTrackerView.prototype._get_ctxmenu_for_threads = function () {
      var self = this;
      return [{
               text: 'Follow',
               action: function (e) {
                  e.preventDefault();
                  var ids = self._get_data_from_selected();
                  var debugger_id = ids['debugger_id'];
                  var thread_group_id = ids['thread_group_id'];
                  var thread_id = ids['thread_id'];

                  var thread = self.debuggee_tracker.get_debugger_with_id(debugger_id).get_thread_group_with_id(thread_group_id).get_thread_with_id(thread_id);

                  self.thread_follower.follow(thread);
               },
              }];
   };

   return {DebuggeeTrackerView: DebuggeeTrackerView};
});
