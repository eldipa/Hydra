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

        return txt.join(" ");
    };
    
    ThreadGroup.prototype.get_display_controller = function () {
        var self = this;
        return [{
               text: 'Remove thread group',
               action: function (e) {
                  e.preventDefault();
                  self.remove();
               },
              },{
               text: 'Load sources', //TODO attach (and others)
               action: function (e) {
                  e.preventDefault();
                  var debugger_id = self.debugger_id;

                  var input_file_dom = $('<input style="display:none;" type="file" />');
                  input_file_dom.change(function(evt) {
                      var file_exec_path = "" + $(this).val();
                      if (file_exec_path) {
                          self.load_file_exec_and_symbols(file_exec_path);

                          // TODO XXX XXX  HACK, run the process
                          var debugger_obj = self.tracker.get_debugger_with_id(debugger_id);
                          debugger_obj.execute("-break-insert", ["-t", "main"]); // TODO restrict this breakpoint to the threa group 
                          self.execute("-exec-run");
                      }
                      else {
                          console.log("Loading nothing");
                      }
                  });
                  input_file_dom.trigger('click');
               },
              }];
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

    return {ThreadGroup: ThreadGroup};
});
