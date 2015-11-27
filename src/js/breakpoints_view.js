define(["underscore", "jquery", "jstree", "layout", "context_menu_for_tree_view", "snippet", "shortcuts"], function (_, $, jstree, layout, context_menu_for_tree_view_module, snippet, shortcuts) {
   'use strict';
    
   var BreakpointsView = function (debuggee_tracker) {
      this.super("BreakpointsView");
      this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');
      
      this.debuggee_tracker = debuggee_tracker;
      this.debuggee_tracker.add_observer(this);

      this.build_tree();

      this.update_tree_data_debounced = _.debounce(_.bind(this.update_tree_data, this), 500);
   };

   BreakpointsView.prototype.update_tree_data = function () {
      var self = this;
      var data = this.get_data_from_tracker();

      this._loading_the_data = true;

      $(this._$container).jstree(true).settings.core.data = data;
      $(this._$container).jstree(true).load_node('#', function (x, is_loaded) {
          if (is_loaded) {
              self._loading_the_data = false;
              $(self._$container).jstree(true).restore_state();
          }
      });

      if (this.is_in_the_dom()) {
         this.repaint($(this.box));
      }
   };
   
   BreakpointsView.prototype.update = function (data, topic, tracker) {
      this.update_tree_data_debounced();
   };
   
   BreakpointsView.prototype.__proto__ = layout.Panel.prototype;
   layout.implement_render_and_unlink_methods(BreakpointsView.prototype);

   BreakpointsView.prototype.build_tree = function () {
      var self = this;

      this._jstree_key = shortcuts.randint().toString();
      var results = context_menu_for_tree_view_module.build_jstree_with_a_context_menu(this._$container, [
            null,
            function (e, elem_owner) {
                self._immediate_action_to_hack_jstree(e, elem_owner);
                var debugger_id =  self._get_data_from_selected().debugger_id;
                var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                return {observable: debugger_obj, context: self};
            },
            function (e, elem_owner) {
                self._immediate_action_to_hack_jstree(e, elem_owner);
                var data = self._get_data_from_selected();

                var debugger_id   = data.debugger_id;
                var breakpoint_id = data.breakpoint_id;
                
                var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                var breakpoint = debugger_obj.get_breakpoint_with_id(breakpoint_id);
                return {observable: breakpoint, context: self};
            },
            function (e, elem_owner) {
                self._immediate_action_to_hack_jstree(e, elem_owner);
                var data = self._get_data_from_selected();

                var debugger_id   = data.debugger_id;
                var breakpoint_id = data.breakpoint_id;
                
                var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
                var breakpoint = debugger_obj.get_breakpoint_with_id(breakpoint_id);
                return {observable: breakpoint, context: self};
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
              "plugins" : ["checkbox", "state"],
              'checkbox': {
                  "whole_node": false,
                  "keep_selected_style": false,
                  "tie_selection": false, // <=== XXX HIGHLY EXPERIMENTAL XXX
              },
              'state' : {
                  "key": this._jstree_key,
		  events: 'open_node.jstree close_node.jstree',
                  filter: function (state) {
                      if (state.checkbox) {
                          delete state.checkbox; // remove the 'checkbox' state before restoring, we already encoded the checked/unchecked state in the get_data_from_tracker method (which represent the state of GDB)
                      }
                      return state;
                  }
              }
          }
      );

      setTimeout(function () {
          $(self._$container).jstree(true).save_state();
      }, 100);

      this._get_data_from_selected = results.getter_for_data_from_selected;
      this._immediate_action_to_hack_jstree = results.immediate_action_to_hack_jstree;

      this.add_handlers_for_enabling_breakpoint_from_node_checkbox();
   };

   BreakpointsView.prototype.add_handlers_for_enabling_breakpoint_from_node_checkbox = function () {
      var bounded_on_change_node_state_handler_for = _.bind(this.change_breakpoint_state_handler_for, this);
      var bounded_on_change_node_state_for_enable_bkpt = _.partial(bounded_on_change_node_state_handler_for, true);
      var bounded_on_change_node_state_for_disable_bkpt = _.partial(bounded_on_change_node_state_handler_for, false);

      var self = this;
      this._$container.on("uncheck_node.jstree", bounded_on_change_node_state_for_disable_bkpt).on("check_node.jstree", bounded_on_change_node_state_for_enable_bkpt);
      this._$container.on("after_open.jstree", function (ev, node) {
          var node_in_dom = $("#"+node.node.id);
          node_in_dom.find('a[code_resolved]').each(function (index, anchor) {
              var anchor = $(anchor);
              var code_resolved = anchor.attr('code_resolved');
              var is_code_resolved_assembly = anchor.attr('is_code_resolved_assembly') === "true";
              
              if (!code_resolved) {
                  return;
              }
              
              var s = snippet.create_snippet(code_resolved, { is_assembly: is_code_resolved_assembly});
              s.appendTo(anchor);
          });
      });
   };

   BreakpointsView.prototype.get_data_from_tracker = function () {
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
                        icon: false,
                        id: [this._jstree_key, debugger_obj.id].join("_"),
                        children: _.map(main_breakpoints,
                            function (main_breakpoint) {

                                var node_for_breakpoint = {
                                    text: main_breakpoint.get_display_name(),
                                    icon: false,
                                    id: [this._jstree_key, debugger_obj.id, main_breakpoint.id].join("_"),
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
                                                var node_for_subbreakpoint = {
                                                    text: subbreakpoint.get_display_name(),
                                                    state: { 'checked' : main_breakpoint.is_enabled && subbreakpoint.is_enabled },
                                                    icon: false,
                                                    id: [this._jstree_key, debugger_obj.id, main_breakpoint.id, subbreakpoint.id].join("_"),
                                                    data: {debugger_id: debugger_obj.id, breakpoint_id: subbreakpoint.id},
                                                };

                                                if (subbreakpoint.is_code_resolved) {
                                                    var code_resolved = subbreakpoint.code_resolved;
                                                    
                                                    node_for_subbreakpoint.a_attr = {};
                                                    node_for_subbreakpoint.a_attr.code_resolved = code_resolved;
                                                    node_for_subbreakpoint.a_attr.is_code_resolved_assembly = !subbreakpoint.are_you_set_on_source_code_line();
                                                }

                                                // third level: sub-breakpoints (like multiple breakpoints)
                                                return node_for_subbreakpoint;
                                            }, this);
                                }
                                else {
                                    if (main_breakpoint.is_code_resolved) {
                                        var code_resolved = main_breakpoint.code_resolved;

                                        node_for_breakpoint.a_attr = {};
                                        node_for_breakpoint.a_attr.code_resolved = code_resolved;
                                        node_for_breakpoint.a_attr.is_code_resolved_assembly = !main_breakpoint.are_you_set_on_source_code_line();
                                    }

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

   BreakpointsView.prototype.change_breakpoint_state_handler_for = function (enable_breakpoint, ev, d) {
      if (this._loading_the_data) {
          return; // the user is not changing the breakpoint, we are just refreshing the data and
                  // we are getting call as a side effect of jstree update.
      }

      var data = d.node.data;

      var debugger_id = data.debugger_id;
      var debugger_obj = this.debuggee_tracker.get_debugger_with_id(debugger_id);

      var breakpoint_id = data.breakpoint_id;

      if (breakpoint_id === undefined) {
          if (enable_breakpoint) {
              debugger_obj.enable_all_your_breakpoints();
          }
          else {
              debugger_obj.disable_all_your_breakpoints();
          }
      }
      else {
          var breakpoint = debugger_obj.get_breakpoint_with_id(breakpoint_id);

          // If we are trying to enable a subbreakpoint, we need to make sure that
          // its main breakpoint is enabled, otherwise the subbreakpoint enabling
          // will not take any effect (and it will be confusing for the user)
          if (enable_breakpoint && breakpoint.is_subbreakpoint()) {
             var main_breakpoint = debugger_obj.get_breakpoint_with_id(breakpoint.your_main_breakpoint_id());
             main_breakpoint.enable_you();
          }

          if (enable_breakpoint) {
              breakpoint.enable_you_and_your_subbreakpoints();
          }
          else {
              breakpoint.disable_you_and_your_subbreakpoints();
          }
      }
  };

   return {BreakpointsView: BreakpointsView};
});
