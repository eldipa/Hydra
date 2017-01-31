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
      ipcsInfoView : 'ipcsInfoView'
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

requirejs(['processView', 'gdb_console_view', 'code_view', 'jquery', 'export_console', 'layout', 'layout_examples', 'jqueryui', 'ctxmenu', 'notify_js_console', 'debuggee_tracker/tracker', 'event_handler', 'debuggee_tracker_view', 'underscore', 'shortcuts', 'thread_follower', "breakpoints_view", "details_view", "global_toolbar", "hidra_log_view", "syscall_trace_view", "ipcsInfoView"], function (processView, gdb_console_view, code_view, $, export_console, layout, layout_examples, jqueryui, ctxmenu, notify_js_console, debuggee_tracker, event_handler, debuggee_tracker_view, _, shortcuts, thread_follower, breakpoints_view, details_view, glob, hidra_log_view_module, syscall_trace_view_module,ipcsInfoView) {
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




   //layout_examples.init_short_examples();
   
   var dbg_tracker = new debuggee_tracker.DebuggeeTracker();
   
   var aGdbConsoleView = new gdb_console_view.GdbConsoleView();
   var aThreadFollower = new thread_follower.ThreadFollower(dbg_tracker, aGdbConsoleView);
   var dbg_tracker_view = new debuggee_tracker_view.DebuggeeTrackerView(dbg_tracker, aThreadFollower);
 
   var bkps_view = new breakpoints_view.BreakpointsView(dbg_tracker);

   var det_view = new details_view.DetailsView();
   var hidra_log = new hidra_log_view_module.HidraLogView(det_view);
   var syscall_trace_view = new syscall_trace_view_module.SyscallTraceView(det_view);
    
   var processGraphView = new processView.ProcessView();
   
   var ipcsInfoView = new ipcsInfoView.IPCSInfoView();

   var root = aThreadFollower.attach($('#main'));
   aThreadFollower.split(dbg_tracker_view, 'right');
   root.render();
   aThreadFollower.parent().set_percentage(75);

   var tabbed = new layout.Tabbed();
   tabbed.add_child(aGdbConsoleView, "intab");
   tabbed.add_child(hidra_log, "intab");
   tabbed.add_child(syscall_trace_view, "intab");
    

   aThreadFollower.split(tabbed, 'bottom');

   dbg_tracker_view.split(bkps_view, 'bottom');
   dbg_tracker_view.parent().split(det_view, 'bottom');
   
   det_view.split(ipcsInfoView, 'bottom');
   
   var floating_root = false;
   EH.subscribe("Layout.showProcessGraph", function() {
	   if (!floating_root){
		   root.add_child(processGraphView, 'overlay');
		   floating_root = true;
	   }else{
		   root.remove_child(processGraphView);
		   floating_root = false
	   }
	   root.render();
   	})

   root.render();
   tabbed.display(0);
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

