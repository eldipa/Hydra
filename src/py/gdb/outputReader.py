import threading
from gdb_mi import Output, Record
import eventHandler


class OutputReader(threading.Thread):
    
    def __init__(self, gdbOutput, queue):
        threading.Thread.__init__(self)
        self.eventHandler = eventHandler.EventHandler()
        self.eventHandler.start()
        self.queue = queue
        self.parser = Output()
        self.gdbOutput = gdbOutput
        self.daemon = True
        self.pid = 0
    
    def run(self):
        # leo hasta obtener el pid
        while (self.pid == 0):
            line = self.gdbOutput.readline()
            record = self.parser.parse_line(line)
            if isinstance(record, Record):
                if (record.klass == "thread-group-started"):
                    self.pid = record.results["pid"]
                    self.queue.put(record.results["pid"])
                    
            
        while True:
            record = self.parser.parse_line(self.gdbOutput.readline())
            #self.eventHandler.publish(topic, data)
        
