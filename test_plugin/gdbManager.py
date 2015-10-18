import gdb.gdbSpawner
from gdb.gdb import Gdb
import publish_subscribe.eventHandler 
import os
from time import sleep
import socket
import pprint
from psutil import pid_exists
from shortcuts import start_notifier, stop_notifier

NOTIFIER_UP = True
NOTIFIER_DOWN = False

class gdbManager:
    
    def __init__(self):
        start_notifier("../src/py/publish_subscribe/")
        
        self.spawner = gdb.gdbSpawner.GdbSpawner()
        self.events = []
        
        self.gdb_by_pid = {}
        
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
        self.eventHandler.subscribe("", self.registerEvent)
        
    def addManualGdb(self):
        gdb = Gdb()
        self.gdb_by_pid[gdb.get_gdb_pid()] = gdb 
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
    
    def clearEvents(self):
        self.events = []
    
    def printEvents(self):
        print ""
        print pprint.pformat(self.events)
    
    def close(self):
        self.spawner.shutdown()
        for gdb in self.gdb_by_pid:
            self.gdb_by_pid[gdb].shutdown()
        self.eventHandler.close()
        stop_notifier("../src/py/publish_subscribe/")
        
    
    
    
