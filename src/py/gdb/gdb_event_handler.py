import gdb

import Queue
import functools
import os
import syslog

import contextlib
import traceback

from publish_subscribe.eventHandler import EventHandler as EH

# Import a lib necessary to implement a temporal workaround ---------------------------
# We need this as a workaround for the bug in GDB: https://sourceware.org/bugzilla/show_bug.cgi?id=17314
# This is based in the fix done in GDB for Guile in this patch: https://sourceware.org/git/gitweb.cgi?p=binutils-gdb.git;a=patch;h=92d8d229d9a310ebfcfc13bf4a75a286c1add1ac
try:
    ## TODO
    import sys
    sys.path.append('/home/martin/dummy/cdebug/python-signalfd-0.1/build/lib.linux-x86_64-2.7')
    import signalfd  # see https://launchpad.net/python-signalfd
except ImportError as e:
    raise ImportError("External lib 'signalfd' not found (version 0.1 or higher)!: %s" % str(e))
# END ---------------------------------------------------------------------------------

def noexception(error_message, return_value=None):
  '''Helper decorator for logging exceptions using the global GDBEventHandler instance.

     This wrapper will invoke the wrapped method and if an exception is thrown,
     this will be logged to the system's log (GDBEventHandler's _log method) and
     a copy of the message will be published to outside (GDBEventHandler's publish method).
    
     The message will be the concatenation of error_message and the traceback.
     See the GDBEventHandler's publish_error method)
     
     This wrapper will capture any exception and will discard them after logging the
     error. In these cases, the wrapper will return return_value as the result of the
     original method invokation.

     Precondition: the global event handler (GDBEventHandler) must be initialized first
     calling the 'initialize' function, otherwise, when this decorator call to
     '_get_global_event_handler' this will crash.
  '''
  def decorator(func):
    def wrapper(self, *args, **kargs):
      try:
        with publish_expection_context(error_message):
          return func(self, *args, **kargs)
      except:
        pass
      return return_value
    return wrapper
  return decorator

@contextlib.contextmanager
def publish_expection_context(error_message):
  try:
    yield 
  except:
    publisher = _get_global_event_handler()
    publisher.publish_and_log_exception("gdb-error", error_message)   # TODO try to catch the GDBModule

class _GDBEventHandler(EH):
  def __init__(self, gdb_id):
    # Workaround -----------------------------------------------------------------
    # We need this as a workaround for the bug in GDB: https://sourceware.org/bugzilla/show_bug.cgi?id=17314
    # This is based in the fix done in GDB for Guile in this patch: https://sourceware.org/git/gitweb.cgi?p=binutils-gdb.git;a=patch;h=92d8d229d9a310ebfcfc13bf4a75a286c1add1ac
    import signal
    previous_mask = signalfd.sigprocmask(signalfd.SIG_BLOCK, [signal.SIGCHLD, signal.SIGCONT, signal.SIGINT])
    try:
        EH.__init__(self, name="(gdb %s)" % gdb_id, as_daemon=True) # as_daemon=True otherwise GDB hangs
    finally:
        signalfd.sigprocmask(signalfd.SIG_SETMASK, previous_mask) # restore the mask for GDB
    # ----------------------------------------------------------------------------
        
    self.gdb_id = gdb_id
    self.queue = Queue.Queue(maxsize=1000000)

  def get_gdb_id(self):
    return self.gdb_id

  def _execute_callback(self, callback, data, t):
    '''Dont execute the callback right now, instead defer the execution of the event 
       and move it to the gdb event loop to be executed in some point in the future.

       This method can be running in a separate thread (async)'''
    event = functools.partial(self._execute_callback_in_gdb_loop, callback, data, t)
    gdb.post_event(lambda: self._handle_event_in_gdb_event_loop(event))
  
  @noexception(error_message="Internal error in the processing of the current or the previous queued events.")
  def _handle_event_in_gdb_event_loop(self, event):
    '''Handle this event. 
       If the target is running, defer the execution pushing this event into a 
       queue to be executed later.
       If the target is stopped, then it should be safe to execute the event
       now, but before, execute all the queued events and then this current event.
       
       This method should run in the main thread (gdb thread or gdb event loop)'''
    if self._is_target_stopped():
      last_event = event
      while True:
        try:
          event = self.queue.get_nowait()
        except Queue.Empty:
          break

        event()
        self.queue.task_done()

      last_event()
    else:
      self._put_event_into_queue(event)

  @noexception(error_message="Internal GDB's queue of events is full")
  def _put_event_into_queue(self, event):
    self.queue.put(event)
 
  @noexception(error_message="Error when trying to see if the target stopped", return_value=False)
  def _is_target_stopped(self):
    selected_thread = gdb.selected_thread()
    if selected_thread is not None and selected_thread.is_running():
      return False
    else:
      return True

  @noexception(error_message="Exception when executing a callback (processing a incoming event)")
  def _execute_callback_in_gdb_loop(self, callback, data, t):
    '''Execute the callback associated to the particular event with those data.

       This method should be executed in the gdb loop and with the target process
       stopped.

       This method also must warranty that no exception can be raised from here.'''
    callback(data)

  
  def publish_and_log(self, topic, severity, message):
    '''Log to syslog and publish an event, with the defined severity and topic.
       The message will be 'message'.
    '''
    assert isinstance(message, basestring)
    message = self._log(severity, message)
    self.publish(topic, message)


  def publish_and_log_exception(self, topic, error_message):
    '''Shortcut for logging errors. This method will log to syslog and publish an
       event using the publish method, with LOG_ERR severity.
       The final message will be the concatenation of the error_message and the
       current traceback.
    '''
    assert isinstance(error_message, basestring)
    message = error_message + traceback.format_exc()
    self.publish_and_log(topic, syslog.LOG_ERR, message)


__EV = None

def initialize():
  global __EV
  if __EV is not None:
    raise ValueError("The GDB Event Handler is already loaded.")

  gdb_id = os.getpid()
  __EV = _GDBEventHandler(gdb_id)
  
def _get_global_event_handler():
  global __EV
  if __EV is None:
    raise ValueError("The GDB Event Handler was not initialized.")

  return __EV
