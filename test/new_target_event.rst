Iniciamos el server

::
   
   >>> import os
   >>> import time
   >>> from subprocess import check_output
   
   >>> os.system("python publish_subscribe/notifier.py start")
   0

Nos conectamos con el event_handler y lanzamos el gdbSpawner

::

   >>> import publish_subscribe.eventHandler 
   >>> eventHandler = publish_subscribe.eventHandler.EventHandler()
   
   >>> import gdb.gdbSpawmer
   >>> spawmer = gdb.gdbSpawmer.GdbSpawmer()

Registramos un callback para el evento new-target

::

   >>> time.sleep(2)

   >>> shared_dict = {}

   >>> def new_target(data):
   ...   global shared_dict
   ...
   ...   shared_dict["new_target"] = data

   >>> eventHandler.subscribe('debugger.new-target', new_target)

Ahora emitimos un load para debuggear un ejecutable

::

   >>> eventHandler.publish("debugger.load", "../cppTestCode/testExe")

Bien, ahora debemos recibir un new-target (entre otros eventos) que contiene el 
id de la session y el process id del programa debuggeado.

::

   >>> time.sleep(2)

   >>> shared_dict["new_target"]
   'No empty!!!'

Clean up

::

   >>> os.system("python publish_subscribe/notifier.py stop")
   0
