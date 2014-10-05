define(['jquery', 'widgets/selectmenu'], function ($, selectmenu) {
   var theme_names = [];
   var selected_by_default = null;
   
   var css_styles = $('link');
   for(var i = 0; i < css_styles.length; i++) {
      var is_a_stylesheet = (css_styles[i].rel.indexOf( "stylesheet" ) !== -1);
      var is_a_selectable_stylesheet = is_a_stylesheet && (css_styles[i].title);
      var is_a_selectable_alternate_stylesheet = is_a_selectable_stylesheet && (css_styles[i].rel.indexOf( "alternate" ) === -1);

      if (is_a_selectable_stylesheet)  {
         var theme_name = css_styles[i].title;

         theme_names.push(theme_name);

         if (is_a_selectable_alternate_stylesheet && !selected_by_default) {
            selected_by_default = theme_name;
         }
      }
   }


   var switch_on_change = function (ev, ui) {
      var style_selected = ui.item.value;

      var css_styles = $('link');
      for(var i = 0; i < css_styles.length; i++) {
         var is_a_stylesheet = (css_styles[i].rel.indexOf( "stylesheet" ) !== -1);
         var is_a_selectable_stylesheet = is_a_stylesheet && (css_styles[i].title);

         if (is_a_selectable_stylesheet)  {
            var theme_name = css_styles[i].title;

            css_styles[i].disabled = true;
            if (theme_name === style_selected) {
               css_styles[i].disabled = false;
            }
         }
      }
   };

   
   var theme_switch = new selectmenu.SelectMenu([{options: theme_names}], selected_by_default, {change: switch_on_change});

   return {
      theme_switch: theme_switch
   };
});
