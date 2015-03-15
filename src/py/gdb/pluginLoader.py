import os
from re import match

class PluginLoader():
    
    def __init__(self, gdbInput):
        self.gdbInput = gdbInput
        self.files = []
        for (dirpath, dirnames, filenames) in os.walk("./py/gdb/Plugins"):  # @UnusedVariable
            for name in filenames:
                if (match(".*.py$", name)):
                    self.files.append(name)
        
        
    def load(self, name):
        if name in self.files:
            self.gdbInput.write('python exec(open("./py/gdb/Plugins/' + name + '").read())' + '\n')
        else:
            print "Plugin %s no encontrado, los detectados son %s" %(name, self.files)
        
    def loadAll(self):
        for plugin in self.files:
            self.gdbInput.write('python exec(open("./py/gdb/Plugins/' + plugin + '").read())' + '\n')