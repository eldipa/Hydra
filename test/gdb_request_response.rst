GDB MI soporta taggear cada comando ejecutado con un token. La respuesta de ese
comando retorna con dicho tag lo que permite aparear cada request con su response.

::

   >>> from shortcuts import start_notifier, stop_notifier 
   >>> import publish_subscribe.eventHandler 
   >>> start_notifier("../src/py/publish_subscribe/")

   >>> from gdb.gdb import Gdb
   >>> gdb = Gdb()
   >>> gdb.subscribe()

   >>> pubsub = publish_subscribe.eventHandler.EventHandler()

Para comenzar, creamos un token o cookie, un numero unico que representara esta transaccion.

::

   >>> token = 1

Ahora armamos el comando que queremos correr (digamos que queremos seleccionar
que programa queremos debuggear)

::

   >>> command = "-file-exec-and-symbols"
   >>> arguments = ["cppTestCode/testExe"]

Y finalmente armamos el evento que queremos emitir.

::

   >>> request_for_command = {
   ...   'command': command,
   ...   'token': token,
   ...   'arguments': arguments,
   ...   'interpreter': 'mi',
   ... }

Antes de enviar el evento necesitamos suscribirnos a un topico que esta vinculado
a ese comando en particular a traves del token o cookie.

::

   >>> request_topic = "request-gdb.%i.%i" % (gdb.gdb.pid, token)
   >>> response_topic = "result-gdb.%i.%i" % (gdb.gdb.pid, token)

Let's do this!

::

   >>> import threading
   >>> r = {} 
   >>> flag = threading.Lock() 
   >>> flag.acquire()                     # doctest: +PASS
   >>>                               
   >>> def add_sync(data): 
   ...   global flag
   ...   global r
   ... 
   ...   r['results'] = data
   ...   flag.release()

   >>> pubsub.subscribe(response_topic, add_sync)

Publicamos el request

::

   >>> pubsub.publish(request_topic, request_for_command)

Y ahora esperamos la respuesta.

::

   >>> flag.acquire()                     # doctest: +PASS 
   >>> response = r['results']
   >>> response
   {u'klass': u'done',
    u'last_stream_records': [],
    u'results': {},
    u'token': 1,
    u'type': u'Sync'}


Genial, aunque podemos hacer un shorcut de todo esto, con fines didacticos:

::

   >>> from shortcuts import request
   >>> response = request(gdb, "-file-list-exec-source-file")
   >>> response['results']['file']
   u'testExe.cpp'


Limiamos todo:

::

   >>> gdb.exit()
   >>> stop_notifier("../src/py/publish_subscribe/")
