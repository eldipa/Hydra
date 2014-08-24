requirejs.config({
   baseUrl: 'js',
   waitSeconds: 25,

   paths: {
      jquery: 'external/jquery-2.1.0',
      d3: 'external/d3.v3.min',
      ko: 'external/knockout-3.0.0',
      ace_internals: 'external/ace/ace',
      ace: 'external/ace',
      w2ui_internals: 'external/w2ui-simple', //change w2ui-1.3.2 (full) or w2ui-simple (simple)
      w2ui: 'external/w2ui',
      ctxmenu: 'external/ctxmenu',
      jqueryui: 'external/jquery-ui-1.11.0',
      jqueryui_tabsoverflow: 'external/jquery-ui-tabs-overflow',
      splitter: 'external/splitter'
   },

   shim: {
      "w2ui_internals": {
         deps: ['jquery'],
         exports: "w2ui"
      },
      "jqueryui": {
         exports: "$",
         deps: ['jquery']
      }
   }

});

requirejs(['w2ui', 'code_view', 'jquery', 'export_console', 'layout', 'layout_examples', 'jqueryui', 'ctxmenu', 'splitter'], function (w2ui, code_view, $, export_console, layout, layout_examples, _, ctxmenu, _) {
   var js_console_server = export_console.init();
   var fs = require('fs');

   ctxmenu.init({
          fadeSpeed: 100,
          filter: function ($obj){},
          above: 'auto',
          preventDoubleContext: true,
          compress: false
   });

   ctxmenu.attachDynamic('body', undefined);

   var update_bar_and_split_for = function (position_name, dimension_name) {
      if (! ((position_name === 'left' && dimension_name === 'width') ||
             (position_name === 'top'  && dimension_name === 'height')) ) {
                throw new Error("The position/dimension names are invalid. Accepted 'left-width' and 'top-height' but received '"+position_name+"-"+dimension_name+"'.");
             }

      var opposite_position_name = {
         left: 'right',
         top : 'bottom',
      }[position_name]

      return function (event, ui) {
         var $container = $(this).parent().parent();
         var new_bar_position = $(ui.helper).position();

         var container_position = $container.position();

         var rel_offset = (new_bar_position[position_name] - container_position[position_name]) / $container[dimension_name]();

         if(rel_offset < 0.0001 || rel_offset > 0.9999) {
            console.log("The bar is moving "+position_name+"--"+opposite_position_name+" too far: Bar new position " + new_bar_position[position_name] + " Container position " + container_position[position_name]);
         }
         else {
            var percentage = (rel_offset * 100);
            $container.children("."+position_name+"_panel_of_splitted")[dimension_name](percentage + "%");
            $container.children("."+opposite_position_name+"_side_panel_and_bar_of_splitted")[dimension_name]((100-percentage) + "%");
         }
      };
   };  

   var fix_for_dimension_at_start_bug_for = function (dimension_name) {
      if (! (dimension_name === 'width' || dimension_name === 'height') ) {
         throw new Error("Incorrect dimension name. Accepted width or height but received '"+dimension_name+"'.");
      }

      return function (event, ui) {
         var correct_value_at_start = $(this)[dimension_name]();
         $(ui.helper)[dimension_name](correct_value_at_start);
      };
   };

   var options_for_draggable_bar = function (type) {
      if (! (type === 'vertical' || type === 'horizontal') ) {
         throw new Error("You cannot create a '"+type+"' draggable bar. Only 'vertical' or 'horizontal' draggable bars are allowed.");
      }
      
      if (type === 'vertical') {
         return { 
            axis: "x", 
            opacity: 0.7, 
            helper: "clone",
            stop: update_bar_and_split_for('left', 'width'),
            start: fix_for_dimension_at_start_bug_for('height')
         };
      }
      else {
         return { 
            axis: "y", 
            opacity: 0.7, 
            helper: "clone",
            stop: update_bar_and_split_for('top', 'height'),
            start: fix_for_dimension_at_start_bug_for('width')
         };
      }
   };

   $(".vertical_bar_splitting").draggable(options_for_draggable_bar('vertical'));
   $(".horizontal_bar_splitting").draggable(options_for_draggable_bar('horizontal'));

   //layout_examples.init();

   /*var event_handler = new event_handler.EventHandler();
   event_handler.init();
   */

   //var view = new code_view.CodeView();

   /*
   event_handler.subscribe('source', function (data) {
      view.load_code_from_file(data.filename);
      //view.highlightLine(data.line_num, 'info');
      view.gotoLine(data.line_num);
   });
   */

   /*
   var socket = require('net').Socket();
   socket.connect(5555, '');
   socket.setEncoding('ascii');
      
   socket.write("new,/home/martin/a.out\n");
   //socket.write("step-into,9061\n");
   socket.on('data', function (chunk) {
      var items = chunk.trim().split(',');
      view.load_code_from_file("/home/martin/" + items[2]);
      view.gotoLine(items[3] * 1);
   });

   var pstyle = 'border: 1px solid #dfdfdf; padding: 5px;';
   $('#layout').w2layout({
      name: 'layout',
      panels: [
         { type: 'main', style: pstyle, content: "main" },
         { type: 'bottom', size: 50, resizable: true, style: pstyle, content: 'bottom' }
      ]
   });

   w2ui.objects['layout'].content("main", view.view_dom);
   */
   
   //process_view.start();
   //require('nw.gui').Window.get().reload(3);
   /*
   var model = {
      fieldsets: [
         {
            name: "Foo category",
            description: "Example of fields.",
            fields: [
                {
                   name: "Name:",
                   widget: {type: 'text', placeholder: 'Your name here'}
                },
                {
                   name: "Password:",
                   widget: {type: 'password', help: "use lower and upper letters with numbers and signs"}
                },
                {
                   name: "Your opinion:",
                   widget: {type: 'textarea'}
                },
                {
                   widget: {type: 'checkbox', help:'beware!!!', message:"yes?"}
                },
                {
                   name: "Your money:",
                   widget: {type: 'static', message:"1244$", help:"it's constant :)"}
                },
                {
                   name: "Select one:",
                   widget: {type: 'select', options: [1, 2]}
                },
                {
                   name: "Select more!:",
                   widget: {type: 'multiselect', help:"use CTRL to select more than one", options: [1, 2, 3, 4]}
                },
               ]
         },
         
         {
            name: 'Campos B',
            classes: '',
            fields: [
                {
                   name: "Nombre:",
                   widget: {tag: 'input'}
                },
                {
                   name: "Apellido:",
                   widget: {tag: 'input'}
                },
               ]
         },
         {
            classes: '',
            fields: [
                {
                   name: "Nombre:",
                   widget: {tag: 'input'}
                },
                {
                   name: "Apellido:",
                   widget: {tag: 'input'}
                },
               ]
         }
         
         ]
   };
   fields.view_it(model, '.main', true);
   */

   /*
   var v = new pgraph.ProcessGraph();
   v.enable(main);
   v.update([
         {
            pid: 1, 
            name: 'A',
            status: 'running'
         },
         {
            pid: 2, 
            name: 'B',
            status: 'running'
         },
         {
            pid: 3, 
            name: 'C',
            status: 'running'
         }
         ],

         [
         [0, 1],
         [0, 2]
            ]);*/

},
function (err) {
   alert("Error during the import (" + err.requireType + ").\nFailed modules: " + err.requireModules + "\n");
});

