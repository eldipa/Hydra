define(['jquery', 'jqueryui'], function ($, _unused_) {
   var create_button_bar = function (buttons_description, as_a_set) {
      var $container = $('<div></div>');

      for (var i = 0; i < buttons_description.length; ++i) {
         var desc = buttons_description[i];

         var label = desc.label || "";
         var action = desc.action || null;

         var $button = $('<button>'+label+'</button>');

         $button.button(desc); // init the 'button' widget of jquery-ui

         if (action) {
            $button.click(action);
         }

         $container.append($button);
      }

      if (as_a_set) {
         $container.buttonset();
      }
        
      return $container;
   };

   return {
      create_button_bar: create_button_bar,
   };
});
