define(["underscore", "jquery", "jstree", "layout"], function (_, $, jstree, layout) {
   'use strict';

   var DebuggeeTrackerView = function (debuggee_tracker) {
      this.super("DebuggeeTrackerView");

      this._$container = $('<div></div>');
      this._$out_of_dom = this._$container;

      this.debuggee_tracker = debuggee_tracker;
      this.debuggee_tracker.add_observer(this);

      this.update_tree_data_debounced = _.debounce(_.bind(this.update_tree_data, this), 500);

      this._$container.jstree({
        'core' : {
          "animation" : false,
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
                    children: _.map(thread_groups_objects_by_id,
                           function (thread_group_obj, thread_group_id) {
                              
                              // second level          
                              return {text: thread_group_obj.get_display_name(thread_group_id),
                                      children: _.map(thread_group_obj.threads_by_id,
                                          function (thread_obj, thread_id) {

                                             // third level
                                             return {text: thread_obj.get_display_name(thread_id)};
                                          }, this)
                                     };
                           }, this)
                   };
         }, this);

      return tree_data;
   };

   return {DebuggeeTrackerView: DebuggeeTrackerView};
});
