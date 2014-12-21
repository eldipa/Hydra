'''
Created on 20/04/2014

@author: nicolas
'''
import json
import threading
import socket
from threading import Lock
import syslog, traceback
from connection import Connection
from topic import build_topic_chain, fail_if_topic_isnt_valid
from esc import esc

class Publisher(object):
    def __init__(self):
        self.connection = Connection(self._get_address())
        
    def publish(self, topic, data):
        fail_if_topic_isnt_valid(topic, allow_empty=False)

        syslog.syslog(syslog.LOG_DEBUG, "Sending publication of an event with topic '%s'." % esc(topic))
        self.connection.send_object({'type': 'publish', 'topic': topic, 'data': data})
        syslog.syslog(syslog.LOG_DEBUG, "Publication of an event sent.")


    def close(self):
       self.connection.close()
    
    def _get_address(self):
        import os, ConfigParser
        script_home = os.path.abspath(os.path.dirname(__file__))
        parent = os.path.pardir

        # TODO This shouldn't be hardcoded!
        config_file = os.path.join(script_home, parent, parent, parent, "config", "publish_subscribe.cfg")

        config = ConfigParser.SafeConfigParser(defaults={
                    'wait_on_address': "localhost",
                    'wait_on_port': "5555",
                     })

        config.read([config_file])
        if not config.has_section("notifier"):
           config.add_section("notifier")


        address = (config.get("notifier", 'wait_on_address'), config.getint("notifier", 'wait_on_port'))

        return address


class EventHandler(threading.Thread, Publisher):
    
    def __init__(self, as_daemon=False):
        threading.Thread.__init__(self)
        if as_daemon:
           self.daemon = True

        Publisher.__init__(self)

        self.lock = Lock()
        self.callbacks_by_topic = {}
      
        self.subscriptions_by_id = {}
        self.next_valid_subscription_id = 0

        self.start()
        
        
    def subscribe(self, topic, callback, return_subscription_id=False):
        fail_if_topic_isnt_valid(topic, allow_empty=True)

        self.lock.acquire()
        try:
           if self.callbacks_by_topic.has_key(topic):
               self.callbacks_by_topic[topic].append((callback, {'id': self.next_valid_subscription_id}))
               syslog.syslog(syslog.LOG_DEBUG, "Registered subscription locally. Subscription to the topic '%s' already sent." % esc(topic))
           else:
               self.connection.send_object({'type': 'subscribe', 'topic': topic})
               syslog.syslog(syslog.LOG_DEBUG, "Subscription sent.")

               self.callbacks_by_topic[topic] = [(callback, {'id': self.next_valid_subscription_id})]
               syslog.syslog(syslog.LOG_DEBUG, "Sending subscription to the topic '%s'." % esc(topic))

           self.subscriptions_by_id[self.next_valid_subscription_id] = {
                 'callback': callback,
                 'topic': topic,
                 }

           self.next_valid_subscription_id += 1
           if return_subscription_id:
              return self.next_valid_subscription_id - 1;
           else:
              return

        finally:
           self.lock.release()

    
    def unsubscribe(self, subscription_id):
        self.lock.acquire()
        try:
           self._unsubscribe(subscription_id)
        finally:
           self.lock.release()

    def wait(self, topic):
        flag = Lock()
        env = {}
        
        def set_data_and_release_flag(data):
            env['data'] = data
            flag.release()

        flag.acquire()
        self.subscribe_for_once_call(topic, set_data_and_release_flag)
        flag.acquire() # this will block us until the set_data_and_release_flag is called

        flag.release() # just for clean up
        return env['data']
        

    def _unsubscribe(self, subscription_id):
        try:
           subscription = self.subscriptions_by_id[subscription_id]
        except KeyError:
           raise Exception("The subscription id '%i' hasn't any callback registered to it." % esc(subscription_id))

        topic = subscription['topic']
        callbackToBeRemoved = subscription['callback']

        for i, callback_and_meta in enumerate(self.callbacks_by_topic[topic]):
           callback, meta = callback_and_meta
           if callback == callbackToBeRemoved and meta['id'] == subscription_id:
              del self.callbacks_by_topic[topic][i]
              break

        if not self.callbacks_by_topic[topic]:
           del self.callbacks_by_topic[topic]
           #TODO send a message to the server, we are not interested in 'topic' any more
        
        del self.subscriptions_by_id[subscription_id]


    def subscribe_for_once_call(self, topic, callback, **kargs):
       subscription = {}
       temp_lock = Lock()

       def wait_until_i_can_unsubscribe_myself():
          temp_lock.acquire()
          temp_lock.release()

       def dont_allow_unsubscription():
          temp_lock.acquire()

       def allow_unsubscription():
          temp_lock.release()
          

       def wrapper(data):
          try:
             return callback(data)
          finally:
             wait_until_i_can_unsubscribe_myself()  
             self._unsubscribe(subscription['id'])


       return_subscription_id = kargs.get('return_subscription_id', False)
       kargs['return_subscription_id'] = True

       dont_allow_unsubscription()
       try:
          subscription['id'] = self.subscribe(topic, wrapper, **kargs)
       finally:
          allow_unsubscription() #TODO very weak implementation: what happen if the callback is registered but an error happen and its subscriptio id is lost? How we can unsubscribe it?

       return subscription['id'] if return_subscription_id else None

    def run(self):
        try:
           while not self.connection.end_of_the_communication:
               events = self.connection.receive_objects()

               for event in events:
                   self.dispatch(event)
                   
        except:
           syslog.syslog(syslog.LOG_ERR, "Exception when receiving a message: %s." % esc(traceback.format_exc()))
        finally:
           self.connection.close()

    def dispatch(self, event):
        topic_chain = build_topic_chain(event['topic'])

        callbacks_collected = []
        self.lock.acquire()
        try:
           syslog.syslog(syslog.LOG_DEBUG, "Executing callback over the topic chain '%s'." % esc(", ".join(topic_chain))) ##TODO
           for t in topic_chain:
               callbacks = self.callbacks_by_topic.get(t, []);
               syslog.syslog(syslog.LOG_DEBUG, "For the topic '%s' there are %i callbacks." % esc(t if t else "(the empty topic)", len(callbacks)))
               callbacks_collected.append(list(callbacks)) # get a copy!
        finally:
           self.lock.release()
         
        for callbacks in callbacks_collected:   
            for callback, subscription in callbacks:
                try:
                    callback(event['data'])
                except:
                    syslog.syslog(syslog.LOG_ERR, "Exception in callback for the topic '%s': %s" % esc(t if t else "(the empty topic)", traceback.format_exc()))


    def close(self):
       self.connection.close()
       self.join()

    

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
            
    
    

                    
                
        
