import threading, sys, traceback, syslog
from gdb_mi import Output, Record, Stream
import publish_subscribe.eventHandler


class OutputReader(threading.Thread):
    _DEBUG = False
    
    def __init__(self, gdbOutput, gdbPid, name): 
        threading.Thread.__init__(self)
        self.eventHandler = publish_subscribe.eventHandler.EventHandler(name=name)
        self.parser = Output()
        self.gdbOutput = gdbOutput
        self.daemon = True
        self.gdbPid = gdbPid

        self.should_be_running = True

    def join(self, *args, **kargs):
        threading.Thread.join(self,  *args,  **kargs)
        self.eventHandler.close(*args, **kargs)

    
    def run(self):
        while True: # always True: try to consume everything until the end of the output of GDB
            record = self.next_record_from_gdb()
            if record is None:
                break

            topic, data = self.build_event_from_gdb_record(record)
            if self._DEBUG:
                sys.stderr.write("**TOPIC**:" + topic + "\n")

            self.eventHandler.publish(topic, data)

            if self._DEBUG:
                sys.stderr.write("**EV-SENT**:" + topic + "\n")

        if self.should_be_running: # kill myself
            self.eventHandler.publish('spawner.kill-debugger', {'pid': self.gdbPid})
            if self._DEBUG:
                sys.stderr.write("**GDB is DEAD?!**: i'm (output reader) should be keep running!\n")
        
        if self._DEBUG:
            sys.stderr.write("**BYE!**\n")
        
    def build_event_from_gdb_record(self, record):
        ''' Take a GDB record (an object created by the MI parser) that represent
            a state, a piece of log or a notification and create from it a event
            to be consumed by others listeners.

            Three types or categories of events exists that reassemble the three
            types of records that GDB has:
                - Sync: this are synchonous responses comming from GDB.
                - Console/Target/Log: this are asynchronous messages comming from GDB
                    or from the target itself and represent outputs or logs, unstructured
                    texts:
                   
                    * Console: is output that should be displayed as is in the console. 
                               It is the textual response to a CLI command.
                    * Target: is the output produced by the target program.
                    * Log: output is output text coming from gdb's internals, 
                           for instance messages that should be displayed as part of 
                           an error log. 
                    # Source: https://sourceware.org/gdb/onlinedocs/gdb/GDB_002fMI-Output-Syntax.html#GDB_002fMI-Output-Syntax

                - Exec/Status/Notify: for asynchronous notifications
                    * Exec: contains asynchronous state change on the target (stopped, 
                            started, disappeared). 
                    * Status: contains on-going status information about the progress 
                              of a slow operation. It can be discarded.
                    * Notify: contains supplementary information that the client 
                              should handle (e.g., a new breakpoint information).
                     
                    # Source: https://sourceware.org/gdb/onlinedocs/gdb/GDB_002fMI-Output-Syntax.html#GDB_002fMI-Output-Syntax
                    '''

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

        return topic, data

    def next_record_from_gdb(self):
        ''' Return the next record from GDB or None if GDB is dead or not responsive. '''
        while True:
            try:
                line = self.gdbOutput.readline()
                if self._DEBUG:
                    sys.stderr.write("**LINE**:" + line)

                if line == "":
                    return None
            except Exception, e:
                syslog.syslog(syslog.LOG_INFO, traceback.format_exc())
                if self._DEBUG:
                    sys.stderr.write("**ERROR**:" + traceback.format_exc())
                return None

            record = self.parser.parse_line(line)
            
            if record == "(gdb)":
               continue

            return record
