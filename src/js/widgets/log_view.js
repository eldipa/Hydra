define(["underscore", "jquery", "layout", "slickgrid", "event_handler", "observation"], function (_, $, layout, slickgrid, event_handler, observation_module) {
   'use strict';
   var Observation = observation_module.Observation;
   var LogView = function (det_view, columns, message_object_constructor_by_default) {
       this.super("LogView");
       this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');

       this._$container.data('do_observation', _.bind(this.do_observation_over_the_grid, this));
       this.det_view = det_view;

       if (!message_object_constructor_by_default) {
           this.message_object_constructor_by_default = Message;
       }
       else {
           this.message_object_constructor_by_default = message_object_constructor_by_default;
       }

       this.keep_scrolling_to_bottom = false;
       var self = this;

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
   };
   

   LogView.prototype.append_message = function (message_object) {
       this.data.push(message_object);

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
       var message_object_constructor = this.data[row_index].message_object_constructor || this.message_object_constructor_by_default;
       var message_object = new message_object_constructor(row_index, this.data[row_index]);
       return new Observation({target: message_object, context: this});
   };

   /* All the lines by default will construct this kind of objects when they are clicked (see do_observation_over_the_grid)
    * If you want other kind of object, you can:
    *   - change the default of all the rows setting the message_object_constructor_by_default parameter
    *   - change the message object for a specific line adding the property 'message_object_constructor' in the line stored in the grid.
    * */
   var Message = function (row_index, log_line_object) {
       var raw_message = log_line_object.message; // just an example
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
   

   return { LogView: LogView };
});

