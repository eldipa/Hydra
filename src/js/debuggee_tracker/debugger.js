define(["underscore", "shortcuts", 'event_handler'], function (_, shortcuts, event_handler) {
    'use strict';

    var Debugger = function (id, tracker, obj) {
        this._properties = [];
        this.update(obj);

        this.id = id;
        this.tracker = tracker;
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

    Debugger.prototype.your_thread_groups_by_id = function () {
        return this.tracker.thread_groups_by_debugger[this.id];
    };

    Debugger.prototype.your_breakpoints_by_id = function () {
        return this.tracker.breakpoints_by_debugger[this.id];
    };

    Debugger.prototype.get_thread_group_with_id = function (thread_group_id) {
        return this.tracker.thread_groups_by_debugger[this.id][thread_group_id];
    };

    Debugger.prototype.execute = function (command, args, callback, self_id_argument_position) {
        args = args || [];
        shortcuts.gdb_request(callback || null, 
                this.id, 
                command,
                args
                );
    };
    return {Debugger: Debugger};
});
