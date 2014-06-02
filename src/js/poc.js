define(['w2ui', 'code_view', 'event_handler', 'jquery'], function (w2ui, code_view, event_handler, $) {
   // init the event handler system, connecting this with the notifier.
   // now, we can send and receive events.
   var event_handler = new event_handler.EventHandler();
   event_handler.init();

   // we create the principal objects for the ui.
   // first, the code view so we can render source code
   var view = new code_view.CodeView();

   // we create the layout
   var pstyle = 'border: 1px solid #dfdfdf; padding: 5px;';
   $('#layout').w2layout({
      name: 'layout',
      panels: [
         { type: 'main', style: pstyle, content: "main" },
         { type: 'top', size: 20, style: pstyle, content: "top" },
         { type: 'bottom', size: 50, resizable: true, style: pstyle, content: '' }
      ]
   });

   // we assign the ui objects to the layout
   w2ui.objects['layout'].content("main", view.view_dom);

   var session_id = null;
   var target_id = null;

   event_handler.subscribe('debugger.new-session', function (data) {
      session_id = data - 0;

      event_handler.subscribe('debugger.new-target', function (data) {
         console.log("Event: " + JSON.stringify(data));
         var received_session = data.gdbPid - 0;
         if (received_session !== session_id) {
            console.log("ERROR: actual session '"+session_id+"' != the received session '"+received_session+"' in the new-target event!");
         }

         target_id = data.targetPid - 0;
         console.log("Target: " + target_id);

         //event_handler.publish(session_id+".direct-command", "");
      });


      event_handler.subscribe("pid."+session_id, function (data) {
         if (data.klass === "stopped" && data.type === "Exec") {
            if (data.results && data.results.reason === "exited-normally") {
               // TODO end
            }

            if (data.results && data.results.frame && data.results.frame.line && data.results.frame.fullname) {
               console.log("Event: " + JSON.stringify(data));
               console.log("Fullname: " + data.results.frame.fullname);
               // load file and line
               view.load_code_from_file(data.results.frame.fullname);
               view.gotoLine(data.results.frame.line - 0);
            }
         }
      });

      event_handler.subscribe("pid."+session_id, function (data) {
         if (data.type === "Console") {
            var old = w2ui.objects['layout'].content("bottom");
            w2ui.objects['layout'].content("bottom", old + data.stream + "<br />");
         }
      });

      event_handler.publish(session_id + ".direct-command", "start");
      //event_handler.publish(session_id + ".direct-command", "b main");
      //event_handler.publish(session_id + ".run", "");

      setTimeout(function () {
         event_handler.publish(session_id + ".direct-command", "c");
      }, 30000);
   });

   event_handler.publish("debugger.load", "cppTestCode/testExe");

   return {};
});
