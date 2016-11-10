define(['ace', 'jquery', 'layout', 'shortcuts', 'underscore', 'code_editor', 'thread_button_bar_controller', 'stack_view'], function (ace, $, layout, shortcuts, _, code_editor, thread_button_bar_controller, stack_view) {

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

    CurrentLineHighlights.prototype.clean_and_search_threads_to_highlight = function () {
        this.clean_up();
        this.search_threads_to_highlight();
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

    CurrentLineHighlights.prototype.update_highlight_of_thread = function (thread) {
        var thread_followed = this.thread_follower.thread_followed;
        if (!thread_followed) {
            console.error("The thread_followed is undefined or not well built and cannot be used by the CurrentLineHighlights object");
            return;
        }

        var thread_highlight = this.thread_highlights[thread.get_uid()];
        var thread_is_shown = !!thread_highlight;

        /*
         * Nop, this is not correct:
         *
         * if (this.isnt_an_interesting_thread_or_shouldnt_be_track(thread)) {
            if (thread_is_shown) {
                console.warn("A thread is highlighted but it shouldn't. In fact it shouldn't be tracked at all. Removing the highlight but this is situation that it shouldn't be happen!");
                this.code_editor.remove_highlight(thread_highlight);
            }
            return;
        }
         * 
         * At difference with the breakpoints, a thread can move from one file to another so
         * a particular thread in our file in one moment is tracked and at the next moment the
         * thread moves to another file and the thread is not interesting anymore.
         * This doesn't happen with the breakpoints which are static objects.
         *
         * So that "if" is wrong.
        **/

        var thread_should_be_shown = this.is_an_interesting_thread_and_should_be_track(thread);

        if (thread_should_be_shown) {
            if (thread_is_shown) { // is shown but probably it is in an incorrect location
                this.code_editor.remove_highlight(thread_highlight);
            }

            this.highlight_this_thread(thread);
        }
        else if (!thread_should_be_shown && thread_is_shown) {
            this.code_editor.remove_highlight(thread_highlight);
            delete this.thread_highlights[thread.get_uid()];
        }
        else { // the !thread_should_be_shown && !thread_is_shown so we dont do anything
        }
    };

    // Is this thread a valid, alive and belongs to our debugger?
    CurrentLineHighlights.prototype.is_an_interesting_thread = function (thread, thread_followed) {
        return thread && thread.is_alive && thread.debugger_id === thread_followed.debugger_id; /* && thread !== thread_followed*/;
    };

    CurrentLineHighlights.prototype.should_track_this_thread = function(thread, thread_follower) {
        var frames = thread.get_stack_frames();

        var selected_frame = _.find(frames, function (frame) {
            // TODO we dont support non-source-code frames
            var is_our = frame.source_fullname && frame.source_line_number && this.thread_follower.is_this_file_already_loaded(frame.source_fullname)
                         || this.thread_follower.is_this_address_already_loaded(frame.instruction_address);
            if (is_our) {
                this.cached_selected_frame = frame;
                return true;
            }
        }, this);

        return selected_frame !== undefined;
    };

    CurrentLineHighlights.prototype.is_an_interesting_thread_and_should_be_track = function (thread){
        var is_an_interesting_thread = this.is_an_interesting_thread(thread, this.thread_follower.thread_followed);
        if (!is_an_interesting_thread) {
            return false;
        }

        var should_track_this_thread = this.should_track_this_thread(thread, this.thread_follower);
        if (!should_track_this_thread) {
            return false;
        }

        return true;
    };

    CurrentLineHighlights.prototype.isnt_an_interesting_thread_or_shouldnt_be_track = function (thread) {
        return !this.is_an_interesting_thread_and_should_be_track(thread);
    };

    CurrentLineHighlights.prototype.highlight_this_thread = function (thread) {
        var selected_frame = this.cached_selected_frame;
        
        var marker = "th " + thread.id;
        if (thread === this.thread_follower.thread_followed) {
            marker = "@" + marker;
        }

        if (selected_frame.source_fullname && selected_frame.source_line_number && 
                this.thread_follower.is_this_file_already_loaded(selected_frame.source_fullname)) {
            var line_number_or_address = selected_frame.source_line_number;
        }
        else {
            var line_number_or_address = selected_frame.instruction_address;
        }

        var thread_highlight = this.code_editor.highlight_thread(line_number_or_address, {text: marker});
        this.thread_highlights[thread.get_uid()] = thread_highlight;
    };

    return {CurrentLineHighlights: CurrentLineHighlights};
});

