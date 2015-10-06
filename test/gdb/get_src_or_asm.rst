
Cosas a ver:

-file-list-exec-source-file
-data-disassemble
info target

::

   >>> from shortcuts import start_notifier, stop_notifier, request, collect
   >>> start_notifier("../src/py/publish_subscribe/")

   >>> from gdb.gdb import Gdb
   >>> gdb = Gdb()

   >>> BIN="../src/cppTestCode/exe_with_and_without_symbols"


Luego de la inicializacion, cargamos el binario 'example_full_debugging_symbol'.
Este fue compilado con gcc con el flago -ggdb que le incluye todos los datos
de debugging necesarios (ademas de tener el source example.c disponible)

::

   >>> request(gdb, "-file-exec-and-symbols %s/example_with_debugging_symbol" % BIN) # doctest: +PASS

Ahora podemos ver cual es el archivo fuente asociado (el que contiene el main) con
solo llamar a 

::

   >>> r = request(gdb, "-file-list-exec-source-file")
   >>> r['results']['file'] 
   u'example.c'

   >>> r['results']['fullname']              #doctest: +SKIP
   u'/foo/bar/example.c'

   >>> r['results']['line']                  #doctest: +SKIP
   u'1'


Para poder correr el ejecutable, ademas del obvio 'run', podemos hacer un 'start' y podemos
luego ver cual es el estado del hilo principal.

::

   >>> request(gdb, "-exec-run", ["--start"])        # doctest: +PASS
   >>> request(gdb, "-thread-info", [])              # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'done',
    u'results': {u'current-thread-id': u'1',
                 u'threads': [{u'core': u'...',
                               u'frame': {u'addr': u'0x...',
                                          u'args': [{u'name': u'argc',
                                                     u'value': u'1'},
                                                    {u'name': u'argv',
                                                     u'value': u'0x...'}],
                                          u'file': u'example.c',
                                          u'fullname': u'.../example.c',
                                          u'func': u'main',
                                          u'level': u'0',
                                          u'line': u'...'},
                               u'id': u'1',
                               u'name': u'...',
                               u'state': u'stopped',
                               u'target-id': u'...'}]},
    u'token': ...,
    u'type': u'Sync'}

Pero que pasa si tenemos el ejecutable sin la informacion necesaria para debuggear?

::

   >>> request(gdb, "-file-exec-and-symbols %s/example_without_debugging_symbol" % BIN) # doctest: +PASS
   
   >>> r = request(gdb, "-file-list-exec-source-file")
   >>> 'file' in r['results']
   False
   >>> r['results']['msg']
   u'No symbol table is loaded.  Use the "file" command.'


Aun sin la tabla de simbolos podemos saber donde esta la funcion main y su codigo
assembly. Esto se debe a que el compilador (gcc)  no borra todos los simbolos.
Para ello desamblamos el codigo objeto desde la direccion &main hasta los primeros
10 bytes.
[Ref http://ftp.gnu.org/old-gnu/Manuals/gdb/html_node/gdb_223.html]

::

   >>> r = request(gdb, "-data-disassemble -s &main -e &main+10 -- 0")
   >>> instructions = r['results']['asm_insns'] # lista de instrucciones
   >>> map(lambda i: (i['address'], i['inst']), instructions)
   [(u'0x0804841d', u'push   %ebp'),
    (u'0x0804841e', u'mov    %esp,%ebp'),
    (u'0x08048420', u'and    $0xfffffff0,%esp'),
    (u'0x08048423', u'sub    $0x20,%esp'),
    (u'0x08048426', u'cmpl   $0x41414141,0x1c(%esp)')]

Pero esto no es todo. Si el ejecutable esta strippeado, no hay ningun simbolo. 
La funcion "main" no existe como tal por que no existe el tag "main"!
La unica alternativa es averiguar cual es el entry point y arrancar por ahi.

**Nota:** Lamentablemente no hay un comando MI de gdb para obtener
el entry point. La unica solucion es un comando tradicional y luego parsear 
la salida (stream events) de GDB... horrible.

::

   >>> from publish_subscribe.eventHandler import EventHandler
   >>> EH = EventHandler(name="TheTest")
   
   >>> @collect
   ... def collector(data):  
   ...   s = data['stream']
   ...   if "Entry point" in s:
   ...      return s
   ...
   ...   return None #discard
   
   >>> EH.subscribe('stream-gdb', collector, send_and_wait_echo=True) # start to track the logs

   >>> # do the request
   >>> request(gdb, "-file-exec-and-symbols %s/example_stripped" % BIN)   # doctest: +PASS
   >>> request(gdb, "info target")                                        # doctest: +PASS

   >>> log_of_entry_point = collector.get_next()  # extract the wanted log

   >>> entry_point_address = log_of_entry_point.split(": ")[-1].strip()
   >>> entry_point_address
   u'0x8048320'

Con esto se puede desamblar las primeras instrucciones (esta no es la direccion del main,
es la direccion de quien llama --indirectamente-- a main).

::

   >>> r = request(gdb, "-data-disassemble -s %s -e %s+10 -- 0" % (entry_point_address, entry_point_address))
   >>> instructions = r['results']['asm_insns'] # lista de instrucciones
   >>> map(lambda i: (i['address'], i['inst']), instructions)
   [(u'0x08048320', u'xor    %ebp,%ebp'),
    (u'0x08048322', u'pop    %esi'),
    (u'0x08048323', u'mov    %esp,%ecx'),
    (u'0x08048325', u'and    $0xfffffff0,%esp'),
    (u'0x08048328', u'push   %eax'),
    (u'0x08048329', u'push   %esp')]


Limiamos todo:

::

   >>> gdb.shutdown()
   0
   
   >>> stop_notifier("../src/py/publish_subscribe/")
