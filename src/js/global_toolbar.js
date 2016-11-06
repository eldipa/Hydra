define(['jquery', 'layout', 'shortcuts', 'underscore', 'widgets/buttons','event_handler'], function ($, layout, shortcuts, _, buttons, event_handler) {
    var GlobalToolbar = function () {
        this.super("Global Button Bar");
        
        var EH = event_handler.get_global_event_handler();
        
        var self = this;
        var button_descriptions = [
             {
               label: "DevTools",
               text: false,
               tooltip: "Open the Developer Tools.",
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
               tooltip: "Reload everything in the UI.",
               icons: {primary: 'fa fa-fw fa-refresh'},
               action: function (ev) {
                  var W = require('nw.gui').Window.get();
                  W.reloadIgnoringCache();
               },
            },{
                label: "ProcessView",
                text: false,
                tooltip: "Show Process Graph.",
                icons: {primary: 'fa fa-fw fa-code-fork'},
                action: function (ev) {
                	EH.publish("Layout.showProcessGraph",{});
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
