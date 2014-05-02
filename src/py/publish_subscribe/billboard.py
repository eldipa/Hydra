import socket, threading, json
import daemon, syslog, traceback
from connection import Connection

#TODO add keep alive
class _Endpoint(threading.Thread):
   def __init__(self, socket, billboard):
      threading.Thread.__init__(self)
      self.connection = Connection(socket)
      self.is_finished = False
      self.billboard = billboard

      self.start()


   def _is_valid_message(self, message):
      if not isinstance(message, dict):
         syslog.syslog(syslog.LOG_ERR, "Invalid message. It isn't an object like {...} : '%s'." % json.dumps(message))
         return False

      if not "topic" in message or not "type" in message:
         syslog.syslog(syslog.LOG_ERR, "Invalid message. It hasn't any topic or type: '%s'." % json.dumps(message))
         return False

      if not message["type"] in ("subscribe", "publish"):
         syslog.syslog(syslog.LOG_ERR, "Invalid message. Unknown type: '%s'." % json.dumps(message))
         return False

      if message["type"] == "publish" and "data" not in message:
         syslog.syslog(syslog.LOG_ERR, "Invalid message. Publish message hasn't any data: '%s'." % json.dumps(message))
         return False

      return True


   def _process_messages(self, messages):
      for message in messages:
         is_valid = self._is_valid_message(message)
         if not is_valid:
            syslog.syslog(syslog.LOG_ERR, "Invalid message: '%s'." % json.dumps(message))
            raise Exception("Invalid message.")

         if message["type"] == "publish":
            self.billboard.distribute_event(message["topic"], message["data"])
         
         else:
            assert message["type"] == "subscribe"
            self.billboard.register_subscriber(message["topic"], self)

   def run(self):
      try:
         while not self.connection.end_of_the_communication:
            messages = self.connection.receive_objects()
            syslog.syslog(syslog.LOG_DEBUG, "Received %i messages" % len(messages))

            self._process_messages(messages)

         syslog.syslog(syslog.LOG_NOTICE, "The connection was closed by the other point of the connection.")
      except:
         syslog.syslog(syslog.LOG_ERR, "An exception has occurred when receiving/processing the messages: %s." % traceback.format_exc())
      finally:
         self.is_finished = True


   def send_event(self, topic, event):
      try:
         self.connection.send_object({"topic": topic, "data": event})
      except:
         syslog.syslog(syslog.LOG_ERR, "Endpoint exception when sending a message to it: %s." % traceback.format_exc())
         self.is_finished = True

   def close(self):
      syslog.syslog(syslog.LOG_NOTICE, "Closing the connection with the endpoint.")
      self.is_finished = True
      self.connection.close()
      syslog.syslog(syslog.LOG_NOTICE, "Connection closed.")

# TODO endpoints_by_topic (and endpoint_subscription_lock) as a single object

