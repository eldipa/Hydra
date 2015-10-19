define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'widgets/buttons'], function (ace, $, layout, shortcuts, _, buttons) {
    var get_text_of_gutter_line_number_from_number = function(session, row) {
        return "" + row; // This is the default
    };

    var CodeEditor = function () {
        this.super("Code Editor");

        this._$container = $('<div style="width: 100%; height: 100%; font-family: monaco;"></div>');
        this.create_ace_viewer();

        this._$out_of_dom = this._$container;

        this.current_loaded_file = "";

        this.create_toolbar();
    };

    CodeEditor.prototype.__proto__ = layout.Panel.prototype;

    CodeEditor.prototype.render = function () {
        if (this._$out_of_dom) {
            if ($(this.box).css('position') === 'relative') {
                this._$out_of_dom.css('position', 'absolute');
            }
            else {
                this._$out_of_dom.css('position', '');
            }

            this._$out_of_dom.appendTo(this.box);
            this._$out_of_dom = null;
        }

        this.editor.resize();
    };
   
    CodeEditor.prototype.unlink = function () {
        if (!this._$out_of_dom) {
            this._$out_of_dom = this._$container.detach();
        }
    };

    CodeEditor.prototype.attach_menu = function (menu) {
        this._$container.data('ctxmenu_controller', menu);
    };

    CodeEditor.prototype.create_toolbar = function () {
        var self = this;

        var args_for_reversing_mode = function () {
              if (self.is_flow_reversed()) {
                  return ["--reverse"];
              }
              else {
                  return [];
              }
        };

        var target_of_the_action = function () {
              if (self.is_targeting_to_all_threads_in_thread_group()) {
                  return self.thread_followed.get_thread_group_you_belong();
              }
              else {
                  return self.thread_followed;
              }
        };

        this.toolbar = new buttons.Buttons([
             {
               label: "Continue",  // "Interrupt"
               text: false,
               icons: {primary: 'fa fa-play'},  // fa-pause
               action: function (ev) {
                  ev.preventDefault();
                  var args = args_for_reversing_mode();
                  var target = target_of_the_action();

                  if (self.is_current_thread_running()) {
                      target.execute("-exec-interrupt", []);
                  }
                  else {
                      target.execute("-exec-continue", args);
                  }
               },
            },
            {
               label: "Next",
               text: false,
               icons: {primary: 'fa fa-step-forward'},
               action: function (ev) {
                  ev.preventDefault();
                  var args = args_for_reversing_mode();
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
                  var args = args_for_reversing_mode();
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
                  var args = args_for_reversing_mode();
                  var target = self.thread_followed;

                  target.execute("-exec-interrupt", args);
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
            ]
                , true);
    };

    CodeEditor.prototype.follow = function (thread_to_follow) {
        this.thread_followed = thread_to_follow;
        this.see_your_thread_and_update_yourself();
    }; 

    // TODO: the CodeEditor should update himself not only if its thread changed but also if
    // other threads changed and their files are the same that the file seen by this CodeEditor
    CodeEditor.prototype.update = function (data, topic, tracker) {
        if (data.thread === this.thread_to_follow) {
            console.log("Update");
            this.see_your_thread_and_update_yourself();
        }
    };

    CodeEditor.prototype.is_this_file_already_loaded = function(filename) {
        return this.current_loaded_file === filename;
    };

    CodeEditor.prototype.see_your_thread_and_update_yourself = function () {
        var source_fullname = this.thread_followed.source_fullname;
        var line_number_str = this.thread_followed.source_line;

        if (source_fullname && line_number_str) {
            if (! this.is_this_file_already_loaded(source_fullname)) {
                this.update_yourself_from_source_code(source_fullname, line_number_str);
            }
        }
        else {
            var instruction_address = this.thread_followed.instruction_address;
            //TODO request to GDB to dissamble few (how much?) instructions around 'instruction_address'.
            //then call update_yourself_from_dissabled_code
        }
    };

    CodeEditor.prototype.update_yourself_from_source_code = function (source_fullname, line_number) {
        //TODO do we need to disable the code view (ace) before doing this stuff and reenable it later?
        
        line_number = 0 + line_number;
        
        this.edit_session.setMode("ace/mode/c_cpp");
        this.use_the_common_decimal_gutter();
        this.load_code_from_file(source_fullname); // TODO use line_number

        this.current_loaded_file = source_fullname;
    };


    CodeEditor.prototype.update_yourself_from_disassembled_code = function (disassembled_code_gdb_event) {
        //TODO do we need to disable the code view (ace) before doing this stuff and reenable it later?

        var asm_lines = disassembled_code_gdb_event['results']['asm_insns'];

        var addresses    = _.pluck(asm_lines, 'address');
        var instructions = _.pluck(asm_lines, 'inst');

        this.edit_session.setMode("ace/mode/assembly_x86");  // TODO avoid re create the session if the file to load is already loaded
        this.use_the_gutter_for_hexa_addresses(addresses);
        this.load_code_from_string(instructions.join('\n')); //TODO can we avoid the join??
        
        this.current_loaded_file = null;
    };

    
    /* Internal */

    CodeEditor.prototype.create_ace_viewer = function () {
        this.editor = ace.ace.edit(this._$container.get()[0]);
      
        this.editor.setFontSize(14);
        this.editor.setTheme("ace/theme/monokai");
        this.editor.setOption("showPrintMargin", false)
        this.editor.setReadOnly(true);
      
        this.editor.setHighlightActiveLine(false);
     
        this.edit_session = this.editor.getSession();
        this.create_gutter_render();
    };


    CodeEditor.prototype.create_gutter_render = function () {
        this.edit_session.gutterRenderer = { 
           getWidth: function(session, lastLineNumber, config) { // I don't know, but this is a Must
               return lastLineNumber.toString().length * config.characterWidth;
           },
           getText: get_text_of_gutter_line_number_from_number
        };
    };

    CodeEditor.prototype.use_the_common_decimal_gutter = function () {
        if (this.edit_session.gutterRenderer.getText !== get_text_of_gutter_line_number_from_number) {
            this.update_gutter_with(get_text_of_gutter_line_number_from_number);
        }
    };

    CodeEditor.prototype.use_the_gutter_for_hexa_addresses = function (addresses_by_line_number) {
        var get_text_of_gutter_line_number_from_address = function(session, row) {
            return addresses_by_line_number[row]; // Returns a String
        };

        this.update_gutter_with(get_text_of_gutter_line_number_from_address);
    }

    CodeEditor.prototype.update_gutter_with = function (get_text_for_gutter) {
        this.editor.renderer.setShowGutter(false);
        this.edit_session.gutterRenderer.getText = get_text_for_gutter;
        this.editor.renderer.setShowGutter(true);
    }
   
    CodeEditor.prototype.load_code_from_file = function (filename, encoding) {
        var fs = require('fs');
        var code = fs.readFileSync(filename, encoding || "ascii");
        this.load_code_from_string(code);
    };

    CodeEditor.prototype.load_code_from_string = function (string) {
        this.editor.setValue(string);
    };

    return {CodeEditor: CodeEditor};
});

