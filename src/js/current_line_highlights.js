define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'code_editor', 'thread_button_bar_controller', 'stack_view'], function (ace, $, layout, shortcuts, _, code_editor, thread_button_bar_controller, stack_view) {

    /*
     * This object will track the breakpoint highligths in the code_editor based
     * in the breakpoints that are affecting the particular thread followed by thread_follower.
     *
     * There are two posibilities:
     *  - the thread moves to another file: all the highlights are invalid and you need
     *    to call clean_up and then, when the new file is open and loaded in the code_editor, 
     *    call to search_breakpoints_to_highlight to search and highlight all the breakpoints that
     *    are in the new file
     *  - a breakpoint change: in this case you need to call update_highlight_of_breakpoint to
     *    know if the breakpoint is of our interest (is in our file for example) and if it is new,
     *    highlight it and if it is deleted or disabled, remove the highlight.
     *
     * */
    var CurrentLineHighlights = function (code_editor, thread_follower) {
        this.code_editor = code_editor;
        this.thread_follower = thread_follower;
        this.thread_highlights = {}
    };

    CurrentLineHighlights.prototype.clean_up = function () {
        _.each(this.thread_highlights, function (thread_highlight) {
            this.code_editor.remove_highlight(thread_highlight);
        }, this);

        this.thread_highlights = {}; 
    };

    CurrentLineHighlights.prototype.search_threads_to_highlight = function () {
        var thread_followed = this.thread_follower.thread_followed;
        if (!thread_followed) {
            console.error("The thread_followed is undefined or not well built and cannot be used by the CurrentLineHighlights object");
            return;
        }

        // Search for "objects" in this new file that require a highlight
        var debugger_obj = thread_followed.get_debugger_you_belong();
        var thread_groups_by_id = debugger_obj.your_thread_groups_by_id();

        _.each(thread_groups_by_id, function (thread_group) {
            var threads_by_id = thread_group.your_threads_by_id();

            _.each(threads_by_id, function (thread) {
                this.update_highlight_of_thread(thread);
            }, this);
        }, this);
    };

    /*
     * Update the highlight of the breakpoint:
     *  - first, if he breakpoint isn't interesting for us, discard the breakpoint
     *    (we assume the breakpoint hasn't a highlight already!)
     *  - then, figure out of the breakpoint should be shown and if it is already shown
     *  - if it should be shown, show it! (create a new highlight or update a previous one)
     *    if it should not be shown, hide it (remove the highlight)
     **/
    CurrentLineHighlights.prototype.update_highlight_of_thread = function (thread) {
        var thread_followed = this.thread_follower.thread_followed;
        if (!thread_followed) {
            console.error("The thread_followed is undefined or not well built and cannot be used by the CurrentLineHighlights object");
            return;
        }

        var thread_highlight = this.thread_highlights[thread];
        var thread_is_shown = !!thread_highlight;

        if (this.isnt_an_interesting_breakpoint_or_shouldnt_be_track(breakpoint)) {
            if (breakpoint_is_shown) {
                console.warn("A breakpoint is highlighted but it shouldn't. In fact it shouldn't be tracked at all. Removing the highlight but this is situation that it shouldn't be happen!");
                this.code_editor.remove_highlight(breakpoint_highlight);
            }
            return;
        }

        var breakpoint_should_be_shown = !(breakpoint.was_deleted || !breakpoint.is_enabled);

        if (breakpoint_should_be_shown) {
            if (breakpoint_is_shown) { // is shown but probably it is in an incorrect location
                this.code_editor.remove_highlight(breakpoint_highlight);
            }

            this.highlight_this_source_code_breakpoint(breakpoint);
        }
        else if (!breakpoint_should_be_shown && breakpoint_is_shown) {
            this.code_editor.remove_highlight(breakpoint_highlight);
            delete this.thread_highlights[breakpoint];
        }
        else { // the !breakpoint_should_be_shown && !breakpoint_is_shown so we dont do anything
        }
    };

    // Is this thread a valid, alive and belongs to our debugger?
    CurrentLineHighlights.prototype.is_an_interesting_thread = function (thread, thread_followed) {
        return thread && thread.is_alive && thread.debugger_id === thread_followed.debugger_id;
    };

    // Is this breakpoint in our source code file or in our assembly code page? Or is it just
    // a breakpoint that we shouldn't track?
    CurrentLineHighlights.prototype.should_track_this_thread = function(breakpoint, thread_follower) {
    
        // TODO debemos manejar el hecho de que un thread esta en varios lugares a la vez debido
        // a la naturaleza del stack!!
        //
        // Para poder tener esa data hay que llamar a get_stack_frames pero este llama a GDB!
        // Para evitar tantas llamadas a gdb se puede hacer que sea el tracker quien cargue los
        // frames y el get_stack_frames solo los retorne o una variante mixta.

        var is_breakpoint_in_source_code = breakpoint.source_fullname && breakpoint.source_line_number;

        if (is_breakpoint_in_source_code) {
            var is_breakpoint_in_our_current_source_file = this.thread_follower.is_this_file_already_loaded(breakpoint.source_fullname);
            return is_breakpoint_in_our_current_source_file;
        }
        else {
            return false; // TODO we dont support non-source-code breakpoints (assembly breakpoints)
        }
    };

    CurrentLineHighlights.prototype.is_an_interesting_thread_and_should_be_track = function (breakpoint){
        var is_an_interesting_thread = this.is_an_interesting_thread(breakpoint, this.thread_follower.thread_followed);
        if (!is_an_interesting_thread) {
            return false;
        }

        var should_track_this_thread = this.should_track_this_thread(breakpoint, this.thread_follower);
        if (!should_track_this_thread) {
            return false;
        }

        return true;
    };

    CurrentLineHighlights.prototype.isnt_an_interesting_breakpoint_or_shouldnt_be_track = function (breakpoint) {
        return !this.is_an_interesting_thread_and_should_be_track(breakpoint);
    };

    CurrentLineHighlights.prototype.highlight_this_source_code_breakpoint = function (breakpoint) {
        var breakpoint_highlight = this.code_editor.highlight_breakpoint(Number(breakpoint.source_line_number), {text: "*"});
        this.thread_highlights[breakpoint] = breakpoint_highlight;
    };

    return {CurrentLineHighlights: CurrentLineHighlights};
});

