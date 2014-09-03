El objetivo es ver si se puede realizar un seguimiento de los syscall mediante
el sistema de breakpoints. La idea es poner un breackpoint en la llamada de
cada syscall que queremos loguear, y mediante una funcion de python conectada
como un handler del evento 'stop' manejarlas.

Primero probamos de detectar un pipe:

El codigo usado es:

.. include:: ../src/cppTestCode/testVariables.cpp :code: cpp

Iniciamos el publicador

:: 
   >>> import os 
   >>> import time 
   >>> from subprocess import check_output 
   >>> def is_running(): 
   ...   out = check_output(["python","py/publish_subscribe/notifier.py", "status"]) 
   ...   return "running" in out
   >>> os.system("python py/publish_subscribe/notifier.py start") 
   0
   >>> time.sleep(2) #esperamos que el servidor este andando. 
   >>> is_running() 
   True
   >>> import publish_subscribe.eventHandler 
   >>> eventHandler = publish_subscribe.eventHandler.EventHandler()
   

Iniciamos al gdbSpawmer  

:: 
   >>> import gdb.gdbSpawmer 
   >>> spawmer = gdb.gdbSpawmer.GdbSpawmer(comandos = True) 
   
Lanzamos un nuevo gdb: 

:: 
   >>> gdbPid = spawmer.startNewProcessWithGdb("cppTestCode/ipcDetection") 
   >>> time.sleep(2)
   >>> gdbPid > 0 
   True
   >>> len(spawmer.listaGdb) == 1 
   True
   
Al instanciar al nuevo gdb ya se creo el breakpoint sobre pipe() vemos si gdb
imprimio el cartel "Se hizo Pipe":

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
   >>> eventHandler.subscribe("gdb." + str(gdbPid) , add_sync) #+ ".type.Console"
   
::
   >>> eventHandler.publish(str(gdbPid) + ".run", "")
   >>> time.sleep(2)
 
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS 
   [{u'stream': u'Starting program: .../src/cppTestCode/ipcDetection > Salida.txt\n',
      u'type': u'Console'},
     {u'stream': u'\nBreakpoint ', u'type': u'Console'},
     {u'stream': u'1, pipe () at ...\n',
      u'type': u'Console'},
     {u'stream': u'Se hizo Pipe\n', u'type': u'Console'},
     {u'stream': u'No hay informaci\xf3n disponible de la tabla de s\xedmbolos.\n',
      u'type': u'Console'},
     {u'stream': u'[Inferior 1 (process ...) exited normally]\n',
      u'type': u'Console'}]

Como vemos el cartel fue lanzado, por lo que la syscall fue detectada
exitosamente. Sin embargo, ya que gdb se detiene dentro de la funcion, y la
misma no fue compilada con el flag -g no tenemos acceso a los argumentos que se
le paso al syscall.


Limpieza: 

:: 
   >>> spawmer.exit("all") 
   >>> spawmer.eliminarCola() 
   >>> ##finalizo al server. 
   >>> os.system("python py/publish_subscribe/notifier.py stop") 
   0
   >>> is_running() 
   False
