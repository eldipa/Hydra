
import subprocess
from subprocess import PIPE
from multiprocessing import Queue

from outputReader import OutputReader

HACK_PATH = "../../shared/hack.so"

class Gdb:
                           

    # crea un nuevo proceso gdb vacio
    def __init__(self):
        self.queue = Queue()
        self.gdb = subprocess.Popen(["gdb", "-interpreter=mi", "-quiet"], stdin=PIPE, stdout=PIPE, stderr=PIPE)
        self.gdbInput = self.gdb.stdin
        self.gdbOutput = self.gdb.stdout
        t = OutputReader(self.gdbOutput, self.queue)
        t.start()

    
    # -Gdb realiza un attach al proceso especificado
    def attach(self, pid):
        self.gdbInput.write("-target-attach " + str(pid) + '\n')
        targetPid = self.queue.get()
        return targetPid
    
    # -Gdb coloca como proceso target un nuevo proceso del codigo 'file'
    # -Modifica el entorno (ld_preload)
    # -Retorna el pid del nuevo proceso
    def file(self, path):
        self.gdbInput.write("-file-exec-and-symbols " + path + '\n')
        self.gdbInput.write("-gdb-set " + "exec-wrapper env LD_PRELOAD=" + HACK_PATH + '\n')
        self.setBreakPoint("main")
        self.run()
        pid = self.queue.get()
        return pid

    
    # Ejecuta al target desde el comienzo
    def run(self):
        self.gdbInput.write("run > Salida.txt" + '\n') ########## redirigir bien la stdout
       
    
    # Ejecuta al target desde el punto donde se encontraba
    def continueExec(self):
        self.gdbInput.write("-exec-continue" + '\n')
    
    # Ejecuta una sola intruccion del target
    def stepInto(self):
        self.gdbInput.write("-exec-next-instruction" + '\n')
        # TODO esperar al prompt y retornar lo pedido
    
    
    # Finaliza el proceso gdb, junto con su target si este no hubiera finalizado
    def exit(self):
        # TODO finalizar target
        self.gdbInput.write("-gdb-exit" + '\n')
    
    # Establece un nuevo breakpoint al comienzo de la funcion dada
    def setBreakPoint(self, funcion):
        self.gdbInput.write("-break-insert " + funcion + '\n')
        
            
import time
        
if __name__ == '__main__':
    gdb = Gdb()
    print "En prompt"
    
    gdb.file("../../cppTestCode/Prueba")
    
    gdb.continueExec();
    
    time.sleep(5)
    
    gdb.exit()
    print "Finalizo"
    
    
    
    
