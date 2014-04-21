define(function () {
   function Server() {
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

   Server.prototype.suscribe = function (topic, callback) {
      topic = topic || '';
      var callbacks = this.callbacks_by_topic[topic];
      if(!callbacks) {
         this.callbacks_by_topic[topic] = [];
      }
      this.callbacks_by_topic[topic].push(callback);

      this.socket.write(JSON.stringify({type: 'suscribe', topic: topic}));
   };

   Server.prototype.init_dispacher = function () {
      var buf = '';
      this.socket.on('data', function (chunk) {
         var events = [];
         var incremental_chunks = chunk.split('}');
         var index_of_the_last = incremental_chunks.length-1;
         if((!buf && incremental_chunks[0][0] !== '{') || (buf && buf[0] !== '{')) {
            throw "Bogus chunck-buffer state.";
         }

         // We join each sub-chunk in an incremental way.
         // In each step we try to parse the full string to extract
         // the event (an object).
         for(var i = 0; i < incremental_chunks.length; i++) { 
            buf += incremental_chunks[i] + ((i === index_of_the_last)? '': '}');
            if(!buf) {
               continue;
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
            this.dispatch(events[i]);
         }
      });
   };

   Server.prototype.dispatch = function (event) {
      var subtopics = event.topic.split('.');
      if(subtopics[0] !== '') {
         subtopics.unshift(''); //add the 'empty' subtopic
      } // because that, the subtopic list always has one or more elements

      // we build the topic chain:
      // if the event's topic is empty, the chain is ['']
      // if the event's topic was A, the chain is ['', A]
      // if the event's topic was A.B, the chain is ['', A, B]
      // and so on
      var topic_chain = [];
      for(var i = 1; i < subtopics.length; i++) {
         topic_chain.push( subtopics.slice(0, i).join('.') );
      }
   
      // we call the callbacks for each topic in the topic chain.
      // the chain is iterated in reverse order (the more specific topic first)
      for(var j = topic_chain.length-1; j >= 0; j--) {
         var topic = topic_chain[j];
         var callbacks = this.callbacks_by_topic[topic] || [];
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
