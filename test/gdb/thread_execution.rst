::

   >>> import sys
   >>> sys.path.append("../src/py/")

   >>> from shortcuts import start_notifier, stop_notifier, request, collect
   >>> start_notifier("../src/py/publish_subscribe/")

   >>> BIN="../src/cppTestCode/threads/two_pthreads"

::

   >>> from publish_subscribe.eventHandler import EventHandler
   >>> EH = EventHandler(name="TheTest")
   
   >>> @collect
   ... def collector(data):
   ...   if data['klass'] == u'library-loaded' or data['klass'].startswith('breakpoint-') \
   ...         or data['klass'].startswith("thread-group"):
   ...      return None # discard
   ...   return data
   
   >>> EH.subscribe('notification-gdb', collector)

   
::

   >>> from gdb.gdb import Gdb
   >>> gdb = Gdb()
   >>> import time

   >>> request(gdb, "-file-exec-and-symbols", [BIN])        # doctest: +PASS
   >>> time.sleep(3)
   >>> request(gdb, "-break-insert", ["roll"])              # doctest: +PASS
   >>> time.sleep(3)
   >>> request(gdb, "-exec-run", [])                        # doctest: +PASS
   
   >>> collector.get_next()                                 # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'thread-created',
    u'results': {u'group-id': u'i1', u'id': u'1'},
    u'token': None,
    u'type': u'Notify'}

   >>> collector.get_next()                                 # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'running',
    u'results': {u'thread-id': u'all'},
    u'token': None,
    u'type': u'Exec'}
   
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'thread-created',
    u'results': {u'group-id': u'i1', u'id': u'2'},
    u'token': None,
    u'type': u'Notify'}
   
   >>> collector.get_next()                                 # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'running',
    u'results': {u'thread-id': u'all'},
    u'token': None,
    u'type': u'Exec'}

   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'stopped',
    u'results': {...
                 u'frame': {...
                            u'file': u'two_pthreads.c',
                            u'fullname': u'.../two_pthreads.c',
                            u'func': u'roll',
                            u'line': u'5'},
                 u'reason': u'breakpoint-hit',
                 u'stopped-threads': u'all',
                 u'thread-id': u'2'},
    u'token': None,
    u'type': u'Exec'}

   >>> request(gdb, "-exec-step", ["--thread 2"])                        # doctest: +PASS
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': 

::

   >>> gdb.shutdown()
   0

   >>> stop_notifier("../src/py/publish_subscribe/")
