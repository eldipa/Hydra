define(['d3', 'ko'], function(d3, ko) {
   var view_it = function (model, container_to_attach, horizontal_form) {
      
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
       *                            }
       *
       *
       *  - then, each field name must be an attribute of the model and
       *    must be (or should be?) an ko.observable object.
       *
       **/

      // fieldsets bind
      var root = d3.select(container_to_attach);
      var label_class = "control-label"
      if(horizontal_form) {
         root = root.append('form').attr('class', 'form-horizontal');
         label_class = label_class + " " + "col-sm-2";
      }
      var fieldsets = root.selectAll('.fieldset').data(model.fieldsets);

      // fieldsets enter()
      // div
      //  -- header (name of the set)
      //      -- small (description)
      var fieldset_divs = fieldsets.enter()
         .append('div')
         .attr('class', function (fset) {
            return "fieldset" + " " + (fset.classes || "");
         }); 

      var set_heads = fieldset_divs.filter(function (fset) { return !!fset.name; })
         .append('h4')
         .text(function (fset) { 
            return fset.name;
         }); 

      set_heads.filter(function (fset) { return !!fset.description; })
         .append('small')
         .text(function (fset) { 
            return " " + fset.description;
         }); 


      // fieldsets exit()
      fieldsets.exit()
         .remove();

      // fieldsets done, now each field is created (bind)
      var fields = fieldsets.selectAll('.form-group').data(function (fset) { 
         return fset.fields;
      });


      // fields enter() and exit()
      fields.enter()
         .append('div')
         .attr('class', 'form-group');

      fields.exit()
         .remove();


      fields.append('label').text(function (field) { return field.name; })
         .attr('class', label_class);

      if(horizontal_form) {
         fields = fields.append('div').attr('class', 'col-sm-10');
      }

      var tag_by_type = {
         'textarea': 'textarea',
         'static': 'p',
         'select': 'select',
         'multiselect': 'select',
      }; // default 'input'

      var field_class = {
         'static': 'form-control-static'
      }; // default 'form-control'

      // field creation (except checkboxs)
      var non_checkbox_packets = fields.filter(function (field) {
         return field.widget.type !== "checkbox";
      })
         .append(function (field) { 
            var tag = tag_by_type[field.widget.type] || "input";
            return document.createElement(tag); 
         })
         .attr('placeholder', function (field) { return field.widget.placeholder || null; })
         .attr('type', function (field) { return field.widget.type; })
         .attr('class', function (field) {
            return field_class[field.widget.type] || 'form-control';
         })
         .attr('multiple', function (field) { 
            return (field.widget.type === "multiselect") ? "" : null; 
         })
         .text(function (field) { return field.widget.message || "";}); //TODO add more attrs for bootstrap, and ko

      // special field creation (checkboxs)
      var checkbox_packets = fields.filter(function (field) {
         return field.widget.type === "checkbox";
      })
         .append('div')
         .attr('class', 'checkbox');

      checkbox_packets.html(function (field) { return '<input type="checkbox"> ' + (field.widget.message || "");});

      // special children (options)
      var options = non_checkbox_packets.filter(function (field) { return field.widget.type === "select" || field.widget.type === "multiselect"; })
         .selectAll('option')
         .data(function (field) { return field.widget.options || []; });

      options.enter()
         .append('option');

      options.exit()
         .remove()

      options.text(function (opt) { return opt; });

      // help texts
      fields.filter(function (field) { return !!field.widget.help; })
         .append('p').text(function (field) { return field.widget.help; })
         .attr('class', 'help-block');


   };

   return {'view_it': view_it};
});
