define(["underscore", "shortcuts", 'event_handler'], function (_, shortcuts, event_handler) {
    'use strict';

    var Debugger = function (obj) {
        this._properties = ["id", "debuggee_tracker"];
        this.update(obj);
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
        this.debuggee_tracker.EH.publish("spawner.kill-debugger", {'debugger-id': this.id}); // like 'what to do with the debuggees?'
    };

    Debugger.prototype.get_thread_groups_by_id = function () {
        return this.debuggee_tracker.thread_groups_by_debugger[this.id];
    };

    return {Debugger: Debugger};
});
