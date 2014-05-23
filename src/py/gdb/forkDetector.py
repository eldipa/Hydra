import threading
import sys
sys.path.append("/home/nicolas/workspace_c++/C-GDB/test_martin/ipc/pyipc")
from ipc import MessageQueue  # @UnresolvedImport ignorar!!
import publish_subscribe.eventHandler

from struct import unpack , pack


_QUEUE_PATH_ = "/tmp/forkHack"
_QUEUE_CHAR_ = 'a'
 
 
class ForkDetector(threading.Thread):
    
    def __init__(self, spawmer):
        threading.Thread.__init__(self)
        open(_QUEUE_PATH_, _QUEUE_CHAR_)
        self.msgQueue = MessageQueue(_QUEUE_PATH_, _QUEUE_CHAR_, 0666, True)
        self.spawmer = spawmer
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
        self.pidToattach = []
        self.eventHandler.subscribe("debugger.attached", self.attached)
        
    def ObtenerID(self, msg):
        struct = unpack('<li', msg)
        return struct[1]
    
    def CrearRespuesta(self, pid):
        msg = pack('<li', pid, 0)
        return msg
    
    def salir(self):
        respuesta = pack('<li', 1, 1)
        self.msgQueue.push(respuesta)
        
    def attached(self, data):
        pid = data
        if pid in self.pidToattach:
            self.pidToattach.remove(pid)
            respuesta = self.CrearRespuesta(pid)
            self.msgQueue.push(respuesta)
        
    def run(self):
        while (True):
            msg = self.msgQueue.pull(type=1)
            pid = self.ObtenerID(msg)
            if pid == 1:
                del self.msgQueue
                return 0
            
            self.pidToattach.append(pid)
            self.eventHandler.publish("debugger.attach", pid)
            
           
