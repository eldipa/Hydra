define(['screenshot', 'event_handler'], function (screenshot, event_handler) {
   'use strict';

   var repl = require("repl");
   var net = require("net");

   var host = '127.0.0.1';
   var port = 5001;
   var attempts = 0;

   /* Start a server so the client can connect to him and start to send
    * arbitrary javascript statements. */
   var init = function () {
      var server = net.createServer(function (socket) {
          var repl_object = repl.start({
                 prompt: "js> ",
                 terminal: false,
                 useColors: false,
                 ignoreUndefined: true,
                 input: socket,
                 output: socket
               });
          
          repl_object.on('exit', function() {
               socket.end();
           });

          // add variables to the context (export variables)
          // repl_object.context.foo = local_foo;
          repl_object.context.take_screenshot = screenshot.take_screenshot;
          repl_object.context.event_handler = event_handler;
         
      });
      
      server.listen(port, host)
         .on('error', function (err) {
            if (err === 'EADDRINUSE') {
               attempts++;
               if (attempts > 10) {    // 10*1000 = 10 seconds
                  console.log("ERROR: " + err);
               }
               else {
                  setTimeout(function () {
                     server.close();
                     server.listen(port, host);
                  }, 1000);
               }
            }
        });

      return server;
   };

   return {init: init};
});

