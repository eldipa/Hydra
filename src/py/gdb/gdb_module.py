from gdb_event_handler import _get_global_event_handler
import functools

class GDBModule(object):
  def __init__(self, uniq_module_name):
    self.uniq_module_name = uniq_module_name
    self._activated = False
  
    self.ev = _get_global_event_handler()

    # This is a subtopic of "stream-gdb.%i.console". This last is used to tag the output
    # of gdb itself. The messages of all the module should be seen as gdb output too.
    #
    # The object sent to this topic should be compatible with gdb_mi.Stream, which
    # represents a simple string.
    self.topic_for_log = "stream-gdb.%i.console.gdb-module.%s" % (self.ev.get_gdb_id(), uniq_module_name)

    # This is a subtopic of 'notification-gdb.%i.<<type>>'. This topic is used for
    # async notifications where <<type>> is defined later an is one of 
    #     ("Exec", "Status", "Notify")
    # The messages of this topic can have any form but they must have an attribute:
    #     data['debugger-id'] = self.ev.get_gdb_id()  for compatibility with others.
    self.topic_for_notification = "notification-gdb.%i.%s" % (
                                             self.ev.get_gdb_id(), 
                                             'gdb-module', # klass of gdb_mi.AsyncOutput
                                             )
    
    
    self.topic_for_notification += ".%s."  # the type of gdb_mi.AsyncOutput ("Exec", "Status", "Notify")
    self.topic_for_notification += uniq_module_name


    # Shortcuts to publish and log messages and exceptions using the correct
    # topic for this module running in this current gdb.
    #
    # Use them instead of the publish_and_log and publish_and_log_exception methods
    # of the global event handler.
    self.publish_and_log = functools.partial(self.ev.publish_and_log, self.topic_for_log)
    self.publish_and_log_exception = functools.partial(self.ev.publish_and_log_exception, self.topic_for_log)


  def activate(self, *args):
    raise NotImplementedError('Subclass responsability')

  def deactivate(self, *args):
    raise NotImplementedError('Subclass responsability')

  def status(self):
    return {'activated': self._activated}

  def are_activated(self):
    ''' Return True if the module is activated and should be doing something
        useful. If False, the module should not be doing anything. '''
    return self._activated

  def cleanup(self):
    ''' Override me to execute code when the module is unloaded. '''
    pass

  def notify(self, type, data):
    '''Shortcut to publish events using the module's topic notification (async).'''
    assert type in ("Exec", "Status", "Notify")

    data['debugger-id'] = self.ev.get_gdb_id() # for compatibility with others.
    return self.ev.publish(self.topic_for_notification % type, data)
    
