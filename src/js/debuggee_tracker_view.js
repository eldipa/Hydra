define(["underscore", "jquery", "jstree", "layout"], function (_, $, jstree, layout) {
   'use strict';

   var DebuggeeTrackerView = function (debuggee_tracker) {
      this.super("DebuggeeTrackerView");

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

   DebuggeeTrackerView.prototype.update = function (topic, data, observed) {
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
      var debugger_objects_by_id =  debuggee_tracker.get_all_debuggers();

      var tree_data = _.map(debugger_objects_by_id, 
         function (debugger_obj, debugger_id) {   
            var thread_groups_objects_by_id = debuggee_tracker.get_thread_groups_of(debugger_id);

            // first level
            return {text: debugger_obj.get_display_name(debugger_id),
                    data: {debugger_id: debugger_id},
                    children: _.map(thread_groups_objects_by_id,
                           function (thread_group_obj, thread_group_id) {
                              
                              // second level          
                              return {text: thread_group_obj.get_display_name(thread_group_id),
                                      data: {debugger_id: debugger_id, thread_group_id: thread_group_id},
                                      children: _.map(thread_group_obj.threads_by_id,
                                          function (thread_obj, thread_id) {

                                             // third level
                                             return {text: thread_obj.get_display_name(thread_id),
                                                     data: {debugger_id: debugger_id, thread_group_id: thread_group_id, thread_id: thread_id}};
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
                  var debugger_obj = self.debuggee_tracker.debuggers_by_id[debugger_id];
                  debugger_obj.kill();
               },
              },{
               text: 'Add thread group',
               action: function (e) {
                  e.preventDefault();
                  var debugger_id = self._get_data_from_selected().debugger_id;
                  var debugger_obj = self.debuggee_tracker.debuggers_by_id[debugger_id];
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

                  var thread_group_obj = self.debuggee_tracker.thread_groups_by_debugger[debugger_id][thread_group_id];
                  thread_group_obj.remove();
               },
              },{
               text: 'Load/attach',
               action: function (e) {
                  e.preventDefault(); //TODO
                  console.log(self._get_data_from_selected());
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
               text: 'Something',
               action: function (e) {
                  e.preventDefault();
                  console.log(self._get_data_from_selected());
               },
              }];
   };

   return {DebuggeeTrackerView: DebuggeeTrackerView};
});
