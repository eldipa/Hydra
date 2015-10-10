define(['event_handler'], function (event_handler) {
   var randint = function (min, max) {
      var min = min || 0;
      var max = max || 1073741824; //2^30
      return Math.floor(Math.random() * (max - min)) + min;
   };

   var gdb_request = function (callback, gdb_id, command, args) {
      if (command[0] === '-') {
         var interpreter = "mi";
      }
      else {
         var interpreter = "console";
      }

      var args = args || [];

      var token = randint();

      var request_for_command = {
         'command': command,
         'token': token,
         'arguments': args,
         'interpreter': interpreter,
      };

      var request_topic = "request-gdb."+gdb_id+"."+token;
      var response_topic = "result-gdb."+gdb_id+"."+token;

      var eh = event_handler.get_global_event_handler();

      if (callback !== null) {
         eh.subscribe_for_once_call(response_topic, callback);
      }
      eh.publish(request_topic, request_for_command);
   };

   var _update_properties = function (obj) {
      _.each(_.keys(obj), function (k) {
         if (!(_.contains(this._properties, k))) {
            throw Error("Unexpected key '"+k+"' to be read and updated");
         }
         this[k] = obj[k];

      }, this);
   };

   return {
      gdb_request: gdb_request,
      _update_properties: _update_properties
   };
});
