define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'widgets/buttons'], function (ace, $, layout, shortcuts, _, buttons) {
    var create_method_to_control_mode = function (mode_name, is_method_to_enter_in_the_mode) {
        var is_method_to_enter_in_the_mode = !!is_method_to_enter_in_the_mode;
        var f = function (is_pseudo_mode) {
            if (is_pseudo_mode) {
                this.pseudo_mode[mode_name] = is_method_to_enter_in_the_mode;
            }
            else {
                this.mode[mode_name] = is_method_to_enter_in_the_mode;
            }
        };

        return f;
    };

    var ThreadButtonBarController = function (thread_follower) {
        this.super("Thread Button Bar Controller");
        this.thread_follower = thread_follower;

        this.mode = {
            is_targeting_all_threads = false,
            is_running: false,
            is_in_assembly: false,
            is_in_reverse_mode: false,
        };

        this.pseudo_mode = {};

        this.create_toolbars();
        this.select_toolbar();

        //this.selected_toolbar = this.toolbar_to_control_a_stopped_thread_in_reverse_mode;
        //this.selected_toolbar = this.toolbar_to_control_a_stopped_thread_in_assembly_mode;
        //TODO wrong labels this.selected_toolbar = this.toolbar_to_control_a_stopped_thread_in_assembly_and_reverse_mode;
        //this.selected_toolbar = this.toolbar_to_control_a_running_thread;
        //TODO wrong labels this.selected_toolbar = this.toolbar_to_control_a_running_thread_in_reverse_mode;
    };

    ThreadButtonBarController.prototype.enter_targeting_all_threads_mode = create_method_to_control_mode("is_targeting_all_threads", true);
    ThreadButtonBarController.prototype.leave_targeting_all_threads_mode = create_method_to_control_mode("is_targeting_all_threads", false);

    ThreadButtonBarController.prototype.enter_assembly_mode = create_method_to_control_mode("is_in_assembly", true);
    ThreadButtonBarController.prototype.leave_assembly_mode = create_method_to_control_mode("is_in_assembly", false);

    ThreadButtonBarController.prototype.enter_reverse_mode = create_method_to_control_mode("is_in_reverse_mode", true);
    ThreadButtonBarController.prototype.leave_reverse_mode = create_method_to_control_mode("is_in_reverse_mode", false);

    ThreadButtonBarController.prototype.update_toolbar = function () {
        this.selected_toolbar.unlink();
        this.select_toolbar();
        this.selected_toolbar.render(); //TODO dont render if we arent in the ui
    };

    ThreadButtonBarController.prototype.select_toolbar = function () {
        this.selected_toolbar = this.toolbar_by_mode\
                                [this.pseudo_mode.is_targeting_all_threads|| this.mode.is_targeting_all_threads]\
                                [this.pseudo_mode.is_running || this.mode.is_running]\
                                [this.is_in_assembly()]\
                                [this.is_in_reverse_mode()];
    };

    ThreadButtonBarController.prototype.is_in_assembly = function () {
        return this.pseudo_mode.is_in_assembly || this.mode.is_in_assembly;
    };

    ThreadButtonBarController.prototype.is_in_reverse_mode = function () {
        return this.pseudo_mode.is_in_reverse_mode || this.mode.is_in_reverse_mode;
    };

    ThreadButtonBarController.prototype.__proto__ = layout.Panel.prototype;

    ThreadButtonBarController.prototype.render = function () {
        this.selected_toolbar.box = this.box;
        return this.selected_toolbar.render();
    };
   
    ThreadButtonBarController.prototype.unlink = function () {
        return this.selected_toolbar.unlink();
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
          if (this.thread_follower.is_targeting_to_all_threads_in_thread_group()) {
              return this.thread_follower.thread_followed.get_thread_group_you_belong();
          }
          else {
              return this.thread_follower.thread_followed;
          }
    };

    ThreadButtonBarController.prototype.create_toolbars = function () {
        var self = this;

        var button_descriptions_for_src_stopped_mode = [
             {
               label: "Continue",
               text: false,
               icons: {primary: 'fa fa-play'},
               action: function (ev) {
                  ev.preventDefault();
                  var args = self._args_for_reversing_mode();
                  var target = self._target_of_the_action();

                  target.execute("-exec-continue", args);
               },
            },
            {
               label: "Next",
               text: false,
               icons: {primary: 'fa fa-step-forward'},
               action: function (ev) {
                  ev.preventDefault();
                  var args = self._args_for_reversing_mode();
                  var target = self.thread_follower.thread_followed;
                  
                  if (self.is_in_assembly()) {
                      target.execute("-exec-next-instruction", args);
                  }
                  else {
                      target.execute("-exec-next", args);
                  }
               },
            }, 
            {
               label: "Step",
               text: false,
               icons: {primary: 'fa fa-sign-in'},
               action: function (ev) {
                  ev.preventDefault();
                  var args = self._args_for_reversing_mode();
                  var target = self.thread_follower.thread_followed;

                  if (self.is_in_assembly()) {
                      target.execute("-exec-step-instruction", args);
                  }
                  else {
                      target.execute("-exec-step", args);
                  }
               },
            }, 
            {
               label: "Finish",
               text: false,
               icons: {primary: 'fa fa-forward'},
               action: function (ev) {
                  ev.preventDefault();
                  var args = self._args_for_reversing_mode();
                  var target = self.thread_follower.thread_followed;

                  target.execute("-exec-finish", args);
               },
            }, 
            {
               label: "Return",
               text: false,
               icons: {primary: 'fa fa-eject'},
               action: function (ev) {
                  ev.preventDefault();
                  var target = self.thread_follower.thread_followed;
                  target.execute("-exec-return", []);
               },
            } 
            ];


        var toolbar_to_control_a_stopped_thread = new buttons.Buttons(button_descriptions_for_src_stopped_mode, true);
        var toolbar_to_control_a_stopped_thread_in_reverse_mode = new buttons.Buttons(this._create_button_descriptions_for_reverse_mode_from(button_descriptions_for_src_stopped_mode), true);

        var button_descriptions_in_assembly_mode = this._create_button_descriptions_for_assembly_mode(button_descriptions_for_src_stopped_mode)
        var toolbar_to_control_a_stopped_thread_in_assembly_mode = new buttons.Buttons(button_descriptions_in_assembly_mode, true);
        var toolbar_to_control_a_stopped_thread_in_assembly_and_reverse_mode = new buttons.Buttons(this._create_button_descriptions_for_reverse_mode_from(button_descriptions_in_assembly_mode), true);
        
        var button_descriptions_in_running_mode = this._create_button_descriptions_for_running_mode(button_descriptions_for_src_stopped_mode);
        var toolbar_to_control_a_running_thread = new buttons.Buttons(button_descriptions_in_running_mode, true);
        var toolbar_to_control_a_running_thread_in_reverse_mode = new buttons.Buttons(this._create_button_descriptions_for_reverse_mode_from(button_descriptions_in_running_mode), true);

        // By is_running first,  TODO add is_targeting_all_threads!!!
        // by is_in_assembly second,
        // by is_in_reverse_mode as last
        this.toolbar_by_mode = {
            true: {
                true: {
                    true: {
                        toolbar_to_control_a_running_thread_in_reverse_mode,
                    },
                    false: {
                        toolbar_to_control_a_running_thread,
                    },
                },
                false: {
                    true: {
                        toolbar_to_control_a_running_thread_in_reverse_mode,
                    },
                    false: {
                        toolbar_to_control_a_running_thread,
                    },
                },
            },
            false: {
                true: {
                    true: {
                        toolbar_to_control_a_stopped_thread_in_assembly_and_reverse_mode,
                    },
                    false: {
                        toolbar_to_control_a_stopped_thread_in_assembly_mode,
                    },
                },
                false: {
                    true: {
                        toolbar_to_control_a_stopped_thread_in_reverse_mode,
                    },
                    false: {
                        toolbar_to_control_a_stopped_thread,
                    },
                },
            },
    };

    ThreadButtonBarController.prototype._create_button_descriptions_for_reverse_mode_from = function (button_descriptions_prototype, position_of_disabled_buttons) {
        var button_descriptions = [];
        for (var i = 0; i < button_descriptions_prototype.length; ++i) {
            var desc = this._copy_button_description(button_descriptions_prototype[i]);

            desc.label += " backward";
            desc.icons.primary += " fa-flip-horizontal";

            button_descriptions.push(desc);
        }

        this._configure_disable_buttons_inplace([4], button_descriptions, button_descriptions_prototype);

        return button_descriptions;
    };
    
    ThreadButtonBarController.prototype._create_button_descriptions_for_assembly_mode = function (button_descriptions_prototype) {
        var button_descriptions = [];
        for (var i = 0; i < button_descriptions_prototype.length; ++i) {
            var desc = this._copy_button_description(button_descriptions_prototype[i]);
            if (i !== 0) {
                desc.label += " instruction";
            } // Continue/Interrupt 

            button_descriptions.push(desc);
        }

        this._configure_disable_buttons_inplace([3, 4], button_descriptions, button_descriptions_prototype);

        return button_descriptions;
    };
    
    ThreadButtonBarController.prototype._create_button_descriptions_for_running_mode = function (button_descriptions_prototype) {
        var button_descriptions = [];
        for (var i = 0; i < button_descriptions_prototype.length; ++i) {
            var desc = this._copy_button_description(button_descriptions_prototype[i]);
            button_descriptions.push(desc);
        }

        button_descriptions[0].label = "Interrupt";
        button_descriptions[0].icons.primary = "fa fa-pause";

        this._configure_disable_buttons_inplace([1, 2, 3, 4], button_descriptions, button_descriptions_prototype);

        return button_descriptions;
    };

    ThreadButtonBarController.prototype._configure_disable_buttons_inplace = function (position_of_disabled_buttons, button_descriptions, button_descriptions_prototype) {
        for (var i = 0; i < position_of_disabled_buttons.length; ++i) {
            var pos = position_of_disabled_buttons[i];

            var desc = this._copy_button_description(button_descriptions_prototype[pos]);
            desc.disabled = true;
            desc.label += " (not allowed)"

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
