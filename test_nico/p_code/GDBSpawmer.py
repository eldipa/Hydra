'''
Created on 15/11/2013

@author: nicolas
'''
import sys
import threading
import wx
import time
sys.path.append("/home/nicolas/workspace_c++/C-GDB/test_martin/ipc/pyipc")

from ipc import MessageQueue #@UnresolvedImport ignorar!!
from struct import unpack , pack


_QUEUE_PATH_ = "/tmp/forkHack"
_QUEUE_CHAR_ = 'a'
 

class Spawmer(threading.Thread):

    def __init__(self, gui):
        threading.Thread.__init__(self)
        self.gui = gui
        open(_QUEUE_PATH_, _QUEUE_CHAR_)
        self.msgQueue = MessageQueue(_QUEUE_PATH_, _QUEUE_CHAR_, 0666, True)
        
        
    def ObtenerID(self, msg):
        struct = unpack('<li', msg)
        return struct[1]
    
    def CrearRespuesta(self, pid):
        msg = pack('<li',pid,0)
        return msg
        

    def run(self): 
        salir = False
        while (not salir):
            msg = self.msgQueue.pull(type = 1)
            print ' '.join(format(ord(i),'b').zfill(8) for i in msg) 
            pid = self.ObtenerID(msg)
            print pid
            wx.CallAfter(self.gui.AddFrame,"", pid)
            #TODO Cambiar esto por algo logico....
            time.sleep(2)
            respuesta = self.CrearRespuesta(pid)
            self.msgQueue.push(respuesta)
            
            
