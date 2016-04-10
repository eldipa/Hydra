define(["underscore", "jquery", "layout", "slickgrid", "event_handler", "observation"], function (_, $, layout, slickgrid, event_handler, observation_module) {
   'use strict';
   var Observation = observation_module.Observation;
   var LogView = function () {
       this.super("LogView");
       this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');

       this._$container.data('do_observation', _.bind(this.do_observation_over_the_grid, this));
   
       this.keep_scrolling_to_bottom = false;
       var self = this;

          var columns = [
            {id: "timestamp", name: "Timestamp", field: "timestamp", width: 96, can_be_autosized: false},
            {id: "source", name: "Source", field: "source", width: 96, can_be_autosized: false, cssClass: "selectable_text"},
            {id: "message", name: "Message", field: "message", cssClass: "selectable_text"},
          ];
          var options = {
            enableCellNavigation: false,
            enableColumnReorder: false,
            rowHeight: 20,
            syncColumnCellResize: true,
            forceFitColumns: true,
            enableTextSelectionOnCells: true,
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

       this.data.push({timestamp: timestamp,
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
       var cell_index_in_row = cell.cell;

       var message = this.data[row_index].message;
       var message_object = {
            get_display_name: function () { return "XXX display name"; },
            get_display_details: function () { return $("<span></span>").text(message); },
            get_display_fullname: function () { return "XXX display fullname"; },
       };

       return new Observation({target: message_object, context: this});
   };

   return { LogView: LogView };
});
