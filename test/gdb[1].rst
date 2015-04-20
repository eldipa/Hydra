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
   >>> gdbInstance = gdb.Gdb(log = True, debugPlugin = "stdioRedirect.py")
   >>> gdbId = gdbInstance.getSessionId()
   >>> gdbId > 0 
   True
   >>> eventHandler.subscribe("gdb." + str(gdbId), add_sync)
   >>> time.sleep(2)
   
   >>> shared_list[0] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS 
   {u'klass': u'thread-group-added',
    u'last_stream_records': [],
    u'results': {u'id': u'...'},
    u'token': None, 
    u'type': u'Notify'}
   
   
Para cargar un nuevo ejecutable en el entorno gdb:

::
   >>> gdbInstance.file("cppTestCode/testExe")
   >>> time.sleep(2)
   
   >>> shared_list.sort() #No se puede garantizar el orden de los eventos, por lo que se ordenan para poder mostrarlos en este test
   
   >>> shared_list[0] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'\n', u'type': u'Log'}
   
   >>> shared_list[1] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'No hay tabla de s\xedmbolos cargada. Use la orden \xabfile\xbb.\n',
      u'type': u'Log'}
      
   >>> shared_list[2] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'fifo-register stdin /tmp/...\n', u'type': u'Log'}
   
   >>> shared_list[3] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'fifo-register stdout /tmp/...\n', u'type': u'Log'}
   
   >>> shared_list[4] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'python exec(open("./py/gdb/Plugins/stdioRedirect.py").read())\n',
      u'type': u'Log'}
   
   >>> shared_list[5] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'done',
      u'last_stream_records': [],
      u'results': {},
      u'token': None,
      u'type': u'Sync'}
      
   >>> shared_list[6] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'done',
      u'last_stream_records': [],
      u'results': {},
      u'token': None,
      u'type': u'Sync'}
      
   >>> shared_list[7] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'done',
      u'last_stream_records': [{u'stream': u'\n', u'type': u'Log'}],
      u'results': {},
      u'token': None,
      u'type': u'Sync'}
      
   >>> shared_list[8] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'done',
      u'last_stream_records': [{u'stream': u'fifo-register stdin /tmp/...\n',
                                u'type': u'Log'}],
      u'results': {},
      u'token': None,
      u'type': u'Sync'}
      
   >>> shared_list[9] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'done',
      u'last_stream_records': [{u'stream': u'fifo-register stdout /tmp/...\n',
                                u'type': u'Log'}],
      u'results': {},
      u'token': None,
      u'type': u'Sync'}
      
   >>> shared_list[10] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'done',
      u'last_stream_records': [{u'stream': u'python exec(open("./py/gdb/Plugins/stdioRedirect.py").read())\n',
                                u'type': u'Log'},
                               {u'stream': u'No hay tabla de s\xedmbolos cargada. Use la orden \xabfile\xbb.\n',
                                u'type': u'Log'}],
      u'results': {},
      u'token': None,
      u'type': u'Sync'}
      
   >>> shared_list[11] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'thread-group-added',
      u'last_stream_records': [],
      u'results': {u'id': u'i1'},
      u'token': None,
      u'type': u'Notify'}
      
Para realizar un run:


::

   >>> shared_list = []
   >>> gdbInstance.run()
   >>> time.sleep(8)
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   [...]
   
      
 
Para salir:

::
   >>> shared_list = []
   >>> gdbInstance.exit() 
   >>> print "salio"
   >>> time.sleep(2)
   >>> shared_list.sort()
   >>> gdbInstance.poll()
   0
   >>> shared_list[0]  #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'Quit\n', u'type': u'Log'}
   
   >>> shared_list[1]  #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'io-revert\n', u'type': u'Log'}
   
   >>> shared_list[2]  #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'done',
      u'last_stream_records': [{u'stream': u'Quit\n', u'type': u'Log'},
                               {u'stream': u'io-revert\n', u'type': u'Log'}],
      u'results': {},
      u'token': None,
      u'type': u'Sync'}
      
   >>> shared_list[3]  #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'exit',
      u'last_stream_records': [],
      u'results': {},
      u'token': None,
      u'type': u'Sync'}
   
   
   
::
   >>> ##finalizo al server.
   >>> os.system("python py/publish_subscribe/notifier.py stop")
   0
   >>> is_running()
   False
