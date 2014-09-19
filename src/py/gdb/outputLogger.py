import threading
import publish_subscribe.eventHandler
import select
import datetime
import tempfile
from multiprocessing import Lock
import os
import uuid

class OutputLogger(threading.Thread):
    
    def __init__(self): 
        threading.Thread.__init__(self)
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
        self.outputsFd = []
        self.originPid = {}
        fifo = "/tmp/" + str(uuid.uuid4())
        os.mkfifo(fifo)
        self.myFd = open(fifo, 'r+')
        self.outputsFd.append(self.myFd)
        self.originPid[self.myFd] = "internal"
        self.lock = Lock()
        self.file = open("/tmp/Salida.txt", "a")  # TODO poner en otro lugar
        self.eventHandler.subscribe("debugger.new-output", self.newFd)
        
    def run(self):
        salir = False
        while not salir:
            [paraLeer, paraEscribir, otro] = select.select(self.outputsFd, [], [])
            for salida in paraLeer:
                leido = salida.read()
                print "la salida es " + leido + " de " + str(salida.fileno())
                
                if salida == self.myFd:
                    if leido == "nuevo":
                        continue
                    elif leido == "salir":
                        salir = True
                
                log = str(datetime.datetime.now()) + " " + self.originPid[salida] + " " + leido
                self.file.write(log + '\n')
            
    
    def newFd(self, data):
        file = open(data[1], "r")
        self.outputsFd.append(file)
        self.originPid[file] = data[0]
        self.lock.acquire()
        self.myFd.write("nuevo")
        self.lock.release()
        
    def finalizar(self):
        self.lock.acquire()
        self.myFd.write("salir")
        self.lock.release()
