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
    
    Debugger.prototype.get_display_controller = function () {
        var self = this;
        var controller = [
              {
               text: 'Kill debugger',
               action: function (e) {
                  e.preventDefault();
                  self.kill();
               },
              },{
               text: 'Add thread group',
               action: function (e) {
                  e.preventDefault();
                  self.add_thread_group();
               },
              },
            {
                text: "Enable all breakpoints",
                action: function (e) {
                   e.preventDefault();
                   self.enable_all_your_breakpoints();
                }
            },
            {
                text: "Disable all breakpoints",
                action: function (e) {
                   e.preventDefault();
                   self.disable_all_your_breakpoints();
                }
            },
            {
                text: "Remove all breakpoints",
                action: function (e) {
                   e.preventDefault();
                   self.delete_all_your_breakpoints();
                },
            } 
        ];

        return controller;
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

    Debugger.prototype.get_thread_group_with_id = function (thread_group_id) {
        return this.tracker.thread_groups_by_debugger[this.id][thread_group_id];
    };
    
    Debugger.prototype.your_breakpoints_by_id = function () {
        return this.tracker.breakpoints_by_debugger[this.id];
    };

    Debugger.prototype.get_breakpoint_with_id = function (breakpoint_id) {
        return this.tracker.breakpoints_by_debugger[this.id][breakpoint_id];
    };

    Debugger.prototype.execute = function (command, args, callback, self_id_argument_position) {
        args = args || [];
        shortcuts.gdb_request(callback || null, 
                this.id, 
                command,
                args
                );
    };

    Debugger.prototype._modify_all_your_breakpoints = function (command) {
        if (command !== "enable" && command !== "disable" && command !== "delete") {
            throw new Error("Unknow command '"+command+"' to execute over the breakpoints of this debugger '"+this.debugger_id+"'");
        }

        _.each(this.tracker.breakpoints_by_debugger[this.id], function (bkpt) {
            if (!bkpt.is_subbreakpoint()) {
                if (command == "enable") {
                    bkpt.enable_you_and_your_subbreakpoints();
                }
                else if (command == "disable") {
                    bkpt.disable_you_and_your_subbreakpoints();
                }
                else if (command == "delete") {
                    bkpt.delete_you_and_your_subbreakpoints();
                }
            }
        });
    };

    Debugger.prototype.enable_all_your_breakpoints = _.partial(Debugger.prototype._modify_all_your_breakpoints, "enable");
    Debugger.prototype.disable_all_your_breakpoints = _.partial(Debugger.prototype._modify_all_your_breakpoints, "disable");
    Debugger.prototype.delete_all_your_breakpoints = _.partial(Debugger.prototype._modify_all_your_breakpoints, "delete");

    return {Debugger: Debugger};
});
