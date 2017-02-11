define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'widgets/buttons', 'observation'], function (ace, $, layout, shortcuts, _, buttons, observation) {
    var create_method_to_control_mode = function (mode_name, is_method_to_enter_in_the_mode) {
        var is_method_to_enter_in_the_mode = !!is_method_to_enter_in_the_mode;
        var f = function (is_pseudo_mode) {
            if (is_pseudo_mode) {
                this.pseudo_mode[mode_name] = is_method_to_enter_in_the_mode;
            }
            else {
                this.mode[mode_name] = is_method_to_enter_in_the_mode;
            }

            this.select_toolbar();
        };

        return f;
    };

    var ThreadButtonBarController = function (thread_follower) {
        this.super("Thread Button Bar Controller");
        this.thread_follower = thread_follower;

        this.mode = {
            is_targeting_all_threads: false,
            is_running: false,
            is_in_assembly: false,
            is_in_reverse_mode: false,
        };

        this.pseudo_mode = {};

        this.create_toolbars();
        this.build_and_initialize_panel_container("<div></div>");

        var self = this;
        this._$container.data('do_observation', function () {
            return new observation.Observation({target: self, context: self});
        });

        this.selected_toolbar = this.toolbar_for_a_dead_process;
        this._$container.append(this.selected_toolbar);
        this.select_toolbar();
        
        //this.selected_toolbar = this.toolbar_to_control_a_stopped_thread_in_reverse_mode;
        //this.selected_toolbar = this.toolbar_to_control_a_stopped_thread_in_assembly_mode;
        //TODO wrong labels this.selected_toolbar = this.toolbar_to_control_a_stopped_thread_in_assembly_and_reverse_mode;
        //this.selected_toolbar = this.toolbar_to_control_a_running_thread;
        //TODO wrong labels this.selected_toolbar = this.toolbar_to_control_a_running_thread_in_reverse_mode;
    };
    
    
    ThreadButtonBarController.prototype.__proto__ = layout.Panel.prototype;
    layout.implement_render_and_unlink_methods(ThreadButtonBarController.prototype);


    ThreadButtonBarController.prototype.get_display_controller = function (from_who) {
        var self = this;

        var controller = [
            {
                header: "Direction of execution",
            },
            {
                text: "Forward",
                action: function (e) {
                    e.preventDefault();
                    self.leave_reverse_mode();
                }
            },
            {
                text: "Backward",
                action: function (e) {
                    e.preventDefault();
                    self.enter_reverse_mode();
                }
            },
            {
                header: "Step instruction level",
            },
            {
                text: "Source code",
                action: function (e) {
                    e.preventDefault();
                    self.leave_assembly_mode();
                }
            },
            {
                text: "Assembly",
                action: function (e) {
                    e.preventDefault();
                    self.enter_assembly_mode();
                }
            },
            {
                header: "Target",
            },
            {
                text: "Current thread",
                action: function (e) {
                    e.preventDefault();
                    self.leave_targeting_all_threads_mode();
                }
            },
            {
                text: "All threads of this process",
                action: function (e) {
                    e.preventDefault();
                    self.enter_targeting_all_threads_mode();
                }
            }
        ];

        return controller;
    };

    ThreadButtonBarController.prototype.enter_targeting_all_threads_mode = create_method_to_control_mode("is_targeting_all_threads", true);
    ThreadButtonBarController.prototype.leave_targeting_all_threads_mode = create_method_to_control_mode("is_targeting_all_threads", false);

    ThreadButtonBarController.prototype.enter_assembly_mode = create_method_to_control_mode("is_in_assembly", true);
    ThreadButtonBarController.prototype.leave_assembly_mode = create_method_to_control_mode("is_in_assembly", false);

    ThreadButtonBarController.prototype.enter_reverse_mode = create_method_to_control_mode("is_in_reverse_mode", true);
    ThreadButtonBarController.prototype.leave_reverse_mode = create_method_to_control_mode("is_in_reverse_mode", false);


    ThreadButtonBarController.prototype.select_toolbar = function () {
        var is_process_alive = this.thread_follower.are_you_following_a_live_process();

        var is_running = this.pseudo_mode.is_running || this.mode.is_running;
        var is_in_assembly = this.is_in_assembly();
        var is_in_reverse_mode = this.is_in_reverse_mode();

        var previous_selected_toolbar = this.selected_toolbar;

        if (is_process_alive) {
            this.selected_toolbar = this.toolbar_by_mode_of_a_running_process[is_running][is_in_assembly][is_in_reverse_mode];
        }
        else {
            this.selected_toolbar = this.toolbar_for_a_dead_process;
        }
                                
        //[this.pseudo_mode.is_targeting_all_threads|| this.mode.is_targeting_all_threads]\
        
        if (previous_selected_toolbar != this.selected_toolbar) {
            var is_in_the_dom = this.is_in_the_dom();

            if (is_in_the_dom) {
                this.unlink();
            }

            this._swap_toolbars_in_the_container(previous_selected_toolbar, this.selected_toolbar);

            if (is_in_the_dom) {
                this.render();
            }
        }
    };

    ThreadButtonBarController.prototype._swap_toolbars_in_the_container = function (previous, current) {
        previous.detach();
        this._$container.prepend(current);
    };

    ThreadButtonBarController.prototype.is_in_assembly = function () {
        return this.pseudo_mode.is_in_assembly || this.mode.is_in_assembly;
    };

    ThreadButtonBarController.prototype.is_in_reverse_mode = function () {
        return this.pseudo_mode.is_in_reverse_mode || this.mode.is_in_reverse_mode;
    };


    ThreadButtonBarController.prototype._args_for_reversing_mode = function () {
          if (this.is_in_reverse_mode()) {
              return ["--reverse"];
          }
          else {
              return [];
          }
    };

    ThreadButtonBarController.prototype._target_of_the_action = function () {
        //TODO no hay ningun cambio en las toolbars que muestren este pseudo mode!!!
          var is_targeting_all_threads = this.pseudo_mode.is_targeting_all_threads || this.mode.is_targeting_all_threads;
          var thread_followed = this.thread_follower.thread_followed;

          if (is_targeting_all_threads || !thread_followed) {
              return this.thread_follower.thread_group_followed;
          }
          else {
              return thread_followed;
          }
    };

    ThreadButtonBarController.prototype.create_toolbars = function () {
        var self = this;

        var button_descriptions_for_src_stopped_mode = [
             {
               label: "Resume",
               text: true,
               tooltip: "Resume the execution.",
               icons: {primary: 'fa fa-play'},
               action: function (ev) {
                  ev.preventDefault();
                  var args = self._args_for_reversing_mode();
                  var target = self._target_of_the_action();

                  target.execute("-exec-continue", args);
               },
            },
            {
               label: "Step over",
               text: true,
               tooltip: "Step over the next instruction.",
               icons: {primary: 'fa fa-mail-forward'},
               action: function (ev) {
                  ev.preventDefault();
                  var args = self._args_for_reversing_mode();
                  var target = self._target_of_the_action();
                  
                  if (self.is_in_assembly()) {
                      target.execute("-exec-next-instruction", args);
                  }
                  else {
                      target.execute("-exec-next", args);
                  }
               },
            }, 
            {
               label: "Step into",
               text: true,
               tooltip: "Step into the next instruction.",
               icons: {primary: 'fa fa-sign-in'},
               action: function (ev) {
                  ev.preventDefault();
                  var args = self._args_for_reversing_mode();
                  var target = self._target_of_the_action();

                  if (self.is_in_assembly()) {
                      target.execute("-exec-step-instruction", args);
                  }
                  else {
                      target.execute("-exec-step", args);
                  }
               },
            }, 
            {
               label: "Step out",
               text: true,
               tooltip: "Step out of the current function.",
               icons: {primary: 'fa fa-external-link'},
               action: function (ev) {
                  ev.preventDefault();
                  var args = self._args_for_reversing_mode();
                  var target = self._target_of_the_action();

                  target.execute("-exec-finish", args);
               },
            } 
            ];


        var toolbar_to_control_a_dead_process = buttons.create_button_bar(this._create_button_descriptions_for_non_running_thread_group(button_descriptions_for_src_stopped_mode));

        var toolbar_to_control_a_stopped_thread = buttons.create_button_bar(button_descriptions_for_src_stopped_mode, true);
        var toolbar_to_control_a_stopped_thread_in_reverse_mode = buttons.create_button_bar(this._create_button_descriptions_for_reverse_mode_from(button_descriptions_for_src_stopped_mode), true);

        var button_descriptions_in_assembly_mode = this._create_button_descriptions_for_assembly_mode(button_descriptions_for_src_stopped_mode)
        var toolbar_to_control_a_stopped_thread_in_assembly_mode = buttons.create_button_bar(button_descriptions_in_assembly_mode, true);
        var toolbar_to_control_a_stopped_thread_in_assembly_and_reverse_mode = buttons.create_button_bar(this._create_button_descriptions_for_reverse_mode_from(button_descriptions_in_assembly_mode), true);
        
        var button_descriptions_in_running_mode = this._create_button_descriptions_for_running_mode(button_descriptions_for_src_stopped_mode);
        var toolbar_to_control_a_running_thread = buttons.create_button_bar(button_descriptions_in_running_mode, true);
        var toolbar_to_control_a_running_thread_in_reverse_mode = buttons.create_button_bar(this._create_button_descriptions_for_reverse_mode_from(button_descriptions_in_running_mode), true);

        this.toolbar_for_a_dead_process = toolbar_to_control_a_dead_process;

        // By is_running first,  TODO add is_targeting_all_threads!!!
        // by is_in_assembly second,
        // by is_in_reverse_mode as last
        this.toolbar_by_mode_of_a_running_process = {
            true: {
                true: {
                    true: toolbar_to_control_a_running_thread_in_reverse_mode,
                    false: toolbar_to_control_a_running_thread,
                },
                false: {
                    true: toolbar_to_control_a_running_thread_in_reverse_mode,
                    false: toolbar_to_control_a_running_thread,
                },
            },
            false: {
                true: {
                    true: toolbar_to_control_a_stopped_thread_in_assembly_and_reverse_mode,
                    false: toolbar_to_control_a_stopped_thread_in_assembly_mode,
                },
                false: {
                    true: toolbar_to_control_a_stopped_thread_in_reverse_mode,
                    false: toolbar_to_control_a_stopped_thread,
                },
            },
        };
    };
    
    ThreadButtonBarController.prototype._create_button_descriptions_for_non_running_thread_group = function (button_descriptions_prototype) {
        var button_descriptions = [];
        var positions = [];
        for (var i = 0; i < button_descriptions_prototype.length; ++i) {
            var desc = this._copy_button_description(button_descriptions_prototype[i]);
            button_descriptions.push(desc);
            
            positions.push(i);
        }

        this._configure_disable_buttons_inplace(positions, button_descriptions, button_descriptions_prototype);
        return button_descriptions;
    }


    ThreadButtonBarController.prototype._create_button_descriptions_for_reverse_mode_from = function (button_descriptions_prototype, position_of_disabled_buttons) {
        var note = "(backward)";
        var button_descriptions = [];
        for (var i = 0; i < button_descriptions_prototype.length; ++i) {
            var desc = this._copy_button_description(button_descriptions_prototype[i]);
            desc.icons.primary += " fa-flip-horizontal";

            button_descriptions.push(desc);
            
            if (desc.tooltip.indexOf(note) === -1) {
                desc.tooltip += " " + note;
            }
        }

        return button_descriptions;
    };
    
    ThreadButtonBarController.prototype._create_button_descriptions_for_assembly_mode = function (button_descriptions_prototype) {
        var button_descriptions = [];
        for (var i = 0; i < button_descriptions_prototype.length; ++i) {
            var desc = this._copy_button_description(button_descriptions_prototype[i]);
            
            desc.tooltip = desc.tooltip.replace("instruction", "assembly instruction");
            button_descriptions.push(desc);
        }

        this._configure_disable_buttons_inplace([3], button_descriptions, button_descriptions_prototype);

        return button_descriptions;
    };
    
    ThreadButtonBarController.prototype._create_button_descriptions_for_running_mode = function (button_descriptions_prototype) {
        var button_descriptions = [];
        for (var i = 0; i < button_descriptions_prototype.length; ++i) {
            var desc = this._copy_button_description(button_descriptions_prototype[i]);
            button_descriptions.push(desc);
        }

        button_descriptions[0].label = "Interrupt";
        button_descriptions[0].tooltip = "Interrupt the current execution.";
        button_descriptions[0].icons.primary = "fa fa-pause";

        this._configure_disable_buttons_inplace([1, 2, 3], button_descriptions, button_descriptions_prototype);

        return button_descriptions;
    };

    ThreadButtonBarController.prototype._configure_disable_buttons_inplace = function (position_of_disabled_buttons, button_descriptions, button_descriptions_prototype) {
        var note = "(not allowed)";
        for (var i = 0; i < position_of_disabled_buttons.length; ++i) {
            var pos = position_of_disabled_buttons[i];

            var desc = this._copy_button_description(button_descriptions_prototype[pos]);
            desc.disabled = true;

            if (desc.tooltip.indexOf(note) === -1) {
                desc.tooltip += " " + note;
            }

            button_descriptions[pos] = desc;
        }
    };

    ThreadButtonBarController.prototype._copy_button_description = function (desc_original) {
        var desc = {};
        for (var k in desc_original) {
            desc[k] = desc_original[k];
        }

        desc.icons = {};
        for (var k in desc_original.icons) {
            desc.icons[k] = desc_original.icons[k]; 
        }

        return desc;
    };

    return {ThreadButtonBarController: ThreadButtonBarController};
});
