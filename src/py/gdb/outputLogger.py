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
        fifoPath = tempfile.mktemp()
        os.mkfifo(fifoPath)
        self.myFifo = open(fifoPath, 'r+')
        self.outputsFd.append(self.myFifo.fileno())
        self.openFiles[self.myFifo.fileno()] = self.myFifo
        self.originPid[self.myFifo.fileno()] = "internal"
        self.lock = Lock()
        self.file = open("/tmp/Salida.txt", "a")  # TODO poner en otro lugar
        self.eventHandler.subscribe("debugger.new-output", self.newFd)
        
    def run(self):
        salir = False
        while not salir:
            print "salidas originales: " + str(self.outputsFd)
            [paraLeer, paraEscribir, otro] = select.select(self.outputsFd, [], [])
            print "para leer: " + str(paraLeer)
            for salida in paraLeer:
                leido = self.openFile[salida].read()
                print "la salida es " + leido + " de " + str(salida)
                
                if leido == "":
                    print "sacando: " +str(salida)
                    self.outputsFd.remove(salida)
                    self.openFile[salida].close()
                    self.openFiles.pop(salida)
                    
                
                if salida == self.myFifo.fileno:
                    if leido == "nuevo":
                        continue
                    elif leido == "salir":
                        salir = True
                
                log = str(datetime.datetime.now()) + " " + str(self.originPid[salida]) + " " + leido
                self.file.write(log + '\n')
            
    
    def newFd(self, data):
        print "nuevo fifo: " + str(data)
        file = open(data[1], "r")
        self.outputsFd.append(file.fileno())
        self.originPid[file.fileno()] = data[0]
        self.openFiles[file.fileno()] = file
        self.lock.acquire()
        self.myFifo.write("nuevo")
        self.lock.release()
        print "agregado, nuevo fd: " + str(self.outputsFd)
        
    def finalizar(self):
        self.lock.acquire()
        self.myFifo.write("salir")
        self.lock.release()
