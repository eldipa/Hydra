
import socket
import syslog
import json
import time
import traceback

class Connection(object):
   def __init__(self, address_or_already_open_socket):
      self.buf = ""
      self.end_of_the_communication = False
      self.closed = False

      if isinstance(address_or_already_open_socket, (tuple, list)):
         address = address_or_already_open_socket

         self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
         connected = False
         attempts = 0
         while not connected:
            try:
               self.socket.connect(address)
               connected = True
            except:
               time.sleep(0.5)
               attempts += 1
               if attempts > 100: #approx 0.5*100 = 50 seconds
                  raise


      else:
         self.socket = address_or_already_open_socket


   def send_object(self, obj):
      if self.end_of_the_communication:
         raise Exception("The communication is already close")

      message = json.dumps(obj)
      syslog.syslog(syslog.LOG_DEBUG, "Sending object (%i bytes): %s." % (len(message), message))
      self.socket.sendall(message)
      syslog.syslog(syslog.LOG_DEBUG, "Object sent (%i bytes)." % (len(message)))

   def receive_objects(self):
      if self.end_of_the_communication:
         raise Exception("The communication is already close")

      chunk = self._read_chunk()
      self.end_of_the_communication = not chunk

      objects = self._ensamble_objects(chunk, 8912)
      return objects


   def close(self):
      if self.closed:
         return 

      self.closed = True
      self.end_of_the_communication = True

      try:
         self.socket.shutdown(socket.SHUT_RDWR)
      except:
         syslog.syslog(syslog.LOG_ERR, "Error in the shutdown: '%s'" % traceback.format_exc())

      try:
         self.socket.close()
      except:
         syslog.syslog(syslog.LOG_ERR, "Error in the close: '%s'" % traceback.format_exc())

    
   def _read_chunk(self):
      syslog.syslog(syslog.LOG_DEBUG, "Waiting for the next chunk of data")
      chunk = self.socket.recv(8912)
      syslog.syslog(syslog.LOG_DEBUG, "Chunk received (%i bytes)." % len(chunk))

      return chunk

   def _ensamble_objects(self, chunk, MAX_BUF_LENGTH):
      '''Take the unfinished object's payload and try to complete one or 
         more objects with the next 'chunk' of payload.
         If the total buf exceeds MAX_BUF_LENGTH bytes, an exception will be thrown.

         Return the ensambled objects.
         '''
      objects = []

      incremental_chunks = chunk.split('}')
      index_of_the_last = len(incremental_chunks) - 1
      
      for i in range(len(incremental_chunks)):
          self.buf += incremental_chunks[i] + ('' if (i == index_of_the_last) else '}')
          if(not self.buf):
              continue
           
          if(len(self.buf) > MAX_BUF_LENGTH):
              raise Exception("Too much data. Buffer's length exceeded .")
          
          try:
              obj = json.loads(self.buf)
              syslog.syslog(syslog.LOG_DEBUG, "Received object from this raw string: '%s'." % (self.buf))
          except:
              # JSON fail, so the 'object' is not complete yet
              continue
              
          self.buf = ''
          objects.append(obj)
      
      syslog.syslog(syslog.LOG_DEBUG, "Received %i objects (remain %i bytes in the internal buffer)" % (len(objects), len(self.buf)))
      return objects

   def __del__(self):
      self.close()
