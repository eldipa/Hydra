define(['ace', 'jquery', 'underscore'], function (ace, $, _) {
    var create_snippet = function (code, opts) {
        var font_size = 11;
        var height = font_size + 3; //px

        var _$container = $('<div style="width: 100%; height: '+height+'px; background-color: initial; font-family: monaco;"></div>');
        var placeholder = _$container.clone(false, false);

        var editor = ace.ace.edit(_$container.get()[0]);
      
        editor.setFontSize(11);

        editor.setTheme("ace/theme/monokai");
        editor.setOption("showPrintMargin", false)
        editor.setReadOnly(true);
        editor.setHighlightActiveLine(false);
        editor.renderer.setShowGutter(false);
        
        var ace_mode = opts.is_assembly? "ace/mode/assembly_x86" : "ace/mode/c_cpp";
        editor.getSession().setMode(ace_mode);

        editor.setValue(code);

        $(opts.temporal_in_dom_element || 'body').append(_$container);

        setTimeout(function() {
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
          }, 300); // TODO this is hardcoded!! we dont know how to build the snippet with ace synchronously.
                   // Our best shot is to wait some time and then we put the snippet into its final target.
          
          return placeholder;
    };

    return {create_snippet: create_snippet};
});
