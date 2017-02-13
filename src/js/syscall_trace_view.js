define(["underscore", "jquery", "layout", "event_handler", "widgets/log_view"], function (_, $, layout, event_handler, log_view_module) {
   'use strict';
   var SyscallTraceView = function (det_view) {
       this.super("SyscallTraceView");
       
       var columns = [
           {id: 'n', name: "#", field: "n", width: 16, can_be_autosized: false},
           {id: "time", name: "Time", field: "time", width: 96, can_be_autosized: false},
           {id: "pid", name: "PID", field: "pid", width: 36, can_be_autosized: false, cssClass: "selectable_text"},
           {id: "tid", name: "TID", field: "tid", width: 16, can_be_autosized: false, cssClass: "selectable_text"},
           {id: "name", name: "Name", field: "name", width: 36, cssClass: "selectable_text"},
           {id: "arguments", name: "Arguments", field: "arguments", width: 96, cssClass: "selectable_text"},
           //{id: "result", name: "Result", field: "result", width: 16, cssClass: "selectable_text"},
           {id: "result_text", name: "Result Text", field: "result_text", width: 36, cssClass: "selectable_text"},
       ];

       this.log_view = new log_view_module.LogView(det_view, columns, Message);
       this.didnt_finish_syscalls = {};

       var EH = event_handler.get_global_event_handler();
       this.time_reference = Date.now();

       var self = this;
       EH.subscribe("notification-gdb", function (data, topic) {
           // topic ~ notification-gdb.¦gdb id|.gdb-module.Exec.strace
           if (!topic.endsWith('.gdb-module.Exec.strace')) {
               return;
           }
           var dtime = Date.now() - self.time_reference;
           self.time_reference += dtime;

           var at_enter = data.at === 'enter';
           var syscall_key = "pid"+data.call.pid+"tid"+data.call.tid;
           if (at_enter) {
               var message = {
                   n: self.log_view.data.length + 1,
                   time: (dtime / 1000).toFixed(4),
                   pid:  data.call.pid,
                   tid:  data.call.tid,
                   name: data.call.name,
                   'arguments': data.call['arguments'],
                   result: '?',
                   result_text: 'not finish'
               };
               self.didnt_finish_syscalls[syscall_key] = message;
           }
           else {
               var incomplete_syscall = self.didnt_finish_syscalls[syscall_key];
               var message = {
                   n: self.log_view.data.length + 1,
                   time: (dtime / 1000).toFixed(4),
                   pid:  data.call.pid,
                   tid:  data.call.tid,
                   name: "?",
                   'arguments': "?",
                   result: data.call.result,
                   result_text: data.call.result_text
               };
               if (incomplete_syscall) {
                   message.name = incomplete_syscall.name;
                   message['arguments'] = incomplete_syscall['arguments'];

                   clearTimeout(incomplete_syscall.show_enter_delayed);
                   delete self.didnt_finish_syscalls[syscall_key];
               }
           }

           if (at_enter) {
               message.show_enter_delayed = _.delay(function () {
                   self.log_view.append_message(message);
               }, 500);
           }
           else {
               self.log_view.append_message(message);
           }
       });
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
       var raw_message = log_line_object.message;
       var obj = JSON.parse(raw_message);
       var indented = JSON.stringify(obj, null, 2);

       this.formatted_message = log_line_object.name;
   }

   Message.prototype.get_display_name = function () {
       return "A message";
   };
   
   Message.prototype.get_display_details = function () {
        return $("<pre></pre>").html(this.formatted_message);
   };
   
   Message.prototype.get_display_fullname = function () {
       return "A message";
   };
   
   Message.prototype.get_display_controller = function () {
       return null;
   };

   return { SyscallTraceView: SyscallTraceView };
});
