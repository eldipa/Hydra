require.config({
   baseUrl: 'js',
   waitSeconds: 25,

   paths: {
      'coffee-script': 'external/coffee-script',
      cs: 'external/cs',
      jquery: 'external/jquery-2.0.3.min',
      d3: 'external/d3.v3.min',
      ko: 'external/knockout-3.0.0'
   }

});

require(['cs!process_graph', 'ko'], function () {

},
function (err) {
   alert("Error during the import (" + err.requireType + ").\nFailed modules: " + err.requireModules + "\n");
});

