define(["underscore", "jquery", "layout", "shortcuts", "fields", "ko"], function (_, $, layout, shortcuts, fields, ko) {
   'use strict';

   var DetailsView = function () {
       this.super("DetailsView");
       this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');

       this.target_observation = null;
       this._is_the_details_view = true;
   };

   DetailsView.prototype.__proto__ = layout.Panel.prototype;
   layout.implement_render_and_unlink_methods(DetailsView.prototype);

   DetailsView.prototype.observe = function (observation) {
       if (observation.context === this) {
           return; 
       }

       var new_target = observation.target;

       if (!new_target) {
           return;
       }

       if (new_target.get_display_name && new_target.get_display_details && new_target.get_display_fullname /* TODO add more conditions */) {
           if (this.target_observation && this.target_observation.target === new_target) {
               return;
           }

           this.target_observation = observation;  // target accepted
           this.target_observation.context = this;
           this.update_view();
       }
       else {
           // We should add a warning here?: the new target is NOT accepted
           // Answer: i don't think so
           //
           // console.debug("Nothing to show");
       }
   };

   DetailsView.prototype.update_view = function () {
       if (!this.target_observation) {
           // clean the view?
           // Answer: i don't think so
       }
       else {
           ko.cleanNode(this._$container.get()[0]);
           this._$container.empty();

           var $elem = $(this.target_observation.target.get_display_details());
           this._$container.append($elem);
           ko.applyBindings(this.target_observation.target, this._$container.get()[0]);

           this._$container.data('do_observation', _.bind(this.do_self_observation, this));
       }
   };

   DetailsView.prototype.do_self_observation = function () {
       if (this.target_observation) {
           return this.target_observation; // TODO a copy perhaps?
       }
       else {
           return null;
       }
   };

   return { DetailsView: DetailsView };
});
