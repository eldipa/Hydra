
from gdb import Gdb
import forkDetector 
from multiprocessing import Lock


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
    
    @Locker
    def attachAGdb(self, pid):
        gdb = Gdb()
        gdb.attach(pid)
        self.listaGdb[pid] = gdb
        
    @Locker
    def startNewProcessWithGdb(self, path):
        gdb = Gdb()
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
        

    
