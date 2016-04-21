import socket, threading, json, sys
import daemon, syslog, traceback
from connection import Connection
from topic import build_topic_chain, fail_if_topic_isnt_valid

from esc import esc
from message import unpack_message_body, pack_message

#TODO add keep alive
class _Endpoint(threading.Thread):
   def __init__(self, socket, notifier, codename):
      threading.Thread.__init__(self)
      self.connection = Connection(socket)
      self.is_finished = False
      self.notifier = notifier
      self.codename = codename

      self.name = ""

      self.start()

   def _is_valid_message(self, message_type, message_body):
      if not message_type in ("subscribe", "publish", "unsubscribe", "introduce_myself"):
         return False


      return True


   def _process_message(self, message_type, message_body):
         if message_type == "publish":
            topic, raw_obj = unpack_message_body(message_type, message_body, dont_unpack_object=True)
            self.notifier.distribute_event(topic, raw_obj)

         elif message_type == "unsubscribe":
            topic = unpack_message_body(message_type, message_body)
            self.notifier.unsubscribe_me(topic, self)

         elif message_type == "introduce_myself":
            self.name = unpack_message_body(message_type, message_body)
         
         elif message_type == "subscribe":
            topic = unpack_message_body(message_type, message_body)
            self.notifier.register_subscriber(topic, self)

         else:
            self._log(syslog.LOG_ERR, "Invalid message. Unknown type: '%s'." % esc(message_type))
            raise Exception("Invalid message.")

   def run(self):
      try:
         while not self.connection.end_of_the_communication:
            message_type, message_body = self.connection.receive_object()
            self._process_message(message_type, message_body)

         self._log(syslog.LOG_NOTICE, "The connection was closed by the other point of the connection.")
      except:
         self._log(syslog.LOG_ERR, "An exception has occurred when receiving/processing the messages: %s." % esc(traceback.format_exc()))
      finally:
         self.is_finished = True


   def send_event(self, topic, obj_raw):
      try:
         self.connection.send_object(pack_message(message_type="publish", topic=topic, obj=obj_raw, dont_pack_object=True))
      except:
         self._log(syslog.LOG_ERR, "An exception when sending a message to it: %s." % esc(traceback.format_exc()))
         self.is_finished = True

   def close(self):
      self._log(syslog.LOG_NOTICE, "Closing the connection with the endpoint.")
      self.is_finished = True
      self.connection.close()
      self._log(syslog.LOG_NOTICE, "Connection closed")

   def __repr__(self):
      return "%s%s%s" % (self.codename, ((" (%s)" % self.name) if self.name else ""), (" [dead]" if self.is_finished else ""))

   def _log(self, level, message):
      message = ("%s: " % esc(repr(self))) + message
      syslog.syslog(level, message)


# TODO endpoints_by_topic (and endpoint_subscription_lock) as a single object

