'''
Created on 20/04/2014

@author: nicolas
'''
import json
import threading
import socket
from multiprocessing import Lock

MSGLEN = 500

class EventHandler(threading.Thread):
    
    def __init__(self):
        threading.Thread.__init__(self)
        self.daemon = True
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.connect(("localhost", 5555))
        self.max_buf_length = 1024 * 1024
        self.log_to_console = True
        self.lock = Lock()
        self.callbacks_by_topic = {}
        
        
    def subscribe(self, topic, callback):
        self.lock.acquire()
        if self.callbacks_by_topic.has_key(topic):
            self.callbacks_by_topic[topic].append(callback)
        else:
            self.callbacks_by_topic[topic] = []
            self.callbacks_by_topic[topic].append(callback)
        self.lock.release()
        msg = json.dumps({'type': 'subscribe', 'topic': topic})
            
        totalsent = 0
        while totalsent < len(msg):
            sent = self.sock.send(msg[totalsent:])
            if sent == 0:
                raise RuntimeError("socket connection broken")
            totalsent = totalsent + sent
    
    def publish(self, topic, data):
        if(not topic):
            raise "The topic must not be empty"

        msg = json.dumps({'type': 'publish', 'topic': topic, 'data': data})
        totalsent = 0
        while totalsent < len(msg):
            sent = self.sock.send(msg[totalsent:])
            if sent == 0:
                raise RuntimeError("socket connection broken")
            totalsent = totalsent + sent
        
    def run(self):
        buf = ''
        
        while(True):
            chunk = self.socket.recv(MSGLEN)
            if(self.log_to_console):
                print("chunk: ")
                print chunk
            events = [];
            incremental_chunks = chunk.split('}')
            index_of_the_last = len(incremental_chunks) - 1
            
            for i in range(len(incremental_chunks)):
                buf += incremental_chunks[i] + ('' if (i == index_of_the_last) else '}')
                if(not buf):
                    continue
                if(len(buf) > self.max_buf_length):
                    raise "Too much data. Buffer's length exceeded ."
                
                event = None;
                try:
                    event = json.loads(buf)
                except:
                    pass
                    # JSON fail, so the 'event object' is not complete yet
                    
                if(not event):
                    continue

                buf = '';
                
                if(not isinstance(event, dict)):
                    raise "Bogus 'event' payload. It isn't an object like {...} ."
                
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
        subtopics = event['topic'].split('.');
        topic_chain = [''];  # the 'empty' topic is added
        for topic in subtopics:
            topic_chain.append(topic)
        if(self.log_to_console):
            print("Topic chain:")
            print(topic_chain)
            
#        we call the callbacks for each topic in the topic chain.
#        the chain is iterated in reverse order (the more specific topic first)
        self.lock.acquire()
        for topic in reversed(topic_chain):
            callbacks = self.callbacks_by_topic[topic];
            if(self.log_to_console):
                print(" on '" + topic + "': ")
                print(callbacks)
            
            for callback in callbacks:
                try:
                    callback(event['data'])
                except:
                    pass  # TODO
        self.lock.release()

    
    

                    
                
        
