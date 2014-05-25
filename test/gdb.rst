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
   ...   out = check_output(["python", "publish_subscribe/billboard.py", "status"])
   ...   return "running" in out
   >>> os.system("python publish_subscribe/billboard.py start")
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
   >>> gdbInstance = gdb.Gdb()
   >>> gdbId = gdbInstance.getSessionId()
   >>> gdbId > 0 
   True
   >>> eventHandler.subscribe("pid." + str(gdbId), add_sync)
   >>> time.sleep(2)
   >>> shared_list[0]['klass'] == 'thread-group-added' #Gdb iniciado
   True
   
Para cargar un nuevo ejecutable en el entorno gdb:

::
   >>> gdbInstance.file("../cppTestCode/testExe")
   >>> time.sleep(2)
   >>> shared_list[1]['klass'] == 'done' #DONE debido a la carga del exe
   True
   >>> shared_list[2]['klass'] == 'done' #DONE debido a el set del LD_PRELOAD
   True
 
Para salir:

::
   >>> gdbInstance.exit() 
   >>> time.sleep(2)
   >>> shared_list[3]['klass'] == 'exit'
   True
   
Para realizar un attach de un proceso ya andando:

:: 
   >>> shared_list = []
   >>> import subprocess 
   >>> p = subprocess.Popen("../cppTestCode/testExe")
   >>> p.pid > 0 
   True
   >>> gdbInstance = gdb.Gdb()
   >>> gdbId = gdbInstance.getSessionId()
   >>> gdbId > 0 
   True
   >>> eventHandler.subscribe("pid." + str(gdbId), add_sync)
   >>> gdbInstance.attach(p.pid) 
   >>> time.sleep(2)
   >>> shared_list[0]['klass'] == 'thread-group-added'
   True
   >>> shared_list[1]['klass'] == 'thread-group-started'
   True
   >>> shared_list[2]['klass'] == 'thread-created'
   True
   >>> shared_list[3]['klass'] == 'library-loaded'
   True
   >>> shared_list[4]['klass'] == 'library-loaded'
   True
   >>> shared_list[5]['klass'] == 'library-loaded'
   True
   >>> shared_list[6]['klass'] == 'library-loaded'
   True
   >>> shared_list[7]['klass'] == 'library-loaded'
   True
   >>> shared_list[8]['klass'] == 'stopped'
   True
   >>> shared_list[9]['klass'] == 'done'
   True
   >>> shared_list = []
   
Para colocar un nuevo breakpoint en una funcion:

::
    >>> gdbInstance.setBreakPoint("main")
    >>> time.sleep(2)
    >>> shared_list[0]['klass'] == 'done'
    True
    >>> shared_list[0]['results']['bkpt']['enabled'] == 'y'
    True
    >>> shared_list[0]['results']['bkpt']['file'] == 'testExe.cpp'
    True
    >>> shared_list[0]['results']['bkpt']['line'] == '10'
    True
    >>> shared_list = []
    
Para realizar un run:

::
   >>> gdbInstance.run()
   >>> time.sleep(10)
   >>> shared_list[0]['stream'] == 'run > Salida.txt\n'
   True
   >>> shared_list[1]['stream'] == 'The program being debugged has been started already.\nStart it from the beginning? '
   True
   >>> shared_list[2]['stream'] == '(y or n) [answered Y; input not from terminal]\n'
   True
   >>> shared_list[3]['klass'] == 'thread-exited'
   True
   >>> shared_list[4]['klass'] == 'thread-group-exited'
   True
   >>> shared_list[5]['klass'] == 'library-unloaded'
   True
   >>> shared_list[6]['klass'] == 'library-unloaded'
   True
   >>> shared_list[7]['klass'] == 'library-unloaded'
   True
   >>> shared_list[8]['klass'] == 'library-unloaded'
   True
   >>> shared_list[9]['klass'] == 'library-unloaded'
   True
   >>> shared_list[10]['type'] == 'Console' # Starting program (stream)
   True
   >>> shared_list[11]['klass'] == 'thread-group-started'
   True
   >>> shared_list[12]['klass'] == 'thread-created'
   True
   >>> shared_list[13]['klass'] == 'running'
   True
   >>> shared_list[14]['klass'] == 'running'
   True
   >>> shared_list[15]['klass'] == 'library-loaded'
   True
   >>> shared_list[16]['klass'] == 'library-loaded'
   True
   >>> shared_list[17]['klass'] == 'library-loaded'
   True
   >>> shared_list[18]['klass'] == 'library-loaded'
   True
   >>> shared_list[19]['klass'] == 'library-loaded'
   True
   >>> shared_list[20]['klass'] == 'breakpoint-modified'
   True
   >>> shared_list[21]['stream'] == '\nBreakpoint '
   True
   >>> shared_list[22]['type'] == 'Console' ##('1, main (argc=1, argv=0xbffff2f4) at testExe.cpp:10\n')
   True
   >>> shared_list[23]['stream'] == '10\t\tusleep(5000000);\n'
   True
   >>> shared_list[24]['output']['klass'] == 'stopped' #output
   True
   >>> shared_list[25]['klass'] == 'stopped' and shared_list[25]['results']['frame']['file'] == 'testExe.cpp' and shared_list[25]['results']['frame']['line'] == '10'
   True
   >>> shared_list[26]['klass'] == 'thread-selected'
   True
   >>> shared_list = []


Para realizar un step-into:

