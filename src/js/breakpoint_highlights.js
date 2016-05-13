define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'code_editor', 'thread_button_bar_controller', 'stack_view'], function (ace, $, layout, shortcuts, _, code_editor, thread_button_bar_controller, stack_view) {

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
            return;
        }

        // Search for "objects" in this new file that require a highlight
        var debugger_obj = thread_followed.get_debugger_you_belong();
        var breakpoints_by_id = debugger_obj.your_breakpoints_by_id();

        _.each(breakpoints_by_id, function (breakpoint) {
            var can_be_shown = breakpoint && !breakpoint.is_pending && breakpoint.debugger_id === thread_followed.debugger_id;
            var was_breakpoint_deleted = breakpoint.was_deleted || !breakpoint.is_enabled;

            if (can_be_shown && !was_breakpoint_deleted) {
                var is_breakpoint_in_source_code = breakpoint.source_fullname && breakpoint.source_line_number;

                // TODO we dont support breakpoints in assembly mode yet so we are only interested in source code level
                var is_breakpoint_in_our_current_source_file = is_breakpoint_in_source_code && this.thread_follower.is_this_file_already_loaded(breakpoint.source_fullname);

                if (is_breakpoint_in_source_code && is_breakpoint_in_our_current_source_file) {
                    this.breakpoint_highlights[breakpoint] = this.code_editor.highlight_breakpoint(Number(breakpoint.source_line_number));
                }
            }
        }, this);
    };

    BreakpointHighlights.prototype.update_highlight_of_breakpoint = function (breakpoint) {
        var thread_followed = this.thread_follower.thread_followed;
        if (!thread_followed) {
            return;
        }

        var can_be_shown = breakpoint && !breakpoint.is_pending && breakpoint.debugger_id === thread_followed.debugger_id;
        if (!can_be_shown) {
            return;
        }

        var was_breakpoint_deleted = breakpoint.was_deleted || !breakpoint.is_enabled;
        var is_breakpoint_in_source_code = breakpoint.source_fullname && breakpoint.source_line_number;

        // TODO we dont support breakpoints in assembly mode yet so we are only interested in source code level
        var is_breakpoint_in_our_current_source_file = is_breakpoint_in_source_code && this.thread_follower.is_this_file_already_loaded(breakpoint.source_fullname);
        
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

    return {BreakpointHighlights: BreakpointHighlights};
});

