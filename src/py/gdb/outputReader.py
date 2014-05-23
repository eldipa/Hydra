import threading
from gdb_mi import Output, Record
import publish_subscribe.eventHandler


class OutputReader(threading.Thread):
    
    def __init__(self, gdbOutput, queue, gdbPid): 
        threading.Thread.__init__(self)
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
        self.queue = queue
        self.parser = Output()
        self.gdbOutput = gdbOutput
        self.daemon = True
        self.gdbPid = gdbPid
        self.pid = 0
    
    def run(self):
        salir = False

        while (not salir):
            line = self.gdbOutput.readline()
            
            if line == "":
                salir = True
                continue

            record = self.parser.parse_line(line)

            if isinstance(record, Record):
                if (record.klass == "thread-group-started"):
                    self.pid = record.results["pid"]
                    self.eventHandler.publish("debugger.new-target" , {'gdbPid': self.gdbPid, 'targetPid': self.pid})
                    
                elif (record.klass == "stopped"):
                    if ('reason' in record.results):
                        self.eventHandler.publish("pid."+ str(self.gdbPid)+".stopped", {'reason':  record.results["reason"], 'output': vars(record)})
            
            if record != "(gdb)":
                self.eventHandler.publish("pid." + str(self.gdbPid), vars(record))
        
