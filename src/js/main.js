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

requirejs(['w2ui', 'code_view', 'jquery', 'export_console', 'layout', 'layout_examples', 'jqueryui'], function (w2ui, code_view, $, export_console, layout, layout_examples, _) {
   var js_console_server = export_console.init();
   var fs = require('fs');

   //$( "#tabs" ).tabs();

   layout_examples.init();

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

