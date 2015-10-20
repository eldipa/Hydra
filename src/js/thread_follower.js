define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'code_editor', 'thread_button_bar_controller'], function (ace, $, layout, shortcuts, _, code_editor, thread_button_bar_controller) {
    var ThreadFollower = function () {
        this.super("Thread Follower");

        this.code_editor = new code_editor.CodeEditor();
        this.button_bar = new thread_button_bar_controller.ThreadButtonBarController(this);

        this.stacked_view = new layout.Stacked("vertically");
        this.stacked_view.add_child(this.button_bar, {position: "top", grow: 0, shrink: 0});
        this.stacked_view.add_child(this.code_editor, {position: "bottom", grow: 1, shrink: 1});

        this.current_loaded_file = "";
    };

    ThreadFollower.prototype.__proto__ = layout.Panel.prototype;

    ThreadFollower.prototype.render = function () {
        this.stacked_view.box = this.box;
        return this.stacked_view.render();
    };
   
    ThreadFollower.prototype.unlink = function () {
        return this.stacked_view.unlink();
    };

    ThreadFollower.prototype.follow = function (thread_to_follow) {
        this.thread_followed = thread_to_follow;
        this.see_your_thread_and_update_yourself();
    }; 

    // TODO: the ThreadFollower should update himself not only if its thread changed but also if
    // other threads changed and their files are the same that the file seen by this ThreadFollower
    ThreadFollower.prototype.update = function (data, topic, tracker) {
        if (data.thread === this.thread_to_follow) {
            console.log("Update");
            this.see_your_thread_and_update_yourself();
        }
    };

    ThreadFollower.prototype.is_this_file_already_loaded = function(filename) {
        return this.current_loaded_file === filename;
    };

    ThreadFollower.prototype.see_your_thread_and_update_yourself = function () {
        var source_fullname = this.thread_followed.source_fullname;
        var line_number_str = this.thread_followed.source_line;

        if (source_fullname && line_number_str) {
            if (! this.is_this_file_already_loaded(source_fullname)) {
                this.update_yourself_from_source_code(source_fullname, line_number_str);
            }
        }
        else {
            var instruction_address = this.thread_followed.instruction_address;
            //TODO request to GDB to dissamble few (how much?) instructions around 'instruction_address'.
            //then call update_yourself_from_dissabled_code
        }
    };

    ThreadFollower.prototype.update_yourself_from_source_code = function (source_fullname, line_number) {
        //TODO do we need to disable the code view (ace) before doing this stuff and reenable it later?
        
        line_number = 0 + line_number;
        this.code_editor.load_cpp_code(source_fullname, line_number);
        
        this.current_loaded_file = source_fullname;
    };

    ThreadFollower.prototype.update_yourself_from_disassembled_code = function (disassembled_code_gdb_event) {
        //TODO do we need to disable the code view (ace) before doing this stuff and reenable it later?

        var asm_lines = disassembled_code_gdb_event['results']['asm_insns'];

        var addresses    = _.pluck(asm_lines, 'address');
        var instructions = _.pluck(asm_lines, 'inst');

        this.code_editor.load_assembly_code(addresses, instructions.join("\n"));

        this.current_loaded_file = null;
    };
    

    return {ThreadFollower: ThreadFollower};
});

