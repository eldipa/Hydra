define(function () {
   'use strict';

   // TODO extract the constants an put them in a external file
   // TODO wrap the errors into Error objects
   function EventHandler() {
      this.callbacks_by_topic = {};
      this.max_buf_length = 1024 * 1024;
      this.log_to_console = false;

      this.subscriptions_by_id = {};
      this.next_valid_subscription_id = 0;
   }
   
   EventHandler.prototype.init = function () {
      if(this.socket) {
         this.shutdown();
      }

      this.socket = require('net').Socket();
      
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
         that.init_dispacher();
      });

      this.socket.setEncoding('ascii');
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

      this.socket.write(JSON.stringify({type: 'publish', topic: topic, data: data}));
   };

   EventHandler.prototype.subscribe = function (topic, callback) {
      topic = topic || '';
      var callbacks = this.callbacks_by_topic[topic];
      if(!callbacks) {
         this.callbacks_by_topic[topic] = [callback];
         this.socket.write(JSON.stringify({type: 'subscribe', topic: topic}));
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
         // TODO: send a message to the notifier server.
      }

      // remove the subscription
      delete this.subscriptions_by_id[subscription_id];
   };


   EventHandler.prototype.init_dispacher = function () {
      var buf = '';
      var self = this;
      this.socket.on('data', function (chunk) {
         var events = [];
         var incremental_chunks = chunk.split('}');
         var index_of_the_last = incremental_chunks.length-1;

         // We join each sub-chunk in an incremental way.
         // In each step we try to parse the full string to extract
         // the event (an object).
         for(var i = 0; i < incremental_chunks.length; i++) {
            buf += incremental_chunks[i] + ((i === index_of_the_last)? '': '}');
            if(!buf) {
               continue;
            }

            if(buf.length > this.max_buf_length) {
               throw "Too much data. Buffer's length exceeded .";
            }

            var event = null;
            try {
               event = JSON.parse(buf);
            }
            catch(e) {
               //JSON fail, so the 'event object' is not complete yet
            }

            if(!event) {
               continue;
            } 

            var old_buf = buf; //for logging
            buf = '';

            if(typeof event !== 'object') {
               throw "Bogus 'event' payload. It isn't an object like {...} .";
            }

            if(typeof event.topic === 'undefined' || typeof event.data === 'undefined') {
               throw "Bogus 'event' payload. It has an incorrect or missing property.";
            }

            events.push(event);
         }

         //finally we dispatch the events, if any
         for(var i = 0; i < events.length; i++) {
            self.dispatch(events[i]);
         }
      });
   };

   EventHandler.prototype.dispatch = function (event) {
      if(this.log_to_console) {
         console.log("Dispatch: ");
         console.log(event);
      }

      // we build the topic chain:
      // if the event's topic is empty, the chain is ['']
      // if the event's topic was A, the chain is ['', A]
      // if the event's topic was A.B, the chain is ['', A, B]
      // and so on
      var subtopics = event.topic.split('.');
      var topic_chain = ['']; // the 'empty' topic is added
      for(var i = 0; i < subtopics.length; i++) {
         topic_chain.push( subtopics.slice(0, i+1).join('.') );
      }
      if(this.log_to_console) {
         console.log("Topic chain:");
         console.log(topic_chain);
      }
   
      // we call the callbacks for each topic in the topic chain.
      // the chain is iterated in reverse order (the more specific topic first)
      for(var j = topic_chain.length-1; j >= 0; j--) {
         var topic = topic_chain[j];
         var callbacks = this.callbacks_by_topic[topic] || [];
         if(this.log_to_console) {
            console.log(" on '" + topic + "': ");
            console.log(callbacks);
         }
         for(var i = 0; i < callbacks.length; i++) {
            try {
               callbacks[i](event.data);
            }
            catch (e) {
               // TODO
               console.log("Error in callback (topic: "+topic+"): " + e);
            }
         }
      }
   };

   return {EventHandler: EventHandler};

});
