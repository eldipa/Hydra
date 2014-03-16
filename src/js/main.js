requirejs.config({
   baseUrl: 'js',
   waitSeconds: 25,

   paths: {
      jquery: 'external/jquery-2.0.3.min',
      d3: 'external/d3.v3.min',
      ko: 'external/knockout-3.0.0'
   }

});

requirejs(['d3', 'ko', 'process_view'], function (d3, ko, process_view) {
   var fs = require('fs');
   
   process_view.start();


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