class Notifier(daemon.Daemon):
   def __init__(self, address, pidfile, name, foreground, listen_queue_len, show_stats, stats_file):
      daemon.Daemon.__init__(self,
            pidfile=pidfile, 
            name=name,
            keep_open_fileno=[0, 1, 2],
            foreground=foreground)

      self.address = address
      self.listen_queue_len = listen_queue_len
      self.endpoints = []
      self.endpoints_by_topic = {}
      self.endpoint_subscription_lock = threading.Lock()

      self.show_stats = show_stats
      self.stats_file = stats_file

      self.socket = None

   def run(self):
      import gc
      gc.disable()

      syslog.syslog(syslog.LOG_NOTICE, "Starting 'publish_subscribe_notifier' daemon on %s." % esc(str(self.address)))
      self.init()
      self.wait_for_new_endpoints()

   def at_the_end(self):
      self.close()

   def init(self):
      try:
         self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
         self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
         self.socket.bind(self.address)
         self.socket.listen(self.listen_queue_len)
      except:
         syslog.syslog(syslog.LOG_ERR, "Exception in the init of the notifier: %s" % esc((traceback.format_exc())))
         sys.exit(1)

   
   def wait_for_new_endpoints(self):
      if self.show_stats:
         self.show_endpoints_and_subscriptions()

      while True:
         try:
            syslog.syslog(syslog.LOG_DEBUG, "Waiting for a new endpoint to connect with self.")
            socket, address = self.socket.accept()
            codename = "Endpoint to %s:%s" % (str(address[0]), str(address[1]))
            syslog.syslog(syslog.LOG_NOTICE, "New endpoint connected: %s." % esc(str(address)))
         except: # TODO separate the real unexpected exceptions from the "shutdown" exception
            syslog.syslog(syslog.LOG_ERR, "Exception in the wait for new endpoints of the notifier: %s" % esc((traceback.format_exc())))
            break

         self.endpoints.append(_Endpoint(socket, self, codename))
         self.reap()

         if self.show_stats:
            self.show_endpoints_and_subscriptions()

   def reap(self):
      to_close = filter(lambda endpoint: endpoint.is_finished, self.endpoints)
      syslog.syslog(syslog.LOG_DEBUG, "Collecting dead endpoints: %i endpoints to be collected." % esc(len(to_close)))
      for endpoint in to_close:
         endpoint.close()
         endpoint.join()

      self.endpoints = filter(lambda endpoint: not endpoint.is_finished, self.endpoints)
      syslog.syslog(syslog.LOG_DEBUG, "Still alive %i endpoints." % esc(len(self.endpoints)))


   def get_and_update_endpoints_by_topic(self, topic):
      endpoints = filter(lambda endpoint: not endpoint.is_finished, self.endpoints_by_topic.get(topic, []))
      if self.endpoints_by_topic.get(topic, []): # update the dictionary only if there is something
         self.endpoints_by_topic[topic] = endpoints

      return endpoints


   def distribute_event(self, topic, obj_raw):
      fail_if_topic_isnt_valid(topic) # this shouldn't fail (it should be checked and filtered before)
      topic_chain = build_topic_chain(topic)
      
      self.endpoint_subscription_lock.acquire() # with this we guarrante that all the events are delivered in the correct order
      try:
         syslog.syslog(syslog.LOG_NOTICE, "Distributing event over the topic chain '%s': %s." % esc(", ".join(topic_chain), obj_raw))
         all_interested_endpoints = sum(map(self.get_and_update_endpoints_by_topic, topic_chain), [])
         endpoints = set(all_interested_endpoints)
         syslog.syslog(syslog.LOG_NOTICE, "There are %i subscribed in total." % esc(len(endpoints)))
         
         for endpoint in endpoints:
            endpoint.send_event(topic, obj_raw)

      except:
         syslog.syslog(syslog.LOG_ERR, "Exception in the distribution: %s" % esc(traceback.format_exc()))

      finally:
         self.endpoint_subscription_lock.release()

      if self.show_stats:
         self.show_endpoints_and_subscriptions()

   def register_subscriber(self, topic, endpoint):
      self.endpoint_subscription_lock.acquire()
      try:
         syslog.syslog(syslog.LOG_NOTICE, "Endpoint subscribed to topic '%s'." % esc(topic if topic else "(the empty topic)"))
         if topic in self.endpoints_by_topic:
            self.endpoints_by_topic[topic].append(endpoint)
         else:
            self.endpoints_by_topic[topic] = [endpoint]

      finally:
         self.endpoint_subscription_lock.release()

      if self.show_stats:
         self.show_endpoints_and_subscriptions()
   
   def unsubscribe_me(self, topic, endpoint):
      self.endpoint_subscription_lock.acquire()
      try:
         syslog.syslog(syslog.LOG_NOTICE, "Removing endpoint subscription for the topic '%s'." % esc(topic if topic else "(the empty topic)"))
         if topic not in self.endpoints_by_topic:
            syslog.syslog(syslog.LOG_ERR, "Trying to unsubscribe from the topic '%s' but no one is subscribed to that topic!" % esc(topic if topic else "(the empty topic)"))
            
         else:
            endpoints_subscribed = self.endpoints_by_topic[topic]

            try:
               endpoints_subscribed.remove(endpoint)
            except ValueError:
               syslog.syslog(syslog.LOG_ERR, "Trying to unsubscribe from the topic '%s' an endpoint that it is not subscribed to that topic!" % esc(topic if topic else "(the empty topic)"))

            if not endpoints_subscribed:
               del self.endpoints_by_topic[topic]  # if it is empty, remove it

      finally:
         self.endpoint_subscription_lock.release()

      if self.show_stats:
         self.show_endpoints_and_subscriptions()

   def close(self):
      if self.socket:
         syslog.syslog(syslog.LOG_NOTICE, "Shutting down 'publish/subscribe notifier' daemon.")
         try:
            self.socket.shutdown(socket.SHUT_RDWR)
         except:
            syslog.syslog(syslog.LOG_ERR, "Error in the shutdown: '%s'" % esc(traceback.format_exc()))

         try:
            self.socket.close()
         except:
            syslog.syslog(syslog.LOG_ERR, "Error in the close: '%s'" % esc(traceback.format_exc()))

         self.socket = None

         for e in self.endpoints:
            e.close()
            e.join()

         syslog.syslog(syslog.LOG_NOTICE, "Shutdown 'publish/subscribe notifier' daemon.")

   def signal_terminate_handler(self, sig_num, stack_frame):
      try:
         self.close()
      except:
         pass

   def show_endpoints_and_subscriptions(self):
      import pprint

      self.endpoint_subscription_lock.acquire()
      try:
         with open(self.stats_file, 'w') as out:
            topics = sorted(self.endpoints_by_topic.keys())
            endpoints = sorted(list(set(sum(self.endpoints_by_topic.values(), []))))
            
            out.write("Subcriptions:\n=============\n")
            for endpoint in endpoints:
               out.write(repr(endpoint))
               out.write(": ")
               out.write(", ".join(
                  map(lambda topic: "<any>" if not topic else topic, 
                     filter(lambda topic: endpoint in self.endpoints_by_topic[topic], topics))))
               out.write("\n")

      finally:
         self.endpoint_subscription_lock.release()

      

