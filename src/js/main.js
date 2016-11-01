requirejs.config({
   baseUrl: 'js',
   waitSeconds: 25,

   paths: {
      jquery: 'external/jquery-2.1.0',
      d3: 'external/d3.v3.min',
      knockout: 'external/knockout-3.0.0',
      knockout_es5_plugin: 'external/knockout-es5',
      ko: 'external/ko',
      ace_internals: 'external/ace/ace',
      ace: 'external/ace',
      ctxmenu: 'external/ctxmenu',
      varViewer: 'varViewer',
      jqueryui: 'external/jquery-ui-1.11.1',
      underscore: 'external/underscore-1.7.0',
      notify: 'external/notify',
      standarInput: 'standarInput',
      shortcuts: 'shortcuts',
      jstree: 'external/jstree-3.1.1',
      debuggee_tracker_view: 'debuggee_tracker_view',
      jquery_event_drag: 'external/jquery.event.drag-2.2',
      slickgrid_core: 'external/slick.core',
      slickgrid: 'external/slick.grid',
      processView: 'processView',
      xterm: 'external/xterm/xterm',
   },

   shim: {
      "jqueryui": {
         exports: "$",
         deps: ['jquery']
      },
      "underscore": {
         exports: "_",
      },
      "notify": {
         deps: ['jquery'],
         exports: "$",
      },
      "jstree": {
         deps: ['jquery'],
         exports: "$",
      },
      "knockout": {
         exports: "ko",
      },
      "jquery_event_drag": {
         deps: ['jquery'],
      },
      "slickgrid_core": {
         deps: ['jquery', "jquery_event_drag"],
      },
      "slickgrid": {
         deps: ['jquery', 'slickgrid_core', "jquery_event_drag"],
         exports: 'Slick'
      }
   }

});

requirejs(['event_handler'], function (event_handler) {
   var EH = new event_handler.EventHandler();
   EH.init("(ui)");
   event_handler.set_global_event_handler(EH);
   EH.publish("ui.loading", {'what': "Interface connected"});

   var __modules_loaded_count = 0;
   requirejs.onResourceLoad = function(context, map, depArray) {
      __modules_loaded_count += 1;
      try {
         EH.publish("ui.loading", {'what': "Interface: "+__modules_loaded_count+" modules loaded."});
      } catch (e) {
         console.error("" + e);
      }
   };

},
function (err) {
   alert("Error during the import (" + err.requireType + ").\nFailed modules: " + err.requireModules + "\n");
});

