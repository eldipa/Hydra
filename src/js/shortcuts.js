define(['event_handler', 'promise'], function (event_handler, promise) {
   var randint = function (min, max) {
      var min = min || 0;
      var max = max || 1073741824; //2^30
      return Math.floor(Math.random() * (max - min)) + min;
   };

   /*
    * Request the execution of the command 'command' with 'args' in the debugger gdb_id.
    * */
   var gdb_request = function (gdb_id, command, args) {
      var args = (args || []).slice(0); //copy args
      var promise_of_response = new promise.Promise(function (resolve, reject) {
          if (command[0] === '-') {
             var interpreter = "mi";
          }
          else {
             var interpreter = "console";
          }

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

          var response_handler = function (data) {
             if (data.klass === "error") {
                 return reject(data);
             }
             else if (data.klass !== "error") {
                 return resolve(data);
             }
             else {
                 return reject(data); // unknow message!!!
             }
          };

          eh.subscribe_for_once_call(response_topic, response_handler);
          eh.publish(request_topic, request_for_command);
      });

      return promise_of_response;
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
