
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
        self.outputFifoPath = None
        self.inputRedirect = inputRedirect
        self.inputFifoPath = None
        self.inputFifo = None
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
        if(inputRedirect):
            self.inputFifoPath = tempfile.mktemp()
            os.mkfifo(self.inputFifoPath)
            self.gdbInput.write("fifo-register " + "stdin " + self.inputFifoPath + '\n')
           
    def getSessionId(self):
        return self.gdb.pid
    
    def poll(self):
        return self.gdb.poll()
    
    def loadPlugin(self, plugin):
        self.pluginLoader.load(plugin)
        
    def subscribe(self):
        self.eventHandler.subscribe("request-gdb.%i" % self.gdb.pid, self.execute_a_request)

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
        if(self.inputRedirect):
            self.inputFifo = open(self.inputFifoPath, 'r+')
        self.gdbInput.write("-target-attach " + str(pid) + '\n')
        if(self.log):
            self.gdbInput.write("io-redirect stdout " + self.outputFifoPath + '\n')
        if(self.inputRedirect):
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
        if (not self.inputFifo and self.inputRedirect):
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
#         pass
##         self.gdb.terminate()  # Agrego para recuperar el prompt
        self.gdb.send_signal(signal.SIGINT)
#         print "signal"
        if(self.inputRedirect or self.log):
                self.gdbInput.write("io-revert" + '\n')
#                 print "revert"
        if (self.isAttached):
            self.gdbInput.write("-target-detach" + '\n')
#             print "detach"
        self.gdbInput.write("-gdb-exit" + '\n')
#         print "exit"
        self.reader.join()
#         print "join"
        self.gdb.wait()
#         print "wait"
        if(self.log):
           os.remove(self.outputFifoPath)
#            print "outfifo"
        if (self.inputFifo):
            self.inputFifo.close()
#             print "infifoclose"
        if(self.inputRedirect):
            os.remove(self.inputFifoPath)
#             print "infifodelete"
        self.eventHandler.close()
#         print "handler"
    
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
    
    def execute_a_request(self, request):
        command = request['command']
        token = int(request['token'])
        arguments = request.get('arguments', tuple())
        interpreter = request.get('interpreter', 'mi')

        if interpreter not in ('mi', 'console'):
           raise ValueError("Unexpected interpreter: '%s'. Expected 'mi' (machine interface) or 'console'." % interpreter)

        arguments_string = " ".join(arguments)
        command_and_arguments_string = " ".join([command, arguments_string])

        if interpreter == "console":
           command_line = '%i-interpreter-exec console "%s"\n' % (token, command_and_arguments_string)
        else:
           if command_and_arguments_string.startswith("-"):
              command_line = "%i%s\n" % (token, command_and_arguments_string)
           else:
              command_line = "%i-%s\n" % (token, command_and_arguments_string)
         
        self.gdbInput.write(command_line)
        self.gdbInput.flush()
