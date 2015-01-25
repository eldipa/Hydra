from frozenconfigparser import FrozenConfigParser
import sys, os

__CONFIG = None

def load_global_config():
   global __CONFIG
   if __CONFIG is not None:
      raise ValueError("The global configuration is already loaded.")
   
   
   # TODO This shouldn't be hardcoded!
   script_home = os.path.abspath(os.path.dirname(__file__))
   parent = os.path.pardir

   config_file = os.path.join(script_home, parent, parent, "config", "concudebug.cfg")

   __CONFIG = FrozenConfigParser(
            optionxform = str, 
            filename_of_defaults = config_file)

def get_global_config():
   if __CONFIG is None:
      raise ValueError("The global configuration is NOT loaded yet.")
   return __CONFIG 
