define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore'], function (ace, $, layout, shortcuts, _, thread_button_bar_controller) {
    var get_text_of_gutter_line_number_from_number = function(session, row) {
        return "" + row; // This is the default
    };

    var CodeEditor = function () {
        this.super("Code Editor");

        this._$container = $('<div style="width: 100%; height: 100%; font-family: monaco;"></div>');
        this.create_ace_viewer();

        this._$out_of_dom = this._$container;
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


    CodeEditor.prototype.load_cpp_code = function (source_fullname) {
        this.edit_session.setMode("ace/mode/c_cpp");
        this.use_the_common_decimal_gutter();
        this.load_code_from_file(source_fullname);
    };


    CodeEditor.prototype.load_assembly_code = function (addresses, assembly_code) {
        this.edit_session.setMode("ace/mode/assembly_x86");  // TODO avoid re create the session if the file to load is already loaded
        this.use_the_gutter_for_hexa_addresses(addresses);
        this.load_code_from_string(assembly_code);
    };

    CodeEditor.prototype.go_to_line = function (line_number) {
        this.editor.scrollToLine(line_number, false, false);
        this.editor.gotoLine(line_number, 0, false);
    };

    CodeEditor.prototype.highlight_lines = function (css_classes, start_line_number, end_line_number) {
        var end_line_number = end_line_number || start_line_number;

        var range = new ace.range.Range(start_line_number, 0, end_line_number, 10);
        var marker_id = this.edit_session.addMarker(range, "code-editor-marker " + css_classes, "fullLine");

        console.log(start_line_number);
        console.log(end_line_number);
        return {marker_id: marker_id};
    };

    CodeEditor.prototype.remove_highlight = function (highlight) {
        this.edit_session.removeMarker(highlight.marker_id);
    };

    CodeEditor.prototype.highlight_thread_current_line = function (line_number) {
        return this.highlight_lines("code-editor-thread-current-line", line_number);
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

