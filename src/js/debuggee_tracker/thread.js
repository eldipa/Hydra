define(["underscore", "shortcuts", 'event_handler', 'debuggee_tracker/frame'], function (_, shortcuts, event_handler, frame_module) {
    'use strict';

    var Frame = frame_module.Frame;

    var Thread = function (id, tracker, obj) {
        this._properties = ["debugger_id", "thread_group_id", "state", "source_fullname", "source_line",  "instruction_address", "frame_level", "is_alive"];

        this.update(obj);
        this.id = id;
        this.tracker = tracker;
        this.EH = event_handler.get_global_event_handler();

        this.frames = [];
    };

    Thread.prototype.update = shortcuts._update_properties;
    
    Thread.prototype.get_uid = function () {
        return "/dbg/" + this.debugger_id + "/thg/" + this.thread_group_id + "/th/" + this.id;
    };

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
                      from_who.thread_follower.follow_specific_thread(self);
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
    
    Thread.prototype.get_debugger_you_belong = function () {
        return this.tracker.get_debugger_with_id(this.debugger_id);
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

        shortcuts.gdb_request(callback || null,
                this.debugger_id, 
                command,
                args
                );
    };

    Thread.prototype.get_stack_frames = function () {
        return this.frames;
    };
   
    Thread.prototype.request_an_update_thread_stack = function (on_success) {
        var thread = this;
        
        var create_frames_and_run_callback_on_success = function create_frames_and_run_callback_on_success(data) {
            var raw_frames = _.pluck(data.results.stack, 'frame');
            var frames = _.map(raw_frames, function (frame) {
                var processed_frame = {};

                processed_frame.thread = thread;

                processed_frame.function_name = frame.func;
                processed_frame.instruction_address = frame.addr;
                processed_frame.level = parseInt(frame.level);

                if (frame.fullname) {
                    processed_frame.source_fullname = frame.fullname;
                    processed_frame.source_line_number = parseInt(frame.line);
                }

                return new Frame(processed_frame);
            });

            thread.frames = _.sortBy(frames, 'level');
            if (on_success) {
                on_success(thread);
            }
        };

        thread.execute("-stack-list-frames", ["SELF", "--no-frame-filters"], create_frames_and_run_callback_on_success, 0);
   };
    
    Thread.prototype.resolve_current_position = function (on_result) {
        on_result(this.source_fullname, this.source_line, this.instruction_address);
    };

    return {Thread: Thread};
});
