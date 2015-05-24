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
import random

class Publisher(object):
    def __init__(self, name="(publisher-only)"):
        self.connection = Connection(self._get_address())
        self.connection.send_object({'type': 'introduce_myself', 'name': name})
        self.name = name
        
    def publish(self, topic, data):
        fail_if_topic_isnt_valid(topic, allow_empty=False)

        self._log(syslog.LOG_DEBUG, "Sending publication of an event with topic '%s'.", topic)
        self.connection.send_object({'type': 'publish', 'topic': topic, 'data': data})
        self._log(syslog.LOG_DEBUG, "Publication of an event sent.")


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

    def __repr__(self):
        return "Endpoint (%s)" % self.name

    def _log(self, level, message, *arguments):
        message = "%s: " + message
        syslog.syslog(level, message % esc(repr(self), *arguments))


class EventHandler(threading.Thread, Publisher):
    
    def __init__(self, as_daemon=False, name="(bob-py)"):
        threading.Thread.__init__(self)
        if as_daemon:
           self.daemon = True

        Publisher.__init__(self, name=name)

        self.lock = Lock()
        self.callbacks_by_topic = {}
      
        self.subscriptions_by_id = {}
        self.next_valid_subscription_id = 0

        self.start()
        
    def __repr__(self):
        return "Endpoint (%s)" % self.name
        
    def subscribe(self, topic, callback, return_subscription_id=False, send_and_wait_echo=False):
        fail_if_topic_isnt_valid(topic, allow_empty=True)

        result = None
        self.lock.acquire()
        try:
           if self.callbacks_by_topic.has_key(topic):
               self.callbacks_by_topic[topic].append((callback, {'id': self.next_valid_subscription_id}))
               self._log(syslog.LOG_DEBUG, "Registered subscription locally. Subscription to the topic '%s' already sent.", topic)
           else:
               self._log(syslog.LOG_DEBUG, "Sending subscription to the topic '%s'.", topic)
               self.connection.send_object({'type': 'subscribe', 'topic': topic})
               self._log(syslog.LOG_DEBUG, "Subscription sent.")

               self.callbacks_by_topic[topic] = [(callback, {'id': self.next_valid_subscription_id})]

           self.subscriptions_by_id[self.next_valid_subscription_id] = {
                 'callback': callback,
                 'topic': topic,
                 }

           self.next_valid_subscription_id += 1
           if return_subscription_id:
              result = self.next_valid_subscription_id - 1;

        finally:
           self.lock.release()

        if send_and_wait_echo:
           cookie = "echo-%i" % int(random.getrandbits(30))
         
           echo_received_flag = Lock()
           echo_received_flag.acquire()

           self.subscribe_for_once_call(cookie, lambda data: echo_received_flag.release(), send_and_wait_echo=False)
           self.publish(cookie, '')

           echo_received_flag.acquire()

        return result

   
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
           self.connection.send_object({'type': 'unsubscribe', 'topic': topic})
        
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
           self._log(syslog.LOG_ERR, "Exception when receiving a message: %s.", traceback.format_exc())
        finally:
           self.connection.close()

    def dispatch(self, event):
        topic_chain = build_topic_chain(event['topic'])

        callbacks_collected = []
        self.lock.acquire()
        try:
           self._log(syslog.LOG_DEBUG, "Executing callback over the topic chain '%s'.", ", ".join(topic_chain)) ##TODO
           for t in topic_chain:
               callbacks = self.callbacks_by_topic.get(t, []);
               self._log(syslog.LOG_DEBUG, "For the topic '%s' there are %s callbacks.", (t if t else "(the empty topic)"), str(len(callbacks)))
               callbacks_collected.append(list(callbacks)) # get a copy!
        finally:
           self.lock.release()
         
        for callbacks in callbacks_collected:   
            for callback, subscription in callbacks:
                try:
                    callback(event['data'])
                except:
                    self._log(syslog.LOG_ERR, "Exception in callback for the topic '%s': %s", (t if t else "(the empty topic)"), traceback.format_exc())


    def close(self):
       self.connection.close()
       self.join()

