import threading
import publish_subscribe.eventHandler
import select
import datetime
import tempfile
from multiprocessing import Lock
import os


class OutputLogger(threading.Thread):
    
    def __init__(self): 
        threading.Thread.__init__(self)
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
        self.outputsFd = []
        self.openFiles = {}
        self.originPid = {}
        self.fifoPath = tempfile.mktemp()
        os.mkfifo(self.fifoPath)
        self.myFifo = open(self.fifoPath, 'r+')
        self.outputsFd.append(self.myFifo.fileno())
        self.openFiles[self.myFifo.fileno()] = self.myFifo
        self.originPid[self.myFifo.fileno()] = "internal"
        self.lock = Lock()
        self.file = open("/tmp/Salida.txt", "a")  # TODO poner en otro lugar
        self.eventHandler.subscribe("debugger.new-output", self.newFd)
        
    def run(self):
        salir = False
        while not salir:
#             print "salidas originales: " + str(self.outputsFd)
            [paraLeer, paraEscribir, otro] = select.select(self.outputsFd, [], [])
#             print "para leer: " + str(paraLeer)
            for salida in paraLeer:
                leido = os.read(salida, 10000)
#                 print "la salida es " + leido + " de " + str(salida)
                
                if leido == "":
#                     print "sacando: " + str(salida)
                    self.outputsFd.remove(salida)
                    self.openFiles[salida].close()
                    self.openFiles.pop(salida)
                    continue
                    
                
                if salida == self.myFifo.fileno():
                    if leido == "nuevo":
                        continue
                    elif leido == "salir":
                        salir = True
                        continue
                
                timestamp = datetime.datetime.now()
                log = str(timestamp) + " " + str(self.originPid[salida]) + " " + leido
                self.file.write(log + '\n')
                event = { "timestamp" : str(timestamp),  "pid" : self.originPid[salida], "output": leido }
                self.eventHandler.publish("outputlog.%i" % self.originPid[salida], event)
        os.remove(self.fifoPath)
        self.eventHandler.publish("logger-exited","")
        self.eventHandler.close()
            
    
    def newFd(self, data):
#         print "nuevo fifo: " + str(data)
        fifoFd = open(data[1], "r")
        self.outputsFd.append(fifoFd.fileno())
        self.originPid[fifoFd.fileno()] = data[0]
        self.openFiles[fifoFd.fileno()] = fifoFd
        self.lock.acquire()
        self.myFifo.write("nuevo")
        os.write(self.myFifo.fileno(), "nuevo")
        self.lock.release()
#         print "agregado, nuevo fd: " + str(self.outputsFd)
        
    def finalizar(self):
        self.lock.acquire()
        os.write(self.myFifo.fileno(), "salir")
        self.lock.release()
