import threading
from gdb_mi import Output, Record, Stream
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
        quit = False

        while not quit:
            line = self.gdbOutput.readline()
            
            if line == "":
                quit = True
                continue

            record = self.parser.parse_line(line)
            
            if record == "(gdb)":
               continue

            if isinstance(record, Record):
                if (record.klass == "thread-group-started"):
                    self.pid = record.results["pid"]
                    self.eventHandler.publish("debugger.new-target.%i" % self.gdbPid , {'gdbPid': self.gdbPid, 'targetPid': self.pid})
                
                
            data = vars(record)
            data['debugger-id'] = self.gdbPid
            if record.type == "Sync":
               token = 0 if record.token is None else record.token
               topic = "result-gdb.%i.%i.%s" % (self.gdbPid, token, record.klass.lower())

            elif record.type in ("Console", "Target", "Log"):
               assert isinstance(record, Stream)
               topic = "stream-gdb.%i.%s" % (self.gdbPid, record.type.lower())
               
            else:
               assert record.type in ("Exec", "Status", "Notify")
               topic = "notification-gdb.%i.%s.%s" %(self.gdbPid, record.type.lower(), record.klass.lower())
 
            self.eventHandler.publish(topic, data)
        
        # here we are really sure that gdb "is dead"
        self.eventHandler.publish("spawner.debugger-exited", {"debugger-id": self.gdbPid,
                                                              "exit-code": -1})
