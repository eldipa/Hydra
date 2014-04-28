import syslog, json

def ensamble_messages(buf, chunk, MAX_BUF_LENGTH):
   '''Take the unfinished message's payload 'buf' and try to complete one or 
      more messages with the next 'chunk' of payload.
      If the total buf exceeds MAX_BUF_LENGTH bytes, an exception will be thrown.

      Return the ensambled messages and the remain buf.
      '''
   messages = []

   syslog.syslog(syslog.LOG_DEBUG, "Chunk received '%s'." % (chunk))
   incremental_chunks = chunk.split('}')
   index_of_the_last = len(incremental_chunks) - 1
   
   for i in range(len(incremental_chunks)):
       buf += incremental_chunks[i] + ('' if (i == index_of_the_last) else '}')
       if(not buf):
           continue
        
       if(len(buf) > MAX_BUF_LENGTH):
           raise Exception("Too much data. Buffer's length exceeded .")
       
       try:
           message = json.loads(buf)
           syslog.syslog(syslog.LOG_DEBUG, "Received message from this raw string: '%s'." % (buf))
       except:
           # JSON fail, so the 'message object' is not complete yet
           continue
           
       buf = ''
       if(not isinstance(message, dict)):
           raise Exception("Bogus message's payload. It isn't an object like {...} .")
       
       messages.append(message)
   
   return messages, buf
