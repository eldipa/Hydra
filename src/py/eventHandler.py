'''
Created on 20/04/2014

@author: nicolas
'''
import json
import threading
import socket
from multiprocessing import Lock

class EventHandler(threading.Thread):
    
    def __init__(self):
        threading.Thread.__init__(self)
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.connect(("localhost", 5555))
        self.fsocket = self.socket.makefile()
        self.max_buf_length = 1024 * 1024
        self.log_to_console = True
        self.lock = Lock()
        self.callbacks_by_topic = {'':[]}
        
        
    def subscribe(self, topic, callback):
        self.lock.acquire()
        if self.callbacks_by_topic.has_key(topic):
            self.callbacks_by_topic[topic].append(callback)
        else:
            self.callbacks_by_topic[topic] = []
            self.callbacks_by_topic[topic].append(callback)
        self.lock.release()
        msg = json.dumps({'type': 'subscribe', 'topic': topic})
        self.fsocket.write(msg)
        self.fsocket.flush()
        if(self.log_to_console):
            print 'Mensaje enviado ' + msg
    
    def publish(self, topic, data):
        if(not topic):
            raise "The topic must not be empty"

        msg = json.dumps({'type': 'publish', 'topic': topic, 'data': data})
        self.fsocket.write(msg)
        self.fsocket.flush()
        if(self.log_to_console):
            print 'Mensaje enviado ' + msg
        
    def run(self):
        buf = ''
        salir = False
        while(not salir):
            chunk = self.fsocket.read()
            if(self.log_to_console):
                print("chunk: " + chunk)
            if chunk == '':
                salir = True
                continue
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
                
#         self.socket.shutdown(socket.SHUT_RDWR)
        self.socket.close()
                
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
            if self.callbacks_by_topic.has_key(topic):
                callbacks = self.callbacks_by_topic[topic];
                if(self.log_to_console):
                    print(" on '" + topic + "': ")
                    print(callbacks)
                
                for callback in callbacks:
                    try:
                        callback(event['data'])
                    except:
                        pass  # TODO
            else:
                if(self.log_to_console):
                    print("Unknown topic '" + topic + "' discarted")

        self.lock.release()

    
    
if __name__ == "__main__":
    
    def funcionCallback(data):
        print 'Sucess: ' + data
        
    def otherCallback(data):
        print "Other Sucess " + data
        
    def defaultCallback(data):
        print "Esto pasa siempre " + data
        
    def myreceive(sock):
        msg = ''
        char = ''
        cont = 0
        salir = False
        while not salir:
            char = sock.read(1) 
            msg += char
            if char == '{':
                cont += 1
            if char == '}':
                cont -= 1
                if cont == 0:
                    salir = True
        return msg
     
    def mysend(sock, msg):
        sock.write(msg)
        sock.flush()
        
    serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    serversocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        serversocket.bind(("localhost", 5555))
        serversocket.listen(1)
        
        handler = EventHandler()

        (clientsocket, address) = serversocket.accept()
        
        sfile = clientsocket.makefile()
        
        handler.start()
        
        handler.publish("prueba", "1234567")
        print "publicado"
        recvData = myreceive(sfile)
        print 'recvData: ' + recvData

        handler.subscribe("prueba", funcionCallback)
        recvData = myreceive(sfile)
        print 'recvData: ' + recvData
        
        handler.subscribe("prueba", otherCallback)
        recvData = myreceive(sfile)
        print 'recvData: ' + recvData
        
        handler.subscribe('', defaultCallback)
        recvData = myreceive(sfile)
        print 'recvData: ' + recvData
        
        msg = '{"topic": "prueba", "data": "1234567", "type": "publish"}'
        mysend(sfile, msg)
        
        msg = '{"topic": "otro", "data": "42", "type": "publish"}'
        mysend(sfile, msg)
     
    finally:
        serversocket.close()
        if clientsocket:
            clientsocket.shutdown(2)
            clientsocket.close()
            
    
    

                    
                
        