def main():
   import sys, os, ConfigParser
   script_home = os.path.abspath(os.path.dirname(__file__))
   parent = os.path.pardir

   sys.path.append(os.path.abspath(os.path.join(script_home, "../")))
   import globalconfig

   globalconfig.load_global_config()
   config = globalconfig.get_global_config()

   syslog.openlog(config.get("notifier", "name"), logoption=syslog.LOG_PID)
   syslog.setlogmask(syslog.LOG_UPTO(getattr(syslog, config.get("notifier", "log_level"))))

   pid_file = config.get("notifier", 'pid_file')
   if not os.path.isabs(pid_file): # it's relative to our home directory
      pid_file = os.path.abspath(os.path.join(script_home, pid_file))

   show_stats = config.getboolean("notifier", "show_stats")
   if show_stats:
      stats_file = config.get("notifier", "stats_file")
      if not os.path.isabs(stats_file): 
         stats_file = os.path.abspath(os.path.join(script_home, stats_file))
   else:
      stats_file = None

   notifier = Notifier(
         address = (config.get("notifier", 'wait_on_address'), config.getint("notifier", 'wait_on_port')),
         pidfile = pid_file,
         name = config.get("notifier", 'name'),
         foreground = config.getboolean("notifier", 'foreground'),
         listen_queue_len = config.getint("notifier", 'listen_queue_len'),
         show_stats = show_stats,
         stats_file = stats_file
         )

   notifier.do_from_arg(sys.argv[1] if len(sys.argv) == 2 else None)

if __name__ == '__main__':
   main()
