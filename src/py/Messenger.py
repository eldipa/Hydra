import threading
from multiprocessing import Queue



# Singleton con metaclass
class Singleton(type):
 
    def __init__(cls, name, bases, dct):
        cls.__instance = None
        type.__init__(cls, name, bases, dct)
 
    def __call__(cls, *args, **kw): #@NoSelf ignorar
        if cls.__instance is None:
            cls.__instance = type.__call__(cls, *args, **kw)
        return cls.__instance
 
class Messenger:
    __metaclass__ = Singleton
    
    def __init__(self):
        self.queue = Queue()
        t = threading.Thread(target=self.leerDeCola)
        t.daemon = True
        t.start()
        
        
    def put(self, data):
        self.queue.put(data)
        
    def leerDeCola(self):
        while(True):
            data = self.queue.get()
            print data
    

    
    
