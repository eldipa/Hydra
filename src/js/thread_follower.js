define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'code_editor', 'thread_button_bar_controller', 'fd_redirector'], function (ace, $, layout, shortcuts, _, code_editor, thread_button_bar_controller, fd_redirector) {
    var ThreadFollower = function () {
        this.super("Thread Follower");

        this.code_editor = new code_editor.CodeEditor();
        this.button_bar = new thread_button_bar_controller.ThreadButtonBarController(this);
        this.fd_redirector = new fd_redirector.FD_Redirector();

        this.stacked_view = new layout.Stacked("vertically");
        this.stacked_view.add_child(this.button_bar, {position: "top", grow: 0, shrink: 0});
        this.stacked_view.add_child(this.code_editor, {position: "bottom", grow: 1, shrink: 1});
        this.stacked_view.add_child(this.fd_redirector, {position: "bottom", grow: 1, shrink: 1});

        this.current_loaded_file = "";
        this.current_line_highlight = null;
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
        if (! this.thread_followed ) {
            return;
        }

        var threads;
        var is_my_thread_updated = false;
        if (data.threads) {
            threads = data.threads;
            is_my_thread_updated = !!_.find(function (t) { 
                return this.thread_followed === t; 
            }, data.threads, this);
        }
        else if (data.thread) {
            threads = [data.thread];
            is_my_thread_updated = this.thread_followed === data.thread;
        }
        else {
            threads = [];
            is_my_thread_updated = false;
        }

        if (is_my_thread_updated) { 
            console.log("Thread UPDATE");
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
            this.button_bar.leave_assembly_mode();

            if (! this.is_this_file_already_loaded(source_fullname)) {
                this.update_yourself_from_source_code(source_fullname);
            }

            this.update_current_line(line_number_str);
        }
        else {
            this.button_bar.enter_assembly_mode();

            var instruction_address = this.thread_followed.instruction_address;
            //TODO request to GDB to dissamble few (how much?) instructions around 'instruction_address'.
            //then call update_yourself_from_dissabled_code
        }
    };

    ThreadFollower.prototype.update_current_line = function (line_number) {
        line_number = Number(line_number) - 1;
        this.code_editor.go_to_line(line_number);

        if (this.current_line_highlight) {
            this.code_editor.remove_highlight(this.current_line_highlight);
        }

        this.current_line_highlight = this.code_editor.highlight_thread_current_line(line_number);
    };

    ThreadFollower.prototype.update_yourself_from_source_code = function (source_fullname) {
        //TODO do we need to disable the code view (ace) before doing this stuff and reenable it later?
        
        this.code_editor.load_cpp_code(source_fullname);
        
        this.current_loaded_file = source_fullname;
    };

    ThreadFollower.prototype.update_yourself_from_disassembled_code = function (disassembled_code_gdb_event) {
        //TODO do we need to disable the code view (ace) before doing this stuff and reenable it later?

        var asm_lines = disassembled_code_gdb_event['results']['asm_insns'];

        var addresses    = _.pluck(asm_lines, 'address');
        var instructions = _.pluck(asm_lines, 'inst');

        this.code_editor.load_assembly_code(addresses, instructions.join("\n"));
        this.code_editor.go_to_line(0);

        this.current_loaded_file = null;
    };
    

    return {ThreadFollower: ThreadFollower};
});

