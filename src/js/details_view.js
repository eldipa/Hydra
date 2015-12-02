define(["underscore", "jquery", "layout", "shortcuts", "fields", "ko"], function (_, $, layout, shortcuts, fields, ko) {
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
           if (this.target_observed === new_target) {
               return;
           }

           this.target_observed = new_target; // target accepted
           this.update_view();
       }
       else {
           // TODO We should add a warning here?: the new target is NOT accepted
           // Answer: i don't think so
           //
           // console.log("Nothing to show");
       }
   };

   DetailsView.prototype.update_view = function () {
       if (!this.target_observed) {
           // TODO clean the view
       }
       else {
           var js = this.target_observed.get_display_details();
           this._$container.html(js);
           ko.applyBindings(this.target_observed, this._$container.get()[0]);
       }
   };

   return { DetailsView: DetailsView };
});
