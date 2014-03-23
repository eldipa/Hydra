define(['d3', 'ko'], function(d3, ko) {
   var view_it = function (model, container_to_attach) {
      
      if(!model.fieldsets) {
         throw "The attribute fieldsets must not be '" + model.fieldsets + "'.";
      }

      /*
       * fieldsets = is a array of objects;
       *  - each object is like = {
       *                            name: ... title of the fieldset,
       *                            fields: ... array of fields,
       *                            description: ... optional description
       *                            classes: ... optional additional classes (a string)
       *                            }
       *
       *  - each "field" in the array is an object like = {
       *                            name: ... field name
       *                            widget: ... how to represent the field
       *                            multifield: ... optional boolean
       *                            }
       *
       *  - if the multifield is True, the name and the widget must be arrays
       *    instead of simple elements.
       *    The list of name-widget tuples will be displayed as normals fields
       *    but all in the same line.
       *    The default is multifield = False
       *
       *  - then, each field name must be an attribute of the model and
       *    must be (or should be?) an ko.observable object.
       *
       **/

      var fieldsets = d3.select(container_to_attach).selectAll('.fieldset').data(model.fieldsets);

      var fieldset_divs = fieldsets.enter()
         .append('div')
         .attr('class', function (fset) {
            return "fieldset" + " " + fset.classes;   //TODO only if it is not empty and defined
         }); //TODO add more bootstrap class

      fieldset_divs.append('h3')
         .text(function (fset) { 
            return fset.name;
         }); //TODO add more attrs

      fieldset_divs.append('h4')
         .text(function (fset) {
            return fset.description;   //TODO only if it is not undefined
         }); //TODO more attrs


      fieldsets.exit()
         .remove();

      var fields = fieldsets.selectAll('.form-group').data(function (fset) { 
         return fset.fields;
      });

      /*
         if(fset.multifield) {
            return d3.zip(fset.name, fset.widget);
         }
         else {
            return [[fset.name, fset.widget]];
         }
         */

      fields.enter()
         .append('div')
         .attr('class', 'form-group');

      fields.exit()
         .remove();


      fields.append('label').text(function (field) { return field.name; });
      fields.append(function (field) { return document.createElement(field.widget.tag); })
         .attr('planceholder', function (field) { return field.name; }); //TODO add more attrs for bootstrap, and ko

   };

   return {'view_it': view_it};
});
