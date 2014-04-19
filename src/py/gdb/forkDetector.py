import threading
import sys
import time
sys.path.append("/home/nicolas/workspace_c++/C-GDB/test_martin/ipc/pyipc")
from ipc import MessageQueue  # @UnresolvedImport ignorar!!

from struct import unpack , pack


_QUEUE_PATH_ = "/tmp/forkHack"
_QUEUE_CHAR_ = 'a'
 
 
class ForkDetector(threading.Thread):
    
    def __init__(self, spawmer):
        threading.Thread.__init__(self)
        self.daemon = True
        open(_QUEUE_PATH_, _QUEUE_CHAR_)
        self.msgQueue = MessageQueue(_QUEUE_PATH_, _QUEUE_CHAR_, 0666, True)
        self.spawmer = spawmer
        
    def ObtenerID(self, msg):
        struct = unpack('<li', msg)
        return struct[1]
    
    def CrearRespuesta(self, pid):
        msg = pack('<li', pid, 0)
        return msg
        
    def run(self):
        while (True):
            msg = self.msgQueue.pull(type=1)
#             print ' '.join(format(ord(i), 'b').zfill(8) for i in msg) 
            pid = self.ObtenerID(msg)
            self.spawmer.attachAGdb(pid)# no retorna hasta que el attach este completo
            #Esta linea no va aca
            self.spawmer.contineExecOfProcess(pid)
            respuesta = self.CrearRespuesta(pid)
            self.msgQueue.push(respuesta)
