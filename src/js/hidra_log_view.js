define(["underscore", "jquery", "layout", "event_handler", "widgets/log_view"], function (_, $, layout, event_handler, log_view_module) {
   'use strict';
   var HidraLogView = function (det_view) {
       this.super("HidraLogView");
       
       var columns = [
           {id: 'n', name: "#", field: "n", width: 16, can_be_autosized: false},
           {id: "timestamp", name: "Timestamp", field: "timestamp", width: 96, can_be_autosized: false},
           {id: "source", name: "Source", field: "source", width: 96, can_be_autosized: false, cssClass: "selectable_text"},
           {id: "message", name: "Message", field: "message", cssClass: "selectable_text"},
       ];

       this.log_view = new log_view_module.LogView(det_view, columns, Message);

       var EH = event_handler.get_global_event_handler();

       var self = this;
       EH.subscribe("", function (data, topic) {
           self.log_view.append_message({
               n: self.log_view.data.length + 1,
               timestamp: Date.now(),
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

       this.formatted_message = syntaxHighlight(indented);
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


   // from https://stackoverflow.com/questions/4810841/how-can-i-pretty-print-json-using-javascript
   function syntaxHighlight(json) {
    var css_style = {
        string_  : "color: green;",
        number_  : "color: darkorange;",
        boolean_ : "color: blue;",
        null_    : "color: magenta;",
        key_     : "color: red;",
    };

    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number_';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key_';
            } else {
                cls = 'string_';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean_';
        } else if (/null/.test(match)) {
            cls = 'null_';
        }
        return '<span style="' + css_style[cls] + '">' + match + '</span>';
    });
   }

   return { HidraLogView: HidraLogView };
});
