define(['ace', 'jquery', 'underscore'], function (ace, $, _) {
    var create_snippet = function (code, is_assembly) {
        var font_size = 11;
        var height = font_size + 3; //px

        var _$container = $('<div style="width: 100%; height: '+height+'px; background-color: initial; font-family: monaco;"></div>');

        var editor = ace.ace.edit(_$container.get()[0]);
      
        editor.setFontSize(11);

        editor.setTheme("ace/theme/monokai");
        editor.setOption("showPrintMargin", false)
        editor.setReadOnly(true);
        editor.setHighlightActiveLine(false);
        editor.renderer.setShowGutter(false);
        
        var ace_mode = is_assembly? "ace/mode/assembly_x86" : "ace/mode/c_cpp";
        editor.getSession().setMode(ace_mode);

        editor.setValue(code);

        $('body').append(_$container);
        //editor.resize(true);
        var renderer = editor.renderer;
        renderer.$renderChanges(2047, true);

        //_$container = _$container.detach();

        console.log(editor);
        console.log(editor.getSession());

        //var line = _$container.find(".ace_line"); //TODO how to update the DOM stuff so we can borrow the ace_line???
        //var line = _$container.find(".ace_text-layer");
        return _$container; //line;
    };

    return {create_snippet: create_snippet};
});
