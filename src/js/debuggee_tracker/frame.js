define(["underscore", "shortcuts"], function (_, shortcuts) {
    'use strict';

    var Frame = function (obj) {
        this._properties = ["level", "function_name", "source_fullname", "source_line_number",  "instruction_address"];

        this.update(obj);
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

    return {Frame: Frame};
});
