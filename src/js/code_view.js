define(['ace', 'jquery'], function (ace, $) {

   var view_dom = $('<div style="width: 100%; height: 100%; min-width: 100px; min-height: 100px"></div>');
   var viewer = ace.ace.edit(view_dom.get()[0]);

   viewer.setFontSize(14);
   viewer.setTheme("ace/theme/xcode");
   viewer.getSession().setMode("ace/mode/c_cpp");
   viewer.setReadOnly(true);

   viewer.setValue('void fun(int a) {\n   asaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;\n   sasas;\n\n   return;\n}\n\nvoid bar(int a) {\n   a;\n   a;\n   a;\n   a;\n   a;\n   a;\n   a;\n   a;\n   a;\n   b;\n   }\n');
   viewer.gotoLine(1);
   viewer.getSession().setUseWrapMode(true);
   viewer.setHighlightActiveLine(true);

   viewer.getSession().highlightLines(9, 10, "alert-danger fixed-position");
   viewer.getSession().highlightLines(12, "alert-danger fixed-position");

   return {view_dom: view_dom};
});
