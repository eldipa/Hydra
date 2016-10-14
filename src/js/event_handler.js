define(['message'], function (message) {
   'use strict';

   var pack_message = message.pack_message;
   var unpack_message_header = message.unpack_message_header;
   var unpack_message_body = message.unpack_message_body;

   // TODO extract the constants an put them in a external file
   // TODO wrap the errors into Error objects
   function EventHandler() {
      this.callbacks_by_topic = {};
      this.max_buf_length = 1024 * 1024;
      this.log_to_console = false;

      this.subscriptions_by_id = {};
      this.next_valid_subscription_id = 0;
   }
   
   EventHandler.prototype.init = function (name) {
      if (!name) {
         var name = "(alice-js)";
      }

      if(this.socket) {
         this.shutdown();
      }

      var net = require('net');
      this.socket = new net.Socket();
      this.socket.setEncoding(null); // binary data (Buffer)
      delete this.socket._readableState.decoder;
      
      var is_connected = false;
      var attempts = 0;
      var that = this;

      this.socket.on('error', function (err) {
         if (is_connected) {
            throw new Error(err);
         }

         if (attempts > 10) {       // 10 * 1000 = 10 seconds
            throw new Error(err);
         }

         setTimeout(function () {
            attempts += 1;
            that.socket.connect(5555, '');
         }, 1000);
      });

      this.socket.on('connect', function () {
         is_connected = true;
         that.socket.write(pack_message('introduce_myself', {name: name}));
         that.init_dispacher();
      });

      this.socket.connect(5555, '');
   };

   EventHandler.prototype.shutdown = function () {
      if(!this.socket) {
         return;
      }

      this.socket.end();
      this.socket = null;
   };

   EventHandler.prototype.close = function () {
      return this.shutdown();
   }

   EventHandler.prototype.publish = function (topic, data) {
      if(!topic) {
         throw "The topic must not be empty";
      }

      this.socket.write(pack_message('publish', {topic: topic, obj: data}));
   };

   EventHandler.prototype.subscribe = function (topic, callback) {
      topic = topic || '';
      var callbacks = this.callbacks_by_topic[topic];
      if(!callbacks) {
         this.callbacks_by_topic[topic] = [callback];
         this.socket.write(pack_message('subscribe', {topic: topic}));
      }
      else {
         this.callbacks_by_topic[topic].push(callback);
      }

      this.subscriptions_by_id[this.next_valid_subscription_id] = {callback: callback, topic: topic};
      this.next_valid_subscription_id++;

      return this.next_valid_subscription_id-1;
   };

   EventHandler.prototype.unsubscribe = function (subscription_id) {
      var subscription = this.subscriptions_by_id[subscription_id];

      if (subscription === undefined) {
         throw new Error("The subscription id '" + subscription_id + "' hasn't any callback registered to it.");
      }

      var callbackTarget = subscription.callback;
      var topic = subscription.topic;

      var callbacks = this.callbacks_by_topic[topic];

      // delete the 'callback' unsubscribed
      callbacks.forEach(function (callback, index) {
         if(callback === callbackTarget) {
            callbacks[index] = null;
         }
      });

      // filter the deleted
      this.callbacks_by_topic[topic] = callbacks.filter(function (callback) {
         return !(callback === null || callback === undefined);
      });

      // remove the topic if there isn't any callback
      if (this.callbacks_by_topic[topic].length === 0) {
         delete this.callbacks_by_topic[topic];
         this.socket.write(pack_message('unsubscribe', {topic: topic}));
      }

      // remove the subscription
      delete this.subscriptions_by_id[subscription_id];
   };

   EventHandler.prototype.subscribe_for_once_call = function (topic, callback) {
      var subscription_id = null;
      var that = this;
      var wrapper = function () {
         var args = Array.prototype.slice.call(arguments);
         try {
            return callback.apply(null, args);
         } 
         catch (err) {
            throw err;
         }
         finally {
            that.unsubscribe(subscription_id);
         }
      };

      subscription_id = this.subscribe(topic, wrapper);
      return subscription_id;
   };


   EventHandler.prototype.init_dispacher = function () {
      var previous_chunk = new Buffer("");
      var is_waiting_the_header = true;

      var message_type = null;
      var message_body_len = null;

      var self = this;
      var process_chunk = function (chunk, is_dummy_chunk) {
         if (is_dummy_chunk !== true) {
             previous_chunk = Buffer.concat([previous_chunk, chunk]);
         }

         if (is_waiting_the_header) {
            if (previous_chunk.length >= 3) {
                var header = previous_chunk.slice(0, 3);
                previous_chunk = previous_chunk.slice(3);

                var r = unpack_message_header(header);
                message_type = r.message_type;
                message_body_len = r.message_body_len;

                is_waiting_the_header = false;
                return true;
            }
            else {
                return false;
            }
         } 
         else { // parsing the body, only if we have enough bytes
            if (previous_chunk.length >= message_body_len) {
                var message_body = previous_chunk.slice(0, message_body_len);
                previous_chunk = previous_chunk.slice(message_body_len);

                if (message_type !== 'publish') {
                    console.warn("Unexpected message of type '"+message_type+"' (expecting a 'publish' message). Dropping the message and moving on.");
                    // continue, move on
                }
                else {
                    var r = unpack_message_body(message_type, message_body);
                    var topic = r.topic;
                    var obj = r.obj;
                    
                    is_waiting_the_header = true;
                    self.dispatch(topic, obj);
                }
                
                message_type = null;
                message_body_len = null;
                return true;
            }
            else {
                return false;
            }
         }

         throw new Error(); 
      };

      this.socket.on('data', function (chunk) {
        var success = process_chunk(chunk);
        while (success) {
            success = process_chunk("", true);
        }
      });
   };

   EventHandler.prototype.dispatch = function (topic, data) {
      if(this.log_to_console) {
         console.debug("Dispatch: ");
         console.debug({topic: topic, data:data});
      }

      // we build the topic chain:
      // if the event's topic is empty, the chain is ['']
      // if the event's topic was A, the chain is ['', A]
      // if the event's topic was A.B, the chain is ['', A, B]
      // and so on
      var subtopics = topic.split('.');
      var topic_chain = ['']; // the 'empty' topic is added
      for(var i = 0; i < subtopics.length; i++) {
         topic_chain.push( subtopics.slice(0, i+1).join('.') );
      }
      if(this.log_to_console) {
         console.debug("Topic chain:");
         console.debug(topic_chain);
      }
   
      // we call the callbacks for each topic in the topic chain.
      // the chain is iterated in reverse order (the more specific topic first)
      for(var j = topic_chain.length-1; j >= 0; j--) {
         var subtopic = topic_chain[j];
         var callbacks = this.callbacks_by_topic[subtopic] || [];
         if(this.log_to_console) {
            console.debug(" on '" + subtopic + "': ");
            console.debug(callbacks);
         }
         for(var i = 0; i < callbacks.length; i++) {
            try {
               callbacks[i](data, topic); // forward the full topic string, not the partial one
            }
            catch (e) {
               console.warn("Error in callback (subtopic: "+subtopic+"): " + e + "\n" + e.stack);
            }
         }
      }
   };
   
   EventHandler.prototype.toString = function(){
	   return "EventHandler Instance";
   }

   var GLOBAL_EVENT_HANDLER = null;

   var set_global_event_handler = function (EH) {
      GLOBAL_EVENT_HANDLER = EH;
   };

   var get_global_event_handler = function () {
      return GLOBAL_EVENT_HANDLER;
   };
   return {EventHandler: EventHandler, 
           set_global_event_handler: set_global_event_handler,
           get_global_event_handler: get_global_event_handler};

});
