define(["underscore", "shortcuts", 'event_handler'], function (_, shortcuts, event_handler) {
    'use strict';

    var ThreadGroup = function (id, tracker, obj) {
        this._properties = ["debugger_id", "state", "executable", "process_id", "exit_code"];
        this.update(obj);

        this.threads_by_id = {};
        this.id = id;
        this.tracker = tracker;
        this.EH = event_handler.get_global_event_handler();
    };

    ThreadGroup.prototype.update = shortcuts._update_properties;

    ThreadGroup.prototype.get_display_name = function () {
        var txt = [];

        if (this.executable != undefined) {
            txt.push(this.executable.substr(this.executable.lastIndexOf("/")+1));
        }

        if (this.state === "started") {
            txt.push("--running");
            if (this.executable != undefined && this.process_id !== undefined) {
                txt.push("Process id: " + this.process_id);
            }
        }
        else {
            txt.push("--not running");
            if (this.exit_code !== undefined) {
                txt.push("Exit code: " + this.exit_code);
            }
        }

        txt.push("(" + this.id + ")");

        return txt.join(" ");
    };

    ThreadGroup.prototype.remove = function () {
        shortcuts.gdb_request(null, 
                this.debugger_id, 
                "-remove-inferior",
                [""+this.id]
                );
    };

    ThreadGroup.prototype.load_file_exec_and_symbols = function (filepath) {
        var self = this;
        var update_my_status_when_file_is_loaded = function () {
            var s = self.tracker.thread_groups_by_debugger[self.debugger_id];
            self.tracker._request_an_update_thread_groups_info(s, self.debugger_id);
        };

        shortcuts.gdb_request(update_my_status_when_file_is_loaded, 
                this.debugger_id, 
                "-file-exec-and-symbols",
                [filepath]
                );
    };

    return {ThreadGroup: ThreadGroup};
});
