define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'code_editor', 'thread_button_bar_controller', 'stack_view'], function (ace, $, layout, shortcuts, _, code_editor, thread_button_bar_controller, stack_view) {

    /*
     * This object will track the breakpoint highligths in the code_editor based
     * in the breakpoints that are affecting the particular thread followed by thread_follower.
     *
     * There are two posibilities:
     *  - the thread moves to another file: all the highlights are invalid and you need
     *    to call clean_up and then, when the new file is open, call to search_breakpoints_to_highlight
     *  - a breakpoint change: in that case you need to call update_highlight_of_breakpoint to
     *    know of the breakpoint is of our interest (is in our file for example) and if it is new 
     *    highlight it and if it is deleted or disabled, remove the highlight.
     *
     * */
    var BreakpointHighlights = function (code_editor, thread_follower) {
        this.code_editor = code_editor;
        this.thread_follower = thread_follower;
        this.breakpoint_highlights = {}
    };

    BreakpointHighlights.prototype.clean_up = function () {
        _.each(this.breakpoint_highlights, function (bkt_highlight) {
            this.code_editor.remove_highlight(bkt_highlight);
        }, this);

        this.breakpoint_highlights = {}; 
    };

    BreakpointHighlights.prototype.search_breakpoints_to_highlight = function () {
        var thread_followed = this.thread_follower.thread_followed;
        if (!thread_followed) {
            console.error("The thread_followed is undefined or not well built and cannot be used by the BreakpointHighlights object");
            return;
        }

        // Search for "objects" in this new file that require a highlight
        var debugger_obj = thread_followed.get_debugger_you_belong();
        var breakpoints_by_id = debugger_obj.your_breakpoints_by_id();

        _.each(breakpoints_by_id, function (breakpoint) {
            if (this.isnt_an_interesting_breakpoint_or_shouldnt_be_track(breakpoint)) {
                return;
            }

            var was_breakpoint_deleted = breakpoint.was_deleted || !breakpoint.is_enabled;

            if (!was_breakpoint_deleted) {
                this.breakpoint_highlights[breakpoint] = this.code_editor.highlight_breakpoint(Number(breakpoint.source_line_number));
            }
        }, this);
    };

    BreakpointHighlights.prototype.update_highlight_of_breakpoint = function (breakpoint) {
        var thread_followed = this.thread_follower.thread_followed;
        if (!thread_followed) {
            console.error("The thread_followed is undefined or not well built and cannot be used by the BreakpointHighlights object");
            return;
        }

        if (this.isnt_an_interesting_breakpoint_or_shouldnt_be_track(breakpoint)) {
            return;
        }

        var was_breakpoint_deleted = breakpoint.was_deleted || !breakpoint.is_enabled;

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
    };

    // Is this breakpoint a valid, non-pending one and belongs to our debugger?
    BreakpointHighlights.prototype.is_an_interesting_breakpoint = function (breakpoint, thread_followed) {
        return breakpoint && !breakpoint.is_pending && breakpoint.debugger_id === thread_followed.debugger_id;
    };

    // Is this breakpoint in our source code file or in our assembly code page? Or is it just
    // a breakpoint that we shouldn't track?
    BreakpointHighlights.prototype.should_track_this_breakpoint = function(breakpoint, thread_follower) {
        var is_breakpoint_in_source_code = breakpoint.source_fullname && breakpoint.source_line_number;

        if (is_breakpoint_in_source_code) {
            var is_breakpoint_in_our_current_source_file = this.thread_follower.is_this_file_already_loaded(breakpoint.source_fullname);
            return is_breakpoint_in_our_current_source_file;
        }
        else {
            return false; // TODO we dont support non-source-code breakpoints (assembly breakpoints)
        }
    };

    BreakpointHighlights.prototype.is_an_interesting_breakpoint_and_should_be_track = function (breakpoint){
        var is_an_interesting_breakpoint = this.is_an_interesting_breakpoint(breakpoint, this.thread_follower.thread_followed);
        if (!is_an_interesting_breakpoint) {
            return false;
        }

        var should_track_this_breakpoint = this.should_track_this_breakpoint(breakpoint, this.thread_follower);
        if (!should_track_this_breakpoint) {
            return false;
        }

        return true;
    };

    BreakpointHighlights.prototype.isnt_an_interesting_breakpoint_or_shouldnt_be_track = function (breakpoint) {
        return !this.is_an_interesting_breakpoint_and_should_be_track(breakpoint);
    };

    return {BreakpointHighlights: BreakpointHighlights};
});

