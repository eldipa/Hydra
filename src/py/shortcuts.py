import os 
import time 
from subprocess import check_output, check_call
import publish_subscribe.eventHandler
import random
from threading import Lock


def start_notifier(path):
   notifier_path = os.path.join(path, "notifier.py")
   def is_running_notifier(): 
      out = check_output(["python", notifier_path, "status"]) 
      return "running" in out
   
   if not is_running_notifier():
      check_call(["python", notifier_path, "start"]) 

   t = 10
   while not is_running_notifier() and t > 0:
      time.sleep(0.1)
      t -= 0.1
 
   if not is_running_notifier():
      raise Exception("The notifier is not up and i cannot start it.")

def stop_notifier(path):   
   notifier_path = os.path.join(path, "notifier.py")
   check_call(["python", notifier_path, "stop"]) 

def request(gdb, command, arguments=tuple()):
   cookie = int(random.getrandbits(30))
   request_topic = "request-gdb.%i.%i" % (gdb.gdb.pid, cookie)
   response_topic = "result-gdb.%i.%i" % (gdb.gdb.pid, cookie)

   # Build the command correctly: use always the MI interface and a cookie
   if not command.startswith("-"):
      interpreter = 'console'
   else:
      interpreter = 'mi'

   request_for_command = {
         'command': command,
         'token': cookie,
         'arguments': arguments,
         'interpreter': interpreter,
   }

   # Create a flag acquired by default
   response_received_flag = Lock()
   response_received_flag.acquire() 

   ctx = {}
   def _wait_and_get_response_from_gdb(event):
      ctx['response'] = event
      response_received_flag.release() # release the flag, response received!
      
   pubsub = publish_subscribe.eventHandler.EventHandler()
   subscription_id = pubsub.subscribe(
                                 response_topic, 
                                 _wait_and_get_response_from_gdb, 
                                 return_subscription_id = True
                        )

   pubsub.publish(request_topic, request_for_command)
   response_received_flag.acquire() # block until the flag is release by the callback (and the respose was received)
   pubsub.unsubscribe(subscription_id)

   return ctx['response']


def collect(func_collector):
   '''Wrap a function, that should return some data, and returns its decorated version.
      This wrap will allow to call func_collector once and only once.
      After the first call, subsequent calls will block the thread.
      
      The wrap will also contain a method called 'get_next' that will block if
      no func_collector was done previuosly.

      After calling (successfuly) func_collector, get_next is allowed to be called.
      After calling get_next, func_collector is allowed again.

      This interaction between func_collector and get_next allows to share results
      from one thread (calling func_collector) to another thread (calling get_next).
      The results are shared one at time.
   '''
   ctx = {}
   can_read_flag = Lock()
   can_read_flag.acquire()

   can_write_flag = Lock()

   def _collect(*args, **kargs):
      can_write_flag.acquire()
      ctx['data'] = func_collector(*args, **kargs)
      can_read_flag.release()

   def _get_next():
      can_read_flag.acquire()
      c = ctx['data']
      can_write_flag.release()
      return c

   _collect.get_next = _get_next

   return _collect

