define(["underscore", "shortcuts", 'event_handler'], function (_, shortcuts, event_handler) {
    'use strict';

    var Thread = function (id, tracker, obj) {
        this._properties = ["thread_group_id", "state", "source_fullname", "source_line",  "instruction_address"];

        this.update(obj);
        this.id = id;
        this.tracker = tracker;
        this.EH = event_handler.get_global_event_handler();

    };

    Thread.prototype.update = shortcuts._update_properties;

    Thread.prototype.get_display_name = function () {
        return "Thread "+this.id+" ("+this.state+")";
    };


    return {Thread: Thread};
});
