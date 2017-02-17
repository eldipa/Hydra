define(["underscore", "jquery", "layout", "event_handler", "widgets/log_view", 'snippet'], function (_, $, layout, event_handler, log_view_module, snippet) {
   'use strict';
   var HidraLogView = function (det_view) {
       this.super("HidraLogView");
       
       var columns = [
           {id: 'n', name: "#", field: "n", width: 50, can_be_autosized: false},
           {id: "time", name: "Time", field: "time", width: 70, can_be_autosized: false},
           {id: "source", name: "Source", field: "source", width: 160, can_be_autosized: false, cssClass: "selectable_text"},
           {id: "message", name: "Message", field: "message", cssClass: "selectable_text"},
       ];

       this.log_view = new log_view_module.LogView(det_view, columns, Message);

       var EH = event_handler.get_global_event_handler();
       this.time_reference = Date.now();

       var self = this;
       EH.subscribe("", function (data, topic) {
           var dtime = Date.now() - self.time_reference;
           self.time_reference += dtime;

           self.log_view.append_message({
               n: self.log_view.data.length + 1,
               time: (dtime / 1000).toFixed(3),
               source: "*" + topic,
               message: JSON.stringify(data)
           });
       });
   };


   HidraLogView.prototype.__proto__ = layout.Panel.prototype;

   HidraLogView.prototype.render = function() {
       this.log_view.box = this.box;
       return this.log_view.render(this.box);
   };

   HidraLogView.prototype.unlink = function() {
       return this.log_view.unlink();
   }

   HidraLogView.prototype.is_in_the_dom = function() {
       return this.log_view.is_in_the_dom();
   }

   
   var Message = function (row_index, log_line_object) {
       var raw_message = log_line_object.message;
       var obj = JSON.parse(raw_message);
       var indented = JSON.stringify(obj, null, 2);

       this.formatted_message = indented.split("\n");
       
       this.max_line_length = 0;
       for (var i = 0; i < this.formatted_message.length; ++i) {
           if (this.formatted_message[i].length > this.max_line_length) {
               this.max_line_length = this.formatted_message[i].length;
           }
       }
   }

   Message.prototype.get_display_name = function () {
       return "A message";
   };
   
   Message.prototype.get_display_details = function () {
        var font_size = 14; //px
        var width = this.max_line_length * (font_size - 4);
        var container = $('<div style="width: '+width+'px; height: 100%; font-family: monaco;"></div>');

        var js = $('<div id="code_snippet"></div>');
        var s = snippet.create_snippet(this.formatted_message.join("\n"), {
            font_size: font_size, 
            interline_size: font_size/2,
            count_lines: this.formatted_message.length
        });
        s.appendTo(container);
        
        return container;
   };
   
   Message.prototype.get_display_fullname = function () {
       return "A message";
   };
   
   Message.prototype.get_display_controller = function () {
       return null;
   };

   return { HidraLogView: HidraLogView };
});
