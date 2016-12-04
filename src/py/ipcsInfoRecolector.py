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
                
            
            print shmemInfo
            
            sleep(self.recolectionInterval)
    
    def splitDetailedInfo(self, infoArray):
        aux = {}
        for item in infoArray:
            item = item.split("=")
            aux.update({item[0]:item[1]})
        return aux
        