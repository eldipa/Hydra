define(["underscore", "shortcuts", 'event_handler', 'ko', 'snippet'], function (_, shortcuts, event_handler, ko, snippet) {
    'use strict';
    
    var Breakpoint = function (id, tracker, obj) {
        this._properties = ["debugger_id", "is_pending", "apply_to_all_threads", "is_enabled", "is_temporal", "thread_ids", "thread_group_ids", "source_fullname", "source_line_number", "instruction_address", "code_resolved", "is_code_resolved", "original_location", "was_deleted"];
        
        this.id = id;
        this.tracker = tracker;
        this.EH = event_handler.get_global_event_handler();

        this.was_deleted = false;
        
        this.update(obj);

        ko.track(this);
    };

    Breakpoint.prototype.get_uid = function () {
        return "/dbg/" + this.debugger_id + "/bkp/" + this.id;
    };

    Breakpoint.prototype.update = function (attributes) {
        shortcuts._update_properties.call(this, attributes);
        
        if (!this.is_pending && !this.is_multiple() && !this.is_code_resolved) {
            this.resolve_code_where_you_are();
        }
    };

    Breakpoint.prototype.get_display_name = function () {
        var name = "";
        if (this.source_fullname && this.source_line_number) {
            name += shortcuts.get_filename_from_fullname(this.source_fullname)+" "+this.source_line_number+" ";
        }

        if (this.is_multiple()) {
            name += "at " + this.original_location;
        }
        else {
            name += "at " + this.instruction_address;
        }

        if (this.is_temporal) {
            name += " (temporal)"
        }

        return name;
    };

    Breakpoint.prototype.get_display_fullname = function () {
        return "Breakpoint " + this.get_display_name();
    };

    Breakpoint.prototype.get_display_details = function () {
        var js = ['<span data-bind="text: get_display_fullname()"></span>',
                  '<div id="code_snippet"></div>', // TODO poner esto en un IF para sacar si no hay codigo
                  'Enabled: <span data-bind="text: is_enabled"></span>',
                  'Temporal: <span data-bind="text: is_temporal"></span>',
                  'Apply to: <span data-bind="text: apply_to_all_threads"></span>'].join("<br />");

        var $elem = $(js);
        this.append_code_resolved_snippet_if_possible_to($elem[2]);
        return $elem;
    };

    Breakpoint.prototype.get_display_controller = function () {
        var self = this;
        var controller = [   
            {
                text: "Enable breakpoint",
                action: function (e) {
                   e.preventDefault();
                   self.enable_you_and_your_subbreakpoints();
                }
            },
            {
                text: "Disable breakpoint",
                action: function (e) {
                   e.preventDefault();
                   self.disable_you_and_your_subbreakpoints();
                }
            }];
        
        if (this.is_subbreakpoint()) {
            controller[controller.length-1].end_menu_here = true;
        }
        else {
            controller.push({
                text: "Remove breakpoint",
                action: function (e) {
                   e.preventDefault();
                   self.delete_you_and_your_subbreakpoints();
                },

                end_menu_here: true
            });
        }
        
        return controller;
    };

    Breakpoint.prototype.are_you_set_on_source_code_line = function () {
        return (this.source_line_number && this.source_fullname);
    };

    Breakpoint.prototype.resolve_code_where_you_are = function () {
        if (this.is_code_resolved) {
            return; // i resolved the source code already
        }

        if (this.are_you_set_on_source_code_line()) {
            var fs = require('fs');
            var code = fs.readFileSync(this.source_fullname, "ascii").split("\n")[this.source_line_number - 1];
            
            this.code_resolved = code.trim();
            this.is_code_resolved = true;
            this.tracker.breakpoint_changed(this);
            return;
        }
        else {
            var self = this;
            var start_address = this.instruction_address;
            var end_address = "0x"+(parseInt(start_address, 16) + 16).toString(16); // start_address + 16
            shortcuts.gdb_request(function (data) { 
                    var instruction_objects = data.results.asm_insns;
                    var instruction_object = instruction_objects[0]; // get only the first instruction

                    var code = instruction_object.inst;
                    self.code_resolved = code.trim();
                    self.is_code_resolved = true;
                    self.tracker.breakpoint_changed(self);
                },
                this.debugger_id, 
                "-data-disassemble",
                ["-s", start_address, "-e", end_address, "--", "0"]
            );
        }
    };

    Breakpoint.prototype.append_code_resolved_snippet_if_possible_to = function (dom_element) {
        if (!this.code_resolved) {
            return;
        }

        var dom_element = $(dom_element);
        var is_code_resolved_assembly = !this.are_you_set_on_source_code_line();

        var s = snippet.create_snippet(this.code_resolved, { is_assembly: is_code_resolved_assembly});
        s.appendTo(dom_element);
        return dom_element;
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
                self.tracker.breakpoint_changed(self); 
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
