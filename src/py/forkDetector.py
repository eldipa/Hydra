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
 
 
class ForkDetector(threading.Thread):
    
    def __init__(self):
        threading.Thread.__init__(self)
        open(_QUEUE_PATH_, _QUEUE_CHAR_)
        self.ev = publish_subscribe.eventHandler.EventHandler(name="ForkDetector")
        try:
            self.msgQueue = MessageQueue(_QUEUE_PATH_, _QUEUE_CHAR_, 0666, True)
        except:
            self.ev.publish("ERROR.forkDetector", {'info':"MSQ ya existente"})
            self.msgQueue = MessageQueue(_QUEUE_PATH_, _QUEUE_CHAR_, 0666, False)
            

    def ObtenerPID(self, msg):
#         print msg.encode('hex_codec')
#         print len(msg)

        struct = unpack('<l4xi4x', msg) #TODO Este padding sirve para una pc de 64 bits, extender para 32 y ver si puede existir otro padding
        
#         print struct
        return struct[1]
    
    def CrearMensaje(self, pid):
        msg = pack('<l4xi4x', pid, 0)
        return msg
    
    def finalizar(self):
        if self.msgQueue:
            msg = pack('<l4xi4x', 1, 0)
#             print msg.encode('hex_codec')
#             print sys.getsizeof(msg)
            self.msgQueue.push(msg)
            
    def run(self):
        salir = False
        try:
            while (not salir): 
                msg = self.msgQueue.pull(type=1)
#                 print calcsize('<li')
                pid = self.ObtenerPID(msg)
                if pid == 0:
    #                 del self.msgQueue  # posiblemente este de mas borrarlo explicitamente
                    salir = True
                else:
                    self.ev.publish("spawner.add-debugger-and-attach.ForkDetector", pid)
        except Exception as inst:
            print type(inst)
            print traceback.format_exc()
            self.msgQueue = None
        finally:
            os.remove(_QUEUE_PATH_)

        
            
            
