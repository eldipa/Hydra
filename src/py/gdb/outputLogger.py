import threading
import publish_subscribe.eventHandler
import select
import datetime

class outputLogger(threading.Thread):
    
    def __init__(self): 
        threading.Thread.__init__(self)
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
        self.outputsFd = []
        self.originPid = {}
        self.file = open("/tmp/Salida.txt", "a") #poner en otro lugar
        
    def run(self):
        salir = false
        while not salir:
            salidas = select.select(self.outputsFd,[],[])
            for salida in salidas:
                leido = salida.read()
                log = str(datetime.datetime.now()) + " " + self.originPid[salida] + " " + leido
                self.file.write(log + '\n')
            