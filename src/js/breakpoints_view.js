define(["underscore", "jquery", "jstree", "layout", "context_menu_for_tree_view"], function (_, $, jstree, layout, context_menu_for_tree_view_module) {
   'use strict';
    
   var BreakpointsView = function (debuggee_tracker) {
      this.super("BreakpointsView");

      this._$container = $('<div style="height: 100%; width: 100%"></div>');
      this._$out_of_dom = this._$container;
      
      this.debuggee_tracker = debuggee_tracker;
      this.debuggee_tracker.add_observer(this);

      var results = context_menu_for_tree_view_module.build_jstree_with_a_context_menu(this._$container, [
            null,
            this._get_ctxmenu_for_debuggers(),
            this._get_ctxmenu_for_main_breakpoints(),
            this._get_ctxmenu_for_sub_breakpoints()
          ],
          {
              'core' : {
                  "animation" : false,
                  "worker": true, 
                  "multiple": true,
                  "check_callback" : false,
                  "themes" : { "url": false, "dots": true, "name": "default-dark", "stripped": true},
                  "force_text": true,
                  'data' : this.get_data(),
              },
              "plugins" : ["checkbox"]
          }
      );

      this.update_tree_data_debounced = _.debounce(_.bind(this.update_tree_data, this), 500);
   };

   BreakpointsView.prototype.update_tree_data = function () {
      var data = this.get_data();
      $(this._$container).jstree(true).settings.core.data = data;
      $(this._$container).jstree(true).refresh();
      
      if (!this._$out_of_dom) {
         this.repaint($(this.box));
      }
   };
   
   BreakpointsView.prototype.update = function (data, topic, tracker) {
      this.update_tree_data_debounced();
   };
   
   BreakpointsView.prototype.__proto__ = layout.Panel.prototype;

   BreakpointsView.prototype.render = function() {
      if (this._$out_of_dom) {
         this._$out_of_dom.appendTo(this.box);
         this._$out_of_dom = null;
      }
      
   };

   BreakpointsView.prototype.unlink = function() {
      if (!this.$out_of_dom) {
         this.$out_of_dom = this._$container.detach();
      }
   };

   BreakpointsView.prototype.get_data = function () {
      var debuggee_tracker = this.debuggee_tracker;
      var debuggers_by_id =  debuggee_tracker.get_all_debuggers();

      var tree_data = _.map(debuggers_by_id, 
              function (debugger_obj) {
                  var breakpoints_by_id = debugger_obj.your_breakpoints_by_id();
                  var results = _.partition(breakpoints_by_id, function (bkpt) { return bkpt.is_subbreakpoint(); });

                  var subbreakpoints   = results[0];
                  var main_breakpoints = results[1];
                
                  // first level: debuggers
                  return {
                        text: debugger_obj.get_display_name(),
                        children: _.map(main_breakpoints,
                            function (main_breakpoint) {

                                if (main_breakpoint.is_multiple()) {

                                    var subbreakpoints_of_this_main_breakpoint = _.filter(subbreakpoints,
                                        function (bkpt) {
                                            return bkpt.is_subbreakpoint_of(main_breakpoint);
                                        });

                                    // second level: (main) breakpoints with multiple sub breakpoints
                                    return {
                                        text: main_breakpoint.get_display_name(),
                                        children: _.map(subbreakpoints_of_this_main_breakpoint,
                                            function (subbreakpoint) {

                                                // third level: sub-breakpoints (like multiple breakpoints)
                                                return {
                                                    text: subbreakpoint.get_display_name()
                                                };
                                            }, this)
                                    };
                                }
                                else {
                                    // second level: (main) singleton breakpoints
                                    return {
                                        text: main_breakpoint.get_display_name()
                                    };
                                }
                            }, this)
                  };
              }, this);

      return tree_data;
   };

   BreakpointsView.prototype._get_ctxmenu_for_debuggers = function () {
       return [
            {
                text: "Enable all breakpoints"
            },
            {
                text: "Disable all breakpoints"
            },
            {
                text: "Remove all breakpoints",
                end_menu_here: true
            } 
        ];
   };
   
   BreakpointsView.prototype._get_ctxmenu_for_main_breakpoints = function () {
       return [
            {
                text: "Enable breakpoint"
            },
            {
                text: "Disable breakpoint"
            },
            {
                text: "Remove breakpoint",
                end_menu_here: true
            } 
        ];
   };
   
   BreakpointsView.prototype._get_ctxmenu_for_sub_breakpoints = function () {
       return [
            {
                text: "Enable breakpoint"
            },
            {
                text: "Disable breakpoint",
                end_menu_here: true
            } 
       ];
   };


   
   return {BreakpointsView: BreakpointsView};
});
