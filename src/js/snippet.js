define(['ace', 'jquery', 'underscore'], function (ace, $, _) {
    var create_snippet = function (code, opts) {
        var font_size = opts.font_size || 11;
        var height_size = font_size + (opts.interline_size || 8); //px

        var height = (opts.count_lines || 1) * height_size;

        var _$container = $('<div style="width: 100%; height: '+height+'px; background-color: initial; font-family: monaco;"></div>');
        var placeholder = _$container.clone(false, false);

        var editor = ace.ace.edit(_$container.get()[0]);
      
        editor.setFontSize(font_size);

        editor.setTheme("ace/theme/monokai");
        editor.setOption("showPrintMargin", false)
        editor.setReadOnly(true);
        editor.setHighlightActiveLine(false);
        editor.renderer.setShowGutter(false);
        
        var ace_mode = opts.is_assembly? "ace/mode/assembly_x86" : "ace/mode/c_cpp";
        editor.getSession().setMode(ace_mode);

        _.defer(function () {
            $(opts.temporal_in_dom_element || 'body').append(_$container);

            var remain_calls = 2; // Hack, we get 2 calls to afterRender and only in the last we must to replace the placeholder with the editor's content.
            editor.renderer.on("afterRender", function() {
                remain_calls -= 1;
                if (remain_calls !== 0) {
                    return;
                }


                _.defer(function () {
                    editor.destroy();

                    var container = $(_$container);
                    container.children(":not(.ace_scroller)").remove();

                    var scroller = container.children(".ace_scroller");
                    scroller.children(":not(.ace_content)").remove();

                    var content = scroller.children(".ace_content");
                    content.children(":not(.ace_text-layer)").remove();

                    var cloned_without_event_handlers = container.clone(false, false);
                    container.remove();

                    placeholder.replaceWith(cloned_without_event_handlers);
                });
            });

            editor.setValue(code);
        });
        
        return placeholder;
    };

    return {create_snippet: create_snippet};
});
