define(["underscore", "shortcuts", 'event_handler'], function (_, shortcuts, event_handler) {
    'use strict';

    var Thread = function (id, tracker, obj) {
        this._properties = ["debugger_id", "thread_group_id", "state", "source_fullname", "source_line",  "instruction_address"];

        this.update(obj);
        this.id = id;
        this.tracker = tracker;
        this.EH = event_handler.get_global_event_handler();

    };

    Thread.prototype.update = shortcuts._update_properties;

    Thread.prototype.get_display_name = function () {
        return "Thread "+this.id+" ("+this.state+")";
    };
    
    Thread.prototype.get_display_controller = function (from_who) {
        if (from_who.thread_follower) {  // a hack?? TODO review this
            var self = this;
            return [{
                   text: 'Follow',
                   action: function (e) {
                      e.preventDefault();
                      from_who.thread_follower.follow(self);
                   },
                  }];
        }
        else {
            return [];
        }
    };

    Thread.prototype.get_thread_group_you_belong = function () {
        return this.tracker.get_debugger_with_id(this.debugger_id).get_thread_group_with_id(this.thread_group_id);
    };

    Thread.prototype.execute = function (command, args, callback, self_id_argument_position) {
        args = args || [];
        var self_id_argument = "--thread " + this.id;

        if (self_id_argument_position === undefined) {
            args.push(self_id_argument);
        }
        else {
            args[self_id_argument_position] = self_id_argument;
        }

        var response = shortcuts.gdb_request(
                this.debugger_id, 
                command,
                args
                );

        if (callback) {
            response.then(callback);
        }
    };

    Thread.prototype.get_stacktrace = function (on_success) {
        this.execute("-stack-list-frames", ["SELF", "--no-frame-filters"], on_success, 0);
    };

    return {Thread: Thread};
});
