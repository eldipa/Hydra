define(['ace', 'jquery'], function (ace, $) {
   function CodeView() {
      this.view_dom = $('<div style="width: 100%; height: 100%; min-width: 100px; min-height: 100px"></div>');
      this.viewer = ace.ace.edit(this.view_dom.get()[0]);
      
      this.viewer.setFontSize(14);
      this.viewer.setTheme("ace/theme/xcode");
      this.viewer.getSession().setMode("ace/mode/c_cpp");
      this.viewer.setReadOnly(true);
      
      this.viewer.getSession().setUseWrapMode(true);
      this.viewer.setHighlightActiveLine(true);
   }

   CodeView.prototype.load_code_from_file = function (filename, encoding) {
      var fs = require('fs');
      var code = fs.readFileSync(filename, encoding || "ascii");

      this.load_code_from_string(code);
   };

   CodeView.prototype.load_code_from_string = function (string) {
      this.viewer.setValue(string);
   };

   CodeView.prototype.gotoLine = function (line_num) {
      this.viewer.gotoLine(line_num);
   }

   /*
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
      this.viewer.getSession().highlightLines(start_line - 1, end_line - 1, cls);
   }

   CodeView.prototype.highlightLine = function (line_num, mark) {
      var cls = "alert-" + mark + " fixed-position";
      this.viewer.getSession().highlightLines(line_num - 1, cls);
   }

   return {CodeView: CodeView};
});
