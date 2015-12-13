define(['jquery', 'jqueryui'], function ($, _unused_) {
 
   // Knonw limitation: If the vertical_layout is used, the buttons will not have the same width unless
   // that they not have any labels.
   var create_button_bar = function (buttons_description, as_a_set, vertical_layout) {
      var $container = $('<div style="overflow: hidden"></div>');

      if (vertical_layout) {
          var button_style = "display: block;";
      }
      else {
          var button_style = "";
      }

      for (var i = 0; i < buttons_description.length; ++i) {
         var desc = buttons_description[i];

         var label = desc.label || "";
         var tooltip = desc.tooltip || "";
         var action = desc.action || null;

         var $button = $('<button style="'+button_style+'">'+label+'</button>');

         $button.button(desc); // init the 'button' widget of jquery-ui

         if (action) {
            $button.click(action);
         }

         if (tooltip) {
             $button.attr("title", $.trim(tooltip));
         }

         $container.append($button);
      }

      if (as_a_set) {
         $container.buttonset();
      }

      if (as_a_set && vertical_layout) {
          $('button:first', $container).removeClass('ui-corner-left').addClass('ui-corner-top');
          $('button:last',  $container).removeClass('ui-corner-right').addClass('ui-corner-bottom');
      }

      return $container;
   };

   return {
      create_button_bar: create_button_bar,
   };
});
