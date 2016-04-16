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
       var message = this.data[row_index].message;
       var message_object = {
            get_display_name: function () { return "XXX display name"; },
            get_display_details: function () { return $("<span></span>").text(message); },
            get_display_fullname: function () { return "XXX display fullname"; },
            get_display_controller: function () { return null; },
       };

       return new Observation({target: message_object, context: this});
   };

   return { LogView: LogView };
});
