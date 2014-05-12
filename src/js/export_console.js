define([], function () {

   var repl = require("repl");
   var net = require("net");

   net.createServer(function (socket) {
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
      
   }).listen(5001);

});

