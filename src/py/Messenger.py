import threading
from multiprocessing import Queue
from gdb.gdb_mi import Record



# Singleton con metaclass
class Singleton(type):
 
    def __init__(cls, name, bases, dct):
        cls.__instance = None
        type.__init__(cls, name, bases, dct)
 
    def __call__(cls, *args, **kw):  # @NoSelf ignorar
        if cls.__instance is None:
            cls.__instance = type.__call__(cls, *args, **kw)
        return cls.__instance
 
class Messenger:
    __metaclass__ = Singleton
    
    def __init__(self, socket=None, gdbSpawmer=None):
        self.queue = Queue()
        self.socket = socket
        self.fsocket = self.socket.makefile() 
        self.gdbSpawmer = gdbSpawmer
        t = threading.Thread(target=self.leerDeCola)
        t.daemon = True
        t.start()
        
        
    def put(self, data):
        self.queue.put(data)
        
    def leerDeCola(self):
        while(True):
            data = self.queue.get()
            if isinstance(data, Record):
                if (data[1].klass == "stopped"):
                    msg = ""
                    msg += data[0]
                    msg += ","
                    msg += data[1].results.frame.fullname
                    msg += ","
                    msg += data[1].results.frame.line
                    msg += '\n'
                    self.fsocket.write(msg)
                    self.fsocket.flush()
                    print data
                else:
                    pass
            else:
                print data
                pass
            
            
    def leerDeSocket(self):
        for l in self.fsocket.readline(): 
            fields = l.split(',')    
            if fields[0] == "new":
                self.gdbSpawmer.startNewProcessWithGdb(fields[1])
            elif fields[0] == "step-into":
                self.gdbSpawmer.stepIntoOfProcess(fields[1])
            elif fields[0] == "attach":
                self.gdbSpawmer.attachAGdb(fields[1])
            

    
    
