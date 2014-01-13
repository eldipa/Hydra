require.config({
   baseUrl: 'js',
   waitSeconds: 25,

   paths: {
      'coffee-script': 'external/coffee-script',
      cs: 'external/cs',
      jquery: 'external/jquery-2.0.3.min',
      d3: 'external/d3.v3.min'
   }

});

require(['cs!process_graph'], function () {

},
function (err) {
   alert("Error during the import (" + err.requireType + ").\nFailed modules: " + err.requireModules + "\n");
});

