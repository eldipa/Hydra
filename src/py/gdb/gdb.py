
import subprocess
from subprocess import PIPE

import outputReader
import publish_subscribe.eventHandler
import os
import signal
import syslog
import functools

import globalconfig

class Gdb(object):
    def __init__(self): 
        self._start_gdb_process()
        
        name_prefix = "(gdb %i" % self.gdb.pid
        self.ev = publish_subscribe.eventHandler.EventHandler(name=name_prefix + "[input])")

        self._start_gdb_output_reader(name_prefix + "[output])")
        self._configure_gdb()
        self._load_base_py_modules_into_gdb_process()

        self._subscribe_to_interested_events_for_me()

    def get_gdb_pid(self):
        return self.gdb_pid  # thread-safe implementation

    def _subscribe_to_interested_events_for_me(self):
        # to avoid any race condition, the handlers must not have an instance of self.
        # other parameters shared must be seen with caution
        self.subscriptions = [
                self.ev.subscribe("request-gdb.%i" % self.gdb.pid, 
                        self._execute_a_request,
                        return_subscription_id=True, send_and_wait_echo=True),
                ]

    def _unsubscribe_me_for_all_events(self):
        for s in self.subscriptions:
            self.ev.unsubscribe(s)
   

    # Finaliza el proceso gdb, junto con su target si este no hubiera finalizado
    def shutdown(self):
        self._unsubscribe_me_for_all_events() # no more events for me
        self.ev.close() # wait until all the events are flushed out, so there should not be any race condition with the thread of my event-handler
                        # but can lead to a deadlock if a handler running in that thread tries to call a publish and in the meanwhile the connection was closed.
        self.reader.should_be_running = False

        try:
            if self.gdb.poll() is None:
                self.gdb.send_signal(signal.SIGINT) # wake up the debugger
                
                self.gdbInput.write("-gdb-exit\n")
                self.gdbInput.flush() 

                self.reader.join(timeout=25) # we wait for the end, nicely
                if self.reader.isAlive():
                    self.gdb.send_signal(signal.SIGTERM) # try to terminate the debugger, again

                self.reader.join(timeout=25) # wait again...
            
                if self.gdb.poll() is None:
                    self.gdb.send_signal(signal.SIGKILL) # enough, kill it!

        finally:
            # close the descriptors and join the threads/processes if they are still alive
            self.gdbInput.close() 
            self.gdbOutput.close()
            self.reader.join()
            self.gdb.wait()

            return self.gdb.returncode

        # TODO detattch the target (if any) before the exit of the debugger.
        # in other case, the target will be killed
    

    # Pide todas las variables y sus tipos  XXX
    #   self.gdbInput.write('-stack-list-variables --all-values' + '\n')
    #   self.gdbInput.write('-data-evaluate-expression ' + data + '\n')
    #   self.gdbInput.write('pointer-printer ' + data + '\n')
        
    

    def _start_gdb_process(self):
        ''' Spawn a GDB process. The attributes gdb, gdbInput and gdbOutput will become
            valid. '''
        cfg = globalconfig.get_global_config()
      
        use_gdb_system = cfg.getboolean('gdb', 'use-gdb-system')

        gdb_args = ["-interpreter=mi", "-quiet"]
        if use_gdb_system:
           gdb_path = 'gdb'

        else:
           gdb_path = cfg.get('gdb', 'gdb-executable-path')
           gdb_data_path = cfg.get('gdb', 'gdb-data-directory')

           data_directory_option = "--data-directory=%s" % gdb_data_path
           gdb_args.append(data_directory_option)
        
        # TODO stderr = /dev/null??  this is simple, but some errors of gdb may be missing
        self.gdb = subprocess.Popen([gdb_path] + gdb_args, stdin=PIPE, 
                        stdout=PIPE, stderr=open('/dev/null', 'w'))
        self.gdbInput = self.gdb.stdin
        self.gdbOutput = self.gdb.stdout

        self.gdb_pid = self.gdb.pid

    def _start_gdb_output_reader(self, name):
        self.reader = outputReader.OutputReader(self.gdbOutput, self.gdb_pid, name)
        self.reader.start()

    def _configure_gdb(self):
        self.gdbInput.write('set non-stop on\n')
        self.gdbInput.write('set target-async on\n')
        self.gdbInput.flush()

    def _load_base_py_modules_into_gdb_process(self):
        ''' Load the basic python modules into GDB. Those are the framework which
            all other modules and plugin can assume to be valid like
                - plugin loader
                - a publish / subscribe system
            '''
        cfg = globalconfig.get_global_config()
        
        name = cfg.get("gdbplugin", "name")
        log_level = getattr(syslog, cfg.get("gdbplugin", "log_level"))
        plugin_directory = os.path.abspath(cfg.get("gdbplugin", "plugin_directory"))

        base_module_path_1 = os.path.abspath('./py')
        base_module_path_2 = os.path.abspath('./py/gdb')

        python_code = '''
import syslog
syslog.openlog("%(name)s", logoption=syslog.LOG_PID)
syslog.setlogmask(syslog.LOG_UPTO(%(log_level)s))
import sys
sys.path.append("%(base_module_path_1)s")
sys.path.append("%(base_module_path_2)s")

import gdb_event_handler
import gdb_module_loader

gdb_event_handler.initialize()
gdb_module_loader.initialize()

sys.path.append("%(plugin_module_path)s")
''' % {
       'name':               name,
       'log_level':          log_level,
       'base_module_path_1': base_module_path_1,
       'base_module_path_2': base_module_path_2,
       'plugin_module_path': plugin_directory,
      }
        for line in python_code.strip().split('\n'):
            if line.strip(): # warning, any empty line will make gdb to enter into 'python mode': we need to execute one line at time.
                self.gdbInput.write('python %s\n' % line)
        self.gdbInput.flush()


    def _execute_a_request(self, request):
        command = request['command']
        token = int(request['token'])
        arguments = request.get('arguments', tuple())
        interpreter = request.get('interpreter', 'mi')

        if interpreter not in ('mi', 'console'):
           raise ValueError("Unexpected interpreter: '%s'. Expected 'mi' (machine interface) or 'console'." % interpreter)

        arguments_string = " ".join(arguments)
        command_and_arguments_string = " ".join([command, arguments_string])

        if interpreter == "console":
           command_line = '%i-interpreter-exec console "%s"\n' % (token, command_and_arguments_string)
        else:
           if command_and_arguments_string.startswith("-"):
              command_line = "%i%s\n" % (token, command_and_arguments_string)
           else:
              command_line = "%i-%s\n" % (token, command_and_arguments_string)
 
        self.gdbInput.write(command_line)
        self.gdbInput.flush()

