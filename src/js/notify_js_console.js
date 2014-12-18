define(['jquery', 'notify', 'underscore',], function ($, _notused, _) {
   'use strict';

   var redirected_stream = {
      log:   false,
      error: false,
      info:  false,
      debug: false,
   };
   
   var notification_class_by_stream = {
      info:  'info',
      error: 'error',
      debug: 'info',
      log:   'info',
   };

   var start_redirection = function () {
      for (var stream_name in redirected_stream) {
         if (redirected_stream[stream_name] === false) {
            var old = console[stream_name];
            redirected_stream[stream_name] = old;
            console[stream_name] = create_redirect_function(notification_class_by_stream[stream_name], old);
         }
      }
   };

   var stop_redirection = function () {
      for (var stream_name in redirected_stream) {
         if (redirected_stream[stream_name] !== false) {
            var old = redirected_stream[stream_name];
            console[stream_name] = old;
            redirected_stream[stream_name] = false;
         }
      }
   };

   var create_redirect_function = function (notification_class, old_function) {
      return function () {
         $.notify.apply(undefined, [arguments[0], notification_class]);
         return old_function.apply(this, arguments);
      }
   };

   return {
      start_redirection: start_redirection,
      stop_redirection:  stop_redirection,
   };
});

