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
        
    
    def finalizar(self):
        self.salir = True 
        
    
    def run(self):
        self.processInfo = []
        while not self.salir:
            
            print self.getShmemInfo()
            
            print self.getSemInfo()
            
            sleep(self.recolectionInterval)
            
    def getShmemInfo(self):
        shmemIPCS = subprocess.check_output(["ipcs","-m"]).splitlines()
        
        #key, shmid, propietario, perms, bytes, nattch, estado
        headers = shmemIPCS[2].split()
        
        shmemInfo = []
        
        #basci info
        for i in range(3,len(shmemIPCS) - 1):
            info={}
            values = shmemIPCS[i].split()
            for j in range(len(headers)):
                info.update({headers[j]: values[j]})
            shmemInfo.append(info)
            
        #detailed info
        for shmem in shmemInfo:
            info = {}
            detailedInfo = subprocess.check_output(["ipcs","-m", "-i", shmem["shmid"]]).splitlines()
            
            info.update(self.splitDetailedInfo(detailedInfo[2].split()))

            info.update(self.splitDetailedInfo(detailedInfo[3].split()))

            info.update(self.splitDetailedInfo(detailedInfo[4].split()))

            info.update(self.splitDetailedInfo([detailedInfo[5]]))
            
            shmem.update(info)
            
        
        return shmemInfo
    
    def getSemInfo(self):
        semIPCS = subprocess.check_output(["ipcs","-s"]).splitlines()
        
        #'key', 'semid', 'propietario', 'perms', 'nsems'
        headers = semIPCS[2].split()
        
        semInfo = []
        
        #basci info
        for i in range(3,len(semIPCS) - 1):
            info={}
            values = semIPCS[i].split()
            for j in range(len(headers)):
                info.update({headers[j]: values[j]})
            semInfo.append(info)
            
        
        #detailed info
        for sem in semInfo:
            info = {}
            detailedInfo = subprocess.check_output(["ipcs","-s", "-i", sem["semid"]]).splitlines()
            
            info.update(self.splitDetailedInfo(detailedInfo[2].split()))

            info.update(self.splitDetailedInfo(detailedInfo[3].split()))

            info.update(self.splitDetailedInfo([detailedInfo[4]]))

            info.update(self.splitDetailedInfo([detailedInfo[5]]))
            
            info.update(self.splitDetailedInfo([detailedInfo[6]]))
            
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
    
    def splitDetailedInfo(self, infoArray):
        aux = {}
        for item in infoArray:
            item = item.split("=")
            aux.update({item[0].strip():item[1].strip()})
        return aux
        