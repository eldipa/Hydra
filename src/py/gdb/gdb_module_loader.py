import importlib
import atexit

from gdb_event_handler import _get_global_event_handler, noexception

class _GDBModuleLoader(object):
  def __init__(self):
    #self.publisher = _get_global_event_handler() see the cleanup method of self
    self.cleanup_callbacks = []
    atexit.register(self._cleanup)

    self.gdb_modules_by_name = {}


  @noexception(error_message="Internal error when importing a gdb module into GDB.")
  def load(self, module_name):
    ''' Load a module. Import the module and check its dependencies, if their are
        satisfied, then call to its 'init' function. See _register for more details.
    '''
    imported_module_names = set(self.gdb_modules_by_name.keys())
    if module_name in imported_module_names:
      return

    module = importlib.import_module(module_name)
    dependencies = set(getattr(module, 'dependencies', []))

    if not dependencies.issubset(imported_module_names):
      raise Exception("Dependencies are not satisfied: %s" % str(dependencies.difference(imported_module_names)))

    return self._register(module, module_name)


  @noexception(error_message="Internal error when importing a gdb module (or modules) into GDB.")
  def load_bulk(self, module_names):
    ''' Load multiples modules at once. Import all the modules and then order them
        according to their dependencies, registering the modules one by one as their
        dependecies are satified. As in 'load', see _register for more info.
    '''
    imported_module_names = set(self.gdb_modules_by_name.keys())
    module_names = set(module_names).difference(imported_module_names)

    mods = {}
    for module_name in module_names:
      module = importlib.import_module(module_name)
      dependencies = set(getattr(module, 'dependencies', []).difference(imported_module_names))
       
      mods[module_name] = {
                           'module': module,
                           'dependencies': dependencies,
                          }

    # resolve the dependencies
    while mods:
       change = False
       for module_name in mods.keys():
          mod = mods[module_name]
          mod['dependencies'].difference_update(imported_module_names)

          if not mod['dependencies']:
             self._register(mod['module'], module_name)
             del mods[module_name]
             change = True

       # missing or circular dependencies
       if not change and mods:
          deps = set()
          for d in [mod['dependencies'] for mod in mods.values()]:
             deps.update(d)
    
          raise Exception("Some modules (%s) couldn't be loaded due missing dependencies: %s" % (
                            str(mods.keys()),
                            str(deps)))
         

  def _register(self, module, module_name):
    ''' Register the imported module calling to its 'init' function, registering
        its 'cleanup' function to be called at exit and registering the module
        in an internal list. '''
    entry_point = getattr(module, 'init', None)
    if entry_point is None:
      raise Exception("No entry point (no 'init' method in the module)")

    gdb_module = entry_point()
     
    cleanup = getattr(gdb_module.cleanup, 'cleanup', None)
    if cleanup:
       self.cleanup_callbacks.append(noexception("Error in a cleanup method of a module/plugin")(cleanup))

    self.gdb_modules_by_name[module_name] = gdb_module
    return gdb_module


  def _cleanup(self):
    ''' Call to all the 'cleanup' functions of all the modules registered in the
        reverse order in which the modules were initialized and registered.

        After that, realize some internal clean up.
        This method should be called by the 'atexit' function of python at exit
        of the interpreter. '''
    self.cleanup_callbacks.reverse()

    for cleanup in self.cleanup_callbacks:
      cleanup() # protected by noexception decorator

    self.gdb_modules_by_name.clear() #remove all the links to each gdb module to free the resources

    '''
    try:
      self.publisher.close()
    except:
      pass # closed the publisher we cannot notify about the error
      ''' # is this our responsability???

__Loader = None

def initialize():
  global __Loader
  if __Loader is not None:
    raise ValueError("The GDB Module Loader is already loaded.")

  __Loader = _GDBModuleLoader()
  
def get_module_loader():
  global __Loader
  if __Loader is None:
    raise ValueError("The GDB Module Loader was not initialized.")

  return __Loader
