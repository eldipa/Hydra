

GdbSpawmer es el encargado de iniciar nuevas instancias de gdb, a continuacion
se muestra como utilizarla:

Primero inicamos el servidor de eventos:

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
   
   >>> import publish_subscribe.eventHandler 
   >>> eventHandler = publish_subscribe.eventHandler.EventHandler()
  
Iniciamos al gdbSpawmer  
   
::
   >>> import gdb.gdbSpawmer
   >>> spawmer = gdb.gdbSpawmer.GdbSpawmer()
   
Para lanzar un nuevo gdb:

::
   >>> gdbPid = spawmer.startNewProcessWithGdb("../cppTestCode/testExe")
   >>> gdbPid > 0
   True
   >>> len(spawmer.listaGdb) == 1
   True
   
Para cerrar a un gdb ("all" para todos):

::
   >>> spawmer.exit(gdbPid)
   
   
Eventos
-------

Para indicarle que queremos debuggear un nuevo executable debemos publicar el
evento "debugger.load" con data la ruta del exe, esto generara un
"debugger.new-session" con data pid de gdb cuando gdb inicie, y un "pid.1234"
(1234 el pid de gdb) con data la salida de gdb con cada linea de gdb. Cuando
gdb se una al proceso target (ya sea creado por gdb o atachado de manera
externa) lanzara un evento "debugger.new-target".

:: 
   >>> import threading, time
   >>> shared_dict = {}
   >>> shared_lock = threading.Lock() # we are using a lock because the
   >>>                                # callback runs in a separeted thread 


   >>> def new_session(data):
   ...   global shared_lock
   ...   global shared_dict
   ...
   ...   shared_lock.acquire()
   ...   shared_dict["new_session"] = data
   ...   shared_lock.release()
   
   >>> def new_target(data):
   ...   global shared_lock
   ...   global shared_dict
   ...
   ...   shared_lock.acquire()
   ...   shared_dict["new_target"] = data
   ...   shared_lock.release()
   
   >>> def attached(data):
   ...   global shared_lock
   ...   global shared_dict
   ...
   ...   shared_lock.acquire()
   ...   shared_dict["attached"] = data
   ...   shared_lock.release()
   
   >>> eventHandler.subscribe("debugger.new-session", new_session)
   >>> eventHandler.subscribe("debugger.new-target", new_target)
   >>> eventHandler.subscribe("debugger.attached", attached)
   >>> time.sleep(2)
    
   >>> eventHandler.publish("debugger.load", "../cppTestCode/testExe")

   >>> time.sleep(5)
   >>> pidGdb = shared_dict["new_session"]
   >>> pidGdb > 0
   True
   
Para realizar un attach:

::
   >>> shared_dict = {}
   
   >>> import subprocess 
   >>> p = subprocess.Popen("../cppTestCode/testExe")
   >>> p.pid > 0 
   True
   >>> eventHandler.publish("debugger.attach", p.pid)
   >>> time.sleep(5)
   
   >>> pidGdb = shared_dict["new_session"]
   >>> pidGdb > 0
   True
   
   >>> parGdbTarget = shared_dict["new_target"] #devuelve un dict
   >>> parGdbTarget['gdbPid'] == pidGdb
   True
   >>> parGdbTarget['targetPid'] == str(p.pid)
   True
   
   >>> pidTarget = shared_dict["attached"]
   >>> pidTarget == p.pid
   True
   
Para finalizar a un gdb (data = "all" para todos):

::
   >>> eventHandler.publish("debugger.exit", "all")
   >>> time.sleep(2)

Ejemplo de uso:

::
   >>> shared_dict = {}
   
   >>> eventHandler.publish("debugger.load", "../cppTestCode/testExe")
   >>> time.sleep(2)

   >>> gdbPid = shared_dict["new_session"]
   
   >>> eventHandler.publish(str(gdbPid) + ".break-funcion", "main")
   >>> time.sleep(2)
   
   >>> eventHandler.publish(str(gdbPid) + ".run", "")
   >>> time.sleep(2)
   
   >>> "new_target" in shared_dict
   True
   
   >>> eventHandler.publish(str(gdbPid) + ".step-into", "")
   >>> time.sleep(2)
   
::
   >>> spawmer.exit("all")
   >>> spawmer.eliminarCola()

   >>> ##finalizo al server.
   >>> os.system("python publish_subscribe/billboard.py stop")
   0
   >>> is_running()
   False
