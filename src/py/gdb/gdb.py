
import subprocess
from subprocess import PIPE
from multiprocessing import Queue

import outputReader
import publish_subscribe.eventHandler
import tempfile
import os
import threading
import signal
import pluginLoader

import globalconfig

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
    def __init__(self, comandos=False, log=False, inputRedirect=False, debugPlugin=None):
        cfg = globalconfig.get_global_config()
      
        use_gdb_system = cfg.getboolean('gdb', 'use-gdb-system')

        gdb_args = ["-interpreter=mi", "-quiet"]
        if use_gdb_system:
           gdb_path = 'gdb'

        else:
           gdb_path = cfg.get('gdb', 'gdb-executable-path')
           gdb_data_path = cfg.get('gdb', 'gdb-data-directory')

           data_directory_option = "--data-directory=%s" % gdb_data_path
           gdb_args.append(data_directory_option)

        self.comandos = comandos
        self.log = log
        self.queue = Queue()

        self.gdb = subprocess.Popen([gdb_path] + gdb_args, stdin=PIPE, stdout=PIPE, stderr=PIPE)
        self.gdbInput = self.gdb.stdin
        self.gdbOutput = self.gdb.stdout
        self.reader = outputReader.OutputReader(self.gdbOutput, self.queue, self.gdb.pid)
        self.reader.start()
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
        self.lock = threading.Lock()
        self.isAttached = False
        self.pluginLoader = pluginLoader.PluginLoader(self.gdbInput)
        if (comandos):
            self.pluginLoader.loadAll()
        if (debugPlugin):
            self.pluginLoader.load(debugPlugin)
        if(log):
            self.outputFifoPath = tempfile.mktemp()
            os.mkfifo(self.outputFifoPath)
            self.gdbInput.write("fifo-register " + "stdout " + self.outputFifoPath + '\n')
            
        # TODO hacerlo opcional??
        self.inputFifoPath = tempfile.mktemp()
        os.mkfifo(self.inputFifoPath)
        self.inputFifo = None
        self.gdbInput.write("fifo-register " + "stdin " + self.inputFifoPath + '\n')
           
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
        self.isAttached = True
        self.inputFifo = open(self.inputFifoPath, 'r+')
        self.gdbInput.write("-target-attach " + str(pid) + '\n')
        self.gdbInput.write("io-redirect stdout " + self.outputFifoPath + '\n')
        self.gdbInput.write("io-redirect stdin " + self.inputFifoPath + '\n')
        self.subscribe()
#         self.eventHandler.subscribe(str(pid) + ".stdin", self.redirectToStdin)
#         self.eventHandler.publish("debugger.new-output", [pid, self.outputFifoPath])
    
    # -Gdb coloca como proceso target un nuevo proceso del codigo 'file'
    # -Modifica el entorno (ld_preload)
    # -Retorna el pid del nuevo proceso
    def file(self, path):
        self.gdbInput.write("-file-exec-and-symbols " + path + '\n')
        self.gdbInput.write("-gdb-set " + "exec-wrapper env LD_PRELOAD=" + HACK_PATH + '\n')
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
        # Abro al fifo aca por si en la ejecucion anterior se cerro para mandar un EOF
        if (not self.inputFifo):
            self.inputFifo = open(self.inputFifoPath, 'r+')
        if(self.log):
            self.targetPid = 0
            self.gdbInput.write("run " + '\n')
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
#         self.gdb.terminate()  # Agrego para recuperar el prompt
        self.gdb.send_signal(signal.SIGINT)
        self.gdbInput.write("io-revert" + '\n')
        if self.isAttached:
            self.gdbInput.write("-target-detach" + '\n')
        self.gdbInput.write("-gdb-exit" + '\n')
        self.reader.join()
        self.gdb.wait()
        if(self.log):
           os.remove(self.outputFifoPath)
        if (self.inputFifo):
            self.inputFifo.close()
        os.remove(self.inputFifoPath)
        self.eventHandler.close()
    
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
            try:
                fileToRedirect = open(path, 'r')
                
                self.lock.acquire()
                
                line = os.read(fileToRedirect.fileno(), 512)
                while (line != ''):
                    os.write(self.inputFifo.fileno(), line)
                    line = os.read(fileToRedirect.fileno(), 512)
                fileToRedirect.close()
                
                self.lock.release()
                
                self.eventHandler.publish(str(self.targetPid) + ".fileRedirectComplete", path)
            
                print "Redirigiendo archivo: " + data
                
            except IOError as e:
                print "I/O error({0}): {1}".format(e.errno, e.strerror)
                
        self.t_redirector = threading.Thread(target=enviarArchivo, args=[data])
        self.t_redirector.start()
            
    def fileThreadJoiner(self, data):
        self.t_redirector.join()
    
    
    
