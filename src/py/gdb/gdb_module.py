from gdb_event_handler import _get_global_event_handler

class GDBModule(object):
  def __init__(self, uniq_module_name):
    self.uniq_module_name = uniq_module_name
    self._activated = False
  
    self.ev = _get_global_event_handler()

    self.topic_prefix = 'gdb-module.%i.%s' % (self.ev.get_gdb_id(), uniq_module_name)
    self.ev.subscribe(self.topic_prefix + '.activate', self.activate)
    self.ev.subscribe(self.topic_prefix + '.deactivate', self.deactivate)
    self.ev.subscribe(self.topic_prefix + '.status-request', self._request_status_handler)
    
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

  def publish(self, topic_posfix, *args, **kargs):
    '''Shortcut to publish events using the module's topic prefix.'''
    if not topic_posfix.startswith('.'):
      topic = '.'.join((self.topic_prefix, topic_posfix))
    else:
      topic = self.topic_prefix + topic_posfix

    return self.ev.publish(topic, *args, **kargs)

  def publish_log(self, severity, log_message, *args, **kargs):
    data = {'module': self.uniq_module_name}
    data.update(kargs.get('extra_data', {}))
    self.ev.publish_log(severity, log_message, *args, extra_data=data)

  def publish_exception(self, error_message):
    data = {'module': self.uniq_module_name}
    data.update(kargs.get('extra_data', {}))
    self.ev.publish_exception(error_message, extra_data=data)
    
  def _request_status_handler(self, *args):
    s = self.status()
    self.ev.publish(self.topic_prefix + '.status-response', s)
