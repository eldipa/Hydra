import threading
from multiprocessing import Queue
import gdb.gdb_mi  

# Singleton con metaclass
class Singleton(type):
 
    def __init__(cls, name, bases, dct):
        cls.__instance = None
        type.__init__(cls, name, bases, dct)
 
    def __call__(cls, *args, **kw):  # @NoSelf ignorar
        if cls.__instance is None:
            cls.__instance = type.__call__(cls, *args, **kw)
        return cls.__instance
 
def makeLineMsg(pid, reason, filePath, line):
    msg = ""
    msg += pid
    msg += ","
    msg += reason
    msg += ","
    msg += filePath
    msg += ","
    msg += line
    msg += '\n'
    return msg
 
class Messenger:
    __metaclass__ = Singleton
    
    def __init__(self, socket=None, gdbSpawmer=None):
        self.queue = Queue()
        self.socket = socket
        if socket:
            self.fsocket = self.socket.makefile() 
            t = threading.Thread(target=self.leerDeSocket)
            t.daemon = True
            t.start()
        self.gdbSpawmer = gdbSpawmer
        t = threading.Thread(target=self.leerDeCola)
        t.daemon = True
        t.start()
        
        
    def put(self, data):
        self.queue.put(data)
        
    def leerDeCola(self):
        while(True):
            data = self.queue.get()
            print data
            if isinstance(data[1], gdb.gdb_mi.Record):
                klass = data[1].klass
                if (klass == "stopped"):
                    results = data[1].results
                    if "reason" in results:
                        if results["reason"] == 'exited-normally':
                            msg = makeLineMsg(data[0], results["reason"] , "", "")
                        else:
                            msg = makeLineMsg(data[0], results["reason"], results["frame"]["file"], results["frame"]["line"])
                        if self.socket:
                            self.fsocket.write(msg)
                            self.fsocket.flush()
                else:
                    pass
            else:
                pass
            
            
    def leerDeSocket(self):
        l = self.fsocket.readline()
        while l:
            fields = l.split(',')    
            if fields[0] == "new":
                self.gdbSpawmer.startNewProcessWithGdb(fields[1])
            elif fields[0] == "step-into":
                self.gdbSpawmer.stepIntoOfProcess(fields[1])
            elif fields[0] == "attach":
                self.gdbSpawmer.attachAGdb(fields[1])
            
            l = self.fsocket.readline()
            

    
    
