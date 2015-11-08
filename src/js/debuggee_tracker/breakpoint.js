define(["underscore", "shortcuts", 'event_handler'], function (_, shortcuts, event_handler) {
    'use strict';

    var Breakpoint = function (id, tracker, obj) {
        this._properties = ["debugger_id", "is_pending", "apply_to_all_threads", "is_enabled", "is_temporal", "thread_ids", "thread_group_ids", "source_fullname", "source_line", "instruction_address"];
        this.update(obj);

        this.id = id;
        this.tracker = tracker;
        this.EH = event_handler.get_global_event_handler();
    };

    Breakpoint.prototype.update = shortcuts._update_properties;
    Breakpoint.prototype.get_display_name = function () {
        var name =  "Breakpoint " + this.id + " at " + this.instruction_address;
        if (this.source_fullname && this.source_line) {
            name += " ("+shortcuts.get_filename_from_fullname(this.source_fullname)+" "+this.source_line+")";
        }

        return name;
    };

    Breakpoint.prototype.is_subbreakpoint = function () {
        return this.id.indexOf(".") !== -1;  // id is like "1.2"
    };
    
    Breakpoint.prototype.is_subbreakpoint_of = function (bkpt) {
        return this.your_main_breakpoint_id() === bkpt.id;
    };

    Breakpoint.prototype.is_multiple = function () {
        return this.instruction_address.indexOf("<MULTIPLE>") !== -1;
    };

    Breakpoint.prototype.your_main_breakpoint_id = function () {
        return /(\d+)\..+/.exec(this.id)[1]; // eg: returns the "1" of the "1.2"
    };

    Breakpoint.prototype._modify_the_breakpoint = function (break_cmd) {
        shortcuts.gdb_request(_.bind(this.tracker, this.tracker.update_breakpoints_from), 
                this.debugger_id, 
                break_cmd,
                [""+this.id]
                );
    };

    Breakpoint.prototype.enable_you =  _.bind(Breakpoint.prototype._modify_the_breakpoint, "-break-enable");
    Breakpoint.prototype.disable_you = _.bind(Breakpoint.prototype._modify_the_breakpoint, "-break-disable");
    Breakpoint.prototype.delete_you =  _.bind(Breakpoint.prototype._modify_the_breakpoint, "-break-delete");

    return {Breakpoint: Breakpoint};
});
