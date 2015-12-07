define(['jquery', 'layout', 'shortcuts', 'underscore', 'widgets/buttons'], function ($, layout, shortcuts, _, buttons) {
    var GlobalToolbar = function () {
        this.super("Global Button Bar");
        
        var self = this;
        var button_descriptions = [
             {
               label: "DevTools",
               text: false,
               icons: {primary: 'fa fa-fw fa-wrench'},
               action: function (ev) {
                  ev.preventDefault();
                  var W = require('nw.gui').Window.get();
                  if (!W.isDevToolsOpen()) {
                    W.showDevTools();
                  }
               },
            },{
               label: "Refresh UI",
               text: false,
               icons: {primary: 'fa fa-fw fa-refresh'},
               action: function (ev) {
                  var W = require('nw.gui').Window.get();
                  W.reloadIgnoringCache();
               },
            }
        ];

        this._$toolbar = buttons.create_button_bar(button_descriptions, true, true);
        this._$toolbar.css({'margin-bottom': "-50%", "margin-right": "0px"});

        this._$container = $('<div style="position: fixed; bottom: 50%;  right: -1px; z-index: 9999"></div>');
        this._$out_of_dom = this._$container;

        this._$container.append(this._$toolbar);
    };

    GlobalToolbar.prototype.__proto__ = layout.Panel.prototype;
    layout.implement_render_and_unlink_methods(GlobalToolbar.prototype);

    return {
        GlobalToolbar: GlobalToolbar
    };

});
