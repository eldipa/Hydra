Para probar el sistema de obtencion de variables utilizaremos el siguiente
codigo: 

.. include:: ../src/cppTestCode/multiplesPunteros.cpp 
   :code: cpp


Iniciamos el publicador

:: 
   >>> import os 
   >>> import time 
   >>> from subprocess import check_output 

   >>> def is_running(): 
   ...   out = check_output(["python","py/publish_subscribe/notifier.py", "status"]) 
   ...   return "running" in out

   >>> os.system("python py/publish_subscribe/notifier.py start") # doctest: +PASS

   >>> time.sleep(2) #esperamos que el servidor este andando. 
   >>> is_running() 
   True
   >>> import publish_subscribe.eventHandler 
   >>> eventHandler = publish_subscribe.eventHandler.EventHandler()
   

Iniciamos al gdbSpawmer, notar que le pasamos el flag para que acepte comandos
nuevos:

:: 
   >>> import gdb.gdbSpawmer 
   >>> spawmer = gdb.gdbSpawmer.GdbSpawmer(comandos = True) 
   
Lanzamos un nuevo gdb: 

:: 
   >>> gdbPid = spawmer.startNewProcessWithGdb("cppTestCode/multiplesPunteros") 
   >>> time.sleep(2)
   >>> gdbPid > 0 
   True
   >>> len(spawmer.listaGdb) == 1 
   True

Colocamos un breakpoint:

::
   >>> eventHandler.publish(str(gdbPid) + ".break-funcion", "multiplesPunteros.cpp:26") 
   >>> time.sleep(2)

Ejecutamos hasta el breakpoint:

::
   >>> eventHandler.publish(str(gdbPid) + ".run", "")
   >>> time.sleep(2)
   
Pedimos las variables:

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
   
   >>> eventHandler.subscribe("result-gdb." + str(gdbPid), add_sync)
   >>> eventHandler.subscribe("stream-gdb." + str(gdbPid), add_sync)
   >>> eventHandler.publish(str(gdbPid) + ".get-variables", "")
   >>> time.sleep(2)
   
   >>> shared_list[0] #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS 
   {u'debugger-id': ...
    u'klass': u'done',
    u'results': {u'variables': [{u'name': u'estructura',
                                 u'value': u'{enteroStruct = ..., floatStruct = ...}'},
                                {u'name': u'entero', u'value': u'0'},
                                {u'name': u'punteroEntero',
                                 u'value': u'0x...'},
                                {u'name': u'punteroClase',
                                 u'value': u'0x...'},
                                {u'name': u'punteroStruct',
                                 u'value': u'...'},
                                {u'arg': u'1',
                                 u'name': u'argc',
                                 u'value': u'1'},
                                {u'arg': u'1',
                                 u'name': u'argv',
                                 u'value': u'0x...'}]},
    u'token': None,
    u'type': u'Sync'}
    
    >>> shared_list = [] 
   
Como se observa hay una importante cantidad de punteros a los que hay que
acceder. De pedir uno por uno, se demoraria demasiado tiempo en las
comunicaciones. Esto puede provocar efectos indeseados en la vista (lag). Para
evaluar multiples valores de punteros se creo un nuevo comando de gdb que
muestra todos los valores en una sola linea (notar que los argumentos estan
separados por espacios en vez de comas):


:: 
   >>> eventHandler.publish(str(gdbPid) + ".evaluate-multiple-pointers", "punteroEntero punteroClase punteroStruct argv")
   >>> time.sleep(2)
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   [{u'debugger-id': ...
     u'stream': u'pointer-printer punteroEntero punteroClase punteroStruct argv\n',
     u'type': u'Log'},
    {u'debugger-id': ...
     u'stream': u'[ punteroEntero: 0 , 
                    punteroClase: {atributoEntero = 0, 
                                   atributoFloat = 0} , 
                    punteroStruct: {enteroStruct = ..., 
                                    floatStruct = ...} , 
                    argv: 0x... "..." ]\n',
     u'type': u'Console'},
    {u'debugger-id': ...
     u'klass': u'done', ...]


Limpieza:

::

   >>> spawmer.exit("all") 
   >>> spawmer.eliminarCola() 
   >>> ##finalizo al server. 
   >>> os.system("python py/publish_subscribe/notifier.py stop")  # doctest: +PASS
   >>> is_running() 
   False
