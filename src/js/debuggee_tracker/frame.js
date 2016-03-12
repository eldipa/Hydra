define(["underscore", "shortcuts"], function (_, shortcuts) {
    'use strict';

    var Frame = function (obj) {
        this._properties = ["level", "function_name", "source_fullname", "source_line_number",  "instruction_address", "thread"];

        this.update(obj);
        this.variables = {};
    };
    
    Frame.prototype.update = shortcuts._update_properties;

    Frame.prototype.get_display_name = function () {
        var name = this.function_name || "??";
        name += " ";

        if (this.source_fullname && this.source_line_number) {
            name += shortcuts.get_filename_from_fullname(this.source_fullname)+" "+this.source_line_number+" ";
        }

        name += "at " + this.instruction_address;

        return name;
    };

    Frame.prototype.get_display_fullname = function () {
        return "Frame " + this.level + " " + this.get_display_name();
    };
    
    Frame.prototype.execute = function (command, args, callback, self_id_argument_position, thread_id_argument_position) {
        args = args || [];
        var self_id_argument = "--frame " + this.level;

        if (self_id_argument_position === undefined) {
            args.push(self_id_argument);
        }
        else {
            args[self_id_argument_position] = self_id_argument;
        }
        
        var thread_id_argument = "--thread " + this.thread.id;

        if (thread_id_argument_position === undefined) {
            args.push(thread_id_argument);
        }
        else {
            args[thread_id_argument_position] = thread_id_argument;
        }

        shortcuts.gdb_request(callback || null,
                this.debugger_id, 
                command,
                args
                );
    };

    Frame.prototype.load_variables = function (variables) {
        this.variables = {};

        _.each(variables,  function (name_val) {
            this.variables[name_val.name] = name_val.val;
        }, this);
    };

    return {Frame: Frame};
});
