import psutil
import threading
import publish_subscribe.eventHandler
from time import sleep

class ProcessInfoRecolector(threading.Thread):

    
    def __init__(self):
        threading.Thread.__init__(self)
        self.ev = publish_subscribe.eventHandler.EventHandler(name="ProcessInfoRecolector")
        self.salir = False
        self.recolectionInterval = 2 # segundos
        self.msgTrunk = 50 #cantidad de procesos que se envian cada vez en caso de cortar el mensaje
        
    def finalizar(self):
        self.salir = True    
        
    def run(self):
        sleep(5); #Espero a que cargue la parte de js
        processInfo = []
        while not self.salir:
            lastProcessInfo = processInfo
            processInfo = []
            pidList = psutil.pids()
            for pid in pidList:
                try:
                    pidInfo = psutil.Process(pid)
                    processInfo.append({"pid": pid, "ppid": pidInfo.ppid(), "command": pidInfo.name()})
                except psutil.NoSuchProcess:
                    pass # el proceso finalizo en el tiempo que se iteraba en la lista pidList, ignorar
                except Exception as inst:
                    self.ev.publish("processInfo.error", {"type":  type(inst), "traceback": traceback.format_exc()})
                    
                    
            addedProcess = [x for x in processInfo if x not in lastProcessInfo]
            removedProcess = [x for x in lastProcessInfo if x not in processInfo]
                
#             self.ev.publish("processInfo", {"info":  [{"group":1,"command": "systemd", "ppid": 0,"pid": 1}]})
#             self.ev.publish("processInfo.info", {"info":  processInfo, "add": addedProcess, "remove": removedProcess})
            if len(addedProcess) > 0 or len(removedProcess) > 0:
                if len(addedProcess) + len(removedProcess) < self.msgTrunk:
                    self.ev.publish("processInfo.info", {"add": addedProcess, "remove": removedProcess})
                else:
                    remainingSize = len(addedProcess)
                    while remainingSize > 0:
                        processDivision = addedProcess[:self.msgTrunk]
                        addedProcess = addedProcess[self.msgTrunk:]
                        self.ev.publish("processInfo.info", {"add": processDivision, "remove": []})
                        remainingSize = len(addedProcess)
                        
                    remainingSize = len(removedProcess)
                    while remainingSize > 0:
                        processDivision = removedProcess[:self.msgTrunk]
                        removedProcess = removedProcess[self.msgTrunk:]
                        self.ev.publish("processInfo.info", {"add": [], "remove": removedProcess})
                        remainingSize = len(removedProcess)
            sleep(self.recolectionInterval)
            