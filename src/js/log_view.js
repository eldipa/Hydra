define(["underscore", "jquery", "layout", "slickgrid", "event_handler", "observation"], function (_, $, layout, slickgrid, event_handler, observation_module) {
   'use strict';
   var Observation = observation_module.Observation;
   var LogView = function (det_view) {
       this.super("LogView");
       this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');

       this._$container.data('do_observation', _.bind(this.do_observation_over_the_grid, this));
       this.det_view = det_view;

       this.keep_scrolling_to_bottom = false;
       var self = this;

          var columns = [
            {id: 'n', name: "#", field: "n", width: 16, can_be_autosized: false},
            {id: "timestamp", name: "Timestamp", field: "timestamp", width: 96, can_be_autosized: false},
            {id: "source", name: "Source", field: "source", width: 96, can_be_autosized: false, cssClass: "selectable_text"},
            {id: "message", name: "Message", field: "message", cssClass: "selectable_text"},
          ];
          var options = {
            enableCellNavigation: true, //
            enableColumnReorder: false,  // dont allow the user to reorder the columns
            rowHeight: 20,               // this is the height of each row in the grid
            syncColumnCellResize: true,  // update the width of the column while the column's header is resized by the user
            forceFitColumns: true,       // distribute the size of each column to a 1/Nth of the available space (unless that the column has the custom can_be_autosized=false in which case its width will remain unchanged.
            enableTextSelectionOnCells: true, // that: enable text selection. Use in conjuntion with out custom css class "selectable_text"
          };
            
          this.data = [];

        this.grid = new slickgrid.Grid(this._$container, this.data, columns, options);
        this.grid.onScroll.subscribe(function (e, d) {
            var row_number = self.grid.getRowFromPosition(d.scrollTop + self.grid.getViewportDimensions().viewportH);
            if (row_number >= self.data.length) {
                self.keep_scrolling_to_bottom = true;
            }
            else {
                self.keep_scrolling_to_bottom = false;
            }
        });

        this.grid.onActiveCellChanged.subscribe(function (e, d) {
            if (!d) {
                return;
            }

            var row_index = d.row;
            var obs = self._do_observation_for_this_row(row_index);
            self.det_view.observe(obs);
        });
         
   var EH = event_handler.get_global_event_handler();
        EH.subscribe("stream-gdb", function (data, topic) {
            var gdb_id_as_str = topic.split(".")[1];
            var source = "GDB " + gdb_id_as_str
            self.add_message(data.stream, source);
         });

        EH.subscribe("", function (data, topic) {
            self.add_message(JSON.stringify(data), "*("+topic+")");
        });
   };

   LogView.prototype.add_message = function (message, source, timestamp) {
       source = source || "";
       timestamp = timestamp || Date.now();

       this.data.push({n: this.data.length + 1,
                       timestamp: timestamp,
                       source: source,
                       message: message,
                    });

       //this.grid.invalidateRow(grid.getSelectedRows()); ?? or invalidateRow last row?? or nothing??
       this.grid.updateRowCount();
       this.grid.render();
       if (this.keep_scrolling_to_bottom){
           this.grid.scrollRowToTop(this.data.length - 1);
       }
   };
   
   LogView.prototype.__proto__ = layout.Panel.prototype;
   layout.implement_render_and_unlink_methods(LogView.prototype);

   LogView.prototype.render = function() {
       if (this._$out_of_dom) {
           this._$out_of_dom.appendTo(this.box);
           this._$out_of_dom = null;
       }

       this.grid.resizeCanvas();
   };

   LogView.prototype.do_observation_over_the_grid = function (event, dom_element) {
       var cell = this.grid.getCellFromEvent(event);

       if (!cell) {
           return;
       }

       var row_index = cell.row;
       return this._do_observation_for_this_row(row_index);
   };
   
   LogView.prototype._do_observation_for_this_row = function (row_index) {
       var message_object_constructor = this.data[row_index].message_object_constructor || Message;
       var message_object = new message_object_constructor(row_index, this.data[row_index]);
       return new Observation({target: message_object, context: this});
   };

   /* All the lines by default will construct this kind of objects when they are clicked (see do_observation_over_the_grid)
    * If you want other kind of object, add the property 'message_object_constructor' in the line stored in the grid,
    * the method _do_observation_for_this_row will use that function to build your custom message.
    * */
   var Message = function (row_index, log_line_object) {
       this.raw_message = log_line_object.message;
       this.formatted_message = this.raw_message;
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

   Message.prototype.get_display_controller = function (current_context) {
       var self = this;

       var _is_the_details_view = current_context._is_the_details_view || false;

       if (!_is_the_details_view) {
           return [];
       }

       var _details_view = current_context;
       var controller = [   
            {
                text: "Show as...",
                subMenu: [
                    {
                        text: "text",
                        action: function (e) {
                           e.preventDefault();
                           self.formatted_message = self.raw_message;
                            
                           _details_view.update_view();
                        }
                    },
                    {
                        text: "json",
                        action: function (e) {
                           e.preventDefault();
                           try {
                               var obj = JSON.parse(self.raw_message);
                               var indented = JSON.stringify(obj, null, 2);
                              
                               self.formatted_message = syntaxHighlight(indented);
                               _details_view.update_view();
                           }
                           catch (e) {
                               self.formatted_message = self.raw_message;
                               _details_view.update_view();
                               throw e;
                           }
                        }
                    }
                ]
            },
       ];
       
       return controller;
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
   return { LogView: LogView };
});
