import threading
import publish_subscribe.eventHandler
from time import sleep
import subprocess

class IPCSInfoRecolector(threading.Thread):

    
    def __init__(self):
        threading.Thread.__init__(self)
        self.ev = publish_subscribe.eventHandler.EventHandler(name="IPCSInfoRecolector")
        self.salir = False
        self.recolectionInterval = 2 # segundos
        self.msgTrunk = 50 #cantidad de procesos que se envian cada vez en caso de cortar el mensaje
        self.IPCSInfoLock = threading.Lock()
        self.ev.subscribe('IPCSInfo.restart', self.restart)
        
    def finalizar(self):
        self.salir = True 
        
    def restart(self, data):
        self.IPCSInfoLock.acquire()
        self.semInfo = []
        self.shmemInfo = []
        self.msqInfo = []
        self.IPCSInfoLock.release()
        
    def run(self):
        self.semInfo = []
        self.shmemInfo = []
        self.msqInfo = []
        while not self.salir:
            self.IPCSInfoLock.acquire() #LOCK
            
            lastSemInfo = self.semInfo
            lastShmemInfo = self.shmemInfo
            lastMsqInfo = self.msqInfo
            
            self.semInfo = self.getSemInfo()
            self.shmemInfo = self.getShmemInfo()
            self.msqInfo = self.getMsqInfo()
            
            addedSem = [x for x in self.semInfo if x not in lastSemInfo]
            removedSem = [x for x in lastSemInfo if x not in self.semInfo]
            
            addedShmem = [x for x in self.shmemInfo if x not in lastShmemInfo]
            removedShmem = [x for x in lastShmemInfo if x not in self.shmemInfo]
            
            addedMsq = [x for x in self.msqInfo if x not in lastMsqInfo]
            removedMsq = [x for x in lastMsqInfo if x not in self.msqInfo]

            self.sendInfo(addedSem, removedSem, "sem")
            self.sendInfo(addedShmem, removedShmem, "shmem")
            self.sendInfo(addedMsq, removedMsq, "msq")
            
            self.IPCSInfoLock.release() #LOCK
            
            sleep(self.recolectionInterval)
            
    def getShmemInfo(self):
        shmemIPCS = subprocess.check_output(["ipcs","-m"]).splitlines()
        
        #key, shmid, propietario, perms, bytes, nattch, estado
        headers = shmemIPCS[2].split()
        
        shmemInfo = self.getBasicInfo(shmemIPCS, headers)

        #detailed info
        for shmem in shmemInfo:
            info = {}
            detailedInfo = subprocess.check_output(["ipcs","-m", "-i", shmem["shmid"]]).splitlines()
            
            for i in range(2,5):
                info.update(self.splitDetailedInfo(detailedInfo[i].split()))

            info.update(self.splitDetailedInfo([detailedInfo[5]]))
            
            shmem.update(info)
            
        
        return shmemInfo
    
    def getSemInfo(self):
        semIPCS = subprocess.check_output(["ipcs","-s"]).splitlines()
        
        #'key', 'semid', 'propietario', 'perms', 'nsems'
        headers = semIPCS[2].split()
        
        semInfo = self.getBasicInfo(semIPCS, headers)
        
        #detailed info
        for sem in semInfo:
            info = {}
            detailedInfo = subprocess.check_output(["ipcs","-s", "-i", sem["semid"]]).splitlines()
            
            for i in range(2,4):
                info.update(self.splitDetailedInfo(detailedInfo[i].split()))
            
            for i in range(4,7):
                info.update(self.splitDetailedInfo([detailedInfo[i]]))
            
            subHeaders = detailedInfo[7].split()
            
            subinfo = []
            for i in range(int(info["nsems"])):
                individualInfo = {}
                singularSemData = detailedInfo[8 + i].split()
                for j in range(len(subHeaders)):
                    individualInfo.update({subHeaders[j]: singularSemData[j]})
                subinfo.append(individualInfo)
            
            info.update({"sems": subinfo})
            
            sem.update(info)
        
        return semInfo
    
    def getMsqInfo(self):
        msqIPCS = subprocess.check_output(["ipcs","-q"]).splitlines()
        
        #'key', 'msqid', 'propietario', 'perms', 'bytes', 'utilizados', 'mensajes'
        headers = msqIPCS[2].split()
        
        #En espanol hay 2 palabras para la columna "bytes utilizados", los uno como un solo header
        if (len(headers) == 7):
            headers = headers[:4] + [headers[4] + "-" + headers[5]] + headers[6:]
        
        msqInfo = self.getBasicInfo(msqIPCS, headers)
            
        #detailed info
        for msq in msqInfo:
            info = {}
            detailedInfo = subprocess.check_output(["ipcs","-q", "-i", msq["msqid"]]).splitlines()
            
            for i in range(2,4):
                info.update(self.splitDetailedInfo(detailedInfo[i].split()))

            for i in range(4,7):
                info.update(self.splitDetailedInfo([detailedInfo[i]]))
            
            msq.update(info)
            
        
        return msqInfo
    
    def getBasicInfo(self, IPCS, headers):
        ipcInfo = []
        for i in range(3,len(IPCS) - 1):
            info={}
            values = IPCS[i].split()
            for j in range(len(headers)):
                info.update({headers[j]: values[j]})
            ipcInfo.append(info)
        return ipcInfo
        
    def splitDetailedInfo(self, infoArray):
        try:
            aux = {}
            for item in infoArray:
                item = item.split("=")
                aux.update({item[0].strip():item[1].strip()})
            return aux
        except Exception as inst:
            print "infoArray = " + str(infoArray)
            raise inst
        
    def sendInfo(self, added, removed, type):
        if len(added) > 0 or len(removed) > 0:
                if len(added) + len(removed) < self.msgTrunk:
                    self.ev.publish("IPCSInfo.info." + type, {"add": added, "remove": removed})
                else:
                    remainingSize = len(added)
                    while remainingSize > 0:
                        division = added[:self.msgTrunk]
                        added = added[self.msgTrunk:]
                        self.ev.publish("IPCSInfo.info."+ type, {"add": division, "remove": []})
                        remainingSize = len(added)
                        
                    remainingSize = len(removed)
                    while remainingSize > 0:
                        division = removed[:self.msgTrunk]
                        removed = removed[self.msgTrunk:]
                        self.ev.publish("IPCSInfo.info."+ type, {"add": [], "remove": removed})
                        remainingSize = len(removed)
            
        