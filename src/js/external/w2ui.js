define(["w2ui_internals", "jquery"], function (_, $) {
   w2obj.layout.prototype.old_content_function = w2obj.layout.prototype.content;

   function content(panel, data, transition) {
      var self = this;
      if(data instanceof jQuery && panel !== "css") {
         var jquery_object = data;
         data = {
            render: function() {
               $(self.el(panel)).empty();
               $(self.el(panel)).append(jquery_object);
            }
         };
      }

      return this.old_content_function(panel, data, transition);
   }

   w2obj.layout.prototype.content = content;

   return {
      objects: w2ui,
      widget_prototypes: w2obj,
      utils: w2utils
   };
});
