define(["underscore", "jquery", "layout", "slickgrid", "event_handler"], function (_, $, layout, slickgrid, event_handler) {
   'use strict';
   var LogView = function () {
       this.super("LogView");
       this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');
   
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

   return { LogView: LogView };
});
