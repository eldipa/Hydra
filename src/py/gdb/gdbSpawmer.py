
from gdb import Gdb
import forkDetector 
from multiprocessing import Lock
import publish_subscribe.eventHandler


def Locker(func):
        def newFunc(self, *args, **kwargs):
            self.lock.acquire()
            try:
                result = func(self, *args, **kwargs)
            finally:
                self.lock.release()
            return result
        return newFunc

class GdbSpawmer:
    
    def __init__(self):
        self.lock = Lock()
        self.listaGdb = {}
        self.forkDetector = forkDetector.ForkDetector(self)
        self.forkDetector.start()
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
        self.subscribe()
        
    def subscribe(self):
        self.eventHandler.subscribe("debugger.load", self.startNewProcessWithGdb)
        self.eventHandler.subscribe("debugger.attach", self.attachAGdb)
        self.eventHandler.subscribe("debugger.exit", self.exit)
    
    @Locker
    def attachAGdb(self, pid):
        gdb = Gdb()
        gdb.attach(pid)
        self.listaGdb[gdb.getSessionId()] = gdb
        self.eventHandler.publish("debugger.attached", pid)
        return gdb.getSessionId()

        
    @Locker
    def startNewProcessWithGdb(self, path):
        gdb = Gdb()
        gdb.file(path)
        self.listaGdb[gdb.getSessionId()] = gdb
        return gdb.getSessionId()
    
    @Locker
    def contineExecOfProcess(self, pid):
        self.listaGdb[pid].continueExec()
        
    @Locker
    def stepIntoOfProcess(self, pid):
        self.listaGdb[pid].stepInto()
        
    # finaliza el gdb deseado, se acepta all
    @Locker
    def exit(self, pid):
        if pid != "all":
            self.listaGdb[pid].exit()
            self.listaGdb.pop(pid)
        else:
            for gdb in self.listaGdb:
                self.listaGdb[gdb].exit() 
            self.listaGdb = []
                
    def eliminarCola(self):
        self.forkDetector.salir()
        self.forkDetector.join()
        

    
