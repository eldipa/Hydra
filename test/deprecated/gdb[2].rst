DEPRECATED TESTS:
Lo que se ven en estos tests son el lanzamiento de un GDB, la carga de un ejecutable
y el cierre/limpieza de todo. Ademas, el uso de breakpoints y de los comandos step y continue.
Estos tests son superados por los que se encuentran en gdb_thread_groups.rst y en gdb_breakpoints.rst.

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

Para realizar un attach de un proceso ya andando:

:: 
   >>> shared_list = []
   >>> import subprocess 
   >>> p = subprocess.Popen("cppTestCode/testExe")
   >>> p.pid > 0 
   True
   >>> gdbInstance = gdb.Gdb(log = False, inputRedirect = False ,debugPlugin = None)
   >>> gdbId = gdbInstance.getSessionId()
   >>> gdbId > 0 
   True
   >>> eventHandler.subscribe("result-gdb." + str(gdbId), add_sync)
   >>> eventHandler.subscribe("stream-gdb." + str(gdbId), add_sync)
   >>> eventHandler.subscribe("notification-gdb." + str(gdbId), add_sync)
   >>> gdbInstance.attach(p.pid) 
   >>> time.sleep(2)
   
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    [{u'debugger-id': ...,
      u'klass': u'thread-group-added',
      u'last_stream_records': [],
      u'results': {u'id': u'i1'},
      u'token': None,
      u'type': u'Notify'},
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
      u'klass': u'done',
      u'last_stream_records': [],
      u'results': {},
      u'token': None,
      u'type': u'Sync'},
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
      u'stream': u'0x... in __kernel_vsyscall ()\n',
      u'type': u'Console'},
     {u'debugger-id': ...,
      u'klass': u'stopped',
      u'last_stream_records': [],
      u'results': {u'core': u'...',
                   u'frame': {u'addr': u'0x...',
                              u'args': [],
                              u'func': u'__kernel_vsyscall'},
                   u'stopped-threads': u'all',
                   u'thread-id': u'1'},
      u'token': None,
      u'type': u'Exec'}]

     
   
   
   >>> shared_list = []
   
Para colocar un nuevo breakpoint en una funcion:

::
    >>> gdbInstance.setBreakPoint("main")
    >>> time.sleep(2)
    >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
     [{u'debugger-id': ...,
      u'klass': u'done',
      u'last_stream_records': [{u'stream': u'0x... in __kernel_vsyscall ()\n',
                                u'type': u'Console'}],
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
   >>> gdbInstance.run()
   >>> time.sleep(8)
   
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   [{u'debugger-id': ...,
      u'stream': u'run > /tmp/SalidaAux.txt\n',
      u'type': u'Log'},
     {u'debugger-id': ...,
      u'stream': u'The program being debugged has been started already.\nStart it from the beginning? ',
      u'type': u'Console'},
     {u'debugger-id': ...,
      u'stream': u'(y or n) [answered Y; input not from terminal]\n',
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
      u'results': {u'id': u'i1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'library-unloaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'library-unloaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'library-unloaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'library-unloaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'},
     {u'debugger-id': ...,
      u'klass': u'library-unloaded',
      u'last_stream_records': [],
      u'results': {u'host-name': u'...',
                   u'id': u'...',
                   u'target-name': u'...',
                   u'thread-group': u'i1'},
      u'token': None,
      u'type': u'Notify'},
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
                               {u'stream': u'The program being debugged has been started already.\nStart it from the beginning? ',
                                u'type': u'Console'},
                               {u'stream': u'(y or n) [answered Y; input not from terminal]\n',
                                u'type': u'Console'},
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
      u'klass': u'thread-selected',
      u'last_stream_records': [],
      u'results': {u'id': u'1'},
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
      u'klass': u'breakpoint-modified',
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
      u'type': u'Notify'},
     {u'debugger-id': ..., u'stream': u'\nBreakpoint ', u'type': u'Console'},
     {u'debugger-id': ...,
      u'stream': u'1, main (argc=1, argv=0x...) at testExe.cpp:10\n',
      u'type': u'Console'},
     {u'debugger-id': ...,
      u'stream': u'10\t\tusleep(5000000);\n',
      u'type': u'Console'},
     {u'debugger-id': ...,
      u'klass': u'stopped',
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
      u'type': u'Exec'}]
   
   
     
   >>> shared_list = []


Para realizar un step-into:

::
   >>> gdbInstance.stepInto()
   >>> time.sleep(7)
   
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   [{u'debugger-id': ...,
      u'klass': u'running',
      u'last_stream_records': [{u'stream': u'\nBreakpoint ',
                                u'type': u'Console'},
                               {u'stream': u'1, main (argc=1, argv=0x...) at testExe.cpp:10\n',
                                u'type': u'Console'},
                               {u'stream': u'10\t\tusleep(5000000);\n',
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
      u'klass': u'stopped',
      u'last_stream_records': [],
      u'results': {u'core': u'...',
                   u'frame': {u'addr': u'0x...',
                              u'args': [{u'name': u'argc', u'value': u'1'},
                                        {u'name': u'argv',
                                         u'value': u'0x...'}],
                              u'file': u'testExe.cpp',
                              u'fullname': u'.../src/cppTestCode/testExe.cpp',
                              u'func': u'main',
                              u'line': u'13'},
                   u'reason': u'end-stepping-range',
                   u'stopped-threads': u'all',
                   u'thread-id': u'1'},
      u'token': None,
      u'type': u'Exec'}]

   
   
   

   >>> shared_list = []
   
Para realizar un continue:

::
   >>> gdbInstance.continueExec()
   >>> time.sleep(2)
   
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   [{u'debugger-id': ...,
      u'klass': u'running',
      u'last_stream_records': [],
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

      
   >>> shared_list = []
   

   
::
   >>> gdbInstance.exit()

   >>> time.sleep(2)

   >>> #El error que figura aca, se debe a que se intenta realizar un detach del programa attachado, 
   >>> #una vez que este finalizo. Es un error que no trae problemas, salvo el cartel.
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   [{u'debugger-id': ..., u'stream': u'Quit\n', u'type': u'Log'},
     {u'debugger-id': ...,
      u'klass': u'error',
      u'last_stream_records': [{u'stream': u'[Inferior 1 (process ...) exited normally]\n',
                                u'type': u'Console'},
                               {u'stream': u'Quit\n', u'type': u'Log'}],
      u'results': {u'msg': u'...'},
      u'token': None,
      u'type': u'Sync'},
     {u'debugger-id': ...,
      u'klass': u'exit',
      u'last_stream_records': [],
      u'results': {},
      u'token': None,
      u'type': u'Sync'}]
   
   

::
   >>> ##finalizo al server.
   >>> os.system("python py/publish_subscribe/notifier.py stop")
   0
   >>> is_running()
   False
