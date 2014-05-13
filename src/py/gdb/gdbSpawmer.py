
from gdb import Gdb
import forkDetector 
from multiprocessing import Lock
import publish_subscribe.eventHandler


def Locker(func):
        def newFunc(self, *args, **kwargs):
            self.lock.acquire()
            result = func(self, *args, **kwargs)
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
        self.eventHandler.publish("debugger.new-session", gdb.getSessionid())
        gdb.attach(pid)
        self.listaGdb[pid] = gdb
        self.eventHandler.publish("debugger.attached", pid)
        
    @Locker
    def startNewProcessWithGdb(self, path):
        gdb = Gdb()
        self.eventHandler.publish("debugger.new-session", gdb.getSessionId())
        pid = gdb.file(path)
        self.listaGdb[pid] = gdb
        return pid
    
    @Locker
    def contineExecOfProcess(self, pid):
        self.listaGdb[pid].continueExec()
        
    @Locker
    def stepIntoOfProcess(self, pid):
        self.listaGdb[pid].stepInto()
        
    # finaliza el gdb del proceso deseado, se acepta all
    @Locker
    def exit(self, pid):
        if pid != "all":
            self.listaGdb[pid].exit()
        else:
            for gdb in self.listaGdb:
                gdb.exit() 
                
    def eliminarCola(self):
        self.forkDetector.salir()
        self.forkDetector.join()
        

    
