define(['w2ui', 'code_view', 'event_handler', 'jquery'], function (w2ui, code_view, event_handler, $) {
   // init the event handler system, connecting this with the notifier.
   // now, we can send and receive events.
   var event_handler = new event_handler.EventHandler();
   event_handler.init();

   // we create the principal objects for the ui.
   // first, the code view so we can render source code
   var view = new code_view.CodeView();

   // we create the layout and the toolbar
   var pstyle = 'border: 1px solid #dfdfdf; padding: 5px;';
   $('#layout').w2layout({
      name: 'layout',
      panels: [
         { type: 'main', style: pstyle, content: "main",
            toolbar: {
               items: [
                     { type: 'button',  id: 'continue',  caption: 'continue', img: 'icon-save'},
                     { type: 'button',  id: 'next',  caption: 'next', img: 'icon-save'},
                     { type: 'button',  id: 'step',  caption: 'step', img: 'icon-save', disabled: true},
                     { type: 'button',  id: 'quit',  caption: 'quit', img: 'icon-save'},
                     { type: 'button',  id: 'quit-all',  caption: 'quit-all', img: 'icon-save'}
               ],
               onClick: function (event) {
                  try {
                     switch(event.target) {
                        case "continue":
                           event_handler.publish(session_id + ".direct-command", "c");
                           break;

                        case "next":
                           event_handler.publish(session_id + ".direct-command", "n");
                           break;

                        case "step":
                           event_handler.publish(session_id + ".direct-command", "s");
                           break;

                        case "quit":
                           event_handler.publish("debugger.exit", session_id);
                           break
                        
                        case "quit-all":
                           event_handler.publish("debugger.exit", "all");
                           break



                        default:
                           throw new Error("Unexpected target '"+event.target+"' for the click event.");
                     }
                  } catch(e) {
                     console.log("ERR: " + e);
                  }
               }
         }},
         { type: 'bottom', size: 50, resizable: true, style: pstyle, content: '' }
      ]
   });

   // we assign the ui objects to the layout
   w2ui.objects['layout'].content("main", view.view_dom);

   var session_id = null;
   var target_id = null;

   event_handler.subscribe('debugger.new-session', function (data) {
      session_id = data - 0;

      // TODO: pregunta: este evento no deberia ser algo como "pid.GDBID.new_target"?
      event_handler.subscribe('debugger.new-target', function (data) {
         var received_session = data.gdbPid - 0;
         if (received_session !== session_id) {
            console.log("ERROR: actual session '"+session_id+"' != the received session '"+received_session+"' in the new-target event!");
         }

         target_id = data.targetPid - 0;
         //TODO mostrar el target id.
      });


      //TODO posiblemente "pid." no es el mejor nombre. Mejor un "gdb." o un
      //mejor aun, un "debugger." (en este caso, el "debugger" de la callback
      //anterior deberia renombrarse a otra cosa).
      //
      //TODO tambien, ademas de pid.GDBID, habria que hacer una separacion mas 
      //profunda como "pid.GDBID.type" o incluso "pid.GDBID.type.klass."
      //Esto es para evitar una explosion de IFs
      event_handler.subscribe("pid."+session_id, function (data) {
         if (data.klass === "stopped" && data.type === "Exec") {
            if (data.results && data.results.reason === "exited-normally") {
               // TODO end
            }

            if (data.results && data.results.frame && data.results.frame.line && data.results.frame.fullname) {
               // load file and line
               view.load_code_from_file(data.results.frame.fullname);
               view.gotoLine(data.results.frame.line - 0);
            }
         }
      });

      // Loggeamos lo que pasa en la "consola" del gdb.
      event_handler.subscribe("pid."+session_id, function (data) {
         if (data.type === "Console") {
            //TODO, como hacer que siempre se muestre lo ultimo? esto es un tema
            //del scroll. (idealmente deberia ser como el scroll del wireshark.
            var old = w2ui.objects['layout'].content("bottom");
            w2ui.objects['layout'].content("bottom", old + data.stream + "<br />");
         }
      });

      // TODO, poner un breakpoint es relativamente facil, pero eliminarlos no.
      // ya que se hace a traves de un "breakpoint id" o bien, un "clear all breakpoints"
      // por linea. De igual manera hay que mantener un registro.
      event_handler.subscribe("pid."+session_id, function (data) {
         if (data.type === "Notify" && data.klass === "breakpoint-created") {
            var bkpt = data.results.bkpt;
            view.highlightLine(bkpt.line-0, 'danger');
         }
      });


      // TODO esto viene de a "pares", una suscripcion que espera un evento sync con
      // un "TOKEN" especial. Cuando lo recibe, hace una accion y luego se desuscribe.
      // Inmediatamente despues de la suscripcion se envia el evento que triggeara
      // dicho evento y por ende dicha callback.
      //
      // Es una especie de "invocacion" pseudo-sincronica.
      var TOKEN = 99;
      var file_list_source_ID = event_handler.subscribe("pid."+session_id, function (data) {
         if (data.type === "Sync" && data.klass === "done") {
            var token = data.token;
            // Sin token, no es para nosotros
            if (token === null || token === undefined) {
               return;
            }

            // No es nuestro token, no es para nosotros
            if (token-0 !== TOKEN) {
               return;
            }
            
            // ok, es para nosostros,
            view.load_code_from_file(data.results.fullname);
            view.gotoLine(0);
            
            // terminamos y no queremos que nos llamen otra vez.
            event_handler.unsubscribe(file_list_source_ID);
         }
      });
      event_handler.publish(session_id + ".direct-command", TOKEN+"-file-list-exec-source-file");

      event_handler.publish(session_id + ".direct-command", "b main");
      setTimeout(function () {
         event_handler.publish(session_id + ".run", "");
      }, 10000);
   });

   event_handler.publish("debugger.load", "cppTestCode/testExe");

   return {};
});
