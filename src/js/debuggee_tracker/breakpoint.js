define(["underscore", "shortcuts", 'event_handler'], function (_, shortcuts, event_handler) {
    'use strict';

    var Breakpoint = function (id, tracker, obj) {
        this._properties = ["debugger_id", "is_pending", "apply_to_all_threads", "is_enabled", "is_temporal", "thread_ids", "thread_group_ids", "source_fullname", "source_line_number", "instruction_address", "source_code_resolved", "is_source_code_resolved"];
        
        this.id = id;
        this.tracker = tracker;
        this.EH = event_handler.get_global_event_handler();
        
        this.update(obj);
    };

    Breakpoint.prototype.update = function (attributes) {
        shortcuts._update_properties.call(this, attributes);
        
        if (!this.is_pending && !this.is_multiple() && !this.is_source_code_resolved) {
            this.resolve_source_code_where_you_are();
        }
    };

    Breakpoint.prototype.get_display_name = function () {
        var name = "";
        if (this.source_fullname && this.source_line_number) {
            name += shortcuts.get_filename_from_fullname(this.source_fullname)+" "+this.source_line_number+" ";
        }

        name += "at " + this.instruction_address;

        return name;
    };

    Breakpoint.prototype.resolve_source_code_where_you_are = function () {
        if (this.is_source_code_resolved) {
            return; // i resolved the source code already
        }

        if (this.source_line_number && this.source_fullname) {
            var fs = require('fs');
            var code = fs.readFileSync(this.source_fullname, "ascii").split("\n")[this.source_line_number - 1];
            
            this.source_code_resolved = code;
            this.is_source_code_resolved = true;
            this.tracker.breakpoint_changed();
            return;
        }
        else {
            var self = this;
            shortcuts.gdb_request(function (data) { 
                    var instruction_objects = data.results.asm_insns;
                    var instruction_object = instruction_objects[0];

                    var code = instruction_object.inst;
                    self.source_code_resolved = code;
                    self.is_source_code_resolved = true;
                    self.tracker.breakpoint_changed();
                },
                this.debugger_id, 
                "-data-disassemble",
                ["-s", this.instruction_address, "--", "0"]
            );
        }
    };

    Breakpoint.prototype.is_subbreakpoint = function () {
        return this.id.indexOf(".") !== -1;  // id is like "1.2"
    };
    
    Breakpoint.prototype.is_subbreakpoint_of = function (bkpt) {
        return this.is_subbreakpoint() && this.your_main_breakpoint_id() === bkpt.id;
    };

    Breakpoint.prototype.is_multiple = function () {
        return this.instruction_address.indexOf("<MULTIPLE>") !== -1;
    };

    Breakpoint.prototype.your_main_breakpoint_id = function () {
        return /(\d+)\..+/.exec(this.id)[1]; // eg: returns the "1" of the "1.2"
    };

    Breakpoint.prototype._modify_the_breakpoint = function (break_cmd, is_enabled, include_all_of_my_subbreakpoints) {
        var self = this;
        var ids = null;
        var bkpts_selected = [];

        if (include_all_of_my_subbreakpoints && self.is_multiple()) {
            var debugger_obj = self.tracker.get_debugger_with_id(self.debugger_id);
            var breakpoints_by_id = debugger_obj.your_breakpoints_by_id();

            var me_and_my_subbreakpoints = _.filter(breakpoints_by_id, 
                    function (bkpt) {
                        return bkpt.is_subbreakpoint_of(self) || bkpt === self;
                    });

            ids = _.map(me_and_my_subbreakpoints, function (bkpt) { return ""+bkpt.id; });
            bkpts_selected = me_and_my_subbreakpoints;
        }
        else {
            ids = [""+this.id]; // just me
            bkpts_selected = [this];
        }

        shortcuts.gdb_request(function () {
                _.each(bkpts_selected, function (bkpt) { bkpt.is_enabled = is_enabled; });
                self.tracker.breakpoint_changed(); 
            },
            this.debugger_id, 
            break_cmd,
            ids
        );
    };

    Breakpoint.prototype.enable_you =  _.partial(Breakpoint.prototype._modify_the_breakpoint, "-break-enable", true, false);
    Breakpoint.prototype.disable_you = _.partial(Breakpoint.prototype._modify_the_breakpoint, "-break-disable", false, false);
    Breakpoint.prototype.enable_you_and_your_subbreakpoints =  _.partial(Breakpoint.prototype._modify_the_breakpoint, "-break-enable", true, true);
    Breakpoint.prototype.disable_you_and_your_subbreakpoints = _.partial(Breakpoint.prototype._modify_the_breakpoint, "-break-disable", false, true);
    Breakpoint.prototype.delete_you_and_your_subbreakpoints = function () {
        var self = this;

        // gdb by default will delete all my subbreakpoints, so i don't need to
        // specify my ids.
        shortcuts.gdb_request(function () { self.tracker.delete_breakpoint(self); },
                this.debugger_id, 
                "-break-delete",
                [""+this.id]
                );
    }

    return {Breakpoint: Breakpoint};
});
