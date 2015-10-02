

GdbSpawmer es el encargado de iniciar nuevas instancias de gdb, tener conocimiento de ellas
y de poder finalizarlas.

Primero inicamos el servidor de eventos y luego instanciamos un gdbSpawner:

::
   
   >>> from shortcuts import start_notifier, stop_notifier, request, collect
   >>> start_notifier("../src/py/publish_subscribe/")
   
   >>> from publish_subscribe.eventHandler import EventHandler
   >>> EH = EventHandler(name="TheTest")

   >>> from gdb.gdbSpawner import GdbSpawner
   >>> gdb_spawner = GdbSpawner()
   
  
Para poder ver que resultados nos devuelve gdbSpawner, nos registramos a sus publicaciones:

::

   >>> @collect
   ... def collector(data):  
   ...   return data
   
   >>> EH.subscribe('spawner.debuggers-info', collector)
   >>> EH.subscribe('spawner.debugger-started', collector)
   >>> EH.subscribe('spawner.debugger-exited', collector)


Para listar las instancias (ninguna por ahora) de GDB bajo el control del gdbSpawner:

::
   >>> EH.publish("spawner.request.debuggers-info", {})

   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debuggers': {}}


Sin GDBs no tiene diversion. Para spawner un gdb hacemos un add. gdbSpawner nos respondera
con un evento que contendra el process id del nuevo GDB spawneado:

::
   >>> EH.publish("spawner.add-debugger", {})

   >>> gdb_added_result = collector.get_next() 
   >>> gdb_added_result                             # doctest: +ELLIPSIS
   {u'debugger-id': ...}


Ahora si listamos de nuevos las instancias, un diccionario indexado por process ids.

:: 
   >>> EH.publish("spawner.request.debuggers-info", {})

   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debuggers': {u'...': {u'debugger-id': ...}}}

Asi como podemos crear podemos eliminar GDBs segun sus process ids. Una vez eliminado un GDB,
su codigo de salida (exit code) nos es devuelto:

::
   >>> gdb_process_id = gdb_added_result['debugger-id']
   >>> EH.publish("spawner.kill-debugger", {'debugger-id': gdb_process_id})
   
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ..., u'exit-code': 0}
   
   
   >>> EH.publish("spawner.request.debuggers-info", {})

   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debuggers': {}}

Si bien eliminar a un GDB es util, eliminar uno o uno teniendo decenas de GDBs corriendo
es tedioso. gdbSpawner soporta la eliminacion de todos los GDBs a la vez.
Por cada GDB eliminado, un evento de genera con el exit code del proceso igual que en el
caso anterior.

::
   
   >>> EH.publish("spawner.add-debugger", {})
   >>> EH.publish("spawner.add-debugger", {})
   >>> EH.publish("spawner.add-debugger", {})
   
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...}
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...}
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...}


   >>> EH.publish("spawner.kill-all-debuggers", {})
   
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ..., u'exit-code': 0}
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ..., u'exit-code': 0}
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ..., u'exit-code': 0}


y podemos verificar que realmente no hay ningun GDB corriendo con

::
   >>> from subprocess import call
   >>> call(["pgrep", "-c", "gdb"], stdout=open("/dev/null", 'w')) == 1
   True

Al finalizar, el gdbSpawner debe ser cerrado. Si hay instancias de GDB asociadas a él, estas
son eliminadas (ningun evento se emite)

::
   >>> EH.publish("spawner.add-debugger", {})
   >>> collector.get_next()                           # doctest: +ELLIPSIS
   {u'debugger-id': ...}

   >>> gdb_spawner.shutdown()

Podemos verificar que no hay ningun GDB corriendo:

::
   >>> call(["pgrep", "-c", "gdb"], stdout=open("/dev/null", 'w')) == 1
   True


Finalizamos el notifier

::
   >>> stop_notifier("../src/py/publish_subscribe/")
