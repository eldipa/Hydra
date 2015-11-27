define(["underscore", "jquery", "layout", "shortcuts", "fields"], function (_, $, layout, shortcuts, fields) {
   'use strict';

   var DetailsView = function () {
       this.super("DetailsView");
       this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');

       this.target_observed = null;
   };

   DetailsView.prototype.__proto__ = layout.Panel.prototype;
   layout.implement_render_and_unlink_methods(DetailsView.prototype);

   DetailsView.prototype.observe = function (new_target) {
       if (!new_target) {
           return;
       }

       if (new_target.get_display_name && new_target.get_display_details && new_target.get_display_fullname /* TODO add more conditions */) {
           this.target_observed = new_target; // target accepted
           this.update_view();
       }
       else {
           // TODO We should add a warning here: the new target is NOT accepted
           console.log("UPPSSSS");
       }
   };

   DetailsView.prototype.update_view = function () {
       if (!this.target_observed) {
           // TODO clean the view
       }
       else {
           var model = {
              fieldsets: [
                    {
                    name:   this.target_observed.get_display_fullname(),
                    fields: this.target_observed.get_display_details(),
                    //description: "Example of fields."
                    }]   
           };

           fields.view_it(model, this._$container.get()[0], true);
       }
   };

   return { DetailsView: DetailsView };
});
