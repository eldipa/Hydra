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
            txt.push(shortcuts.get_filename_from_fullname(this.executable));
        }
        else {
            return "nothing loaded";
        }

        if (this.state === "started") {
            if (this.executable != undefined && this.process_id !== undefined) {
                txt.push("[PID: " + this.process_id + "]");
            }
            else {
                txt.push("[running]");
            }
        }
        else {
            if (this.exit_code !== undefined) {
                txt.push("[Exit code: " + this.exit_code + "]");
            }
            else {
                txt.push("[not running]");
            }
        }

        return txt.join(" ");
    };

    ThreadGroup.prototype.are_you_alive = function () {
        return this.state === "started";
    };
    
    ThreadGroup.prototype.get_debugger_you_belong = function () {
        return this.tracker.get_debugger_with_id(this.debugger_id);
    };

    ThreadGroup.prototype.is_executable_loaded = function () {
        return this.executable !== undefined; // this is a HACK TODO (if gdb removes the executable we don't notice it!!)
    };
    
    ThreadGroup.prototype.get_display_controller = function (from_who) {
        var self = this;
        var menu = [];

        var debugger_id = self.debugger_id;
        var debugger_obj = self.tracker.get_debugger_with_id(debugger_id);

        var thread_follower = from_who.thread_follower;
        console.log(this.executable);

        menu.push({
            text: 'Follow',
            disabled: !self.is_executable_loaded() || !thread_follower,
            action: function (e) {
                e.preventDefault();
                thread_follower.follow_thread_group(self);
            },
        });

        menu.push({divider: true});
        menu.push({
               text: 'Load executable', //TODO attach (and others)
               action: function (e) {
                  e.preventDefault();

                  var input_file_dom = $('<input style="display:none;" type="file" />');
                  input_file_dom.change(function(evt) {
                      var file_exec_path = "" + $(this).val();
                      if (file_exec_path) {
                          self.load_file_exec_and_symbols(file_exec_path);
                          thread_follower.follow_thread_group(self);
                      }
                      else {
                          console.log("Loading nothing");
                      }
                  });
                  input_file_dom.trigger('click');
               },
              });

        menu.push({divider: true});
        menu.push({
            text: 'Run at main',
            disabled: self.are_you_alive() || !self.is_executable_loaded(),
            action: function (e) {
                e.preventDefault();

                self.execute("-break-insert", ["-t", "main"]); 
                self.execute("-exec-run");
            },
        });
        
        menu.push({divider: true});
        menu.push({
            text: 'Send signal...',
            disabled: !self.are_you_alive(),
            action: function (e) {
                e.preventDefault();
                // TODO
            },
        });

        menu.push({divider: true});
        menu.push({
               text: 'Remove thread group',
               action: function (e) {
                  e.preventDefault();
                  self.remove();
               },
        });

        return menu;

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

        this.execute("-file-exec-and-symbols",
                [filepath],
                update_my_status_when_file_is_loaded
                );
    };

    ThreadGroup.prototype.your_threads_by_id = function () {
        return this.threads_by_id;
    };

    ThreadGroup.prototype.get_thread_with_id = function (thread_id) {
        return this.threads_by_id[thread_id];
    };

    ThreadGroup.prototype.execute = function (command, args, callback, self_id_argument_position) {
        args = args || [];
        var self_id_argument = "--thread-group " + this.id;

        if (self_id_argument_position === undefined) {
            args.unshift(self_id_argument);
        }
        else {
            args[self_id_argument_position] = self_id_argument;
        }

        shortcuts.gdb_request(callback || null, 
                this.debugger_id, 
                command,
                args
                );
    };

    ThreadGroup.prototype.update_source_fullnames = function (on_result) {
        this.execute("-file-list-exec-source-files", [], function on_file_list(data) {
            var results = data['results'];
            var files = results['files'];

            if (!files) {
                // failed, try to find a reason of why
                this.execute("-file-list-exec-source-file", [], function on_single_file(data) {
                    var results = data['results'];
                    var msg = results['msg'];

                    if (msg) {
                        on_result([], msg);
                    }
                    else {
                        on_result([], 'No sources, unknown reason');
                    }
                });
            }
            else {
                on_result(files, "Ok");
            }
        });
    };

    ThreadGroup.prototype.resolve_current_position = function (on_result) {
        var self = this;
        if (!this._source_fullname || !this._source_line || !this._instruction_address) {
            this.update_source_fullnames(function on_file_list(file_list, msg) {
                if (!file_list) {
                    // log msg??
                    var source_fullname = null;
                    var source_line = null;
                    var instruction_address = "0x000000"; // TODO replace this by the entry point
                }
                else {
                    var source_fullname = file_list[0].fullname;
                    var source_line = 1; 
                    var instruction_address = null;
                }

                self._source_fullname = source_fullname;
                self._source_line = source_line;
                self._instruction_address = instruction_address;

                on_result(source_fullname, source_line, instruction_address);
            });
        }
        else {
            on_result(this._source_fullname, this._source_line, this._instruction_address);
        }
    };

    return {ThreadGroup: ThreadGroup};
});
