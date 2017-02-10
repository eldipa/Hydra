define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'code_editor', 'thread_button_bar_controller', 'stack_view', 'breakpoint_highlights', 'current_line_highlights'], function (ace, $, layout, shortcuts, _, code_editor, thread_button_bar_controller, stack_view, breakpoint_highlights_module, current_line_highlights_module) {
    var PAGE_LENGTH = 2048;

    var ThreadFollower = function (debuggee_tracker, gdb_console_view) {
        this.super("Thread Follower");

        debuggee_tracker.add_observer(this);
        this.gdb_console_view = gdb_console_view;

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
        this.current_loaded_codepage = null;
        //this.current_line_highlight = null;

        this.breakpoint_highlights = new breakpoint_highlights_module.BreakpointHighlights(this.code_editor, this);
        this.current_line_highlights = new current_line_highlights_module.CurrentLineHighlights(this.code_editor, this);
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

    ThreadFollower.prototype.follow = function (thread_to_follow, thread_group_to_follow) {
        if (thread_to_follow && thread_group_to_follow) {
            throw new Error("You cannot 'follow' a thread and a thread group, just pick a thread only and you will be following its thread group indirectly.");
        }

        if (thread_to_follow) {
            thread_group_to_follow = thread_to_follow.get_thread_group_you_belong();
        }
        else {
            thread_to_follow = null; // beware of this....
        }

        this.thread_followed = thread_to_follow;
        this.thread_group_followed = thread_group_to_follow;

        this.code_editor.set_debugger(thread_to_follow.get_debugger_you_belong());
        this.gdb_console_view.follow_debugger(thread_to_follow.get_debugger_you_belong());

        this.stack_view.follow(thread_to_follow, this);

        this.see_your_thread_and_update_yourself(true);

        this.breakpoint_highlights.clean_and_search_breakpoints_to_highlight();
        this.current_line_highlights.clean_and_search_threads_to_highlight();
    };


    // TODO: the ThreadFollower should update himself not only if its thread changed but also if
    // other threads changed and their files are the same that the file seen by this ThreadFollower
    ThreadFollower.prototype.update = function (data, topic, tracker) {
        // Thread Group specific stuff --------------------------
        //
        //
        if (! this.thread_group_followed) {
            return;
        }

        // If any breakpoint changed, update that breakpoint
        if (_.contains(["breakpoint_update", "breakpoint_deleted", "breakpoint_changed"], topic)) {
            var breakpoint = data.breakpoint;
            this.breakpoint_highlights.update_highlight_of_breakpoint(breakpoint);

            return;
        }

        //
        //
        // Thread Group specific stuff end.


        // Thread alive specific stuff --------------------------
        //
        //
        if (! this.thread_followed ) {
            return;
        }
        
        // Get all the threads involved in this event  and determine if our thread followed
        // is one of them
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
        
        
        // Request an update of the thread's variables if was my thread followed who was updated
        if (_.contains(["thread-stack-updated"], topic)) {
            var thread = data.thread;
            if (is_my_thread_updated) {
                this.stack_view.on_frames_updated_request_variables_update();
            }

            //return;
        }

        // a thread changed, we need to update us:
        if (_.contains(["thread-stack-updated", 'thread_created', 'thread_running', 'thread_stopped', 'thread_exited', 'thread_update', 'thread_group_exited'], topic)) {
            // Update our thread that we are following
            if (is_my_thread_updated) { 
                this.see_your_thread_and_update_yourself();
            }
            
            // Update the rest of the threads, always
            _.each(threads, function (thread) {
                if (thread !== this.thread_followed) {
                    this.current_line_highlights.update_highlight_of_thread(thread);
                }
            }, this);
        }
        else {
            console.log("w? " + topic);
        }

        //
        //
        // Thread alive specific stuff end.
    };

    ThreadFollower.prototype.is_this_file_already_loaded = function(filename) {
        return this.current_loaded_file === filename;
    };

    ThreadFollower.prototype.is_this_address_already_loaded = function (hexa_address) {
        if (this.current_loaded_codepage === null) {
            return false;
        }

        var addr = parseInt(hexa_address, 16);
        return this.current_loaded_codepage.begin <= addr && addr <= this.current_loaded_codepage.end;
    };

    ThreadFollower.prototype.see_your_thread_and_update_yourself = function (am_i_following_other_thread) {
        var source_fullname = this.thread_followed.source_fullname;
        var line_number_str = this.thread_followed.source_line;
        var instruction_address = this.thread_followed.instruction_address;

        this.update_button_bar_and_code_editor_to_show(source_fullname, line_number_str, instruction_address, am_i_following_other_thread);
    };

    ThreadFollower.prototype.update_button_bar_and_code_editor_to_show = function (source_fullname, line_number_str, instruction_address, am_i_following_other_thread) {
        if (source_fullname && line_number_str && !this.button_bar.is_in_assembly()) {
            this.button_bar.leave_assembly_mode();

            if (! this.is_this_file_already_loaded(source_fullname)) {
                this.update_yourself_from_source_code(source_fullname);

                if (! am_i_following_other_thread ) {
                    this.breakpoint_highlights.clean_and_search_breakpoints_to_highlight();
                    this.current_line_highlights.clean_and_search_threads_to_highlight();
                }
            }

            this.update_current_line(line_number_str);
        }
        else {
            this.button_bar.enter_assembly_mode();

            var debugger_obj = this.thread_followed.get_debugger_you_belong();
            var self = this;
            var base = parseInt(instruction_address, 16);
            base = base - (base % PAGE_LENGTH);

            var up_asm = function () {
                if (! am_i_following_other_thread ) {
                    self.breakpoint_highlights.clean_and_search_breakpoints_to_highlight();
                    self.current_line_highlights.clean_and_search_threads_to_highlight();
                }

                self.update_current_line(instruction_address);
            };

            if (this.current_loaded_codepage && this.current_loaded_codepage.begin === base) {
                up_asm();
            }
            else {
                debugger_obj.execute("-data-disassemble", 
                        ["-s", base+"",
                         "-e", base+"+"+PAGE_LENGTH,
                         "--", "0"],
                        function (e) {
                            self.update_yourself_from_disassembled_code(e);
                            up_asm();
                        }
                        );
            }
        }

        // The following is necessary to syncronize other gdb views (like the gdb console view)
        var thread_followed = this.thread_followed;
        var debugger_obj = thread_followed.get_debugger_you_belong();
        debugger_obj.execute("-thread-select", ["" + thread_followed.id], function() {
            debugger_obj.execute("-stack-select-frame", ["" + thread_followed.frame_level]);
        });
    };

    ThreadFollower.prototype.update_current_line = function (line_number_or_address) {
        //line_number = Number(line_number);
        this.code_editor.go_to_line(line_number_or_address);
        this.current_line_highlights.update_highlight_of_thread(this.thread_followed);

        /*
        if (this.current_line_highlight) {
            this.code_editor.remove_highlight(this.current_line_highlight);
        }

        this.current_line_highlight = this.code_editor.highlight_thread_current_line(line_number, {text: "@th " + this.thread_followed.id});
        */
    };

    ThreadFollower.prototype.update_yourself_from_source_code = function (source_fullname) {
        //TODO do we need to disable the code view (ace) before doing this stuff and reenable it later?
     
        // Load the new source code
        this.code_editor.load_cpp_code(source_fullname);
        this.current_loaded_file = source_fullname;
        this.current_loaded_codepage = null;
    };

    ThreadFollower.prototype.update_yourself_from_disassembled_code = function (disassembled_code_gdb_event) {
        //TODO do we need to disable the code view (ace) before doing this stuff and reenable it later?

        var asm_lines = disassembled_code_gdb_event['results']['asm_insns'];

        var addresses    = _.pluck(asm_lines, 'address');
        var instructions = _.pluck(asm_lines, 'inst');

        this.code_editor.load_assembly_code(addresses, instructions.join("\n"));
        this.code_editor.go_to_line(0);

        this.current_loaded_file = null;
        this.current_loaded_codepage = {begin: parseInt(addresses[0], 16), end: parseInt(addresses[addresses.length-1], 16)};
    };



    return {ThreadFollower: ThreadFollower};
});

