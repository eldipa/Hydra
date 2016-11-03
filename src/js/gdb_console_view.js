define(['jquery', 'layout', 'shortcuts', 'underscore', 'xterm', 'event_handler'], function ($, layout, shortcuts, _, xterm, event_handler) {
    var GdbConsoleView = function () {
        this.super("GdbConsoleView");
        this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%; font-family: monaco; overflow: hidden;"></div>');
        this._subscriptions = [];

        this._initialize_terminal();
        this.follow_debugger(null);
    };

    GdbConsoleView.prototype.__proto__ = layout.Panel.prototype;
    layout.implement_render_and_unlink_methods(GdbConsoleView.prototype);

    GdbConsoleView.prototype.render = function () {
        if (this.$out_of_dom) {
            this.$out_of_dom.appendTo(this.box);
            this.$out_of_dom = null;
        }
    
        _.delay(_.bind(this.term.fit, this.term), 100);
    };

    GdbConsoleView.prototype.unlink = function () {
        if (!this.$out_of_dom) {
            this.$out_of_dom = this._$container.detach();
        }
    };

 
    GdbConsoleView.prototype._initialize_terminal = function () {
        var EH = event_handler.get_global_event_handler();

        this.term = new xterm.Terminal({cursorBlink: true});
        this.term.open(this._$container.get(0));

        var term = this.term;   

        term._flushBuffer = function () {
            term.write(term._attachSocketBuffer);
            term._attachSocketBuffer = null;
            clearTimeout(term._attachSocketBufferTimer);
            term._attachSocketBufferTimer = null;
        };

        term._pushToBuffer = function (data) {
            if (term._attachSocketBuffer) {
                term._attachSocketBuffer += data;
            } else {
                term._attachSocketBuffer = data;
                _.delay(_.bind(term._flushBuffer, term), 10);
            }
        };
        

        var self = this;
        term._sendData = function (data) {
            if (self.debugger_id != null) {
                EH.publish("type-into-gdb-console."+self.debugger_id, data);
            }
        };

        term.on('data', term._sendData);
    };

    GdbConsoleView.prototype._subscribe_to_gdb_output_events = function () {
        var EH = event_handler.get_global_event_handler();
        var term = this.term;
        var debugger_id = this.debugger_id;

        this._subscriptions.push(EH.subscribe("output-from-gdb-console."+debugger_id, function (data) {
            term._pushToBuffer(data);
        }));

        this._subscriptions.push(EH.subscribe("last-output-from-gdb-console."+debugger_id, function (data) {
            term.clear();
            term._pushToBuffer(data);
        }));

    };

    GdbConsoleView.prototype._unsubscribe = function () {
        var EH = event_handler.get_global_event_handler();
        for (var i = 0; i < this._subscriptions.length; ++i) {
            EH.unsubscribe(this._subscriptions[i]);
        }
        this._subscriptions = [];

    };

    GdbConsoleView.prototype.request_the_last_output_from_gdb_console = function () {
        var EH = event_handler.get_global_event_handler();
        EH.publish("request-last-output-from-gdb-console."+this.debugger_id, "");
    };

    GdbConsoleView.prototype.follow_debugger = function (debugger_obj) {
        var debugger_id = null;
        if (debugger_obj) {
            debugger_id = debugger_obj.id;
        }

        var debugger_changed = this.debugger_id !== debugger_id;
        var is_the_debugger_alive = (debugger_id != null)

        if (debugger_changed) {
            this.debugger_id = debugger_id;
            this._unsubscribe();
        }

        if (debugger_changed && is_the_debugger_alive) {
            this._subscribe_to_gdb_output_events();
            _.delay(_.bind(this.request_the_last_output_from_gdb_console, this), 500);
        }

        if (debugger_changed && !is_the_debugger_alive) {
            this.term.clear();
            this.term.write("You are not following any debugger.");
        }
    };

    return {GdbConsoleView: GdbConsoleView};
});

