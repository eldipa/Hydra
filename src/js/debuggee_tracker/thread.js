define(["underscore", "shortcuts", 'event_handler'], function (_, shortcuts, event_handler) {
    'use strict';

    var Thread = function (obj) {
        this._properties = ["id", "debugger_id", "debuggee_tracker", "thread_group_id", "state", "source_fullname", "source_line",  "instruction_address"];
        this.update(obj);
    };
    
    Thread.prototype.update = shortcuts._update_properties;
    
    Thread.prototype.get_display_name = function () {
        return "Thread "+this.id+" ("+this.state+")";
    };

    Thread.prototype.get_debugger_in_which_you_are_running = function () {
        return this.debuggee_tracker.get_debugger(this.debugger_id);
    };

    Thread.prototype.get_thread_group_in_which_you_are_running = function () {
        return this.debuggee_tracker.get_thread_group(this.debugger_id, this.thread_group_id);
    };

    return {Thread: Thread};
});
