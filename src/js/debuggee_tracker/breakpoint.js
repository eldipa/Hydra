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

    return {Breakpoint: Breakpoint};
});
