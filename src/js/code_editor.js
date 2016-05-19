define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore'], function (ace, $, layout, shortcuts, _) {
    var get_text_of_gutter_line_number_from_number = function(session, ace_row_number) {
        return "" + (ace_row_number+1);
    };

    var ace_row_lookup_from_line_number = function(line_number) {
        return Number(line_number)-1;
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

    CodeEditor.prototype.go_to_line = function (line_number_or_address) {
        var ace_row_number = this.ace_row_lookup_from_gutter_line(line_number_or_address);

        var ace_line_number = ace_row_number + 1;
        this.editor.scrollToLine(ace_line_number, true, false);
        this.editor.gotoLine(ace_line_number, 0, false);
    };

    CodeEditor.prototype._highlight_ace_range = function (hightlight, stringBuilder, range, left, top, config) {
        var hightlight_classes = hightlight.css_classes;
        var note = hightlight.note;

        var note_str = "";
        if (note) {
            var note_elem = $('<span style="pointer-events: auto;"></span>');
            note_elem.text(note.text);
            note_str = note_elem.prop('outerHTML');
        }

        var clazz = "code-editor-marker " + hightlight_classes;
        var extraStyle = "text-align: right;";

        var height = config.lineHeight;
        
        if (range.start.row != range.end.row)
            height += ((range.end.row - config.firstRowScreen) * config.lineHeight) - top;

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "top:", top, "px;",
            "left:0;right:0;", extraStyle || "", "'>"+note_str+"</div>"
        );
    };

    CodeEditor.prototype.highlight_lines = function (hightlight, start_line_number_or_address, end_line_number_or_address) {
        var start = this.ace_row_lookup_from_gutter_line(start_line_number_or_address);

        if (end_line_number_or_address === null || end_line_number_or_address === undefined) {
            var end = start;
        }
        else {
            var end = this.ace_row_lookup_from_gutter_line(end_line_number_or_address);
        }

        var range = new ace.range.Range(start, 0, end, 10);
        //var marker_id = this.edit_session.addMarker(range, "code-editor-marker " + css_classes, "fullLine");

        var marker_id = this.edit_session.addMarker(range, "", _.partial(this._highlight_ace_range, hightlight));

        return {marker_id: marker_id};
    };

    CodeEditor.prototype.remove_highlight = function (highlight) {
        this.edit_session.removeMarker(highlight.marker_id);
    };

    CodeEditor.prototype.highlight_thread_current_line = function (line_number_or_address, note) {
        return this.highlight_lines({
            css_classes: "code-editor-thread-current-line",
            note: note
        }, line_number_or_address);
    };

    CodeEditor.prototype.highlight_breakpoint = function (line_number_or_address, note) {
        return this.highlight_lines({
            css_classes: "code-editor-breakpoint",
            note: note
        }, line_number_or_address);
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

        this.ace_row_lookup_from_gutter_line = ace_row_lookup_from_line_number;
    };

    CodeEditor.prototype.use_the_common_decimal_gutter = function () {
        if (this.edit_session.gutterRenderer.getText !== get_text_of_gutter_line_number_from_number) {
            this.update_gutter_with(get_text_of_gutter_line_number_from_number, ace_row_lookup_from_gutter_line);
        }
    };

    CodeEditor.prototype.use_the_gutter_for_hexa_addresses = function (addresses_by_ace_row_number) {
        var get_text_of_gutter_line_number_from_address = function(session, ace_row_number) {
            return addresses_by_ace_row_number[ace_row_number]; // Returns a String
        };

        var ace_row_lookup_from_address = function (address) {
            return _.indexOf(addresses_by_ace_row_number, address, true); // Return -1 if fails: TODO what we should do in that case?
        };

        this.update_gutter_with(get_text_of_gutter_line_number_from_address, ace_row_lookup_from_address);
    }

    // The get_text_for_gutter function maps each ace row (from 0 to N-1) to a nice and meaningful text for
    // the gutter:
    //   - String numbers from 1 to N when the loaded code is a source code
    //   - String hexadecimal addresses from A to B (where A < B) whe the loaded code is in assembly.
    //
    // The inverse_for_ace_row_lookup reverts the operation. Given a string from the gutter (string numbers or string
    // hexadecimal addresses) returns the corresponding row number in the ace editor (a number from 0 to N-1).
    //
    CodeEditor.prototype.update_gutter_with = function (get_text_for_gutter, inverse_for_ace_row_lookup) {
        this.editor.renderer.setShowGutter(false);
        this.edit_session.gutterRenderer.getText = get_text_for_gutter;
        this.editor.renderer.setShowGutter(true);

        this.ace_row_lookup_from_gutter_line = inverse_for_ace_row_lookup;
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

