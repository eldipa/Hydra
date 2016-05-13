define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'code_editor', 'thread_button_bar_controller', 'stack_view', 'breakpoint_highlights'], function (ace, $, layout, shortcuts, _, code_editor, thread_button_bar_controller, stack_view, breakpoint_highlights_module) {
    var ThreadFollower = function (debuggee_tracker) {
        this.super("Thread Follower");

        debuggee_tracker.add_observer(this);

        // Create a Code Editor view and a button bar to display and control a thread
        this.code_editor = new code_editor.CodeEditor();
        this.button_bar = new thread_button_bar_controller.ThreadButtonBarController(this);

        this.view = new layout.Stacked("vertically");
        this.view.add_child(this.button_bar, {position: "top", grow: 0, shrink: 0});
        this.view.add_child(this.code_editor, {position: "bottom", grow: 1, shrink: 1});

        // Create a view for the stack 
        this.stack_view = new stack_view.StackView(); // we dont want that StackView be an observer of the debuggee_tracker. We want to reuse the same logic of our update method

        this.view.split(this.stack_view, 'right');
        this.view = this.view.parent();
        this.view.set_percentage(70);

        this.current_loaded_file = "";
        this.current_line_highlight = null;

        this.breakpoint_highlights = new breakpoint_highlights_module.BreakpointHighlights(this.code_editor, this);
    };

    ThreadFollower.prototype.__proto__ = layout.Panel.prototype;
   
    ThreadFollower.prototype.is_container = function () {
        return true;
    };

    ThreadFollower.prototype.render = function () {
        this.view.box = this.box;
        return this.view.render();
    };
   
    ThreadFollower.prototype.unlink = function () {
        return this.view.unlink();
    };

    ThreadFollower.prototype.follow = function (thread_to_follow) {
        this.thread_followed = thread_to_follow;
        this.stack_view.follow(thread_to_follow, this);

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
            this.stack_view.request_frames_update(); // Request an update of the thread's stack
            this.see_your_thread_and_update_yourself();
        }

        if (topic === "breakpoint_update" || topic === "breakpoint_deleted" || topic === "breakpoint_changed") {
            var breakpoint = data.breakpoint;
            this.figure_out_if_this_breakpoint_apply_to_you_and_update_yourself_if_so(breakpoint);
        }
    };

    ThreadFollower.prototype.is_this_file_already_loaded = function(filename) {
        return this.current_loaded_file === filename;
    };

    ThreadFollower.prototype.see_your_thread_and_update_yourself = function () {
        var source_fullname = this.thread_followed.source_fullname;
        var line_number_str = this.thread_followed.source_line;
        var instruction_address = this.thread_followed.instruction_address;

        this.update_button_bar_and_code_editor_to_show(source_fullname, line_number_str, instruction_address);
    };

    ThreadFollower.prototype.update_button_bar_and_code_editor_to_show = function (source_fullname, line_number_str, instruction_address) {
        if (source_fullname && line_number_str) {
            this.button_bar.leave_assembly_mode();

            if (! this.is_this_file_already_loaded(source_fullname)) {
                this.update_yourself_from_source_code(source_fullname);
            }

            this.update_current_line(line_number_str);
        }
        else {
            this.button_bar.enter_assembly_mode();

            //TODO request to GDB to dissamble few (how much?) instructions around 'instruction_address'.
            //then call update_yourself_from_dissabled_code
        }
    };

    ThreadFollower.prototype.update_current_line = function (line_number) {
        line_number = Number(line_number);
        this.code_editor.go_to_line(line_number);

        if (this.current_line_highlight) {
            this.code_editor.remove_highlight(this.current_line_highlight);
        }

        this.current_line_highlight = this.code_editor.highlight_thread_current_line(line_number);
    };

    ThreadFollower.prototype.update_yourself_from_source_code = function (source_fullname) {
        //TODO do we need to disable the code view (ace) before doing this stuff and reenable it later?
     
        this.breakpoint_highlights.clean_up();

        // Load the new source code
        this.code_editor.load_cpp_code(source_fullname);
        this.current_loaded_file = source_fullname;

        this.breakpoint_highlights.search_breakpoints_to_highlight();

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


    ThreadFollower.prototype.figure_out_if_this_breakpoint_apply_to_you_and_update_yourself_if_so = function (breakpoint) {
        this.breakpoint_highlights.update_highlight_of_breakpoint(breakpoint);
        return;

        var is_breakpoint_in_source_code = breakpoint.source_fullname && breakpoint.source_line_number;

        // TODO we dont support breakpoints in assembly mode yet so we are only interested in source code level
        var is_breakpoint_in_our_current_source_file = is_breakpoint_in_source_code && this.is_this_file_already_loaded(breakpoint.source_fullname);
        
        if (is_breakpoint_in_source_code && is_breakpoint_in_our_current_source_file) {
            var breakpoint_highlight = this.breakpoint_highlights[breakpoint];

            if (was_breakpoint_deleted && breakpoint_highlight) {
                this.code_editor.remove_highlight(breakpoint_highlight);
                delete this.breakpoint_highlights[breakpoint];
            }
            else if (!was_breakpoint_deleted) {
                if (breakpoint_highlight) {
                    this.code_editor.remove_highlight(breakpoint_highlight);
                }

                this.breakpoint_highlights[breakpoint] = this.code_editor.highlight_breakpoint(Number(breakpoint.source_line_number));
            }
        }
    };
    

    return {ThreadFollower: ThreadFollower};
});

