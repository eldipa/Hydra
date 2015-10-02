DEPRECATED TESTS:
Lo que se ven en estos tests son el lanzamiento de un GDB, la carga de un ejecutable
y el cierre/limpieza de todo.
Estos tests son superados por los que se encuentran en gdb_thread_groups.rst.


Introduccion
------------

Gdb es uno de los debuggers mas usados y mas eficientes existentes en la
actualidad. En el proyecto actual se realizo un front-end del mismo. Como esta
compuesto y como utilizarlo se explica a continuacion

Estructura
----------

El modulo de gdb esta compuesto por tres partes. 
 - Objeto gdb
 - Proceso gdb
 - Thread OutputReader

Dependencias
------------

El modulo depende de *publish_subscribe* y de *gdb_mi*. Para poder ejecutar las
pruebas en primer lugar debemos dar de alta al servidor de *publish_subscribe*:

:: 
   >>> import os
   >>> import time
   >>> from subprocess import check_output
   >>> def is_running():
   ...   out = check_output(["python", "py/publish_subscribe/notifier.py", "status"])
   ...   return "running" in out
   >>> os.system("python py/publish_subscribe/notifier.py start")
   0
   >>> time.sleep(2) #esperamos que el servidor este andando.
   >>> is_running()
   True
   

Ademas se necesita un ejecutable que debuggear:

.. include:: ../src/cppTestCode/testExe.cpp
  :code: cpp



Creamos una funcion a llamar con cada evento generado por *outputReader*, vemos
que la salida cambie con cada llamada.

:: 

   >>> import threading, time 
   >>> shared_list = [] 
   >>> shared_lock = threading.Lock() 
   >>>                               
   >>> def add_sync(data): 
   ...   global shared_lock 
   ...   global shared_list 
   ... 
   ...   shared_lock.acquire() 
   ...   shared_list.append(data) 
   ...   shared_lock.release()
   >>> import publish_subscribe.eventHandler 
   >>> eventHandler = publish_subscribe.eventHandler.EventHandler()

Para instaciar un nuevo proceso gdb se debe hacer:

::
   >>> from gdb import gdb
   >>> gdbInstance = gdb.Gdb(log = False, inputRedirect = False)
   >>> gdbInstance.poll() #si no retorna resultado (none) quiere decir que esta corriendo
   >>> gdbId = gdbInstance.getSessionId()
   >>> gdbId > 0 
   True
   >>> eventHandler.subscribe("result-gdb." + str(gdbId), add_sync)
   >>> eventHandler.subscribe("stream-gdb." + str(gdbId), add_sync)
   >>> eventHandler.subscribe("notification-gdb." + str(gdbId), add_sync)
   >>> time.sleep(2)
   
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS 
   [{u'debugger-id': ...,
    u'klass': u'thread-group-added',
    u'last_stream_records': [],
    u'results': {u'id': u'...'},
    u'token': None, 
    u'type': u'Notify'}]
   
   
Para cargar un nuevo ejecutable en el entorno gdb:

::
   >>> gdbInstance.file("cppTestCode/testExe")
   >>> time.sleep(2)
   
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   [{u'debugger-id': ...,
      u'klass': u'thread-group-added',
      u'last_stream_records': [],
      u'results': {u'id': u'i1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'done',
      u'last_stream_records': [],
      u'results': {},
      u'token': None,
      u'type': u'Sync'},
     {u'debugger-id': ...,
      u'klass': u'done',
      u'last_stream_records': [],
      u'results': {},
      u'token': None,
      u'type': u'Sync'},
     {u'debugger-id': ..., u'stream': u'\n', u'type': u'Log'},
     {u'debugger-id': ...,
      u'klass': u'done',
      u'last_stream_records': [{u'stream': u'\n', u'type': u'Log'}],
      u'results': {},
      u'token': None,
      u'type': u'Sync'}]

   
      
Para realizar un run:


::

   >>> shared_list = []
   >>> gdbInstance.run()
   >>> time.sleep(8)
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    [{u'debugger-id': ...,
      u'stream': u'run > /tmp/SalidaAux.txt\n',
      u'type': u'Log'},
     {u'debugger-id': ...,
      u'stream': u'Starting program: .../src/cppTestCode/testExe > /tmp/SalidaAux.txt\n',
      u'type': u'Console'},
     {u'debugger-id': ...,
      u'klass': u'thread-group-started',
      u'last_stream_records': [],
      u'results': {u'id': u'i1', u'pid': u'...'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'thread-created',
      u'last_stream_records': [],
      u'results': {u'group-id': u'i1', u'id': u'1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'library-loaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'symbols-loaded': u'0',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'running',
      u'last_stream_records': [{u'stream': u'run > /tmp/SalidaAux.txt\n',
                                u'type': u'Log'},
                               {u'stream': u'Starting program: .../src/cppTestCode/testExe > /tmp/SalidaAux.txt\n',
                                u'type': u'Console'}],
      u'results': {},
      u'token': None,
      u'type': u'Sync'},
     {u'debugger-id': ...,
      u'klass': u'running',
      u'last_stream_records': [],
      u'results': {u'thread-id': u'all'},
      u'token': None,
      u'type': u'Exec'},
     {u'debugger-id': ...,
      u'klass': u'library-loaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'symbols-loaded': u'0',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'library-loaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'symbols-loaded': u'0',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'library-loaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'symbols-loaded': u'0',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'library-loaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'symbols-loaded': u'0',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'stream': u'[Inferior 1 (process ...) exited normally]\n',
      u'type': u'Console'},
     {u'debugger-id': ...,
      u'klass': u'thread-exited',
      u'last_stream_records': [],
      u'results': {u'group-id': u'i1', u'id': u'1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'thread-group-exited',
      u'last_stream_records': [],
      u'results': {u'exit-code': u'0', u'id': u'i1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'stopped',
      u'last_stream_records': [],
      u'results': {u'reason': u'exited-normally'},
      u'token': None,
      u'type': u'Exec'}]

   
   
      
 
Para salir:

::
   >>> shared_list = []
   >>> gdbInstance.exit() 
   >>> time.sleep(2)
   >>> gdbInstance.poll()
   0
   >>> shared_list  #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS   
   [{u'debugger-id': ..., u'stream': u'Quit\n', u'type': u'Log'},
     {u'debugger-id': ...,
      u'klass': u'exit',
      u'last_stream_records': [{u'stream': u'[Inferior 1 (process ...) exited normally]\n',
                                u'type': u'Console'},
                               {u'stream': u'Quit\n', u'type': u'Log'}],
      u'results': {},
      u'token': None,
      u'type': u'Sync'}]

   
     
   
   
   
::
   >>> eventHandler.close()
   >>> ##finalizo al server.
   >>> os.system("python py/publish_subscribe/notifier.py stop")
   0
   >>> is_running()
   False
