import gdb.gdbSpawner
from gdb.gdb import Gdb
import publish_subscribe.eventHandler 
import os
from time import sleep
import socket
import pprint
from psutil import pid_exists


NOTIFIER_UP = True
NOTIFIER_DOWN = False

class gdbManager:
    
    def __init__(self):
        os.system("python ../src/py/publish_subscribe/notifier.py start")
        self.wait_until(NOTIFIER_UP)
        
        self.spawner = gdb.gdbSpawner.GdbSpawner()
        self.events = []
        
        self.gdb_by_pid = {}
        
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
        self.eventHandler.subscribe("", self.registerEvent)
        
    def addManualGdb(self):
        gdb = Gdb()
        self.gdb_by_pid[gdb.get_gdb_pid] = gdb 
        return gdb
    
    def shutdownManualGdb(self, gdbPid):
        self.gdb_by_pid[gdbPid].shutdown()
        self.gdb_by_pid.pop(gdbPid)
        
    def registerEvent(self, event):
        self.events.append(event)   
        
    def publish(self, topic, data):
        self.eventHandler.publish(topic, data)
        
    def subscribe(self, topic, callback):
        self.eventHandler.subscribe(topic, callback)
        
    #devuelve el primer evento que contenga a dicho string, none en caso contrario
    def anyEventHasThisString(self, string):
        for event in self.events:
            if (string in str(event)):
                return event
        return None
    
    def getGdbIOfromSpawner(self, gdbPid):
        gdbOutput = self.spawner.gdb_by_its_pid[gdbPid].gdbOutput
        gdbInput = self.spawner.gdb_by_its_pid[gdbPid].gdbInput
        return {'input': gdbInput, 'output': gdbOutput}
    
    def resetEvents(self):
        self.events = []
    
    def printEvents(self):
        print ""
        print pprint.pformat(self.events)
    
    def close(self):
        self.spawner.shutdown()
        for gdb in self.gdb_by_pid:
            self.gdb_by_pid[gdb].shutdown()
        self.eventHandler.close()
        os.system("python ../src/py/publish_subscribe/notifier.py stop")
        self.wait_until(NOTIFIER_DOWN)
            
    # #COPIA DE EVENTHANDLER
    def _get_address(self):
        import os, ConfigParser
        script_home = os.path.abspath(os.path.dirname(__file__))
        parent = os.path.pardir

        # TODO This shouldn't be hardcoded!
        config_file = os.path.join(script_home, parent, "config", "publish_subscribe.cfg")

        config = ConfigParser.SafeConfigParser(defaults={
                    'wait_on_address': "localhost",
                    'wait_on_port': "5555",
                     })

        config.read([config_file])
        if not config.has_section("notifier"):
            config.add_section("notifier")


        address = (config.get("notifier", 'wait_on_address'), config.getint("notifier", 'wait_on_port'))

        return address
    
    def tryNewConection(self):
        isUp = None
        sock = None
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect(self._get_address())
            isUp = True
        except Exception as inst:
            isUp = False
#             print "Exception: " + str(type(inst)) + " errno:" + os.strerror(inst.errno)
        
        return isUp
            
    def wait_until(self, stopConditon):
        timeout = 2
        step = 0.01
        stop = False
        while not stop  and timeout > 0:
            sleep(step)
            timeout -= step
            status = self.tryNewConection()
            if (status == stopConditon):
                stop = True
        
        if not stop:
            raise Exception
        
        
    
    
    
