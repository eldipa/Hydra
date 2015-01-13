
import subprocess
from subprocess import PIPE
from multiprocessing import Queue

import outputReader
import publish_subscribe.eventHandler
import tempfile
import os
import threading

HACK_PATH = "/shared/hack.so"

# Lock para utilizar en cada funcion que escriba en el stdin del target
def Locker(func):
        def newFunc(self, *args, **kwargs):
            self.lock.acquire()
            try:
                result = func(self, *args, **kwargs)
            finally:
                self.lock.release()
            return result
        return newFunc

class Gdb:
                           

    # crea un nuevo proceso gdb vacio
    def __init__(self, comandos=False, log=False, inputRedirect=False):
        self.comandos = comandos;
        self.log = log
        self.queue = Queue()
        self.gdb = subprocess.Popen(["gdb", "-interpreter=mi", "-quiet"], stdin=PIPE, stdout=PIPE, stderr=PIPE)
        self.gdbInput = self.gdb.stdin
        self.gdbOutput = self.gdb.stdout
        self.reader = outputReader.OutputReader(self.gdbOutput, self.queue, self.gdb.pid)
        self.reader.start()
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
        self.lock = threading.Lock()
        if (comandos):
            files = []
            for (dirpath, dirnames, filenames) in os.walk("./py/gdb/Plugins"):
                files = files + filenames
            for plugin in files:
                self.gdbInput.write('python exec(open("./py/gdb/Plugins/' + plugin + '").read())' + '\n')
        if(log):
            self.outputFifoPath = tempfile.mktemp()
            os.mkfifo(self.outputFifoPath)
            self.gdbInput.write("fifo-register " + self.outputFifoPath + '\n')
            
        # TODO hacerlo opcional??
        self.inputFifoPath = tempfile.mktemp()
        os.mkfifo(self.inputFifoPath)
        self.inputFifo = None
        
    def getSessionId(self):
        return self.gdb.pid
        
    def subscribe(self):
        self.eventHandler.subscribe(str(self.gdb.pid) + ".run", self.run)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".continue", self.continueExec)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".step-into", self.stepInto)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".exit", self.exit)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".break-funcion", self.setBreakPoint)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".direct-command", self.directCommand)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".get-variables", self.getVariables)
        self.eventHandler.subscribe(str(self.gdb.pid) + ".evaluate-expression", self.evaluarExpresion)
        if (self.comandos):
            self.eventHandler.subscribe(str(self.gdb.pid) + ".evaluate-multiple-pointers", self.evaluarMultiplesPunteros)
        if(self.log):
            self.targetPid = 0
            self.eventHandler.subscribe("debugger.new-target.%i" % (self.gdb.pid), self.registerPid)
        self.eventHandler.publish("debugger.new-session", self.gdb.pid)

    
    # -Gdb realiza un attach al proceso especificado
    def attach(self, pid):
        self.gdbInput.write("-target-attach " + str(pid) + '\n')
        self.gdbInput.write("output-redirect " + self.outputFifoPath + '\n')
        self.subscribe()
        self.eventHandler.subscribe(str(pid) + ".stdin", self.redirectToStdin)
        self.eventHandler.publish("debugger.new-output", [pid, self.outputFifoPath])
    
    # -Gdb coloca como proceso target un nuevo proceso del codigo 'file'
    # -Modifica el entorno (ld_preload)
    # -Retorna el pid del nuevo proceso
    def file(self, path):
        self.gdbInput.write("-file-exec-and-symbols " + path + '\n')
        self.gdbInput.write("-gdb-set " + "exec-wrapper env LD_PRELOAD=" + HACK_PATH + '\n')
#         self.setBreakPoint("main")
#         self.run()
        self.gdbInput.write('\n')
        self.subscribe()

    def registerPid(self, data):
        self.targetPid = int(data["targetPid"])
        self.eventHandler.subscribe(str(self.targetPid) + ".stdin.txt", self.redirectToStdin)
        self.eventHandler.subscribe(str(self.targetPid) + ".stdin.eof", self.sendEOF)
        self.eventHandler.subscribe(str(self.targetPid) + ".stdin.file", self.redirectFileToStdin)
        self.eventHandler.subscribe(str(self.targetPid) + ".fileRedirectComplete", self.fileThreadJoiner)
        self.eventHandler.publish("debugger.new-output", [self.targetPid, self.outputFifoPath])

    
    # Ejecuta al target desde el comienzo
    @Locker
    def run(self, data=""):
        if (not self.inputFifo):
            self.inputFifo = open(self.inputFifoPath, 'r+')
        if(self.log):
            self.targetPid = 0
            self.gdbInput.write("run < " + self.inputFifoPath + '\n')
        else:
            self.gdbInput.write("run > " + "/tmp/SalidaAux.txt" + '\n')
    
    # Ejecuta al target desde el punto donde se encontraba
    def continueExec(self, data=""):
        self.gdbInput.write("-exec-continue" + '\n')
    
    # Ejecuta una sola intruccion del target
    def stepInto(self, data=""):
        self.gdbInput.write("-exec-step" + '\n')
    
    
    # Finaliza el proceso gdb, junto con su target si este no hubiera finalizado
    @Locker
    def exit(self, data=""):
        self.gdb.terminate()  # Agrego para recuperar el prompt
        self.gdbInput.write("-gdb-exit" + '\n')
        self.reader.join()
        self.gdb.wait()
        os.remove(self.outputFifoPath)
        if (self.inputFifo):
            self.inputFifo.close()
        os.remove(self.inputFifoPath)
    
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
    def getVariables(self, data=""):
        self.gdbInput.write('-stack-list-variables --all-values' + '\n')
           
    def evaluarExpresion(self, data=""):
        self.gdbInput.write('-data-evaluate-expression ' + data + '\n')
       
    def evaluarMultiplesPunteros(self, data=""):
        self.gdbInput.write('pointer-printer ' + data + '\n')
        
    @Locker  
    def redirectToStdin(self, data):
        print "redirigiendo " + data
        os.write(self.inputFifo.fileno(), data + '\n')  # Creo que este \n no deberia ir

    @Locker
    def sendEOF(self, data):
        print "Sending EOF"
        self.inputFifo.close()
        self.inputFifo = None
        
    def redirectFileToStdin(self, data):
        def enviarArchivo(path):
            self.lock.acquire()
            
            file = open(path, 'r')
            line = os.read(file.fileno(), 512)
            while (line != ''):
                os.write(self.inputFifo.fileno(), line)
                line = os.read(file.fileno(), 512)
            file.close()
            
            self.lock.release()
            
            self.eventHandler.publish(str(self.targetPid) + ".fileRedirectComplete", path)
            
        print "Redirigiendo archivo: " + data
        self.t_redirector = threading.Thread(target=enviarArchivo, args=[data])
        self.t_redirector.start()
            
    def fileThreadJoiner(self, data):
        self.t_redirector.join()
    
    
    
