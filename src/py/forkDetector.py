import threading
import sys
from psutil import pid_exists
sys.path.append("./ipc/pyipc")
from ipc import MessageQueue  # @UnresolvedImport ignorar!!
import publish_subscribe.eventHandler
import os

from struct import unpack , pack


_QUEUE_PATH_ = "/tmp/forkHack"
_QUEUE_CHAR_ = 'a'
 
 
class ForkDetector(threading.Thread):
    
    def __init__(self):
        threading.Thread.__init__(self)
        open(_QUEUE_PATH_, _QUEUE_CHAR_)
        self.msgQueue = MessageQueue(_QUEUE_PATH_, _QUEUE_CHAR_, 0666, True)
        self.ev = publish_subscribe.eventHandler.EventHandler(name="ForkDetector")

    def ObtenerPID(self, msg):
        struct = unpack('<li', msg)
        return struct[1]
    
    def CrearMensaje(self, pid):
        msg = pack('<li', pid, 0)
        return msg
    
    def finalizar(self):
        msg = pack('<li', 1, 0)
        self.msgQueue.push(msg)
    
    def run(self):
        salir = False
        while (not salir): 
            msg = self.msgQueue.pull(type=1)
            pid = self.ObtenerPID(msg)
            if pid == 0:
#                 del self.msgQueue  # posiblemente este de mas borrarlo explicitamente
                salir = True
            else:
                self.ev.publish("spawner.add-debugger-and-attach.ForkDetector", pid)
                
        os.remove(_QUEUE_PATH_)
        
            
            
