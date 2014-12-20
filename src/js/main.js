requirejs.config({
   baseUrl: 'js',
   waitSeconds: 25,

   paths: {
      jquery: 'external/jquery-2.1.0',
      d3: 'external/d3.v3.min',
      ko: 'external/knockout-3.0.0',
      ace_internals: 'external/ace/ace',
      ace: 'external/ace',
      w2ui_internals: 'external/w2ui-1.3.2', //TODO Deprecated
      w2ui: 'external/w2ui',                 //TODO Deprecated
      ctxmenu: 'external/ctxmenu',
      varViewer: 'varViewer',
      jqueryui: 'external/jquery-ui-1.11.1',
      underscore: 'external/underscore-1.7.0',
      notify: 'external/notify'
   },

   shim: {
      "w2ui_internals": {     //TODO Deprecated 
         deps: ['jquery'],
         exports: "w2ui"
      },
      "jqueryui": {
         exports: "$",
         deps: ['jquery']
      },
      "underscore": {
         exports: "_",
      },
      "notify": {
         deps: ['jquery'],
         exports: "$",
      }
   }

});

var __modules_loaded_count = 0;
var __status_element = window.splash_window.window.document.getElementById("status");
requirejs.onResourceLoad = function(context, map, depArray) {
   __modules_loaded_count += 1;
   try {
      __status_element.innerHTML = "Loading... ["+__modules_loaded_count+" modules done].";
   } catch (e) {
      console.error("" + e);
      __status_element = window.splash_window.window.document.getElementById("status");
   }
};

requirejs(['ui', 'code_view', 'jquery', 'export_console', 'layout', 'layout_examples', 'jqueryui', 'ctxmenu', 'notify'], function (ui, code_view, $, export_console, layout, layout_examples, _, ctxmenu, notify) {
   var js_console_server = export_console.init();
   var fs = require('fs');

   ctxmenu.init({
          fadeSpeed: 100,
          above: 'auto',
          preventDoubleContext: true,
          compress: false
   });

   ctxmenu.attachDynamic('body', undefined);
  
   //layout_examples.init();
   ui.init();

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
   // Hide and close the splash window and show this one
   window.splash_window.hide();
   require('nw.gui').Window.get().show();
   window.splash_window.close();
},
function (err) {
   alert("Error during the import (" + err.requireType + ").\nFailed modules: " + err.requireModules + "\n");
});

