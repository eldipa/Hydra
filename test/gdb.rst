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
   >>> cantEventos1 = len(shared_list)
   >>> cantEventos1 > 0 
   True
   
Para cargar un nuevo ejecutable en el entorno gdb:

::
   >>> gdbInstance.file("../cppTestCode/testExe")
   >>> time.sleep(2)
   >>> cantEventos2 = len(shared_list)
   >>> cantEventos2 > cantEventos1 
   True
   
Esto cargara al ejecutable, generara un breakpoint en main, iniciara la
ejecucion y devolvera el control cuando llegue a dicho breakpoint.
 
Para salir:

::
   >>> gdbInstance.exit() 
   >>> time.sleep(2)
   >>> cantEventos3 = len(shared_list)
   >>> cantEventos3 > cantEventos2 
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
   >>> cantEventos1 = len(shared_list)
   >>> cantEventos1 > 0 
   True
   
Para colocar un nuevo breakpoint en una funcion:

::
    >>> gdbInstance.setBreakPoint("main")
    >>> time.sleep(2)
    >>> cantEventos2 = len(shared_list)
    >>> cantEventos2 > cantEventos1
    True
    
Para realizar un run:

::
   >>> gdbInstance.run()
   >>> time.sleep(5)
   >>> cantEventos3 = len(shared_list)
   >>> cantEventos3 > cantEventos2
   True

Para realizar un step-into:

::
   >>> gdbInstance.stepInto()
   >>> time.sleep(2)
   >>> cantEventos4 = len(shared_list)
   >>> cantEventos4 > cantEventos3
   True

Para realizar un continue:

::
   >>> gdbInstance.continueExec()
   >>> time.sleep(2)
   >>> cantEventos5 = len(shared_list)
   >>> cantEventos5 > cantEventos4
   True
   
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
   >>> shared_list = []

   >>> gdbInstance = gdb.Gdb()
   >>> gdbInstance.file("../cppTestCode/testExe")
   >>> gdbId = gdbInstance.getSessionId()
   >>> gdbId > 0
   True
   >>> eventHandler.subscribe("pid." + str(gdbId), add_sync)
   
Para colocar un breakpoint en una funcion:

::
   >>> eventHandler.publish(str(gdbId) + ".break-funcion", "main")
   >>> time.sleep(2)
   >>> cantEventos1 = len(shared_list)
   >>> cantEventos1 > 0 
   True


Para realizar un step-into:

::
   >>> eventHandler.publish(str(gdbId) + ".step-into", "")
   >>> time.sleep(2)
   >>> cantEventos2 = len(shared_list)
   >>> cantEventos2 >  cantEventos1 
   True

Para realizar un continue:

:: 
   >>> eventHandler.publish(str(gdbId) + ".continue", "")
   >>> time.sleep(2)
   >>> cantEventos3 = len(shared_list)
   >>> cantEventos3 > cantEventos2
   True
   

Para realizar un run:

::
   >>> eventHandler.publish(str(gdbId) + ".run", "")
   >>> time.sleep(5)
   >>> cantEventos4 = len(shared_list)
   >>> cantEventos4 > cantEventos3
   True
   
Para realizar un exit:

::
   >>> eventHandler.publish(str(gdbId) + ".exit", "")
   >>> time.sleep(2)
   >>> cantEventos5 = len(shared_list)
   >>> cantEventos5 > cantEventos4
   True




::
   >>> ##finalizo al server.
   >>> os.system("python publish_subscribe/billboard.py stop")
   0
   >>> is_running()
   False
  
