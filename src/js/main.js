requirejs.config({
   baseUrl: 'js',
   waitSeconds: 25,

   paths: {
      jquery: 'external/jquery-2.0.3.min',
      d3: 'external/d3.v3.min',
      ko: 'external/knockout-3.0.0'
   }

});

requirejs(['d3', 'ko', 'process_graph'], function (d3, ko, pgraph) {
   var fs = require('fs');

   console.log(d3.select('.main'));
   var main = d3.select('.main')
      .append('div')
      .attr('class', 'col-xs-12 col-sm-9');

   console.log(main);


   var form = d3.select('.main')
      .append('div')
      .attr('class', 'col-xs-6 col-sm-3 sidebar-offcanvas')
      .attr('role', 'navigation')
      .append('div')
      .attr('class', 'form-group');

   form.append('label')
      .text('View type')
   var s = form.append('select')
      .attr('class', 'form-control')
      .attr('data-bind', 'value: view_type');
   s.append('option').text('graph');
   s.append('option').text('table');

   form.append('label')
      .text('Include all descendents');
   form.append('input')
      .attr('type', 'checkbox')
      .attr('data-bind', 'checked: include_all_descendents');

   form.append('label')
      .text('Polling');
   form.append('input')
      .attr('type', 'text')
      .attr('class', 'form-control')
      .attr('placeholder', 'Polling time')
      .attr('data-bind', 'value: polling');

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
            ]);

},
function (err) {
   alert("Error during the import (" + err.requireType + ").\nFailed modules: " + err.requireModules + "\n");
});

