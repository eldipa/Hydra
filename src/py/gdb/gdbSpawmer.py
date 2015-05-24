
from gdb import Gdb
import forkDetector 
import outputLogger
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
    
    def __init__(self, comandos=False, log=False, inputRedirect=False, debugPlugin=None):
        self.comandos = comandos;
        self.log = log
        self.inputRedirect = inputRedirect
        self.debugPlugin = debugPlugin
        self.extraPlugin = []
        self.lock = Lock()
        self.listaGdb = {}
        self.forkDetector = forkDetector.ForkDetector(self)
        self.forkDetector.start()
        if(log):
            self.logger = outputLogger.OutputLogger()
            self.logger.start()
        self.eventHandler = publish_subscribe.eventHandler.EventHandler(name="(GDB Spawmer)")
        self.subscribe()
        
    def subscribe(self):
        self.eventHandler.subscribe("spawner.request.debuggers-info", self.response_debuggers_info)

        self.eventHandler.subscribe("debugger.load", self.startNewProcessWithGdb)
        self.eventHandler.subscribe("debugger.attach", self.attachAGdb)
        self.eventHandler.subscribe("debugger.exit", self.exit)
        
    def loadPlugin(self, plugin):
        self.extraPlugin.append(plugin)

    @Locker
    def response_debuggers_info(self, _):
        debuggers_data = dict((debugger_id, {'debugger-id': debugger_id}) for debugger_id in self.listaGdb.keys())
        self.eventHandler.publish("spawner.debuggers-info", {'debuggers': debuggers_data})
    
    @Locker
    def attachAGdb(self, pid):
        gdb = Gdb(comandos=self.comandos, log=self.log, inputRedirect=self.inputRedirect ,debugPlugin=self.debugPlugin)
        for plugin in self.extraPlugin:
            gdb.loadPlugin(plugin)
        gdb.attach(pid)
        self.listaGdb[gdb.getSessionId()] = gdb
        self.eventHandler.publish("debugger.attached", pid)
        return gdb.getSessionId()

        
    @Locker
    def startNewProcessWithGdb(self, path):
        gdb = Gdb(comandos=self.comandos, log=self.log, inputRedirect=self.inputRedirect, debugPlugin=self.debugPlugin)
        for plugin in self.extraPlugin:
            gdb.loadPlugin(plugin)
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
#                 print "exit "+ str(gdb)
                self.listaGdb[gdb].exit() 
            self.listaGdb = {}
                
    def eliminarCola(self):
        self.forkDetector.salir()
        self.forkDetector.join()
        
    def shutdown(self):
        self.eliminarCola()
        self.exit('all')
        if self.log:
           self.logger.finalizar()
           self.logger.join()
    
