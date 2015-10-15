Iniciamos:

::

   >>> import sys
   >>> sys.path.append("../src/py/")

   >>> from shortcuts import start_notifier, stop_notifier, request, collect
   >>> start_notifier("../src/py/publish_subscribe/")

   >>> BIN="../src/cppTestCode/threads/two_pthreads"

Creamos un debugger y recolectaremos sus eventos (aunque filtraremos algunos)

::

   >>> from publish_subscribe.eventHandler import EventHandler
   >>> EH = EventHandler(name="TheTest")
   
   >>> @collect
   ... def collector(data):
   ...   if data['klass'] == u'library-loaded' or data['klass'].startswith('breakpoint-') \
   ...         or data['klass'].startswith("thread-group") or data['klass'].startswith('cmd-param-changed'):
   ...      return None # discard
   ...   return data
   
   >>> EH.subscribe('notification-gdb', collector)

   >>> import time
   >>> from gdb.gdb import Gdb
   >>> gdb = Gdb()


Configuramos a GDB en modo 
    - non-stop: hace que si un thread se frena, el resto de los hilos del proceso no.
    - target-async: hace que cuando el current thread de GDB se frena, GDB aun pueda seguir
      aceptando, y en lo posible, procesando requests.

::

   >>> request(gdb, "set non-stop on", [])                     # doctest: +PASS
   >>> request(gdb, "set target-async on", [])                 # doctest: +PASS

Cargamos un executable que tendra 2 hilos, el principal (funcion main) y el thread 2 (funcion roll)
Ponemos un breakpoint al principio del al funcion roll y otro antes de un join en la funcion
main (linea ~14).

::

   >>> request(gdb, "-file-exec-and-symbols", [BIN])        # doctest: +PASS
   >>> request(gdb, "-break-insert", ["roll"])              # doctest: +PASS
   >>> request(gdb, "-break-insert", ["14"])                # doctest: +PASS
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
    u'results': {u'thread-id': u'1'},
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
    u'results': {u'thread-id': u'2'},
    u'token': None,
    u'type': u'Exec'}

   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'stopped',...
   
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'stopped',...

Ahora, ambos threads deberian estar frenados debido a cada uno de los breakpoints.

::

   >>> request(gdb, "-thread-info", [])       # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'results': {u'current-thread-id': ...,
                 u'threads': [{u'core': ...,
                               u'id': u'2',
                               u'name': u'...',
                               u'state': u'stopped',
                               ...
                               u'id': u'1',
                               u'name': u'...',
                               u'state': u'stopped',
                               u'target-id': u'...'}]},
    u'token': ...,
    u'type': u'Sync'}

Si le damos continue al thread 1, solo este se quedara en running.
Si bien sera el thread 1 quien el current thread de GDB, dado que estamos en modo target-async
aun podremos hablarle a GDB

::

   >>> request(gdb, "-exec-continue", ["--thread 1"])                        # doctest: +PASS
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'running',
    u'results': {u'thread-id': u'1'},
    ...}
   
   >>> request(gdb, "-thread-info", [])       # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'results': {u'current-thread-id': ...,
                 u'threads': [{u'core': ...,
                               u'id': u'2',
                               u'name': u'...',
                               u'state': u'stopped',
                               ...
                               u'id': u'1',
                               u'name': u'...',
                               u'state': u'running',
                               u'target-id': u'...'}]},
    u'token': ...,
    u'type': u'Sync'}

Veamos de hacer un step. Esto deberia poner en running al thread 2 y luego stoppearlo.
Dado que estamos en modo non-stop, solo el thread 2 se frenara mientras que el thread 1
seguira en running.

Lo mismo si hacemos un next.

::

   >>> request(gdb, "-exec-step", ["--thread 2"])                        # doctest: +PASS
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'running',
    u'results': {u'thread-id': u'2'},
    ...}

   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'stopped',
    u'results': {u'core': u'...',
                 u'frame': {u'addr': u'...',
                            u'args': [{u'name': u'cookie',
                                       u'value': u'...'}],
                            u'file': u'two_pthreads.c',
                            u'fullname': u'...threads/two_pthreads.c',
                            u'func': u'roll',
                            u'line': u'6'},
                 u'reason': u'end-stepping-range',
                 u'stopped-threads': [u'2'],
                 u'thread-id': u'...'},
    u'token': None,
    u'type': u'Exec'}
   
   >>> request(gdb, "-thread-info", [])       # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'results': {u'current-thread-id': ...,
                 u'threads': [{u'core': ...,
                               u'id': u'2',
                               u'name': u'...',
                               u'state': u'stopped',
                               ...
                               u'id': u'1',
                               u'name': u'...',
                               u'state': u'running',
                               u'target-id': u'...'}]},
    u'token': ...,
    u'type': u'Sync'}

   >>> request(gdb, "-exec-next", ["--thread 2"])                        # doctest: +PASS
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'running',
    u'results': {u'thread-id': u'2'},
    ...}

   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'stopped',
    ...}
   
   >>> request(gdb, "-thread-info", [])       # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'results': {u'current-thread-id': ...,
                 u'threads': [{u'core': ...,
                               u'id': u'2',
                               u'name': u'...',
                               u'state': u'stopped',
                               ...
                               u'id': u'1',
                               u'name': u'...',
                               u'state': u'running',
                               u'target-id': u'...'}]},
    u'token': ...,
    u'type': u'Sync'}
   
A pesar de que el thread 1 sigue corriendo, lo podemos interrumpir:

::

   >>> request(gdb, "-exec-interrupt", ["--thread 1"])                        # doctest: +PASS
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'stopped',
    u'results': {u'core': u'...',
                 u'frame': {u'addr': u'0x...',
                            u'args': [],
                            u'func': u'...'},
                 u'reason': u'signal-received',
                 u'signal-meaning': u'Signal 0',
                 u'signal-name': u'0',
                 u'stopped-threads': [u'1'],
                 u'thread-id': u'...'},
    u'token': None,
    u'type': u'Exec'}

   >>> request(gdb, "-thread-info", [])       # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'results': {u'current-thread-id': ...,
                 u'threads': [{u'core': ...,
                               u'id': u'2',
                               u'name': u'...',
                               u'state': u'stopped',
                               ...
                               u'id': u'1',
                               u'name': u'...',
                               u'state': u'stopped',
                               u'target-id': u'...'}]},
    u'token': ...,
    u'type': u'Sync'}

Podemos ahora darle un continue a ambos threads. Asi, el proceso terminara.

::

   >>> request(gdb, "-exec-continue", ["--all"])                        # doctest: +PASS
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'running',
    ...}

   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'running',
    ...}

   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'thread-exited',
    ...}

   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'thread-exited',
    ...}

   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'stopped',
    u'results': {u'exit-code': u'01', u'reason': u'exited'},
    u'token': None,
    u'type': u'Exec'}

En general, los comandos next, continue, step reciben parametros que definen sobre que thread(s)
actuan.
Estos son:
  --thread T
  --thread-group TG
  --all
Ver la documentacion y el codigo de la funcion  mi_cmd_execute de GDB.
Este es un extracto:

    - "Cannot specify --thread-group together with --all"
    - "Cannot specify --thread together with --all"
    - "Cannot specify --thread together with --thread-group"
    - "Cannot specify --frame without --thread"

    "if --thread-group option identifies
     an inferior with multiple threads, then a random one will be
     picked.  This is not a problem -- frontend should always
     provide --thread if it wishes to operate on a specific
     thread."

::

   >>> gdb.shutdown()
   0

   >>> stop_notifier("../src/py/publish_subscribe/")

