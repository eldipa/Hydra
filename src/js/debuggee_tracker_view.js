define(["underscore", "jquery", "jstree", "layout"], function (_, $, jstree, layout) {
   'use strict';

   var DebuggeeTrackerView = function (debuggee_tracker, thread_follower) {  //TODO thread_follower is a hack
      this.super("DebuggeeTrackerView");

      this.thread_follower = thread_follower;

      this._$container = $('<div style="height: 100%; width: 100%"></div>');
      this._$out_of_dom = this._$container;

      this.debuggee_tracker = debuggee_tracker;
      this.debuggee_tracker.add_observer(this);

      this.update_tree_data_debounced = _.debounce(_.bind(this.update_tree_data, this), 500);

      var _attach_ctxmenu_safe = _.throttle(_.bind(this._attach_ctxmenu, this), 500);
      this._$container.on("after_open.jstree", function () {
            _attach_ctxmenu_safe();
         }).on("redraw.jstree", function () {
            _attach_ctxmenu_safe();
         }).jstree({
        'core' : {
          "animation" : false,
          "worker": true, 
          "multiple": false,
          "check_callback" : false,
          "themes" : { "url": false, "dots": true, "name": "default-dark", "stripped": true},
          "force_text": true,
          'data' : this.get_data(),
        },
      });

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
                    children: _.map(thread_groups_by_id,
                           function (thread_group) {
                              
                              // second level          
                              return {text: thread_group.get_display_name(),
                                      data: {debugger_id: debugger_obj.id, thread_group_id: thread_group.id},
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

   DebuggeeTrackerView.prototype._attach_ctxmenu = function () {
      var $debuggers_first_level =      this._$container.children('ul').children('li');
      var $thread_groups_second_level = $debuggers_first_level.children('ul').children('li');
      var $threads_third_level =        $thread_groups_second_level.children('ul').children('li');

      this._$container.data('ctxmenu_controller', this._get_ctxmenu_for_debuggee_tracker());
      $debuggers_first_level.data('ctxmenu_controller', this._get_ctxmenu_for_debuggers());
      $thread_groups_second_level.data('ctxmenu_controller', this._get_ctxmenu_for_thread_groups());
      $threads_third_level.data('ctxmenu_controller', this._get_ctxmenu_for_threads());
   };

   DebuggeeTrackerView.prototype._get_data_from_selected = function () {
      var nodes_selected = this._$container.jstree('get_selected');
      var node_selected = nodes_selected[0]; //TODO we only support one of them for now

      return this._$container.jstree(true).get_node(node_selected).data;
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
               immediate_action: function (ctx_event, element_ctxmenu_owner) {
                  if (ctx_event.jstree_hack_done) {
                     return;
                  }
                  ctx_event.jstree_hack_done = true;

                  var node_id = $(element_ctxmenu_owner).attr('id');
                  self._$container.jstree("deselect_all");
                  self._$container.jstree("select_node", node_id);
              },
              },{
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
               immediate_action: function (ctx_event, element_ctxmenu_owner) {
                  if (ctx_event.jstree_hack_done) {
                     return;
                  }
                  ctx_event.jstree_hack_done = true;
                  
                  var node_id = $(element_ctxmenu_owner).attr('id');
                  self._$container.jstree("deselect_all");
                  self._$container.jstree("select_node", node_id);
              },
              },{
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
               immediate_action: function (ctx_event, element_ctxmenu_owner) {
                  if (ctx_event.jstree_hack_done) {
                     return;
                  }
                  ctx_event.jstree_hack_done = true;
                  
                  var node_id = $(element_ctxmenu_owner).attr('id');
                  self._$container.jstree("deselect_all");
                  self._$container.jstree("select_node", node_id);
              },
              },{
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
