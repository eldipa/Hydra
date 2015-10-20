define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'widgets/buttons'], function (ace, $, layout, shortcuts, _, buttons) {
    var ThreadButtonBarController = function (thread_follower) {
        this.super("Thread Button Bar Controller");
        this.thread_follower = thread_follower;

        this.create_toolbars();
        this.selected_toolbar = this.toolbar_to_control_a_stopped_thread;
        //this.selected_toolbar = this.toolbar_to_control_a_stopped_thread_in_reverse_mode;
        //this.selected_toolbar = this.toolbar_to_control_a_stopped_thread_in_assembly_mode;
        //TODO wrong labels this.selected_toolbar = this.toolbar_to_control_a_stopped_thread_in_assembly_and_reverse_mode;
        //this.selected_toolbar = this.toolbar_to_control_a_running_thread;
        //TODO wrong labels this.selected_toolbar = this.toolbar_to_control_a_running_thread_in_reverse_mode;
    };

    ThreadButtonBarController.prototype.__proto__ = layout.Panel.prototype;

    ThreadButtonBarController.prototype.render = function () {
        this.selected_toolbar.box = this.box;
        return this.selected_toolbar.render();
    };
   
    ThreadButtonBarController.prototype.unlink = function () {
        return this.selected_toolbar.unlink();
    };

    ThreadButtonBarController.prototype._change_toolbar = function (t) {
        //TODO
    };

    ThreadButtonBarController.prototype._args_for_reversing_mode = function () {
          if (this.thread_follower.is_flow_reversed()) {
              return ["--reverse"];
          }
          else {
              return [];
          }
    };

    ThreadButtonBarController.prototype._target_of_the_action = function () {
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
                  var target = self.thread_followed;
                  
                  if (self.is_in_assembly_mode()) {
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
                  var target = self.thread_followed;

                  if (self.is_in_assembly_mode()) {
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
                  var target = self.thread_followed;

                  target.execute("-exec-finish", args);
               },
            }, 
            {
               label: "Return",
               text: false,
               icons: {primary: 'fa fa-eject'},
               action: function (ev) {
                  ev.preventDefault();
                  var target = self.thread_followed;
                  target.execute("-exec-return", []);
               },
            } 
            ];


        this.toolbar_to_control_a_stopped_thread = new buttons.Buttons(button_descriptions_for_src_stopped_mode, true);
        this.toolbar_to_control_a_stopped_thread_in_reverse_mode = new buttons.Buttons(this._create_button_descriptions_for_reverse_mode_from(button_descriptions_for_src_stopped_mode), true);

        var button_descriptions_in_assembly_mode = this._create_button_descriptions_for_assembly_mode(button_descriptions_for_src_stopped_mode)
        this.toolbar_to_control_a_stopped_thread_in_assembly_mode = new buttons.Buttons(button_descriptions_in_assembly_mode, true);
        this.toolbar_to_control_a_stopped_thread_in_assembly_and_reverse_mode = new buttons.Buttons(this._create_button_descriptions_for_reverse_mode_from(button_descriptions_in_assembly_mode), true);
        
        var button_descriptions_in_running_mode = this._create_button_descriptions_for_running_mode(button_descriptions_for_src_stopped_mode);
        this.toolbar_to_control_a_running_thread = new buttons.Buttons(button_descriptions_in_running_mode, true);
        this.toolbar_to_control_a_running_thread_in_reverse_mode = new buttons.Buttons(this._create_button_descriptions_for_reverse_mode_from(button_descriptions_in_running_mode), true);

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
