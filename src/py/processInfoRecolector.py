import psutil
import threading
import publish_subscribe.eventHandler
from time import sleep

class ProcessInfoRecolector(threading.Thread):

    
    def __init__(self):
        threading.Thread.__init__(self)
        self.ev = publish_subscribe.eventHandler.EventHandler(name="ProcessInfoRecolector")
        self.salir = False
        self.recolectionInterval = 1 # segundos
        
    def finalizar(self):
        self.salir = True    
        
    def run(self):
        while not self.salir:
            processInfo = []
            pidList = psutil.pids()
            for pid in pidList:
                pidInfo = psutil.Process(pid)
                processInfo.append({"pid": pid, "ppid": pidInfo.ppid(), "command": pidInfo.name()})
                
            self.ev.publish("processInfo", {"info":  [{"group":1,"command": "systemd", "ppid": 0,"pid": 1}]})
            sleep(self.recolectionInterval)