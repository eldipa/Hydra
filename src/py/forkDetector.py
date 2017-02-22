import threading
import sys
from psutil import pid_exists
sys.path.append("./ipc/pyipc")
from ipc import MessageQueue  # @UnresolvedImport ignorar!!
import publish_subscribe.eventHandler
import os
import binascii
import traceback

from struct import *


_QUEUE_PATH_ = "/tmp/forkHack"
_QUEUE_CHAR_ = 'a'

_STRUCT_FORMAT_64_ = '<l4xi4x' #Formato little endiand - long - 4 x padding - int - 4 x padding 
_STRUCT_FORMAT_32_ = '<li'
_STRUCT_FORMAT_ = _STRUCT_FORMAT_32_

is_64bit = calcsize('P') * 8 == 64 #Checkeo la arquitectura utilizada, P = integer
if is_64bit:
    _STRUCT_FORMAT_ = _STRUCT_FORMAT_64_
 
 
class ForkDetector(threading.Thread):
    
    def __init__(self):
        threading.Thread.__init__(self)
        open(_QUEUE_PATH_,'a')
        self.PID_of_forked = []
        self.ev = publish_subscribe.eventHandler.EventHandler(name="ForkDetector")
        self.ev.subscribe('spawner.spawn_and_attach_completed', self.respondToForkedProcess)
        try:
            self.msgQueue = MessageQueue(_QUEUE_PATH_, _QUEUE_CHAR_, 0666, True)
        except:
            self.ev.publish("ERROR.forkDetector", {'info':"MSQ ya existente"})
            self.msgQueue = MessageQueue(_QUEUE_PATH_, _QUEUE_CHAR_, 0666, False)
    
    def respondToForkedProcess(self, data):
        if data in self.PID_of_forked:
            msg = self.CrearMensaje(data, 0)
            self.msgQueue.push(msg)
            self.PID_of_forked.remove(data)
            

    def ObtenerPID(self, msg):
#         print msg.encode('hex_codec')
#         print len(msg)

        struct = unpack(_STRUCT_FORMAT_, msg) #TODO Este padding sirve para una pc de 64 bits, extender para 32 y ver si puede existir otro padding
        
#         print struct
        return struct[1]
    
    def CrearMensaje(self, mtype ,pid):
        msg = pack(_STRUCT_FORMAT_, mtype, pid)
        return msg
    
    def finalizar(self):
        if hasattr(self, 'msgQueue'):
            msg = pack(_STRUCT_FORMAT_, 1, 0)
#             print msg.encode('hex_codec')
#             print sys.getsizeof(msg)
            self.msgQueue.push(msg)
            
    def run(self):
        salir = False
        try:
            while (not salir): 
                msg = self.msgQueue.pull(type=1)
                pid = self.ObtenerPID(msg)
                if pid == 0:
                    salir = True
                else:
                    self.PID_of_forked.append(pid)
                    self.ev.publish("spawner.add-debugger-and-attach.ForkDetector", pid)

        except Exception as inst:
            print type(inst)
            print traceback.format_exc()
            self.msgQueue = None
            
        finally:
            del self.msgQueue
            os.remove(_QUEUE_PATH_)

        
            
            
