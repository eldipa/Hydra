define(["underscore", "jquery", "jstree", "layout", "context_menu_for_tree_view", "snippet"], function (_, $, jstree, layout, context_menu_for_tree_view_module, snippet) {
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
                  "multiple": false,
                  "check_callback" : false,
                  "themes" : { "url": false, "dots": true, "name": "default-dark", "stripped": true},
                  "force_text": true,
                  'data' : this.get_data(),
              },
              "plugins" : ["checkbox"],
              'checkbox': {
                  "whole_node": false,
                  "keep_selected_style": false,
                  "tie_selection": false, // <=== XXX HIGHLY EXPERIMENTAL XXX
              }
          }
      );

      this._get_data_from_selected = results.getter_for_data_from_selected;

      var bounded_change_handler_for = _.bind(this.change_breakpoint_state_handler_for, this);
      var bounded_change_handler_for_enable_bkpt = _.partial(bounded_change_handler_for, true);
      var bounded_change_handler_for_disable_bkpt = _.partial(bounded_change_handler_for, false);

      this._$container.on("uncheck_node.jstree", bounded_change_handler_for_disable_bkpt).on("check_node.jstree", bounded_change_handler_for_enable_bkpt);

      this.update_tree_data_debounced = _.debounce(_.bind(this.update_tree_data, this), 500);
   };

   BreakpointsView.prototype.update_tree_data = function () {
      var data = this.get_data();
      $(this._$container).jstree(true).settings.core.data = data;
      $(this._$container).jstree(true).refresh();
      $(this._$container).jstree(true).load_node('#');

      var self = this;
      setTimeout(function () {
          var s = snippet.create_snippet("int i = 0;", false);
          //$(self._$container).append($(s));
          setTimeout(function() {
                /*var dcontainer = $('<div style="width: 100%; height: 17px; background-color: initial; font-family: monaco;" class="ace_editor ace-monokai ace_dark"></div>');
                var dscroller = $('<div class="ace_scroller" style="left: 0px; right: 0px; bottom: 0px;"></div>');
                var dcontent  = $('<div class="ace_content" style="margin-top: 0px; width: 700px; height: 48px; margin-left: 0px;"></div>');
                var dlayer = $('<div class="ace_layer ace_text-layer" style="padding: 0px 4px;"></div>');

                $(s).find('.ace_line').appendTo(dlayer);
                dlayer.appendTo(dcontent);
                dcontent.appendTo(dscroller);
                dscroller.appendTo(dcontainer);

                dcontainer.appendTo($(self._$container));
                $(s).remove();
                */
                
                /*
                $(s).find('.ace_text-input').remove();
                $(s).find('.ace_gutter').remove();
                $(s).find('.ace_scrollbar-v').remove();
                $(s).find('.ace_scrollbar-h').remove();
                $(s).find('.ace_print-margin-layer').remove();
                $(s).find('.ace_marker-layer').remove();
                $(s).find('.ace_cursor-layer').remove();
                */

                $(s).children(":not(.ace_scroller)").remove();
                $(s).children(".ace_scroller").children(":not(.ace_content)").remove();
                $(s).children(".ace_scroller").children(".ace_content").children(":not(.ace_text-layer)").remove();

                var cloned_without_event_handlers = $(s).clone(false, false);
                $(s).remove();
                cloned_without_event_handlers.appendTo($(self._$container));
                
          }, 300);
      }, 1500);

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
                        data: {debugger_id: debugger_obj.id},
                        children: _.map(main_breakpoints,
                            function (main_breakpoint) {

                                var node_for_breakpoint = {
                                    text: main_breakpoint.get_display_name(),
                                    data: {debugger_id: debugger_obj.id, breakpoint_id: main_breakpoint.id},
                                };

                                if (main_breakpoint.is_multiple()) {
                                    var subbreakpoints_of_this_main_breakpoint = _.filter(subbreakpoints,
                                        function (bkpt) {
                                            return bkpt.is_subbreakpoint_of(main_breakpoint);
                                        });

                                    // this breakpoint has multiple sub breakpoints
                                    node_for_breakpoint.children = _.map(subbreakpoints_of_this_main_breakpoint,
                                            function (subbreakpoint) {

                                                // third level: sub-breakpoints (like multiple breakpoints)
                                                return {
                                                    text: subbreakpoint.get_display_name(),
                                                    state: { 'checked' : main_breakpoint.is_enabled && subbreakpoint.is_enabled },
                                                    data: {debugger_id: debugger_obj.id, breakpoint_id: subbreakpoint.id},
                                                };
                                            }, this);
                                }
                                else {
                                    // for single (non-multiple) breakpoints we can be sure
                                    // of its state
                                    node_for_breakpoint.state = { 'checked' : main_breakpoint.is_enabled };
                                }

                                // second level: breakpoints with possible multiple sub breakpoints
                                return node_for_breakpoint;
                            }, this)
                  };
              }, this);

      return tree_data;
   };

   BreakpointsView.prototype._get_ctxmenu_for_debuggers = function () {
       var self = this;
       return [
            {
                text: "Enable all breakpoints",
                action: function (e) {
                   e.preventDefault();
                   var debugger_id = self._get_data_from_selected().debugger_id;
                   var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);

                   debugger_obj.execute("-break-enable", []); // TODO all? otherwise, do a for loop
                }
            },
            {
                text: "Disable all breakpoints",
                action: function (e) {
                   e.preventDefault();
                   var debugger_id = self._get_data_from_selected().debugger_id;
                   var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);

                   debugger_obj.execute("-break-disable", []); // TODO all? otherwise, do a for loop
                }
            },
            {
                text: "Remove all breakpoints",
                action: function (e) {
                   e.preventDefault();
                   var debugger_id = self._get_data_from_selected().debugger_id;
                   var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);

                   debugger_obj.execute("-break-delete", []); // TODO all? otherwise, do a for loop
                },

                end_menu_here: true
            } 
        ];
   };
   
   BreakpointsView.prototype._get_ctxmenu_for_main_breakpoints = function () {
       var self = this;
       return [
            {
                text: "Enable breakpoint",
                action: function (e) {
                   e.preventDefault();
                   var data = self._get_data_from_selected();

                   var debugger_id   = data.debugger_id;
                   var breakpoint_id = data.breakpoint_id;
                
                   var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                   var breakpoint = debugger_obj.get_breakpoint_with_id(breakpoint_id);

                   breakpoint.enable_you_and_your_subbreakpoints();
                }
            },
            {
                text: "Disable breakpoint",
                action: function (e) {
                   e.preventDefault();
                   var data = self._get_data_from_selected();

                   var debugger_id   = data.debugger_id;
                   var breakpoint_id = data.breakpoint_id;
                
                   var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                   var breakpoint = debugger_obj.get_breakpoint_with_id(breakpoint_id);

                   breakpoint.disable_you_and_your_subbreakpoints();
                }
            },
            {
                text: "Remove breakpoint",
                action: function (e) {
                   e.preventDefault();
                   var data = self._get_data_from_selected();

                   var debugger_id   = data.debugger_id;
                   var breakpoint_id = data.breakpoint_id;
                
                   var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                   var breakpoint = debugger_obj.get_breakpoint_with_id(breakpoint_id);

                   breakpoint.delete_you_and_your_subbreakpoints();
                },

                end_menu_here: true
            } 
        ];
   };
   
   BreakpointsView.prototype._get_ctxmenu_for_sub_breakpoints = function () {
       var self = this;
       return [
            {
                text: "Enable breakpoint",
                action: function (e) {
                   e.preventDefault();
                   var data = self._get_data_from_selected();

                   var debugger_id   = data.debugger_id;
                   var breakpoint_id = data.breakpoint_id;
                
                   var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                   var breakpoint = debugger_obj.get_breakpoint_with_id(breakpoint_id);

                   breakpoint.enable_you();
                }
            },
            {
                text: "Disable breakpoint",
                action: function (e) {
                   e.preventDefault();
                   var data = self._get_data_from_selected();

                   var debugger_id   = data.debugger_id;
                   var breakpoint_id = data.breakpoint_id;
                
                   var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                   var breakpoint = debugger_obj.get_breakpoint_with_id(breakpoint_id);

                   breakpoint.disable_you();
                },

                end_menu_here: true
            } 
       ];
   };

   BreakpointsView.prototype.change_breakpoint_state_handler_for = function (enable_breakpoint, ev, d) {
      var data = d.node.data;

      var debugger_id = data.debugger_id;
      var debugger_obj = this.debuggee_tracker.get_debugger_with_id(debugger_id);

      var breakpoint_id = data.breakpoint_id;

      if (breakpoint_id === undefined) {
          // TODO enable/disable globally
          console.log(d);
      }
      else {
          var breakpoint = debugger_obj.get_breakpoint_with_id(breakpoint_id);
          if (enable_breakpoint) {
              //breakpoint.enable_you();
          }
          else {
              //breakpoint.disable_you();
          }
      }
  };

   return {BreakpointsView: BreakpointsView};
});
