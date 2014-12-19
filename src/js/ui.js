define(['jquery', 'layout', 'code_view', 'event_handler', 'varViewer', 'widgets/buttons', 'listview_panel'], function ($, layout, code_view, EH, varViewer, buttons, listview_panel) {
   var Panel = layout.Panel;
   var Tabbed = layout.Tabbed;
   var ListViewPanel = listview_panel.ListViewPanel;

   var init = function init(dom_element) {
      // Create the UI layout:
      //                |
      //   CodeViewer   | 
      //                | VarViewer
      // ---------------+
      //   GDB Console  |
      // ---------------+
      //  Target Output |
      // ---------------+
      //   Syscall log  |
      //
      
      // we create the principal objects for the ui.
      // first, the code view so we can render source code
      var view = new code_view.CodeView();

      
      // Panel to render the log
      var log = new ListViewPanel();
      log.autoscroll(true);
      log.feed = function (line) {
         var $newContent = $('<p>'+line+'</p>');
         this.push({dom_element: $newContent});
      };

      // Panel to render the stdout
      var stdoutlog = new ListViewPanel();
      stdoutlog.autoscroll(true);
      stdoutlog.feed = function (data) {
         var line = "["+data.timestamp+"]@["+data.pid+"]: "+data.output+"";
         var $newContent = $('<p>'+line+'</p>');
         this.push({dom_element: $newContent});
      };

      // Panel to render the syscall log
      var syscalllog = new ListViewPanel();
      syscalllog.autoscroll(true);
      syscalllog.feed = function (data) {
         if (data.result === undefined) { // syscall enter
            var line = "["+data.timestamp+"]@["+data.pid+"]: "+data.name+"("+data.arguments.join(", ")+") : "+data.restype+"";
            var $newContent = $('<p>'+line+'</p>');
         }
         else {                           // syscall exit
            var line = "["+data.timestamp+"]@["+data.pid+"]: result = " + data.result_text + "";
            var $newContent = $('<p>'+line+'</p>');
         }
         
         this.push({dom_element: $newContent});
      }


      // then, the VarViewer
      var visor = new varViewer.VarViewer();


      // Now we attach and build the final layout
      var root = view.attach($('body'));
      view.split(log, "bottom");    // TODO (issue #61) poner esto en tabs y ademas hacer un metodo en layout.Panel que sea on_own_tab() para tomar un panel y reemplarlo por un Tabbed con un unico tab (el).

      root.render();
      view.parent().set_percentage(80); //TODO (issue #62) por que hay que hacer un render() antes de un set_percentage()?

      view.parent().split(visor, "right");
      root.render();

      view.parent().split(stdoutlog, "bottom");
      root.render();

      stdoutlog.split(syscalllog, "bottom")
      root.render();
           

      // init the event handler system, connecting this with the notifier.
      // now, we can send and receive events.
      var event_handler = new EH.EventHandler();
      event_handler.init();


      var session_id = null;
      var target_id = null;

      // TODO (issue #70), ok, pero esto deberia ser wrappeado a un objeto mas coherente
      // Session tal vez? ... hay que meditarlo.
      event_handler.subscribe('debugger.new-session', function (data) {
         session_id = data - 0;

         event_handler.subscribe('debugger.new-target', function (data) {
            var received_session = data.gdbPid - 0;
            if (received_session !== session_id) {
               //TODO (issue #63) hacer un sistema de loggeo por UI y no por consola (tooltips o algo asi)
               console.log("ERROR: actual session '"+session_id+"' != the received session '"+received_session+"' in the new-target event!");
            }

            target_id = data.targetPid - 0;
            //TODO (issue #70) mostrar el target id.
         });


         event_handler.subscribe("gdb."+session_id+".type.Exec.klass.stopped", function (data) {
               if (data.results && data.results.frame && data.results.frame.line && data.results.frame.fullname) {
                  // load file
                  view.load_file(data.results.frame.fullname);

                  // and line
                  var line = data.results.frame.line - 0;
                  //TODO (issue #64) hacer que la linea actual sea mas llamativa
                  view.setCurrentLine(line);
                  view.gotoLine(line);
               }
         });

         event_handler.subscribe("gdb."+session_id+".type.Notify.klass.thread-group-exited", function (data) {
               // TODO (issue #70) end
               view.cleanCurrentLine();
         });

         // Loggeamos lo que pasa en la "consola" del gdb.
         event_handler.subscribe("gdb."+session_id+".type.Console", function (data) {
               log.feed(data.stream);
               log.render();
         });
         
         // Loggeamos lo que se capturo del stdout del target
         event_handler.subscribe("outputlog", function (data) {
               stdoutlog.feed(data);
               stdoutlog.render();
         });

         // Loggeamos las syscalls (cuando se entra y se sale de una de ellas)
         event_handler.subscribe("syscall", function (data) {
               syscalllog.feed(data);
               syscalllog.render();
         });

         // TODO (issue #36), poner un breakpoint es relativamente facil, pero eliminarlos no.
         // ya que se hace a traves de un "breakpoint id" o bien, un "clear all breakpoints"
         // por linea. De igual manera hay que mantener un registro.
         event_handler.subscribe("gdb."+session_id+".type.Notify.klass.breakpoint-created", function (data) {
               //TODO (issue #65) ver los breakpoints de "ace"
               //TODO (issue #64) hacer que las lineas de breakpoint sean mas llamativas
               //TODO (issue #65) click derecho en el numero de linea (gluter) muestra el menu contextual pero NO cambia la linea actual (current), haciendo que el breakpoint se ponga en otro lado.
               var bkpt = data.results.bkpt;
               view.setBreakpoint(bkpt.line-0);
         });


         // TODO (issue #66) esto viene de a "pares", una suscripcion que espera un evento sync con
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
      });


      view.attach_menu([
                  {
                     header: 'On this line'
                  },
                  {
                     text: 'breakpoint',
                     action: function (e) {
                        e.preventDefault();
                        var line = view.viewer.getCursorPosition().row + 1;
                        event_handler.publish(session_id + ".direct-command", "b " + line);
                     }
                  },
      ]);

      // TODO (issue #67) cuando se hace un click en un boton, este queda seleccionado
      // y no es desmarcado hasta que se hace click en otro lado!
      var main_button_bar = new buttons.Buttons([
            {
               label: "Run",
               text: false,
               icons: {primary: 'ui-icon-power'},
               action: function (ev) {
                  ev.preventDefault();
                  event_handler.publish(session_id + ".run", "");
               },
            },
            {
               label: "Continue",
               text: false,
               icons: {primary: 'ui-icon-play'},
               action: function (ev) {
                  ev.preventDefault();
                  //TODO (issue #31) aimportante, "-exec-continue" NO es equivalente a "c" (continue)
                  //esto quiere decir que no existe una equivalencia 1 a 1.
                  //Por ejemplo, "c" hara que ciertos logs (Console) se emitan pero
                  //el evento de stopped tenga un "reason" vacio.
                  //En cambio, "-exec-continue" hara que no haya logs
                  //y que el stopped tenga un reason parecido a uno de los logs.
                  event_handler.publish(session_id + ".direct-command", "-exec-continue");
               },
            }, 
            {
               label: "Next",
               text: false,
               icons: {primary: 'ui-icon-arrowthick-1-e'},
               action: function (ev) {
                  ev.preventDefault();
                  event_handler.publish(session_id + ".direct-command", "n");
               },
            }, 
            {
               label: "Step",
               text: false,
               icons: {primary: 'ui-icon-arrowreturnthick-1-s'},
               action: function (ev) {
                  ev.preventDefault();
                  event_handler.publish(session_id + ".direct-command", "s");
               },
            }, 
            {
               label: "Quit",
               text: false,
               icons: {primary: 'ui-icon-circle-minus'},
               action: function (ev) {
                  ev.preventDefault();
                  event_handler.publish("debugger.exit", session_id);
               },
            }, 
            {
               label: "Quit-All",
               text: false,
               icons: {primary: 'ui-icon-circle-close'},
               action: function (ev) {
                  ev.preventDefault();
                  event_handler.publish("debugger.exit", "all");
               },
            }], true);

      // TODO (issue #68) hacer un "Splitted" con size fijo: la barra de botones no deberia ser resizable
      // TODO (issue #69) hacer que las lineas de separacion del split sean mas finas y que se engrosen
      // mientras este el mouse encima de ellas.
      
      var S1 = new layout.Stacked("vertically");
      view.swap(S1);
      S1.add_child(main_button_bar, {position: "top", grow: 0, shrink: 0});
      S1.add_child(view, {position: "bottom", grow: 1, shrink: 1});

      root.render();

      event_handler.publish("debugger.load", "cppTestCode/outputTest");

   };

   return {
      init: init
   };
});

