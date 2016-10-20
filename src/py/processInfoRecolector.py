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
                try:
                    pidInfo = psutil.Process(pid)
                    processInfo.append({"pid": pid, "ppid": pidInfo.ppid(), "command": pidInfo.name()})
                except NoSuchProcess:
                    pass # el proceso finalizo en el tiempo que se iteraba en la lista pidList, ignorar
                except Exception as inst:
                    self.ev.publish("processInfo.error", {"type":  type(inst), "traceback": traceback.format_exc()})
                    
                
#             self.ev.publish("processInfo", {"info":  [{"group":1,"command": "systemd", "ppid": 0,"pid": 1}]})
            self.ev.publish("processInfo.info", {"info":  processInfo})
            sleep(self.recolectionInterval)