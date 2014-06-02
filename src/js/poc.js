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
      event_handler.publish(session_id + ".run", "");
   });

   event_handler.subscribe('debugger.new-target', function (data) {
      console.log("Event: " + JSON.stringify(data));
      var received_session = data.gdbPid - 0;
      if (received_session !== session_id) {
         console.log("ERROR: actual session '"+session_id+"' != the received session '"+received_session+"' in the new-target event!");
      }

      target_id = data.targetPid - 0;
      console.log("Target: " + target_id);

      event_handler.subscribe("pid."+session_id, function (data) {
         console.log("Event: " + JSON.stringify(data));
         if (data.klass === "stopped" && data.type === "Exec") {
            if (data.results && data.results.reason === "exited-normally") {
               // TODO end
            }

            if (data.results && data.results.fram && data.results.frame.line && data.results.frame.file) {
               // TODO load file and line
            }
         }
      });

      event_handler.subscribe("pid."+session_id, function (data) {
         if (data.type === "Console") {
            var old = w2ui.objects['layout'].content("bottom");
            w2ui.objects['layout'].content("bottom", old + data.stream);
         }
      });
   });

   event_handler.publish("debugger.load", "cppTestCode/testExe");

   return {};
});