class Billboard(daemon.Daemon):
   def __init__(self, address):
      import os
      script_home = os.path.abspath(os.path.dirname(__file__))
      pidfile = os.path.join(script_home, "publish_subscribe.pid")
      daemon.Daemon.__init__(self,
            pidfile=pidfile, 
            name="publish_subscribe_billboard",
            keep_open_fileno=[0, 1, 2],
            foreground = False)

      self.address = address
      self.endpoints = []
      self.endpoints_by_topic = {}
      self.endpoint_subscription_lock = threading.Lock()

      self.socket = None

   def run(self):
      syslog.setlogmask(syslog.LOG_UPTO(syslog.LOG_DEBUG))
      
      import gc
      gc.disable()

      syslog.syslog(syslog.LOG_NOTICE, "Starting 'publish_subscribe_billboard' daemon on %s." % str(self.address))
      self.init()
      self.wait_for_new_endpoints()

   def at_the_end(self):
      self.close()

   def init(self):
      try:
         self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
         self.socket.bind(self.address)
         self.socket.listen(10)
      except:
         syslog.syslog(syslog.LOG_ERR, "Exception in the init of the billboard: %s" % (traceback.format_exc()))
         sys.exit(1)

   
   def wait_for_new_endpoints(self):
      while True:
         try:
            syslog.syslog(syslog.LOG_DEBUG, "Waiting for a new endpoint to connect with self.")
            socket, address = self.socket.accept()
            syslog.syslog(syslog.LOG_NOTICE, "New endpoint connected: %s." % str(address))
         except: # TODO separate the real unexpected exceptions from the "shutdown" exception
            syslog.syslog(syslog.LOG_ERR, "Exception in the wait for new endpoints of the billboard: %s" % (traceback.format_exc()))
            break

         self.endpoints.append(_Endpoint(socket, self))

         to_close = filter(lambda endpoint: endpoint.is_finished, self.endpoints)
         syslog.syslog(syslog.LOG_DEBUG, "Collecting dead endpoints: %i endpoints to be collected." % len(to_close))
         for endpoint in to_close:
            endpoint.close()
            endpoint.join()

         self.endpoints = filter(lambda endpoint: not endpoint.is_finished, self.endpoints)
         syslog.syslog(syslog.LOG_NOTICE, "Still alive %i endpoints." % len(self.endpoints))

   def distribute_event(self, topic, event):
      self.endpoint_subscription_lock.acquire()
      try:
         subtopics = topic.split(".")
         topic_chain = [""] # the empty topic
         for i in range(len(subtopics)):
            topic_chain.append('.'.join(subtopics[:i+1]))
         
         topic_chain.reverse()
         endpoints_already_notified = set()
         syslog.syslog(syslog.LOG_DEBUG, "Distributing event over the topic chain '%s': %s." % (str(topic_chain), json.dumps(event)))
         for t in topic_chain:
            endpoints = filter(lambda endpoint: not endpoint.is_finished, self.endpoints_by_topic.get(t, []))
            syslog.syslog(syslog.LOG_DEBUG, "For the topic '%s' there are %i subscribed." % (t if t else "(the empty topic)", len(endpoints)))

            for endpoint in endpoints:
               if endpoint in endpoints_already_notified:
                  syslog.syslog(syslog.LOG_DEBUG, "Don't send. Endpoint already notified.")
               else:
                  endpoints_already_notified.add(endpoint)
                  endpoint.send_event(topic, event)
         
            if len(endpoints):
               syslog.syslog(syslog.LOG_DEBUG, "Event of topic '%s' distributed to %i endpoints subscribed." % (t if t else "(the empty topic)", len(endpoints)))

      except:
         syslog.syslog(syslog.LOG_ERR, "Exception in the distribution: %s" % (traceback.format_exc()))

      finally:
         self.endpoint_subscription_lock.release()

   def register_subscriber(self, topic, endpoint):
      self.endpoint_subscription_lock.acquire()
      try:
         syslog.syslog(syslog.LOG_NOTICE, "Endpoint subscribed to topic '%s'." % (topic if topic else "(the empty topic)"))
         if topic in self.endpoints_by_topic:
            self.endpoints_by_topic[topic].append(endpoint)
         else:
            self.endpoints_by_topic[topic] = [endpoint]

      finally:
         self.endpoint_subscription_lock.release()

   def close(self):
      if self.socket:
         syslog.syslog(syslog.LOG_NOTICE, "Shutting down 'publish_subscribe_billboard' daemon.")
         try:
            self.socket.shutdown(socket.SHUT_RDWR)
         except:
            syslog.syslog(syslog.LOG_ERR, "Error in the shutdown: '%s'" % traceback.format_exc())

         try:
            self.socket.close()
         except:
            syslog.syslog(syslog.LOG_ERR, "Error in the close: '%s'" % traceback.format_exc())

         self.socket = None

         for e in self.endpoints:
            e.close()
            e.join()

         syslog.syslog(syslog.LOG_NOTICE, "Shutdown 'publish_subscribe_billboard' daemon.")

   def signal_terminate_handler(self, sig_num, stack_frame):
      try:
         self.close()
      except:
         pass

if __name__ == '__main__':
   import sys
   billboard = Billboard(('', 5555))
   billboard.do_from_arg(sys.argv[1] if len(sys.argv) == 2 else None)

