import gdb

from gdb_event_handler import _get_global_event_handler
from gdb_event_handler import noexception 
import functools, syslog

class GDBModule(object):
  def __init__(self, uniq_module_name, is_activated_by_default=False):
    self.uniq_module_name = uniq_module_name
    self._activated = is_activated_by_default

    self.registered_commands = {}
  
    self.ev = _get_global_event_handler()

    # Topic 
    #   stream-gdb.<<gdb id>>.console.gdb-module.<<module name>>
    #
    # This is a subtopic of "stream-gdb.%i.console". This last is used to tag the output
    # of gdb itself. The messages of all the modules should be seen as gdb output too.
    #
    # The object sent to this topic should be compatible with gdb_mi.Stream, which
    # represents a simple string.
    self.topic_for_log = "stream-gdb.%i.console.gdb-module.%s" % (self.ev.get_gdb_id(), uniq_module_name)

    # Topic:
    #   notification-gdb.<<gdb id>>.gdb-module.<<type>>.<<module name>>
    #
    # This is a subtopic of 'notification-gdb.<<gdb id>>.gdb-module.<<type>>'. 
    # This topic is used for async notifications where <<type>> is defined later and is one of 
    #     ("Exec", "Status", "Notify")
    # The messages of this topic can have any form but they must have an attribute:
    #     data['debugger-id'] = self.ev.get_gdb_id()  for compatibility with others.
    self.topic_for_notification = "notification-gdb.%i.%s" % (
                                             self.ev.get_gdb_id(), 
                                             'gdb-module', # we set 'gdb-module' as the klass of gdb_mi.AsyncOutput
                                             )
    
    self.topic_for_notification += ".%s."  # this parameter will be the type of gdb_mi.AsyncOutput ("Exec", "Status", "Notify")
    self.topic_for_notification += uniq_module_name


    # Shortcuts to publish and log messages and exceptions using the correct
    # topic for this module running in this current gdb.
    #
    # Use them instead of the publish_and_log and publish_and_log_exception methods
    # of the global event handler.
    #
    # Use self.publish_and_log to log some useful info. (INFO level)
    # Use self.publish_and_log_exception to log errors and exceptions
    # Use self.DEBUG to publish and log debug info (aka debugging prints) (DEBUG level)
    # All of those methods will be publishing with the topic self.topic_for_log
    #
    # To publish events like results or other important data (not logging), use
    # the method self.notify instead. This will be publishing with the topic self.topic_for_notification
    self.publish_and_log = functools.partial(self.ev.publish_and_log, self.topic_for_log, syslog.LOG_INFO)
    self.publish_and_log_exception = functools.partial(self.ev.publish_and_log_exception, self.topic_for_log)
    self.DEBUG = functools.partial(self.ev.publish_and_log, self.topic_for_log, syslog.LOG_DEBUG)


    # Register the three common commands to control this module (see self.register_gdb_command_from)
    self.register_gdb_command_from(self.activate)
    self.register_gdb_command_from(self.deactivate)
    self.register_gdb_command_from(self.status)


  def activate(self, *args):
    raise NotImplementedError('Subclass responsability')

  def deactivate(self, *args):
    raise NotImplementedError('Subclass responsability')

  def status(self):
    self.notify("Status", {'activated': self._activated})

  def are_activated(self):
    ''' Return True if the module is activated and should be doing something
        useful. If False, the module should not be doing anything. '''
    return self._activated

  def cleanup(self):
    ''' Override me to execute code when the module is unloaded. '''
    pass

  def notify(self, type, data):
    '''Shortcut to publish events using the module's topic notification (async).
       
       These are the possible types of notifications:
         Exec: contains asynchronous state change on the target (stopped, 
              started, disappeared). 
         Status: contains on-going status information about the progress 
              of a slow operation. It can be discarded.
         Notify: contains supplementary information that the client 
              should handle (e.g., a new breakpoint information).
    
    '''
    assert type in ("Exec", "Status", "Notify")
    assert isinstance(data, dict)

    data['debugger-id'] = self.ev.get_gdb_id() # for compatibility with others.
    return self.ev.publish(self.topic_for_notification % type, data)
    

  def register_gdb_command_from(self, bound_method):
    ''' Register the invokation of the bound method as a GDB's command,
        so you can call this method using the CLI.

        Because issues in the implementation, this will work on only one instance:
        if you call register_gdb_command_from on the bound method self.foo over two
        different instances self_1 and self_2, the command created will calls to
        the last method used in the last invokation of register_gdb_command_from.

        The GDB's command will have the form gdb-module-<<module name>>-<<method name>>.
        '''
    command_name = "gdb-module-%s-%s" % (self.uniq_module_name, 
                                         bound_method.__name__)
    class _command(gdb.Command):
      def __init__(cmdself):
          super(_command, cmdself).__init__(command_name, gdb.COMMAND_DATA)

      @noexception("Error when executing the command %s" % command_name, None)
      def invoke(cmdself, args, from_tty):            
          cmdself.dont_repeat()
          argv = gdb.string_to_argv(args)
          return bound_method(*argv)

    if command_name in self.registered_commands:
      raise KeyError("The command '%s' is already registered." % command_name)

    self.registered_commands[command_name] = _command()