requirejs(['xterm', 'ui', 'code_view', 'jquery', 'export_console', 'layout', 'layout_examples', 'jqueryui', 'ctxmenu', 'notify_js_console', 'debuggee_tracker/tracker', 'event_handler', 'debuggee_tracker_view', 'underscore', 'shortcuts', 'thread_follower', "breakpoints_view", "details_view", "global_toolbar", "log_view"], function (xterm, ui, code_view, $, export_console, layout, layout_examples, jqueryui, ctxmenu, notify_js_console, debuggee_tracker, event_handler, debuggee_tracker_view, _, shortcuts, thread_follower, breakpoints_view, details_view, glob, log_view_module) {
   var EH = event_handler.get_global_event_handler();
   EH.publish("ui.loading", {'what': "Creating the Views..."});
   
   var js_console_server = export_console.init({
       event_handler: event_handler,
       debuggee_tracker: debuggee_tracker,
       shortcuts: shortcuts,
       u: _
   });

   // Load the context menu handler.
   ctxmenu.init({
          fadeSpeed: 100,
          above: 'auto',
          preventDoubleContext: true,
          compress: true
   });

   // Create a dynamic context menu. On click, this will travel the DOM from the clicked
   // element to the root, collecting special attributes from them and building 
   // a dynamic menu from them (see the docs)
   ctxmenu.attachDynamic('body', undefined);
  
   // Copy the messages to the "console" and shows them to the UI
   notify_js_console.init();
   notify_js_console.start_redirection();

   // Global toolbar (for develop mode only)
   var global_toolbar = new glob.GlobalToolbar();
   var root_for_global_bar = global_toolbar.attach($('body'));
   root_for_global_bar.render();


      var Panel = layout.Panel;
      var text_rectangle = new Panel("my xterm");

      text_rectangle.$container = $('<div style="width: 100%; height: 100%; font-family: monaco;"></div>');
      text_rectangle.$out_of_dom = text_rectangle.$container;

      text_rectangle.render = function () {
         if (this.$out_of_dom) {
            this.$out_of_dom.appendTo(this.box);
            this.$out_of_dom = null;
         }

         var term = this.term;
         term.fit();
         setTimeout(function () { term.fit(); }, 100);
      };

      text_rectangle.unlink = function () {
         if (!this.$out_of_dom) {
            this.$out_of_dom = this.$container.detach();
         }
      };

      var term = new xterm.Terminal({cursorBlink: true});
      text_rectangle.term = term;
      term.open(text_rectangle.$container.get(0));
    
    var bidirectional = true;
    var buffered = true;

    term._flushBuffer = function () {
      term.write(term._attachSocketBuffer);
      term._attachSocketBuffer = null;
      clearTimeout(term._attachSocketBufferTimer);
      term._attachSocketBufferTimer = null;
    };

    term._pushToBuffer = function (data) {
      if (term._attachSocketBuffer) {
        term._attachSocketBuffer += data;
      } else {
        term._attachSocketBuffer = data;
        setTimeout(term._flushBuffer, 10);
      }
    };

    term._sendData = function (data) {
        console.log(data[0])
      EH.publish("type-into-gdb-console", data);
    };
    window.term = term;

    EH.subscribe("output-from-gdb-console", function (data) {
      if (buffered) {
        term._pushToBuffer(data);
      } else {
        term.write(data);
      }
    });
    
    EH.subscribe("last-output-from-gdb-console", function (data) {
      term.clear();
      if (buffered) {
        term._pushToBuffer(data);
      } else {
        term.write(data);
      }
    });

    if (bidirectional) {
      term.on('data', term._sendData);
    }

    setTimeout(function () {
        EH.publish("request-last-output-from-gdb-console", "");
    }, 500);

    //socket.addEventListener('close', term.detach.bind(term, socket));
    //socket.addEventListener('error', term.detach.bind(term, socket));


   //layout_examples.init_short_examples();
   var l = ui.init(EH);
   var root = l.root;
   var visor = l.visor;
   var old_code_editor = l.code_editor;

   var dbg_tracker = new debuggee_tracker.DebuggeeTracker();
   
   var aThreadFollower = new thread_follower.ThreadFollower(dbg_tracker);
   var dbg_tracker_view = new debuggee_tracker_view.DebuggeeTrackerView(dbg_tracker, aThreadFollower);
 
   var bkps_view = new breakpoints_view.BreakpointsView(dbg_tracker);

   var det_view = new details_view.DetailsView();

   visor.swap(dbg_tracker_view);
   dbg_tracker_view.split(bkps_view, "bottom");
   dbg_tracker_view.parent().split(det_view, "bottom");

   old_code_editor.swap(aThreadFollower);

   var log = new log_view_module.LogView(det_view);
   l.stdoutlog.swap(log);

   root.render();
                bkps_view.swap(text_rectangle);

   root.render();

   det_view.update_view();

   $(document).on('click', 'body', function (e) {
        var observable_attrname = 'do_observation';
        
        e.preventDefault();

        var $target = $(e.target);
    
        var observation= null;        
        var do_observation = null;
        if($target.length === 1) {
            do_observation = $target.data(observable_attrname);
            if (do_observation) {
                observation = do_observation(e, $target[0]);
            }
        }

        if (!observation) {
            var $parents = $target.parents(); 
            $parents.each(function () {
                if (!observation) {  // TODO cambiar este for-each por un for-each-until
                    do_observation = $(this).data(observable_attrname);
                    if (do_observation) {
                        observation  = do_observation(e, $(this)[0]);
                    }
                }
            });
        }
    
        if (observation) {
                det_view.observe(observation);
            /*setTimeout(function () {
            }, 100); // delay this so we can make sure that do_observation will work
                     // dont forget that we are been calling in a click event. This event
                     // is highly probably been used by the "view" to select the object too
                     // and it is probably that selection that will be returned by do_observation
                     // so we need to call do_observation later so we can make sure that the
                     // view and the do_observation will work correctly
            */
        } 
   });


   //process_view.start();
   //require('nw.gui').Window.get().reload(3);
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
   
   // When the main window get closed, notify this to the backend
   var main_window = require('nw.gui').Window.get();
   main_window.on('close', function() {
      // Hide the window to give user the feeling of closing immediately
      this.hide();

      // Notify
      EH.publish("ui.closed", {});

      // Close the main window (force == true).
      this.close(true);
   });
   
   // Hide and close the splash window and show this one
   main_window.show();
   EH.publish("ui.loaded", {'what': "Done"});
},
function (err) {
   alert("Error during the import (" + err.requireType + ").\nFailed modules: " + err.requireModules + "\n");
});

