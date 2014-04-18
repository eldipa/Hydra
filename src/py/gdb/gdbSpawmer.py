
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
        
        
        
if __name__ == '__main__':
    spawmer = GdbSpawmer()
    spawmer.startNewProcessWithGdb("../../cppTestCode/Prueba")
    time.sleep(5)
    
