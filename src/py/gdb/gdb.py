
import subprocess
from subprocess import PIPE
from multiprocessing import Queue

import outputReader
import publish_subscribe.eventHandler

HACK_PATH = "/shared/hack.so"

class Gdb:
                           

    # crea un nuevo proceso gdb vacio
    def __init__(self):
        self.targetPid = 0
        self.queue = Queue()
        self.gdb = subprocess.Popen(["gdb", "-interpreter=mi", "-quiet"], stdin=PIPE, stdout=PIPE, stderr=PIPE)
        self.gdbInput = self.gdb.stdin
        self.gdbOutput = self.gdb.stdout
        self.reader = outputReader.OutputReader(self.gdbOutput, self.queue, self.gdb.pid)
        self.reader.start()
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
        
    def getSessionId(self):
        return self.gdb.pid
    
    def getTargetPid(self):
        return self.targetPid
        
    def subscribe(self):
        self.eventHandler.subscribe(str(self.gdb.pid) + ".run", self.run)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".continue", self.continueExec)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".step-into", self.stepInto)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".exit", self.exit)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".break-funcion", self.setBreakPoint)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".direct-command", self.directCommand)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".get-variables", self.getVariables)
        
        self.eventHandler.publish("debugger.new-session", self.gdb.pid)

    
    # -Gdb realiza un attach al proceso especificado
    def attach(self, pid):
        self.gdbInput.write("-target-attach " + str(pid) + '\n')
        self.subscribe()
    
    # -Gdb coloca como proceso target un nuevo proceso del codigo 'file'
    # -Modifica el entorno (ld_preload)
    # -Retorna el pid del nuevo proceso
    def file(self, path):
        self.gdbInput.write("-file-exec-and-symbols " + path + '\n')
        self.gdbInput.write("-gdb-set " + "exec-wrapper env LD_PRELOAD=" + HACK_PATH + '\n')
#         self.setBreakPoint("main")
#         self.run()
        self.subscribe()

    
    # Ejecuta al target desde el comienzo
    def run(self, data=""):
        self.gdbInput.write("run > Salida.txt" + '\n')  ########## redirigir bien la stdout
       
    
    # Ejecuta al target desde el punto donde se encontraba
    def continueExec(self, data=""):
        self.gdbInput.write("-exec-continue" + '\n')
    
    # Ejecuta una sola intruccion del target
    def stepInto(self, data=""):
        self.gdbInput.write("-exec-step" + '\n')
    
    
    # Finaliza el proceso gdb, junto con su target si este no hubiera finalizado
    def exit(self, data=""):
        # self.gdbInput.write("kill" + '\n')
        self.gdbInput.write("-gdb-exit" + '\n')
        self.reader.join()
    
    # Establece un nuevo breakpoint al comienzo de la funcion dada
    # donde puede ser:
    # function
    # filename:linenum
    # filename:function
    # *address 
    def setBreakPoint(self, donde):
        self.gdbInput.write("-break-insert " + donde + '\n')

    # Ejectua un comando arbitrario pasado como argumento
    def directCommand(self, command):
        self.gdbInput.write(command + '\n')
        
    # Pide todas las variables y sus tipos 
    def getVariables(self, data =""):
        self.gdbInput.write('-stack-list-variables --all-values' + '\n')
    
    
    
