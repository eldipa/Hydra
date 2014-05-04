define(function () {
   function Server() {
      this.callbacks_by_topic = {};
      this.max_buf_length = 1024 * 1024;
      this.log_to_console = true;
   }
   
   Server.prototype.init = function () {
      if(this.socket) {
         this.shutdown();
      }

      this.socket = require('net').Socket();
      this.socket.connect(5555, '');
      this.socket.setEncoding('ascii');

      this.init_dispacher();
   };

   Server.prototype.shutdown = function () {
      if(!this.socket) {
         return;
      }

      this.socket.end();
      this.socket = null;
   };

   Server.prototype.publish = function (topic, data) {
      if(!topic) {
         throw "The topic must not be empty";
      }

      this.socket.write(JSON.stringify({type: 'publish', topic: topic, data: data}));
   };

   Server.prototype.subscribe = function (topic, callback) {
      topic = topic || '';
      var callbacks = this.callbacks_by_topic[topic];
      if(!callbacks) {
         this.callbacks_by_topic[topic] = [callback];
         this.socket.write(JSON.stringify({type: 'subscribe', topic: topic}));
      }
      else {
         this.callbacks_by_topic[topic].push(callback);
      }
   };

   Server.prototype.init_dispacher = function () {
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

   Server.prototype.dispatch = function (event) {
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
            }
         }
      }
   };

   return {Server: Server};

});
