define(["underscore", "jquery", "layout", "event_handler", "widgets/log_view", 'snippet'], function (_, $, layout, event_handler, log_view_module, snippet) {
   'use strict';
   var SyscallTraceView = function (det_view) {
       this.super("SyscallTraceView");
       
       var columns = [
           {id: 'n', name: "#", field: "n", width: 50, can_be_autosized: false},
           {id: "time", name: "Time", field: "time", width: 70, can_be_autosized: false},
           {id: "pid", name: "PID", field: "pid", width: 60, can_be_autosized: false, cssClass: "selectable_text"},
           {id: "tid", name: "TID", field: "tid", width: 16, can_be_autosized: false, cssClass: "selectable_text"},
           {id: "name", name: "Name", field: "name", width: 100, can_be_autosized: false, cssClass: "selectable_text"},
           {id: "arguments", name: "Arguments", field: "arguments", width: 36, cssClass: "selectable_text"},
           {id: "result_text", name: "Result", field: "result_text", width: 60, can_be_autosized: false, cssClass: "selectable_text"},
       ];

       this.log_view = new log_view_module.LogView(det_view, columns, Message);
       this.didnt_finish_syscalls = {};

       var EH = event_handler.get_global_event_handler();
       this.time_reference = null;

       var self = this;
       EH.subscribe("notification-gdb", function (data, topic) {
           // topic ~ notification-gdb.¦gdb id|.gdb-module.Exec.strace
           if (!topic.endsWith('.gdb-module.Exec.strace')) {
               return;
           }

           var at_enter = data.at === 'enter';
           var syscall_key = "pid"+data.call.pid+"tid"+data.call.tid;
           if (at_enter) {
               var message = {
                   _syscall_timestamp: data.call.timestamp,

                   n: self.log_view.data.length + 1,
                   pid:  data.call.pid,
                   tid:  data.call.tid,
                   name: data.call.name,
                   args: data.call.args,
                   result: '?',
                   result_text: 'not finish',
                   restype: data.call.restype
               };
               self.didnt_finish_syscalls[syscall_key] = message;
           }
           else {
               var incomplete_syscall = self.didnt_finish_syscalls[syscall_key];
               var message = {
                   _syscall_timestamp: data.call.timestamp,

                   n: self.log_view.data.length + 1,
                   pid:  data.call.pid,
                   tid:  data.call.tid,
                   name: "?",
                   args: ["?"],
                   result: data.call.result,
                   result_text: data.call.result_text,
                   restype: data.call.restype
               };
               if (incomplete_syscall) {
                   message.name = incomplete_syscall.name;
                   message.args = incomplete_syscall.args;
                   message.restype = incomplete_syscall.restype;

                   clearTimeout(incomplete_syscall.show_enter_delayed);
                   delete self.didnt_finish_syscalls[syscall_key];
               }
           }

           if (at_enter) {
               var delay = 500;
               message.show_enter_delayed = _.delay(function () {
                   self._add_and_update_time(message);
                   self.log_view.append_message(message);
               }, delay);
           }
           else {
               self._add_and_update_time(message);
               self.log_view.append_message(message);
           }
       });
   };

   SyscallTraceView.prototype._add_and_update_time = function (message) {
       var syscall_timestamp = parseInt(message._syscall_timestamp);
       delete message._syscall_timestamp;

       if (this.time_reference === null) {
           var dtime = 0;
           this.time_reference = syscall_timestamp;
       }
       else {
           var dtime = syscall_timestamp - this.time_reference;
           this.time_reference += dtime;
       }

       message.time = (dtime / 1000000).toFixed(6);
   };

   SyscallTraceView.prototype.__proto__ = layout.Panel.prototype;

   SyscallTraceView.prototype.render = function() {
       this.log_view.box = this.box;
       return this.log_view.render(this.box);
   };

   SyscallTraceView.prototype.unlink = function() {
       return this.log_view.unlink();
   }

   SyscallTraceView.prototype.is_in_the_dom = function() {
       return this.log_view.is_in_the_dom();
   }

   
   var Message = function (row_index, log_line_object) {
       this.formatted_message = [];
       
       this.formatted_message.push(log_line_object.restype + " "); 

       this.formatted_message.push(log_line_object.name + " (");

       var i_of_last = log_line_object.args.length - 1;
       for(var i = 0; i < log_line_object.args.length; ++i) {
           var args = log_line_object.args[i];

           if (i !== i_of_last) {
               var msg = "  " + args + ",";
           }
           else {
               var msg = "  " + args;
           }

           this.formatted_message.push(msg);
       }


       var result_str = log_line_object.result.toString().trim();
       var result_text_str = log_line_object.result_text.toString().trim();
       
       var result_msg = ") = " + result_str + ";";
       if (result_str !== result_text_str) {
           if (result_text_str.startsWith(result_str)) {
               result_text_str = result_text_str.replace(result_str, "").trim();
           }

           result_msg += "  // " + result_text_str
       }

       this.formatted_message.push(result_msg);
   }

   Message.prototype.get_display_name = function () {
       return "A message";
   };
   
   Message.prototype.get_display_details = function () {
        var container = $('<div></div>');
        for (var i = 0; i < this.formatted_message.length; ++i) {
            var js = $('<div id="code_snippet"></div>');
            var s = snippet.create_snippet(this.formatted_message[i], {font_size: 14});

            s.appendTo(container);
        }
        
        return container;
   };
   
   Message.prototype.get_display_fullname = function () {
       return "A message";
   };
   
   Message.prototype.get_display_controller = function () {
       return null;
   };

   return { SyscallTraceView: SyscallTraceView };
});
