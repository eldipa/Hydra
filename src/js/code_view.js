define(['ace', 'jquery', 'layout'], function (ace, $, layout) {
   function CodeView() {
      this.super("Code View");

      this._$container = $('<div style="width: 100%; height: 100%;"></div>');
      this.create_ace_viewer();
      this.saved_session_by_filename = {};
      this.filename = null;

      this._$out_of_dom = this._$container;
   }

   CodeView.prototype.__proto__ = layout.Panel.prototype;

   CodeView.prototype.attach_menu = function (menu) {
      this._$container.data('ctxmenu_controller', menu);
   };


   /* 
    * Load a file only if the file wasn't loaded already.
    * In any case, the current session is replaced by the session that
    * represent the state of the file.
    * If the file is new (is loaded), the session is new too.
    * But if the file was loaded previously, the session of that file is used.
    * */
   CodeView.prototype.load_file = function (filename, encoding) {
      var session = this.saved_session_by_filename[filename];
      if(!session) {
         session = new ace.EditSession("");

         session.setMode("ace/mode/c_cpp");

         this.viewer.setSession(session);
         this.saved_session_by_filename[filename] = this.viewer.getSession();
         this.filename = filename;
         this.load_code_from_file(filename);
      }
      else {
         this.filename = filename
         this.viewer.setSession(this.saved_session_by_filename[filename]);
      }
   };

   /*
    * Define where should be a breakpoint in the current file.
    * */
   CodeView.prototype.setBreakpoint = function (line_num) {
      this.highlightLine(line_num, 'danger');
   };

   /*
    * Define the current line (under execution) in th current file.
    * If there is a previous 'current' line, this is removed.
    * */
   CodeView.prototype.setCurrentLine = function (line_num) {
      var session = this.viewer.getSession();
      var last_current_line = session.last_current_line;
      
      if(last_current_line) {
         this.removeHightlight(last_current_line.line_highlighted_id);
      }

      var line_highlighted_id = this.highlightLine(line_num, 'info');
      session.last_current_line = {line: line_num, line_highlighted_id: line_highlighted_id};
   };

   /*
    * Remove the current line of all the open files.
    * */
   CodeView.prototype.cleanCurrentLine = function () {
      for(var filename in this.saved_session_by_filename) {
         var session = this.saved_session_by_filename[filename];
         var last_current_line = session.last_current_line;
         
         if(last_current_line) {
            this.removeHightlight(last_current_line.line_highlighted_id);
            session.last_current_line = null;
         }
      }
   };

   /*
    * Move the cursor to that line.
    * */
   CodeView.prototype.gotoLine = function (line_num) {
      this.viewer.gotoLine(line_num);
   }

   /* Render */
   CodeView.prototype.render = function () {
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

      this.viewer.resize();
   };

   CodeView.prototype.unlink = function () {
      if (!this._$out_of_dom) {
         this._$out_of_dom = this._$container.detach();
      }
   }


   /*
    * Internal.
    * Create an Ace editor and put in the DOM.
    * Set some properties like the font size or the editor's theme.
    * */
   CodeView.prototype.create_ace_viewer = function () {
      this.viewer = ace.ace.edit(this._$container.get()[0]);
      
      this.viewer.setFontSize(14);
      this.viewer.setTheme("ace/theme/xcode");
      this.viewer.setOption("showPrintMargin", false)
      this.viewer.setReadOnly(false);
      
      this.viewer.setHighlightActiveLine(false);
   };

   /*
    * Internal.
    * Load a file into the current editor's session.
    * */
   CodeView.prototype.load_code_from_file = function (filename, encoding) {
      var fs = require('fs');
      var code = fs.readFileSync(filename, encoding || "ascii");
      this.load_code_from_string(code);
   };

   /*
    * Internal.
    * Same like 'load_code_from_file' but load a string instead a file.
    * */
   CodeView.prototype.load_code_from_string = function (string) {
      this.viewer.setValue(string);
   };

   /* 
    * Internal.
    *
    * The 'mark' is the type of the highlight: 
    *  - danger
    *  - warning
    *  - info
    *  - success
    *
    * The marks are transformed to CSS classes using Bootsstrap. 
    * See http://getbootstrap.com/components/#alerts
    *
    * For this to work, there must be a CSS class named 'fixed-position' like this:
    *     .fixed-position {
    *        position: absolute;
    *     }
    *
    * */
   CodeView.prototype.highlightLines = function (start_line, end_line, mark) {
      var cls = "alert-" + mark + " fixed-position";
      return {
         filename: this.filename,
         id: this.viewer.getSession().highlightLines(start_line - 1, end_line - 1, cls).id
      };
   };

   CodeView.prototype.highlightLine = function (line_num, mark) {
      var cls = "alert-" + mark + " fixed-position";
      return {
         filename: this.filename,
         id: this.viewer.getSession().highlightLines(line_num - 1, cls).id
      };
   };

   CodeView.prototype.removeHightlight = function (highlight_id) {
      this.saved_session_by_filename[highlight_id.filename].removeMarker(highlight_id.id);
   };

   return {CodeView: CodeView};
});
