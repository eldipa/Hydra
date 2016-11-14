import threading, sys, traceback, syslog
import pty, os, select

import publish_subscribe.eventHandler
from gdb_mi import Output, Record, Stream

class GDBReader(threading.Thread):
    _DEBUG = False

    def __init__(self, gdb_process_id, name, gdb_mi_file_descriptor, gdb_console_file_descriptor):
        threading.Thread.__init__(self)
        self.ev = publish_subscribe.eventHandler.EventHandler(name=name)
        
        self.gdb_pid = gdb_process_id
        self.gdb_mi_file_descriptor = gdb_mi_file_descriptor
        self.gdb_console_file_descriptor = gdb_console_file_descriptor
        
        self.mi_parser = Output()

        self.is_gdb_running = True
        self.is_gdb_shutting_down = False

        self.gdb_console_last_chunks = []
        self.how_much_gdb_console_buffered = 0
        self.max_gdb_console_buffer_length = 2048 * 4

        self.ev.subscribe(
                "request-last-output-from-gdb-console.%i" % self.gdb_pid, 
                self._send_last_output_of_gdb_console)

    def _send_last_output_of_gdb_console(self, data):
        self.ev.publish("last-output-from-gdb-console.%i" % self.gdb_pid,
                "".join(self.gdb_console_last_chunks))


    def run(self):
        while self.is_gdb_running:
            ready_to_read, _, _ = select.select([self.gdb_mi_file_descriptor,
                                                 self.gdb_console_file_descriptor,
                                                 ],  [], [])

            try:
                if self.gdb_mi_file_descriptor in ready_to_read:
                    self._process_gdb_mi_income()

                if self.gdb_console_file_descriptor in ready_to_read:
                    self._process_gdb_console_chunk()

            except Exception, e:
                syslog.syslog(syslog.LOG_INFO, traceback.format_exc())
                if self._DEBUG:
                    sys.stderr.write("**ERROR**:" + traceback.format_exc())
        
        if not self.is_gdb_shutting_down and not self.is_gdb_running: # this is abnormal, so I will kill myself
            self.ev.publish('spawner.kill-debugger', {'debugger-id': self.gdb_pid})
            if self._DEBUG:
                sys.stderr.write("**GDB is DEAD?!**: i'm (output reader) should be keep running!\n")

        if self._DEBUG:
            sys.stderr.write("**BYE!**\n")

    def _process_gdb_mi_income(self):
        chunk = os.read(self.gdb_mi_file_descriptor, 2048)
        if not chunk:
            self.is_gdb_running = False
            if self._DEBUG:
                sys.stderr.write("**CHUNK READ EMPTY (GDB should not be running)**")
            return

        if self._DEBUG:
            sys.stderr.write("**CHUNK READ**:" + chunk)

        are_more_to_be_parsed_already = True
        while are_more_to_be_parsed_already:
            try:
                record = self.mi_parser.parse(chunk)
            except Exception, e:
                syslog.syslog(syslog.LOG_INFO, traceback.format_exc())
                if self._DEBUG:
                    sys.stderr.write("**ERROR**:" + traceback.format_exc())

                record = None

            if record is not None and record != "(gdb)":
                self._emit_gdb_record_event(record)

            are_more_to_be_parsed_already = self.mi_parser.are_more_to_be_parsed_already()
            chunk = ""


    def _emit_gdb_record_event(self, record):
        topic, data = self._build_event_from_gdb_record(record)
        if self._DEBUG:
            sys.stderr.write("**TOPIC**:" + topic + "\n")

        self.ev.publish(topic, data)

        if self._DEBUG:
            sys.stderr.write("**EV-SENT**:" + topic + "\n")


    def _process_gdb_console_chunk(self):
        chunk = os.read(self.gdb_console_file_descriptor, 2048)
        if chunk:
            topic = "output-from-gdb-console.%i" % (self.gdb_pid, )
            self.ev.publish(topic, chunk)
            
            self.gdb_console_last_chunks.append(chunk)
            self.how_much_gdb_console_buffered += len(chunk)

            while self.how_much_gdb_console_buffered > self.max_gdb_console_buffer_length and \
                    len(self.gdb_console_last_chunks) > 1:
                oldest_chunk = self.gdb_console_last_chunks[0]
                self.how_much_gdb_console_buffered -= len(oldest_chunk)

                del self.gdb_console_last_chunks[0]

    
    def arun(self):
        while True: # always True: try to consume everything until the end of the output of GDB
            record = self.next_record_from_gdb()
            if record is None:
                break

            topic, data = self.build_event_from_gdb_record(record)
            if self._DEBUG:
                sys.stderr.write("**TOPIC**:" + topic + "\n")

            self.ev.publish(topic, data)

            if self._DEBUG:
                sys.stderr.write("**EV-SENT**:" + topic + "\n")

        if self.should_be_running: # kill myself
            self.ev.publish('spawner.kill-debugger', {'pid': self.gdb_pid})
            if self._DEBUG:
                sys.stderr.write("**GDB is DEAD?!**: i'm (output reader) should be keep running!\n")
        
        if self._DEBUG:
            sys.stderr.write("**BYE!**\n")
        
    def _build_event_from_gdb_record(self, record):
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
        data['debugger-id'] = self.gdb_pid
        if record.type == "Sync":
           token = 0 if record.token is None else record.token
           topic = "result-gdb.%i.%i.%s" % (self.gdb_pid, token, record.klass.lower())

        elif record.type in ("Console", "Target", "Log"):
           assert isinstance(record, Stream)
           topic = "stream-gdb.%i.%s" % (self.gdb_pid, record.type.lower())
           
        else:
           assert record.type in ("Exec", "Status", "Notify")
           topic = "notification-gdb.%i.%s.%s" %(self.gdb_pid, record.type.lower(), record.klass.lower())

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
