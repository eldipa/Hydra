Reiniciamos el sistema de eventos como en la primera parte:

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

::
   >>> from gdb import gdb

Eventos
-------

A continuacion se detalla el modo de uso de la clase gdb, a traves de eventos.
La creacion de cada instancia de Gdb no corresponde a la clase Gdb sino a la
clase GdbSpawmer, probaremos los comandos de un Gdb ya iniciado. Durante toda
la ejecucion el *outputReader* lanzara eventos bajo el topic "gdb.1234" (siendo
1234 el pid del proceso gdb).

::
   >>> gdbInstance = gdb.Gdb(log = True, debugPlugin = "stdioRedirect.py")
   >>> gdbInstance.file("cppTestCode/testExe")
   >>> gdbId = gdbInstance.getSessionId()
   >>> gdbId > 0
   True
   >>> eventHandler.subscribe("gdb." + str(gdbId), add_sync)
   >>> time.sleep(2)
   
Para colocar un breakpoint en una funcion:

:: 

   >>> shared_list = []
   >>> eventHandler.publish(str(gdbId) + ".break-funcion", "main")
   >>> time.sleep(2)

   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   [{u'klass': u'done',
      u'last_stream_records': [],
      u'results': {u'bkpt': {u'addr': u'0x...',
                             u'disp': u'keep',
                             u'enabled': u'y',
                             u'file': u'testExe.cpp',
                             u'fullname': u'.../src/cppTestCode/testExe.cpp',
                             u'func': u'main(int, char**)',
                             u'line': u'10',
                             u'number': u'1',
                             u'original-location': u'main',
                             u'thread-groups': [u'i1'],
                             u'times': u'0',
                             u'type': u'breakpoint'}},
      u'token': None,
      u'type': u'Sync'}]
    
   >>> shared_list = []
   
Para realizar un run:

::
   >>> eventHandler.publish(str(gdbId) + ".run", "")
   >>> time.sleep(8)
   
   >>> shared_list.sort()
   
   >>> shared_list[0] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   {u'stream': u'\n', u'type': u'Console'}
   
   >>> shared_list[1] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'\n', u'type': u'Console'}
   
   >>> shared_list[2] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'\n', u'type': u'Console'}
   
   >>> shared_list[3] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'\n', u'type': u'Console'}
   
   >>> shared_list[4] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'\n', u'type': u'Console'}
   
   >>> shared_list[5] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'\nBreakpoint ', u'type': u'Console'}
   
   >>> shared_list[6] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'$2 = ...', u'type': u'Console'}
   
   >>> shared_list[7] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'$3 = ...', u'type': u'Console'}
   
   >>> shared_list[8] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'$4 = ...', u'type': u'Console'}
   
   >>> shared_list[9] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'$6 = ...', u'type': u'Console'}
   
   >>> shared_list[10] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'$7 = ...', u'type': u'Console'}
   
   >>> shared_list[11] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'1, main (argc=1, argv=0x...) at testExe.cpp:10\n',
      u'type': u'Console'}
   
   >>> shared_list[12] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'10\t\tusleep(5000000);\n', u'type': u'Console'}
   
   >>> shared_list[13] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'Starting program: .../src/cppTestCode/testExe \n',
      u'type': u'Console'}
   
   >>> shared_list[14] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'stream': u'run \n', u'type': u'Log'}
   
   >>> shared_list[15] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'breakpoint-modified',
      u'last_stream_records': [],
      u'results': {u'bkpt': {u'addr': u'0x...',
                             u'disp': u'keep',
                             u'enabled': u'y',
                             u'file': u'testExe.cpp',
                             u'fullname': u'.../src/cppTestCode/testExe.cpp',
                             u'func': u'main(int, char**)',
                             u'line': u'10',
                             u'number': u'1',
                             u'original-location': u'main',
                             u'thread-groups': [u'i1'],
                             u'times': u'1',
                             u'type': u'breakpoint'}},
      u'token': None,
      u'type': u'Notify'}
   
   >>> shared_list[16] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'library-loaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'symbols-loaded': u'0',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'}
   
   >>> shared_list[17] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'library-loaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'symbols-loaded': u'0',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'}
   
   >>> shared_list[18] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'library-loaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'symbols-loaded': u'0',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'}
   
   >>> shared_list[19] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'library-loaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'symbols-loaded': u'0',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'}
   
   >>> shared_list[20] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'library-loaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'symbols-loaded': u'0',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'}
   
   >>> shared_list[21] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'running',
      u'last_stream_records': [],
      u'results': {u'thread-id': u'all'},
      u'token': None,
      u'type': u'Exec'}
   
   >>> shared_list[22] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'running',
      u'last_stream_records': [{u'stream': u'run \n', u'type': u'Log'},
                               {u'stream': u'Starting program: .../src/cppTestCode/testExe \n',
                                u'type': u'Console'}],
      u'results': {},
      u'token': None,
      u'type': u'Sync'}
   
   >>> shared_list[23] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'stopped',
      u'last_stream_records': [],
      u'results': {u'bkptno': u'1',
                   u'core': u'...',
                   u'disp': u'keep',
                   u'frame': {u'addr': u'0x...',
                              u'args': [{u'name': u'argc', u'value': u'1'},
                                        {u'name': u'argv',
                                         u'value': u'0x...'}],
                              u'file': u'testExe.cpp',
                              u'fullname': u'.../src/cppTestCode/testExe.cpp',
                              u'func': u'main',
                              u'line': u'10'},
                   u'reason': u'breakpoint-hit',
                   u'stopped-threads': u'all',
                   u'thread-id': u'1'},
      u'token': None,
      u'type': u'Exec'}
   
   >>> shared_list[24] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'thread-created',
      u'last_stream_records': [],
      u'results': {u'group-id': u'i1', u'id': u'1'},
      u'token': None,
      u'type': u'Notify'}
   
   >>> shared_list[25] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     {u'klass': u'thread-group-started',
      u'last_stream_records': [],
      u'results': {u'id': u'i1', u'pid': u'...'},
      u'token': None,
      u'type': u'Notify'}
   
   
   
   
   >>> shared_list = []

Para realizar un step-into:

::
   >>> eventHandler.publish(str(gdbId) + ".step-into", "")
   >>> time.sleep(2)
   
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   
     
   >>> shared_list = []
   
Para realizar un continue:

:: 
   >>> eventHandler.publish(str(gdbId) + ".continue", "")
   >>> time.sleep(10)
   
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   
  
   >>> shared_list = []
   
Para realizar un comando arbitrario:


::

   >>> eventHandler.publish(str(gdbId) + ".direct-command", "-break-insert usleep") 
   >>> time.sleep(5) 
   
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   
    
    >>> shared_list = []

 
   
Para realizar un exit:

::
   >>> eventHandler.publish(str(gdbId) + ".exit", "")
   >>> time.sleep(2)
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   


::
   >>> ##finalizo al server.
   >>> os.system("python py/publish_subscribe/notifier.py stop")
   0
   >>> is_running()
   False
  
