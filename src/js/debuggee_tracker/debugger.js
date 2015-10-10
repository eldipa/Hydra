define(["underscore", "shortcuts", 'event_handler'], function (_, shortcuts, event_handler) {
    'use strict';

    var Debugger = function (id, obj) {
        this._properties = [];
        this.update(obj);

        this.id = id;
        this.EH = event_handler.get_global_event_handler();
    };

    Debugger.prototype.update = shortcuts._update_properties;
    Debugger.prototype.get_display_name = function () {
        return "GDB " + this.id;
    };

    Debugger.prototype.add_thread_group = function () {
        shortcuts.gdb_request(null, 
            this.id, 
            "-add-inferior",
            []
            );
    };

    Debugger.prototype.kill = function () {  // TODO this is only a draft, add more options
        this.EH.publish("spawner.kill-debugger", {'debugger-id': this.id}); // like 'what to do with the debuggees?'
    };

    return {Debugger: Debugger};
});
