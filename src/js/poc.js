define(['w2ui', 'code_view', 'event_handler', 'ctxmenu', 'jquery','varViewer'], function (w2ui, code_view, event_handler, ctxmenu, $, varViewer) {
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
                     { type: 'button',  id: 'run',  caption: 'run', img: 'icon-save'},
                     { type: 'button',  id: 'continue',  caption: 'continue', img: 'icon-save'},
                     { type: 'button',  id: 'next',  caption: 'next', img: 'icon-save'},
                     { type: 'button',  id: 'step',  caption: 'step', img: 'icon-save'},
                     { type: 'button',  id: 'quit',  caption: 'quit', img: 'icon-save'},
                     { type: 'button',  id: 'quit-all',  caption: 'quit-all', img: 'icon-save'}
               ],
               onClick: function (event) {
                  try {
                     switch(event.target) {
                        case "run":
                           event_handler.publish(session_id + ".run", "");
                           break;

                        case "continue":
                           //TODO importante, "-exec-continue" NO es equivalente a "c" (continue)
                           //esto quiere decir que no existe una equivalencia 1 a 1.
                           //Por ejemplo, "c" hara que ciertos logs (Console) se emitan pero
                           //el evento de stopped tenga un "reason" vacio.
                           //En cambio, "-exec-continue" hara que no haya logs
                           //y que el stopped tenga un reason parecido a uno de los logs.
                           event_handler.publish(session_id + ".direct-command", "-exec-continue");
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
         { type: 'bottom', size: 50, resizable: true, style: pstyle, content: '' },
         { type: 'right', size: 200, resizable: true, style: pstyle, content: '' }
      ]
   });

   // we assign the ui objects to the layout
   w2ui.objects['layout'].content("main", view.view_dom);
   
   var visor = new varViewer.VarViewer();
   visor.setUI(w2ui.objects['layout']);

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
      event_handler.subscribe("gdb."+session_id+".type.Exec.klass.stopped", function (data) {
            if (data.results && data.results.frame && data.results.frame.line && data.results.frame.fullname) {
               // load file
               view.load_file(data.results.frame.fullname);

               // and line
               var line = data.results.frame.line - 0;
               view.setCurrentLine(line);
               view.gotoLine(line);
            }
      });

      event_handler.subscribe("gdb."+session_id+".type.Notify.klass.thread-group-exited", function (data) {
            // TODO end
            view.cleanCurrentLine();
      });

      // Loggeamos lo que pasa en la "consola" del gdb.
      event_handler.subscribe("gdb."+session_id+".type.Console", function (data) {
            //TODO, como hacer que siempre se muestre lo ultimo? esto es un tema
            //del scroll. (idealmente deberia ser como el scroll del wireshark.
            var old = w2ui.objects['layout'].content("bottom");
            w2ui.objects['layout'].content("bottom", old + data.stream + "<br />");
      });

      // TODO, poner un breakpoint es relativamente facil, pero eliminarlos no.
      // ya que se hace a traves de un "breakpoint id" o bien, un "clear all breakpoints"
      // por linea. De igual manera hay que mantener un registro.
      event_handler.subscribe("gdb."+session_id+".type.Notify.klass.breakpoint-created", function (data) {
            //TODO ver los breakpoints de "ace"
            var bkpt = data.results.bkpt;
            view.setBreakpoint(bkpt.line-0);
      });


      // TODO esto viene de a "pares", una suscripcion que espera un evento sync con
      // un "TOKEN" especial. Cuando lo recibe, hace una accion y luego se desuscribe.
      // Inmediatamente despues de la suscripcion se envia el evento que triggeara
      // dicho evento y por ende dicha callback.
      //
      // Es una especie de "invocacion" pseudo-sincronica.
      var TOKEN = 99;
      var file_list_source_ID = event_handler.subscribe("gdb."+session_id+".type.Sync.klass.done", function (data) {
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
            view.load_file(data.results.fullname);
            view.gotoLine(0);
            
            // terminamos y no queremos que nos llamen otra vez.
            event_handler.unsubscribe(file_list_source_ID);
      });
      event_handler.publish(session_id + ".direct-command", TOKEN+"-file-list-exec-source-file");

      // inicializamos el modulo para crear menus contextuales
      // TODO esto solo hay que hacerlo una vez
      ctxmenu.init({
             fadeSpeed: 100,
             filter: function ($obj){},
             above: 'auto',
             preventDoubleContext: true,
             compress: false
      });

      // creamos el menu para los breakpoints
      // TODO por alguna razon, el menu se lanza cuando se hace click en cualquier lugar.
      ctxmenu.attach(view.view_dom, [
            {
               header: 'Menu'
            },
            {
               text: 'breakpoint',
               action: function (e) {
                  e.preventDefault();
                  var line = view.viewer.getCursorPosition().row + 1;
                  event_handler.publish(session_id + ".direct-command", "b " + line);
               }
            }
            ]);

   });

   event_handler.publish("debugger.load", "cppTestCode/testVariables");

   return {};
});
