import socket, threading, json
import daemon

class _Endpoint(threading.Thread):
   def __init__(self, socket, billboard):
      threading.Thread.__init__(self)
      self.socket = socket
      self.is_finished = False
      self.billboard = billboard


   def run(self):
      try:
         buf = ''
         while True:
            messages = []
            chunk = self.socket.recv(1024)
            incremental_chunks = chunk.split('}')
            index_of_the_last = len(incremental_chunks) - 1

            for i in range(len(incremental_chunks)):
               buf = buf + incremental_chunks[i] + ('' if index_of_the_last == i else '}')

               if not buf:
                  continue

               if len(buf) > 1024*1024:
                  raise Exception("Too much data")

               try:
                  message = json.loads(buf)
               except:
                  continue


               if not isinstance(message, dict):
                  raise Exception("Bogus 'message' payload. It isn't an object like {...} .")

               if not "topic" in message or not "type" in message:
                  raise Exception("Bogus 'message' payload. It has an incorrect or missing property.")

               if not message["type"] in ("subscribe", "publish"):
                  raise Exception("Bogus 'message' payload. Unknow message's type.")

               if message["type"] == "publish" and "data" not in message:
                  raise Exception("Bogus 'message' payload. It hasn't the data property.")

               messages.append(message)

            for message in messages:
               if message["type"] == "publish":
                  self.billboard.distribute_event(message["topic"], message["data"])
               
               else:
                  self.billboard.register_subscriber(message["topic"], self)
      finally:
         self.is_finished = True

   def send_event(self, topic, event):
      message = json.dumps({"topic": topic, "data": event})
      self.socket.sendall(message) 

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
            name="publish_subscribe",
            keep_open_fileno=[0, 1, 2],
            foreground = True)

      self.address = address
      self.endpoints = []
      self.endpoints_by_topic = {}
      self.endpoint_subscription_lock = threading.Lock()

      self.socket = None

   def run(self):
      self.init()
      self.wait_for_new_endpoints()

   def at_the_end(self):
      self.close()

   def init(self):
      self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
      self.socket.bind(self.address)
      self.socket.listen(10)
   
   def wait_for_new_endpoints(self):
      while True:
         try:
            socket, address = self.socket.accept()
         except: # TODO separate the real unexpected exceptions from the "shutdown" exception
            break

         self.endpoints.append(_Endpoint(socket, self))

         for endpoint in filter(lambda endpoint: endpoint.is_finished, self.endpoints):
            endpoint.close()

         self.endpoints = filter(lambda endpoint: not endpoint.is_finished, self.endpoints)

   def distribute_event(self, topic, event):
      self.endpoint_subscription_lock.lock()
      try:
         subtopics = topic.split(".")
         topic_chain = [""] # the empty topic
         for i in range(len(subtopics)):
            topic_chain.append('.'.join(subtopics[:i+1]))
         
         topic_chain.reverse()
         for t in topic_chain:
            endpoints = self.endpoints_by_topic.get(t, [])
            for endpoint in endpoints:
               endpoint.send_event(t, event)

      finally:
         self.endpoint_subscription_lock.release()

   def register_subscriber(self, topic, endpoint):
      self.endpoint_subscription_lock.lock()
      try:
         if topic in self.endpoints_by_topic:
            self.endpoints_by_topic[topic].append(endpoint)
         else:
            self.endpoints_by_topic[topic] = [endpoint]

      finally:
         self.endpoint_subscription_lock.release()

   def close(self):
      if self.socket:
         self.socket.close()
         self.socket = None

         for e in self.endpoints:
            e.close()


if __name__ == '__main__':
   import sys
   billboard = Billboard(('', 5555))
   billboard.do_from_arg(sys.argv[1] if len(sys.argv) == 2 else None)

