define(['jquery', 'notify', 'underscore',], function ($, _notused, _) {
   'use strict';

   var util = require('util');

   var redirected_stream = {
      debug: false,
      info:  false,
      log:   false,
      warn:  false,
      error: false,
   };
   
   var notification_class_by_stream = {
      debug: 'debug',
      info:  'info',
      log:   'debug',
      warn:  'warn',
      error: 'error',
   };

   var init = function (notify_configuration) {
      var style_name = "hydra-info";
      $.notify.addStyle(style_name, {
          html: "<div><div class='ui-widget'><i class='fa fa-fw fa-info-circle'></i><span data-notify-text></span></div></div>",
      });
      
      var style_name = "hydra-warn";
      $.notify.addStyle(style_name, {
          html: "<div><div class='ui-widget'><i class='fa fa-fw fa-warning'></i><span data-notify-text></span></div></div>",
      });
      
      var style_name = "hydra-error";
      $.notify.addStyle(style_name, {
          html: "<div><div class='ui-widget'><i class='fa fa-fw fa-bug'></i><span data-notify-text></span></div></div>",
      });
      
      var style_name = "hydra-success";
      $.notify.addStyle(style_name, {
          html: "<div><div class='ui-widget'><i class='fa fa-fw fa-check-circle'></i><span data-notify-text></span></div></div>",
      });
      
      var style_name = "hydra-debug";
      $.notify.addStyle(style_name, {
          html: "<div><div class='ui-widget'><i class='fa fa-fw fa-bug'></i><span data-notify-text></span></div></div>",
      });

      if (notify_configuration) {
         $.notify.defaults(notify_configuration);
      }

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
         var to_print = arguments[0];
         if (util.isObject(to_print)) {
             to_print = util.inspect(to_print, {depth: 1});
         }
         else {
             to_print = "" + to_print;
         }

         if (!to_print) {
             to_print = "."; // transform an empty string to a non-empty otherwise notifyjs will not print it
         }

         $.notify.apply(undefined, [to_print, {style: "hydra-"+notification_class, className: notification_class}]);
         return old_function.apply(this, arguments);
      }
   };

   return {
      init: init,
      start_redirection: start_redirection,
      stop_redirection:  stop_redirection,
   };
});

