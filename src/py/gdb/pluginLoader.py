import os, syslog
from re import match
import globalconfig

class PluginLoader(object):
    
    def __init__(self, gdbInput):
        cfg = globalconfig.get_global_config()
        self.name = cfg.get("gdbplugin", "name")
        self.log_level = getattr(syslog, cfg.get("gdbplugin", "log_level"))
        self.plugin_directory = os.path.abspath(cfg.get("gdbplugin", "plugin_directory"))

        self.gdbInput = gdbInput
        self.files = []
        for _, _, filenames in os.walk(self.plugin_directory):
            for name in filenames:
                if (match(".*.py$", name)):
                    self.files.append(name)
 
    def load_base_modules(self):
        cfg = globalconfig.get_global_config()

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
       'name':               self.name,
       'log_level':          self.log_level,
       'base_module_path_1': base_module_path_1,
       'base_module_path_2': base_module_path_2,
       'plugin_module_path': self.plugin_directory,
      }
        for line in python_code.strip().split('\n'):
          self.gdbInput('python %s' % line)
        
    def load(self, name):
        if name in self.files:
            self.gdbInput.write('python exec(open("./py/gdb/Plugins/' + name + '").read())' + '\n')
        else:
            print "Plugin %s no encontrado, los detectados son %s" %(name, self.files)
        
    def loadAll(self):
        for plugin in self.files:
            self.gdbInput.write('python exec(open("./py/gdb/Plugins/' + plugin + '").read())' + '\n')
