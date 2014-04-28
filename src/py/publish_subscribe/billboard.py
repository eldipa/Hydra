import socket, threading, json
import daemon, syslog, traceback
from message_ensambler import ensamble_messages

class _Endpoint(threading.Thread):
   def __init__(self, socket, billboard):
      threading.Thread.__init__(self)
      self.socket = socket
      self.is_finished = False
      self.billboard = billboard

      self.start()


   def _is_valid_message(self, message):
      if not "topic" in message or not "type" in message:
         return False

      if not message["type"] in ("subscribe", "publish"):
         return False

      if message["type"] == "publish" and "data" not in message:
         return False

      return True


   def _process_messages(self, messages):
      for message in messages:
         is_valid = self._is_valid_message(message)
         if not is_valid:
            syslog.syslog(syslog.LOG_ERR, "Invalid message: '%s'." % json.dumps(message))
            continue

         if message["type"] == "publish":
            self.billboard.distribute_event(message["topic"], message["data"])
         
         else:
            self.billboard.register_subscriber(message["topic"], self)

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
            self._process_messages(messages)


      except:
         syslog.syslog(syslog.LOG_ERR, "Endpoint exception when receiving a message from he: %s." % traceback.format_exc())
      finally:
         self.is_finished = True


   def send_event(self, topic, event):
      try:
         message = json.dumps({"topic": topic, "data": event})
         syslog.syslog(syslog.LOG_DEBUG, "Sending event: %s." % message)
         self.socket.sendall(message)
      except:
         syslog.syslog(syslog.LOG_ERR, "Endpoint exception when sending a message to he: %s." % traceback.format_exc())
         self.is_finished = True

   def close(self):
      self.socket.shutdown(2)
      self.socket.close()

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
            socket, address = self.socket.accept()
            syslog.syslog(syslog.LOG_DEBUG, "New endpoint connected: %s." % str(address))
         except: # TODO separate the real unexpected exceptions from the "shutdown" exception
            syslog.syslog(syslog.LOG_ERR, "Exception in the wait for new endpoints of the billboard: %s" % (traceback.format_exc()))
            break

         self.endpoints.append(_Endpoint(socket, self))

         to_close = filter(lambda endpoint: endpoint.is_finished, self.endpoints)
         syslog.syslog(syslog.LOG_DEBUG, "Collecting dead endpoints: %i endpoints to be collected." % len(to_close))
         for endpoint in to_close:
            endpoint.close()

         self.endpoints = filter(lambda endpoint: not endpoint.is_finished, self.endpoints)
         syslog.syslog(syslog.LOG_DEBUG, "Still alive %i endpoints." % len(self.endpoints))

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
            endpoints = self.endpoints_by_topic.get(t, [])
            syslog.syslog(syslog.LOG_DEBUG, "For the topic '%s' there are %i subscribed." % (t if t else "(the empty topic)", len(endpoints)))

            for endpoint in endpoints:
               if endpoint in endpoints_already_notified:
                  syslog.syslog(syslog.LOG_DEBUG, "Don't send. Endpoint already notified.")
               else:
                  endpoints_already_notified.add(endpoint)
                  endpoint.send_event(topic, event)
         
            if len(endpoints):
               syslog.syslog(syslog.LOG_DEBUG, "Event of topic '%s' distributed to %i endpoints subscribed." % (t if t else "(the empty topic)", len(endpoints)))


      finally:
         self.endpoint_subscription_lock.release()

   def register_subscriber(self, topic, endpoint):
      self.endpoint_subscription_lock.acquire()
      try:
         syslog.syslog(syslog.LOG_DEBUG, "Endpoint subscribed to topic '%s'." % (topic if topic else "(the empty topic)"))
         if topic in self.endpoints_by_topic:
            self.endpoints_by_topic[topic].append(endpoint)
         else:
            self.endpoints_by_topic[topic] = [endpoint]

      finally:
         self.endpoint_subscription_lock.release()

   def close(self):
      if self.socket:
         syslog.syslog(syslog.LOG_NOTICE, "Shutting down 'publish_subscribe_billboard' daemon.")
         self.socket.shutdown(2)
         self.socket.close()
         self.socket = None

         for e in self.endpoints:
            e.close()

         syslog.syslog(syslog.LOG_NOTICE, "Shutdown 'publish_subscribe_billboard' daemon.")

   def signal_terminate_handler(self, sig_num, stack_frame):
      self.close()

if __name__ == '__main__':
   import sys
   billboard = Billboard(('', 5555))
   billboard.do_from_arg(sys.argv[1] if len(sys.argv) == 2 else None)

