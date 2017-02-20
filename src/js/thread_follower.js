define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'code_editor', 'thread_button_bar_controller', 'stack_view', 'breakpoint_highlights', 'current_line_highlights'], function (ace, $, layout, shortcuts, _, code_editor, thread_button_bar_controller, stack_view, breakpoint_highlights_module, current_line_highlights_module) {
    var PAGE_LENGTH = 2048;

    var ThreadFollower = function (debuggee_tracker, gdb_console_view) {
        this.super("Thread Follower");

        debuggee_tracker.add_observer(this);
        this.gdb_console_view = gdb_console_view;

        // Create a Code Editor view and a button bar to display and control a thread
        this.code_editor = new code_editor.CodeEditor(this);
        this.code_editor.clean_up();

        this.button_bar = new thread_button_bar_controller.ThreadButtonBarController(this);

        this.view = new layout.Stacked("vertically");
        this.view.add_child(this.button_bar, {position: "top", grow: 0, shrink: 0});
        this.view.add_child(this.code_editor, {position: "bottom", grow: 1, shrink: 1});

        // Create a view for the stack 
        this.stack_view = new stack_view.StackView(this); // we dont want that StackView be an observer of the debuggee_tracker. We want to reuse the same logic of our update method

        this.view.split(this.stack_view, 'right');
        this.view = this.view.parent();
        this.view.set_percentage(70);

        this.current_loaded_file = "";
        this.current_loaded_codepage = null;

        this.breakpoint_highlights = new breakpoint_highlights_module.BreakpointHighlights(this.code_editor, this);
        this.current_line_highlights = new current_line_highlights_module.CurrentLineHighlights(this.code_editor, this);

        _.bindAll(this, "update_button_bar_and_code_editor_to_show");
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

        if (this.are_you_following_a_thread_group()) {
            this.gdb_console_view.follow_debugger(this.thread_group_followed.get_debugger_you_belong());

            this.stack_view.request_frames_update();

            this.code_editor._file_selector.enable();
            this.see_your_thread_and_update_yourself(true);

            this.breakpoint_highlights.clean_and_search_breakpoints_to_highlight();
            this.current_line_highlights.clean_and_search_threads_to_highlight();
        }
        else {
            this.clean_up();
        }

        if (false) {
            if (this.are_you_following_a_thread_group() && !this.are_you_following_a_specific_thread()) {
                console.log("Thread follower: following a thread group "+this.thread_group_followed.get_display_name()+" ("+this.thread_group_followed.get_debugger_you_belong().get_display_name()+")");
            }
            else if (this.are_you_following_a_specific_thread()) {
                if (!this.are_you_following_a_thread_group()) throw new Error("Inconsistent following");
                console.log("Thread follower: following the thread "+this.thread_followed.get_display_name()+" of "+this.thread_group_followed.get_display_name()+" ("+this.thread_group_followed.get_debugger_you_belong().get_display_name()+")");
            }
            else {
                console.log("Thread follower: not following anything.");
            }
        }
    };

    ThreadFollower.prototype.follow_nobody = function () {
        return this.follow(null, null);
    };

    ThreadFollower.prototype.follow_thread_group = function (thread_group_to_follow) {
        return this.follow(null, thread_group_to_follow);
    };

    ThreadFollower.prototype.follow_specific_thread = function (thread_to_follow) {
        return this.follow(thread_to_follow, null);
    };

    ThreadFollower.prototype.clean_up = function () {
        if (this.thread_followed || this.thread_group_followed) throw new Error("Invalid clean-up state of ThreadFollower");

        this.gdb_console_view.follow_debugger(null);
        
        this.stack_view.clean_up();
        
        this.code_editor.clean_up();
        this.code_editor._file_selector.disable();
        this.button_bar.select_toolbar(); // because this thread follower is not following anything, this call will disable the button bar

        this.breakpoint_highlights.clean_up();
        this.current_line_highlights.clean_up();
    };


    /*
     *                      DB or TG  is dead
     *                /-------------------------\
     *               /                           \
     *              V                             \
     *                          follow TG
     *      Following nobody    --------->  Following a thread group (and its debugger)
     *      ----------------                -------------------------------------------
     *   th followed == null                 th followed == null
     *   tg followed == null                 tg followed == TG
     *   db followed == null                 db followed == TG's DB
     *
     *           ^   \                        |     ^
     *           |    \          follow TH    |     |   TH is dead
     *            \    \                      V     |
     *             \    \
     *              \    \--------------->  Following a thread (and its debugger and thread group)
     *               \      follow TH       ------------------------------------------------------
     *                \                      th followed == TH
     *                 \                     tg followed == TH's TG
     *                  \----------------    dg followed == TH's DB
     *                    DB or TG is dead
     *
     * */

    // TODO: the ThreadFollower should update himself not only if its thread changed but also if
    // other threads changed and their files are the same that the file seen by this ThreadFollower
    ThreadFollower.prototype.update = function (data, topic, tracker) {
        // Safe to ignore ---------------------------------------
        //
        if (_.contains(["debugger_started", "thread_group_started"], topic)) {
            return;
        }
        //
        // ------------------------------------------------------


        if (this.are_you_following_nobody()) {
            return;
        }

        // Thread Group specific stuff --------------------------
        // from here we should be following a thread group
        //
        // If any breakpoint changed, update that breakpoint
        if (_.contains(["breakpoint_update", "breakpoint_deleted", "breakpoint_changed"], topic)) {
            var breakpoint = data.breakpoint;
            this.breakpoint_highlights.update_highlight_of_breakpoint(breakpoint);

            return;
        }

        // If several breakpoints changed...
        if (_.contains(["breakpoints_update"], topic)) {
            var breakpoints_by_id = data.debugger_obj.your_breakpoints_by_id();
            _.each(breakpoints_by_id, function (breakpoint) {
                this.breakpoint_highlights.update_highlight_of_breakpoint(breakpoint);
            }, this);

            return;
        }

        if (_.contains(["thread_group_exited"], topic) && data.thread_group == this.thread_group_followed) {
            this.follow_nobody(); // restart the following, our thread group (process) is dead!
            return;
        }

        if (_.contains(["debugger_exited"], topic) && data.debugger_obj === this.thread_group_followed.get_debugger_you_belong()) {
            this.follow_nobody(); // restart the following, our debugger was killed (and out thread group didn't finished!)!
            return;
        }

        //
        //
        // Thread Group specific stuff end.

        
        if (! this.are_you_following_a_specific_thread() ) {
            return;
        }

        // Thread alive specific stuff --------------------------
        // from here not only we are following a thread group but a specific thread too
        //
        
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


            if (is_my_thread_updated && _.contains(["thread_exited"], topic)) {
                this.follow_thread_group(this.thread_group_followed); // refollowing us, our thread is dead!
            }

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
        if (!this.are_you_following_a_thread_group()) {
            throw new Error("see_your_thread_and_update_yourself on a follower which it is not following anything.");
        }
        else if (this.are_you_following_a_thread_group() && !this.are_you_following_a_specific_thread() 
                && this.thread_group_followed.is_executable_loaded()) {
            var target = this.thread_group_followed;
        }
        else if (this.are_you_following_a_specific_thread()){
            var target = this.thread_followed;
        }
        else {
            var target = null; // we don't have a binary executable loaded so we cannot show anything
        }
        

        if (target) {
            target.resolve_current_position(_.partial(this.update_button_bar_and_code_editor_to_show, _, _, _, am_i_following_other_thread));
        }
    };

    ThreadFollower.prototype.update_button_bar_and_code_editor_to_show = function (source_fullname, line_number_str, instruction_address, am_i_following_other_thread) {
        if (source_fullname && line_number_str && !this.button_bar.is_in_assembly()) {
            this.button_bar.leave_assembly_mode();
            this.code_editor._file_selector.update_selection(source_fullname);

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
            this.code_editor._file_selector.update_selection("");

            var debugger_obj = this.thread_group_followed.get_debugger_you_belong();
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
        
        this.force_sync_due_thread_followed_update();
    };

    ThreadFollower.prototype.force_sync_due_thread_followed_update = function () {
        // The following is necessary to syncronize other gdb views (like the gdb console view)
        if (this.are_you_following_a_specific_thread()) {
            var thread_followed = this.thread_followed;
            var debugger_obj = this.thread_group_followed.get_debugger_you_belong()

            debugger_obj.execute("-thread-select", ["" + thread_followed.id], function() {
                debugger_obj.execute("-stack-select-frame", ["" + thread_followed.frame_level]);
            });
        }
        else {
            // XXX we need to do something here?
        }
    };

    ThreadFollower.prototype.update_current_line = function (line_number_or_address) {
        this.code_editor.go_to_line(line_number_or_address);
        if (this.are_you_following_a_specific_thread()) { // if we are following a thread we must update its highlight
            this.current_line_highlights.update_highlight_of_thread(this.thread_followed);
        }
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

    ThreadFollower.prototype.are_you_following_a_live_process = function () {
        return this.thread_group_followed && this.thread_group_followed.are_you_alive();
    };

    ThreadFollower.prototype.are_you_following_nobody = function () {
        return ! this.are_you_following_a_thread_group();
    };

    ThreadFollower.prototype.are_you_following_a_thread_group = function () {
        return !!this.thread_group_followed;
    };

    ThreadFollower.prototype.are_you_following_a_specific_thread = function () {
        return !!this.thread_followed;
    };


    return {ThreadFollower: ThreadFollower};
});

