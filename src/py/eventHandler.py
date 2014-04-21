'''
Created on 20/04/2014

@author: nicolas
'''
import json
import threading

MSGLEN = 100

class EventHandler(threading.Thread):
    
    # Pre: socket ya conectado
    def __init__(self, socket):
        threading.Thread.__init__(self)
        self.socket = socket
        self.callbacks = {}
        self.max_buf_length = 1024 * 1024
        self.log_to_console = True
        self.callbacks_by_topic = {}
        
        
    def subscribe(self, topic, callback):
        self.callbacks[topic] = callback;
        self.socket.write(json.loads({type: 'subscribe', topic: topic}))
    
    def publish(self, topic, data):
        if(not topic):
            raise "The topic must not be empty"

        self.socket.write(json.loads({type: 'publish', topic: topic, data: data}))
        
    def run(self):
        buf = ''
        
        while(True):
            chunk = self.socket.recv(MSGLEN)
            events = [];
            incremental_chunks = chunk.split('}')
            index_of_the_last = incremental_chunks.length - 1
            
            for i in range(incremental_chunks.length):
                buf += incremental_chunks[i] + ('' if (i == index_of_the_last) else '}')
                if(not buf):
                    continue
                if(buf.length > self.max_buf_length):
                    raise "Too much data. Buffer's length exceeded ."
                
                event = None;
                try:
                    event = json.dumps(buf)
                except:
                    pass
                    # JSON fail, so the 'event object' is not complete yet
                    
                if(not event):
                    continue

                old_buf = buf  # for logging
                buf = '';
                
                if(isinstance(event, 'object')):
                    raise "Bogus 'event' payload. It isn't an object like {...} ."
        

                if(isinstance(event.topic, 'undefined') or isinstance(event.data, 'undefined')):
                    raise "Bogus 'event' payload. It has an incorrect or missing property."
                
                events.append(event)
                
            # finally we dispatch the events, if any
            for event in events:
                self.dispatch(event)
                
    def dispatch(self, event):
        if(self.log_to_console):
            print("Dispatch: ")
            print(event)
            
#        we build the topic chain:
#        if the event's topic is empty, the chain is ['']
#        if the event's topic was A, the chain is ['', A]
#        if the event's topic was A.B, the chain is ['', A, B]
#        and so on
        subtopics = event.topic.split('.');
        topic_chain = ['']; # the 'empty' topic is added
        for i in range(subtopics.length): 
            topic_chain.push( subtopics.slice(0, i+1).join('.') )
        if(self.log_to_console):
            print("Topic chain:")
            print(topic_chain)
            
#        we call the callbacks for each topic in the topic chain.
#        the chain is iterated in reverse order (the more specific topic first)
#         for(var j = topic_chain.length-1; j >= 0; j--) 
        for j in range(topic_chain.length-1, 0,-1):                            
            topic = topic_chain[j];
            callbacks = self.callbacks_by_topic[topic];
            if(self.log_to_console):
                print(" on '" + topic + "': ")
                print(callbacks)
            
            for callback in callbacks:
                try:
                    callback(event.data)
                except:
                    pass# TODO

         

                    
                
        
