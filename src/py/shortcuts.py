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

def request(gdb, command):
   request_topic = "%i.direct-command" % gdb.gdb.pid
   response_topic = "gdb.%i" % gdb.gdb.pid

   cookie = int(random.getrandbits(30))

   # Build the command correctly: use always the MI interface and a cookie
   if not command.startswith("-"):
      command = '%i-interpreter-exec console "%s"' % (cookie, command)
   else:
      command = "%i%s" % (cookie, command)


   # Create a flag acquired by default
   response_received_flag = Lock()
   response_received_flag.acquire() 

   ctx = {}
   def _wait_and_get_response_from_gdb(event):
      if event == command: # this is my own event, it is the request and not the response
         return

      if 'response' in ctx: # the response was already received, discard this
         return

      if event.get('token', None) != cookie:
         return # this is not for us

      ctx['response'] = event
      response_received_flag.release() # release the flag, response received!
      
   pubsub = publish_subscribe.eventHandler.EventHandler()
   subscription_id = pubsub.subscribe(
                                 "result-gdb", 
                                 _wait_and_get_response_from_gdb, 
                                 return_subscription_id = True
                        )

   pubsub.publish(request_topic, command)
   response_received_flag.acquire() # block until the flag is release by the callback (and the respose was received)
   pubsub.unsubscribe(subscription_id)

   return ctx['response']
