'''
Created on 15/11/2013

@author: nicolas
'''
import sys
from GUI import GUI
import wx
sys.path.append("/home/nicolas/workspace_c++/C-GDB/test_martin/ipc/pyipc")

from ipc import MessageQueue #@UnresolvedImport ignorar!!
import threading
from struct import unpack , pack


_QUEUE_PATH_ = "/tmp/forkHack"
_QUEUE_CHAR_ = 'a'
 

class Spawmer():

    def __init__(self, path):
        self.path = path
        open(_QUEUE_PATH_, _QUEUE_CHAR_)
        self.msgQueue = MessageQueue(_QUEUE_PATH_, _QUEUE_CHAR_, 0666, True)
        
    def obtenerID(self, msg):
        struct = unpack('<li', msg)
        return struct[1]
    
    def crearRespuesta(self, pid):
        msg = pack('<li',pid,0)
        return msg
        

    def start(self):
        gui = GUI(path = self.path)
        self.guiThread = threading.Thread(target=gui.MainLoop())  
        self.guiThread.start() 
        salir = False
        while (not salir):
            msg = self.msgQueue.pull(type = 1)
            #TODO Ver errores!!!!
            pid = self.obtenerID(msg)
            print pid
            sys.stdout.flush()
            wx.CallAfter(gui.AddFrame,["", pid])
            respuesta = self.crearRespuesta(pid)
            self.msgQueue.push(respuesta)
            
            
        
    
spwm = Spawmer('../c_code/Debug/Cpp_Code')
spwm.start()
