'''
Created on 20/04/2014

@author: nicolas
'''
import json
import threading
import socket
from multiprocessing import Lock
import syslog, traceback
from message_ensambler import ensamble_messages

class EventHandler(threading.Thread):
    
    def __init__(self):
        threading.Thread.__init__(self)
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.connect(("localhost", 5555))
        self.max_buf_length = 1024 * 1024
        self.log_to_console = False
        self.lock = Lock()
        self.callbacks_by_topic = {'':[]}

        self.start()
        
        
    def subscribe(self, topic, callback):
        self.lock.acquire()
        if self.callbacks_by_topic.has_key(topic):
            self.callbacks_by_topic[topic].append(callback)
        else:
            self.callbacks_by_topic[topic] = []
            self.callbacks_by_topic[topic].append(callback)
        self.lock.release()

        msg = json.dumps({'type': 'subscribe', 'topic': topic})
        syslog.syslog(syslog.LOG_DEBUG, "Subscribing to the topic '%s'. Sending: '%s'." % (topic, msg))
        self.socket.sendall(msg)
    
    def publish(self, topic, data):
        if(not topic):
            raise "The topic must not be empty"

        msg = json.dumps({'type': 'publish', 'topic': topic, 'data': data})
        syslog.syslog(syslog.LOG_DEBUG, "Publising an event of topic '%s'. Sending: '%s'." % (topic, msg))
        self.socket.sendall(msg)
        
    def _read_chunk(self):
        chunk = self.socket.recv(1024)
        if not chunk:
           syslog.syslog(syslog.LOG_DEBUG, "Endpoint close the connection.")
      
        return chunk


    def run(self):
        try:
           buf = ''
           while True:
               chunk = self._read_chunk()
               end_of_the_communication = not chunk

               if end_of_the_communication:
                  break
               
               messages, buf = ensamble_messages(buf, chunk, 8912)

               events = messages
                   
               # finally we dispatch the events, if any
               for event in events:
                   self.dispatch(event)
                   
        except:
           syslog.syslog(syslog.LOG_ERR, "Exception when receiving a message: %s." % traceback.format_exc())
        finally:
           self.socket.shutdown(socket.SHUT_RDWR)
           self.socket.close()
                
    def dispatch(self, event):
        if(self.log_to_console):
            print("Dispatch: ")
            print(event)
            
        # we build the topic chain:
        # if the event's topic is empty, the chain is ['']
        # if the event's topic was A, the chain is ['', A]
        # if the event's topic was A.B, the chain is ['', A, B]
        # and so on
        topic = event["topic"]
        subtopics = topic.split(".")
        topic_chain = [""] # the empty topic
        for i in range(len(subtopics)):
           topic_chain.append('.'.join(subtopics[:i+1]))

        if(self.log_to_console):
            print("Topic chain:")
            print(topic_chain)
            
        # we call the callbacks for each topic in the topic chain.
        # the chain is reversed (the more specific topic first)
        topic_chain.reverse()
        self.lock.acquire()
        try:
           syslog.syslog(syslog.LOG_DEBUG, "Executing callback over the topic chain '%s'." % (str(topic_chain)))
           for t in topic_chain:
               callbacks = self.callbacks_by_topic.get(t, []);
               syslog.syslog(syslog.LOG_DEBUG, "For the topic '%s' there are %i callbacks." % (t if t else "(the empty topic)", len(callbacks)))
                
               for callback in callbacks:
                   try:
                       callback(event['data'])
                   except:
                       syslog.syslog(syslog.LOG_ERR, "Exception in callback for the topic '%s': %s" % (t if t else "(the empty topic)", traceback.format_exc()))

        finally:
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
            
    
    

                    
                
        
