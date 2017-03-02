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
        self.processListLock = threading.Lock()
        self.ev.subscribe('processInfo.restart', self.restart)
        
    def finalizar(self):
        self.salir = True    
        
    def restart(self, data):
        self.processListLock.acquire()
        self.processInfo = []
        self.processListLock.release()
        
    def run(self):
        self.processInfo = []
        while not self.salir:
            self.processListLock.acquire() #LOCK
            lastProcessInfo = self.processInfo
            self.processInfo = []
            pidList = psutil.pids()
            for pid in pidList:
                try:
                    pidInfo = psutil.Process(pid)
                    if pidInfo.status() == "zombie":
                        status = pidInfo.status()
                    else:
                        status = "running"
                    self.processInfo.append({"pid": pid, "ppid": pidInfo.ppid(), "command": pidInfo.name(), "status": status})
                except psutil.NoSuchProcess:
                    pass # el proceso finalizo en el tiempo que se iteraba en la lista pidList, ignorar
                except Exception as inst:
                    self.ev.publish("processInfo.error", {"type":  type(inst), "traceback": traceback.format_exc()})
                    
                    
            addedProcess = [x for x in self.processInfo if x not in lastProcessInfo]
            removedProcess = [x for x in lastProcessInfo if x not in self.processInfo]
                
            self.sendProcessInfo(addedProcess, removedProcess)
            
            self.processListLock.release() #LOCK
                        
            sleep(self.recolectionInterval)
            
    def sendProcessInfo(self, addedProcess, removedProcess):
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
                        self.ev.publish("processInfo.info", {"add": [], "remove": processDivision})
                        remainingSize = len(removedProcess)
            