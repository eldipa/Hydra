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

            print self.getMsqInfo()
            
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
            
            for i in range(2,5):
                info.update(self.splitDetailedInfo(detailedInfo[i].split()))

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
        
        msqInfo = []
        
        #basci info
        for i in range(3,len(msqIPCS) - 1):
            info={}
            values = msqIPCS[i].split()
            for j in range(len(headers)):
                info.update({headers[j]: values[j]})
            msqInfo.append(info)
            
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
        