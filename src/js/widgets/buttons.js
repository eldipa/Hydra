define(['jquery', 'jqueryui', 'layout/panel'], function ($, _, panel) {
   var Buttons = function (buttons_description, as_a_set) {
      this.super("Buttons");
      this._$container = $('<div></div>');

      for (var i = 0; i < buttons_description.length; ++i) {
         var desc = buttons_description[i];

         var label = desc.label || "";
         var action = desc.action || null;

         var $button = $('<button>'+label+'</button>');

         $button.button(desc); // init the 'button' widget of jquery-ui

         if (action) {
            $button.click(action);
         }

         this._$container.append($button);
      }

      if (as_a_set) {
         this._$container.buttonset();
      }

      this._$out_of_dom = this._$container;
   };

   Buttons.prototype.__proto__ = panel.Panel.prototype;
   
   Buttons.prototype.render = function () {
      if (this._$out_of_dom) {
         this._$out_of_dom.appendTo(this.box);
         this._$out_of_dom = null;
      }
   };
   
   Buttons.prototype.unlink = function () {
      if (!this._$out_of_dom) {
         this._$out_of_dom = this._$container.detach();
      }
   }; 

   return {
      Buttons: Buttons,
   };
});
