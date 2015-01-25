import ConfigParser
import collections
import StringIO
import contextlib

class FrozenConfigParser(object):
   def __init__(self, 
            defaults=None, dict_type=collections.OrderedDict, allow_no_value=False, 
            optionxform=None, 
            filename_of_defaults = None, filenames_of_potential_configs = None,
            interpolate=True):
      ''' Create a RawConfigParser parser (or a SafeConfigParser parser if 'interpolate'
          is True).
          The parser created will receive 'defaults', 'dict_type' and 'allow_no_value'
          as its parameters. (See the constructors' doc of RawConfigParser/SafeConfigParser)

          Optionally, you can change function used to transform the option's name with
          'optionxform'. (See the method's doc 'optionxform' of ConfigParser)

          Then, the file 'filename_of_defaults' will be read with the 'readfp' method
          of the parser. If this fails, all the construction of FrozenConfigParser 
          will fail. (See the method's doc 'readfp' of ConfigParser)

          Then, the file or files in 'filenames_of_potential_configs' will be read
          with the 'read' method. If one file cannot be open, its reading is skipped.
          (See the method's doc 'read' of ConfigParser)
      
          After the creation of this FrozenConfigParser instance, the object
          will offer the same interface that RawConfigParser/SafeConfigParser but
          with one exception: all the methods that allow the modificacion of the parser
          were removed and will not be available. All the data returned by this
          object is constant.
          '''
          
      cls = ConfigParser.SafeConfigParser if interpolate else ConfigParser.RawConfigParser
      self._config_parser = cls(defaults, dict_type, allow_no_value)
      self._dict_type = dict_type
 
      if optionxform:
         self._config_parser.optionxform = optionxform

      # read the data from the file/files. First using 'readfp' and then using 'read'.
      # See the doc of ConfigParser for the reason of this.
      self.readed_filenames = []
      if filename_of_defaults:
         with open(filename_of_defaults, 'r') as cfg_file:
            self._config_parser.readfp(cfg_file, filename_of_defaults)
            self.readed_filenames.append(filename_of_defaults)

      if filenames_of_potential_configs:
         self.readed_filenames.extend(self._config_parser.read(filenames_of_potential_configs))

      # borrow methods to avoid indirections
      self.has_section = self._config_parser.has_section
      self.sections = self._config_parser.sections
      
      self.has_option = self._config_parser.has_option
      self.options = self._config_parser.options
      
      self.items = self._config_parser.items

      self.get = self._config_parser.get
      self.getint = self._config_parser.getint
      self.getfloat = self._config_parser.getfloat
      self.getboolean = self._config_parser.getboolean
      

   def defaults(self):
      ''' Returns a copy of the defaults dictionary. See the help of the method
          'defaults' of RawConfigParser or SafeConfigParser.'''
      return self._dict_type(self._config_parser.defaults())
   
   def __repr__(self):
      with contextlib.closing(StringIO.StringIO()) as buf:
         self._config_parser.write(buf)
         return buf.getvalue()