::
   >>> gdbInstance.stepInto()
   >>> time.sleep(2)
   >>> shared_list[0]['klass'] == 'running'
   True
   >>> shared_list[1]['klass'] == 'running'
   True
   >>> shared_list[2]['output']['klass'] == 'stopped' #output
   True
   >>> shared_list[3]['klass'] == 'stopped' and shared_list[3]['results']['reason'] ==  'end-stepping-range' and shared_list[3]['results']['frame']['file'] == '../sysdeps/unix/sysv/linux/usleep.c' and shared_list[3]['results']['frame']['line'] == '26'
   True
   >>> shared_list = []
   
Para realizar un continue:

::
   >>> gdbInstance.continueExec()
   >>> time.sleep(10)
   >>> shared_list[0]['klass'] == 'running'
   True
   >>> shared_list[1]['klass'] == 'running'
   True
   >>> shared_list[2]['klass'] == 'thread-exited'
   True
   >>> shared_list[3]['klass'] == 'thread-group-exited'
   True
   >>> shared_list[4]['output']['klass'] == 'stopped' #output
   True
   >>> shared_list[5]['klass'] == 'stopped' and shared_list[5]['results']['reason'] ==  'exited-normally'
   True
   >>> shared_list = []

   
::
   >>> gdbInstance.exit() 
   
Eventos
-------

A continuacion se detalla el modo de uso de la clase gdb, a traves de eventos.
La creacion de cada instancia de Gdb no corresponde a la clase Gdb sino a la
clase GdbSpawmer, probaremos los comandos de un Gdb ya iniciado. Durante toda
la ejecucion el *outputReader* lanzara eventos bajo el topic "pid.1234" (siendo
1234 el pid del proceso gdb).

::
   >>> gdbInstance = gdb.Gdb()
   >>> gdbInstance.file("../cppTestCode/testExe")
   >>> gdbId = gdbInstance.getSessionId()
   >>> gdbId > 0
   True
   >>> eventHandler.subscribe("pid." + str(gdbId), add_sync)
   >>> time.sleep(2)
   
Para colocar un breakpoint en una funcion:

:: 

   >>> shared_list = []
   >>> eventHandler.publish(str(gdbId) + ".break-funcion", "main")
   >>> time.sleep(2)
   >>> cantEventos1 = len(shared_list)
   >>> shared_list[0]['klass'] == 'done'
   True
   >>> shared_list[0]['results']['bkpt']['enabled'] == 'y'
   True
   >>> shared_list[0]['results']['bkpt']['file'] == 'testExe.cpp'
   True
   >>> shared_list[0]['results']['bkpt']['line'] == '10'
   True
   >>> shared_list = []
   
Para realizar un run:

::
   >>> eventHandler.publish(str(gdbId) + ".run", "")
   >>> time.sleep(10)
   >>> shared_list[0]['stream'] == 'run > Salida.txt\n'
   True
   >>> shared_list[1]['type'] == 'Console' # Starting program (stream)
   True
   >>> shared_list[2]['klass'] == 'thread-group-started'
   True
   >>> shared_list[3]['klass'] == 'thread-created'
   True
   >>> shared_list[4]['klass'] == 'running'
   True
   >>> shared_list[5]['klass'] == 'running'
   True
   >>> shared_list[6]['klass'] == 'library-loaded'
   True
   >>> shared_list[7]['klass'] == 'library-loaded'
   True
   >>> shared_list[8]['klass'] == 'library-loaded'
   True
   >>> shared_list[9]['klass'] == 'library-loaded'
   True
   >>> shared_list[10]['klass'] == 'library-loaded'
   True
   >>> shared_list[11]['klass'] == 'breakpoint-modified'
   True
   >>> shared_list[12]['stream'] == '\nBreakpoint '
   True
   >>> shared_list[13]['type'] == 'Console' ##('1, main (argc=1, argv=0xbffff2f4) at testExe.cpp:10\n')
   True
   >>> shared_list[14]['stream'] == '10\t\tusleep(5000000);\n'
   True
   >>> shared_list[15]['output']['klass'] == 'stopped' #output
   True
   >>> shared_list[16]['klass'] == 'stopped' and shared_list[16]['results']['frame']['file'] == 'testExe.cpp' and shared_list[16]['results']['frame']['line'] == '10'
   True
   >>> shared_list = []
      



Para realizar un step-into:

::
   >>> eventHandler.publish(str(gdbId) + ".step-into", "")
   >>> time.sleep(2)
   >>> shared_list[0]['klass'] == 'running'
   True
   >>> shared_list[1]['klass'] == 'running'
   True
   >>> shared_list[2]['output']['klass'] == 'stopped' #output
   True
   >>> shared_list[3]['klass'] == 'stopped' and shared_list[3]['results']['reason'] ==  'end-stepping-range' and shared_list[3]['results']['frame']['file'] == '../sysdeps/unix/sysv/linux/usleep.c' and shared_list[3]['results']['frame']['line'] == '26'
   True
   >>> shared_list = []
   
 

Para realizar un continue:

:: 
   >>> eventHandler.publish(str(gdbId) + ".continue", "")
   >>> time.sleep(10)
   >>> shared_list[0]['klass'] == 'running'
   True
   >>> shared_list[1]['klass'] == 'running'
   True
   >>> shared_list[2]['klass'] == 'thread-exited'
   True
   >>> shared_list[3]['klass'] == 'thread-group-exited'
   True
   >>> shared_list[4]['output']['klass'] == 'stopped' #output
   True
   >>> shared_list[5]['klass'] == 'stopped' and shared_list[5]['results']['reason'] ==  'exited-normally'
   True
   >>> shared_list = []

   
   
Para realizar un exit:

::
   >>> eventHandler.publish(str(gdbId) + ".exit", "")
   >>> time.sleep(2)
   >>> shared_list[0]['klass'] == 'exit'
   True



::
   >>> ##finalizo al server.
   >>> os.system("python publish_subscribe/billboard.py stop")
   0
   >>> is_running()
   False
  
