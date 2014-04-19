
from gdb import Gdb
from forkDetector import ForkDetector
import time


class GdbSpawmer:
    
    def __init__(self):
        self.listaGdb = {}
        t = ForkDetector(self)
        t.start()
        
    def attachAGdb(self, pid):
        gdb = Gdb()
        gdb.attach(pid)
        self.listaGdb[pid] = gdb
        
    def startNewProcessWithGdb(self, path):
        gdb = Gdb()
        pid = gdb.file(path)
        self.listaGdb[pid] = gdb
        return pid
    
    def contineExecOfProcess(self,pid):
        self.listaGdb[pid].continueExec()
        
    def stepIntoOfProcess(self, pid):
        self.listaGdb[pid].stepInto()
        
    #finaliza el gdb del proceso deseado, se acepta all
    def exit(self, pid):
        if pid != "all":
            self.listaGdb[pid].exit()
        else:
            for gdb in self.listaGdb:
                gdb.exit()
        
        
        
if __name__ == '__main__':
    spawmer = GdbSpawmer()
    pid = spawmer.startNewProcessWithGdb("../../cppTestCode/Prueba")
    spawmer.contineExecOfProcess(pid)
    while(True):
        time.sleep(1)
    
