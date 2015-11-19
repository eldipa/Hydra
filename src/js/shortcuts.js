define(['event_handler'], function (event_handler) {
   var randint = function (min, max) {
      var min = min || 0;
      var max = max || 1073741824; //2^30
      return Math.floor(Math.random() * (max - min)) + min;
   };

   /*
    * Request the execution of the command 'command' with 'args' in the debugger gdb_id.
    * If the on_non_error is not null, it must be a function that it will be called with the
    * response of this request only if the class of the response is not "error".
    * If on_error is not null, it will be called in the oposite condition.
    * */
   var gdb_request = function (on_non_error, gdb_id, command, args, on_error) {
      if (command[0] === '-') {
         var interpreter = "mi";
      }
      else {
         var interpreter = "console";
      }

      var on_error = on_error || null;
      var on_non_error = on_non_error || null;

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

      if (on_non_error !== null || on_error !== null) {
         var callback = function (data) {
             if (data.klass === "error" && on_error !== null) {
                 return on_error(data);
             }
             else if (data.klass !== "error" && on_non_error !== null) {
                 return on_non_error(data);
             }
         };
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

   var get_filename_from_fullname = function (fullname) {
        return fullname.substr(fullname.lastIndexOf("/")+1);
   };

   return {
      gdb_request: gdb_request,
      _update_properties: _update_properties,
      get_filename_from_fullname: get_filename_from_fullname,
      randint: randint
   };
});
