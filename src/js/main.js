requirejs.config({
   baseUrl: 'js',
   waitSeconds: 25,

   paths: {
      jquery: 'external/jquery-2.0.3.min',
      d3: 'external/d3.v3.min',
      ko: 'external/knockout-3.0.0'
   }

});

requirejs(['d3', 'ko'], function (d3, ko) {
   console.log(d3.version);
   console.log(ko.version);

   var fs = require('fs');
    
   fs.readFile('./package.json', 'utf-8', function (error, contents) {
          //document.write(contents);
          console.log(contents);
   });

   var f = require('./js/f.js');

},
function (err) {
   alert("Error during the import (" + err.requireType + ").\nFailed modules: " + err.requireModules + "\n");
});

