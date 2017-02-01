from gdb_module import GDBModule
import gdb

class Ld_Preload(GDBModule):

    def __init__(self):
        GDBModule.__init__(self, 'ld_preload')
        self.__shared_path__ = "./shared/hack.so"
    
#     def request(self, *args):
#         ''' Simple, receives a message and returns it back (in a event of type Notify).
#             If args is empty or contains more than 1 value, fail with an exception. '''
#         if not self._activated:
#             return
# 
#         if len(args) != 1:
#             raise ValueError("Unexpected count of arguments. We are expecting 1 but found %i: '%s'" % (
#                 len(args), str(args)))
# 
#         self.notify("Notify", {'response': args[0]})
  
    def activate(self, *args):
        if self.are_activated():
            return
        
        gdb.execute("set environment LD_PRELOAD=" +  self.__shared_path__)
        
        self.notify("Notify", {'LD_Preload_path': self.__shared_path__})

        self._activated = True

    def deactivate(self, *args):
        if not self.are_activated():
            return
        
        gdb.execute("set environment LD_PRELOAD")
    
        self._activated = False

def init():
    return Ld_Preload()