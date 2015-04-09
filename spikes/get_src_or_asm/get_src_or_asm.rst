
Cosas a ver:

-file-list-exec-source-file
-data-disassemble
info target

::

   >>> import sys
   >>> sys.path.append("../../src/py/")

   >>> from shortcuts import start_notifier, stop_notifier, request
   >>> start_notifier("../../src/py/publish_subscribe/")

   >>> from gdb.gdb import Gdb
   >>> gdb = Gdb()
   >>> gdb.subscribe()


Luego de la inicializacion, cargamos el binario 'example_full_debugging_symbol'.
Este fue compilado con gcc con el flago -ggdb que le incluye todos los datos
de debugging necesarios (ademas de tener el source example.c disponible)

::

   >>> request(gdb, "-file-exec-and-symbols example_with_debugging_symbol") # doctest: +PASS

Ahora podemos ver cual es el archivo fuente asociado (el que contiene el main) con
solo llamar a 

::

   >>> r = request(gdb, "-file-list-exec-source-file")
   >>> r['results']['file'] 
   u'example.c'

   >>> r['results']['fullname']              #doctest: +SKIP
   u'/foo/bar/example.c'


Pero que pasa si tenemos el ejecutable sin la informacion necesaria para debuggear?

::

   >>> request(gdb, "-file-exec-and-symbols example_without_debugging_symbol") # doctest: +PASS
   
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
el entry point. La unica solucion es un comando tradicional y luego parsear.

::

   >>> request(gdb, "-file-exec-and-symbols example_stripped")   # doctest: +PASS

   >>> stream_records = request(gdb, "info target")['last_stream_records']
   >>> entry_point_record = filter(lambda r: "Entry point" in r['stream'], stream_records)[0]
   >>> entry_point_address = entry_point_record['stream'].split(": ")[-1].strip()
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

   >>> gdb.exit()
   >>> stop_notifier("../../src/py/publish_subscribe/")
