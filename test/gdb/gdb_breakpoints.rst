Como siempre, inicializamos nuestro gdb y el sistema de comunicaciones

::

   >>> from shortcuts import start_notifier, stop_notifier, request
   >>> start_notifier("../src/py/publish_subscribe/")

   >>> from gdb.gdb import Gdb
   >>> gdb = Gdb()

   >>> BIN="../src/cppTestCode/exe_with_and_without_symbols"
   
   >>> request(gdb, "set target-async off", [])                 # doctest: +PASS


Para comenzar, veamos como se setean breakpoints en un binario con todos los
simbolos para debugging

::

   >>> request(gdb, "-file-exec-and-symbols", ["%s/example_with_debugging_symbol" % BIN]) # doctest: +PASS

Ahora ponemos un breakpoint sobre la funcion "main" y ponemos otro breakpoint
sobre una linea de codigo fuente en particular. Ambas posiciones pueden ser deducidas
por gdb por tener todos los simbolos e informacion de debugging en el ejecutable.

El flag -p NUM hace que el breakpoint se restrinja al thread NUM. Notese que hay u bug en GDB que hace que el atributo
thread del evento insert tenga repetido el thread sobre el cual se aplica el breakpoint.

::

   >>> b1 = request(gdb, "-break-insert", ["-p", "1", "main"])
   >>> b1                                                        # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'done',
    u'results': {u'bkpts': [{u'addr': ...,
                             u'disp': u'keep',
                             u'enabled': u'y',
                             u'file': u'example.c',
                             u'fullname': ...,
                             u'func': u'main',
                             u'line': u'5',
                             u'number': u'1',
                             u'original-location': ...,
                             u'thread': [u'1', u'1'],
                             u'thread-groups': [u'i1'],
                             u'times': u'0',
                             u'type': u'breakpoint'}]},
    u'token': ...,
    u'type': u'Sync'}

   >>> b2 = request(gdb, "-break-insert", ["-p", "1", "10"])
   >>> b2                                                        # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'done',
    u'results': {u'bkpts': [{u'addr': ...,
                             u'disp': u'keep',
                             u'enabled': u'y',
                             u'file': u'example.c',
                             u'fullname': ...,
                             u'func': u'main',
                             u'line': u'10',
                             u'number': u'2',
                             u'original-location': ...,
                             u'thread': [u'1', u'1'],
                             u'thread-groups': [u'i1'],
                             u'times': u'0',
                             u'type': u'breakpoint'}]},
    u'token': ...,
    u'type': u'Sync'}


Antes de seguir, algunas cosas remarcables sobre los datos que se entregan cuando
se setea un breakpoint (para mas info, https://sourceware.org/gdb/onlinedocs/gdb/GDB_002fMI-Breakpoint-Information.html#GDB_002fMI-Breakpoint-Information)

 - Se muestra cual es la direccion fisica real donde esta puesto el breakpoint

::

   >>> bkpt = b1['results']['bkpts'][0]
   >>> bkpt['addr']                          # doctest: +PASS      
   u'0x08048426'

 - Tambien se indica (y solo si esta disponible) el archivo fuente, linea y funcion
en donde esta el breakpoint. El atributo "original-location" es la posicion que quiso
poner el usuario y puede no estar disponible.

::
   
   >>> bkpt['file'], bkpt['line'], bkpt['fullname']         # doctest: +ELLIPSIS
   (u'example.c',
    u'5',
    ...)

 - GDB mantiene un estado por cada breaktpoint, en particular un id para identificacion: 

::

   >>> bkpt['number']      # the breakpoint id
   u'1'

   >>> bkpt['disp']        # if 'del', then the breakpoint will be deleted (temporal breakpoint)
   u'keep'

   >>> bkpt['enabled']     # if 'n', the breakpoint is disabled
   u'y'

Para poder obtener todos los breakpoints seteados, podemos pedirselo a GDB

::

   >>> request(gdb, "-break-list")                    # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'done',
    u'results': {u'BreakpointTable': {u'body': [{u'addr': u'0x...',
                                                 u'disp': u'keep',
                                                 u'enabled': u'y',
                                                 u'file': u'example.c',
                                                 u'fullname': u'.../exe_with_and_without_symbols/example.c',
                                                 u'func': u'main',
                                                 u'line': u'5',
                                                 u'number': u'1',
                                                 u'original-location': u'main',
                                                 u'thread': [u'1', u'1'],
                                                 u'thread-groups': [u'i1'],
                                                 u'times': u'0',
                                                 u'type': u'breakpoint'},
                                                {u'addr': ...
                                                 ...
                                                 u'number': u'2',
                                                 ...
                                                 u'type': u'breakpoint'}],
                                      u'hdr': [{u'alignment': u'-1',
                                                u'col_name': u'number',
                                                ...
                                                u'colhdr': u'What',
                                                u'width': u'40'}],
                                      u'nr_cols': u'6',
                                      u'nr_rows': u'2'}},
    u'token': ...,
    u'type': u'Sync'}


Veamos ahora que pasa si queremos poner un breakpoint cuando el ejecutable no tiene
toda la info de debugging

::

   >>> request(gdb, "-file-exec-and-symbols %s/example_without_debugging_symbol" % BIN) # doctest: +PASS

   >>> b1 = request(gdb, "-break-insert", ["-p", "1", "main"])
   >>> b1                                                        # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'done',
    u'results': {u'bkpts': [{u'addr': ...
                             u'at': ...
                             u'disp': u'keep',
                             u'enabled': u'y',
                             u'number': u'3',
                             u'original-location': u'main',
                             u'thread': [u'1', u'1'],
                             u'thread-groups': [u'i1'],
                             u'times': u'0',
                             u'type': u'breakpoint'}]},
    u'token': ...
    u'type': u'Sync'}

   >>> b2 = request(gdb, "-break-insert", ["-p", "1", "10"])
   >>> b2                                                        # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'error',
    u'results': {u'msg': u'No symbol table is loaded.  Use the "file" command.'},
    u'token': ...
    u'type': u'Sync'}

A pesar de no tener informacion de debugging es posible setear un breakpoint en funcion
de los nombres de las funciones puesto que en general los simbolos no son strippeados.
No obstante, ninguna informacion sobre el fuente (source) es mantenida y por lo tanto
no es posible setear breakpoints en funcion de el numero de linea de un fuente.

Para el caso de un ejecutable strippeado:

::

   >>> request(gdb, "-file-exec-and-symbols %s/example_stripped" % BIN) # doctest: +PASS

   >>> b1 = request(gdb, "-break-insert", ["-p", "1", "main"])
   >>> b1                                                        # doctest: +ELLIPSIS
   {u'debugger-id': ...
    u'klass': u'error',
    u'results': {u'msg': u'Function "main" not defined.'},
    u'token': ...
    u'type': u'Sync'}

lo cual era de esperarse ese error.

Ahora veamos como se comportan los breakpoints en un ambiente multithreading

::
   
   >>> gdb.shutdown()
   0
   >>> gdb = Gdb()

   >>> BIN="../src/cppTestCode/threads/three_pthreads"
   
   >>> from shortcuts import start_notifier, stop_notifier, request, collect
   >>> from publish_subscribe.eventHandler import EventHandler
   >>> EH = EventHandler(name="TheTest")
   
   >>> @collect
   ... def collector(data):
   ...   if data['klass'].startswith('breakpoint-'):
   ...      return data
   ...   return None # discard
   
   >>> EH.subscribe('notification-gdb', collector)

En este caso, nuestro proceso lanzara 2 hilos que ejecutaran la funcion roll mientras el hilo principal espera en
el join.
Pondremos un breakpoint en la funcion roll que hara que esos 2 hilos se bloqueen, con un total de dos hits al breakpoint. 
Luego pondremos un breakpoint adicional solo para uno de esos dos hilos; al darle continue, todos lo hilos deberian 
correr salvo ese, probando que los breakpoints se pueden asignar por thread.

Hay un bug en GDB que hace que el evento emitido por poner un breakpoint en un solo hilo tenga un atributo "thread" extra
mal formado: contiene por duplicado el numero del thread implicado.

::
   
   >>> request(gdb, "-file-exec-and-symbols", ["--thread-group i1", BIN])        # doctest: +PASS

   >>> b1 = request(gdb, "-break-insert", ["roll"])                             # doctest: +PASS 
   >>> request(gdb, "-exec-run", ["--thread-group i1"])                         # doctest: +PASS 

   >>> collector.get_next()                                 # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'breakpoint-modified',
    u'results': {u'bkpts': [{u'addr': u'0x...',
                             u'disp': u'keep',
                             u'enabled': u'y',
                             u'file': u'three_pthreads.c',
                             u'fullname': u'.../three_pthreads.c',
                             u'func': u'roll',
                             u'line': u'5',
                             u'number': u'1',
                             u'original-location': u'roll',
                             u'thread-groups': [u'i1'],
                             u'times': u'1',
                             u'type': u'breakpoint'}]},
    ...
    u'type': u'Notify'}

   >>> collector.get_next()                                 # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'breakpoint-modified',
    u'results': {u'bkpts': [{u'addr': u'0x...',
                             ...
                             u'func': u'roll',
                             u'line': u'5',
                             u'number': u'1',
                             ...
                             u'thread-groups': [u'i1'],
                             u'times': u'2',
                             u'type': u'breakpoint'}]},
    ...}

   >>> request(gdb, "-thread-info", [])       # doctest: +ELLIPSIS
   {...
                 u'threads': [{...
                                          u'func': u'roll',
                                          u'level': u'0',
                                          u'line': u'5'},
                               u'id': u'3',
                               u'name': u'three_pthreads',
                               u'state': u'stopped',
                               ...},
                              {...
                                          u'func': u'roll',
                                          u'level': u'0',
                                          u'line': u'5'},
                               u'id': u'2',
                               u'name': u'three_pthreads',
                               u'state': u'stopped',
                               ...},
                              {...
                               u'id': u'1',
                               u'name': u'three_pthreads',
                               u'state': u'running',
                               ...}]},
    ...}


   >>> request(gdb, "-break-insert", ["-p", "2", "6"])                      # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'done',
    u'results': {u'bkpts': [{u'addr': u'0x...',
                             ...
                             u'func': u'roll',
                             u'line': u'6',
                             u'number': u'2',
                             ...
                             u'thread': [u'2', u'2'],
                             u'thread-groups': [u'i1'],
                             u'times': u'0',
                             u'type': u'breakpoint'}]},
    ...}

   >>> request(gdb, '-exec-continue', ["--thread-group i1"])                    # doctest: +PASS

   >>> collector.get_next()                                 # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'breakpoint-modified',
    u'results': {u'bkpts': [{u'addr': u'0x...',
                             ...
                             u'func': u'roll',
                             u'line': u'6',
                             u'number': u'2',
                             ...
                             u'thread': [u'2', u'2'],
                             u'thread-groups': [u'i1'],
                             u'times': u'1',
                             u'type': u'breakpoint'}]},
    ...}

   >>> request(gdb, "-thread-info", [])       # doctest: +ELLIPSIS
   {...
                 u'threads': [{...
                                          u'func': u'roll',
                                          u'level': u'0',
                                          u'line': u'6'},
                               u'id': u'2',
                               u'name': u'three_pthreads',
                               u'state': u'stopped',
                               ...},
                              {...
                               u'id': u'1',
                               u'name': u'three_pthreads',
                               u'state': u'running',
                               ...}]},
    ...}
   
   >>> request(gdb, '-exec-continue', ["--thread-group i1"])                    # doctest: +PASS


Veamos ahora como se muestran breakpoints pendientes, breakpoints que no se pueden setear debido a que aun no esta
disponible el ejecutable/binario y/o los simbolos.
Para ello necesitamos el flag "-f" o tendremos un error.

::
   
   >>> gdb.shutdown()
   0
   >>> gdb = Gdb()

   >>> BIN="../src/cppTestCode/threads/three_pthreads"
   
   >>> request(gdb, "-break-insert", ["roll"])       # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'error',
    u'results': {u'msg': u'No symbol table is loaded.  Use the "file" command.'},
    u'token': ...,
    u'type': u'Sync'}

   >>> request(gdb, "-break-insert", ["-f", "roll"])       # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'done',
    u'results': {u'bkpts': [{u'addr': u'<PENDING>',
                             u'disp': u'keep',
                             u'enabled': u'y',
                             u'number': u'1',
                             u'original-location': u'roll',
                             u'pending': u'roll',
                             u'times': u'0',
                             u'type': u'breakpoint'}]},
    u'token': ...,
    u'type': u'Sync'}

Podemos poner mas de un breakpoint en el mismo lugar:

::
   >>> request(gdb, "-break-insert", ["-f", "roll"])       # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'done',
    u'results': {u'bkpts': [{u'addr': u'<PENDING>',
                             u'disp': u'keep',
                             u'enabled': u'y',
                             u'number': u'2',
                             u'original-location': u'roll',
                             u'pending': u'roll',
                             u'times': u'0',
                             u'type': u'breakpoint'}]},
    u'token': ...,
    u'type': u'Sync'}

   
   >>> request(gdb, "-break-list")                    # doctest: +ELLIPSIS
   {...
    u'results': {u'BreakpointTable': {u'body': [{u'addr': u'<PENDING>',
                                                 u'disp': u'keep',
                                                 u'enabled': u'y',
                                                 u'number': u'1',
                                                 u'original-location': u'roll',
                                                 u'pending': u'roll',
                                                 u'times': u'0',
                                                 u'type': u'breakpoint'},
                                                {u'addr': u'<PENDING>',
                                                 u'disp': u'keep',
                                                 u'enabled': u'y',
                                                 u'number': u'2',
                                                 u'original-location': u'roll',
                                                 u'pending': u'roll',
                                                 u'times': u'0',
                                                 u'type': u'breakpoint'}],
    ...}

Cuando un ejecutable es cargado, los breakpoints son resueltos y se modifican. Lo curioso es que si dos breakpoints
estan en el mismo lugar, no son breakpoints separados (como los breakpoints 1 y 2 del ejemplo de arriba) sino que 
son como sub-breakpoints (aka 1.1 y 1.2)

::
   >>> request(gdb, "-file-exec-and-symbols", ["--thread-group i1", BIN])        # doctest: +PASS

   >>> collector.get_next()                                 # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'breakpoint-modified',
    u'results': {u'bkpts': [{u'addr': u'0x...',
                             ...
                             u'func': u'roll',
                             u'line': u'5',
                             u'number': u'1',
                             ...
                             u'thread-groups': [u'i1'],
                             u'times': u'0',
                             u'type': u'breakpoint'}]},
    ...}

   >>> collector.get_next()                                 # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'breakpoint-modified',
    u'results': {u'bkpts': [{u'addr': u'0x...',
                             ...
                             u'func': u'roll',
                             u'line': u'5',
                             u'number': u'2',
                             ...
                             u'thread-groups': [u'i1'],
                             u'times': u'0',
                             u'type': u'breakpoint'}]},
    ...}

   >>> request(gdb, "-break-list")                    # doctest: +ELLIPSIS
   {...
    u'results': {u'BreakpointTable': {u'body': [{u'addr': u'0x...',
                                                 u'disp': u'keep',
                                                 u'enabled': u'y',
                                                 u'file': u'three_pthreads.c',
                                                 u'fullname': u'.../three_pthreads.c',
                                                 u'func': u'roll',
                                                 u'line': u'5',
                                                 u'number': u'1',
                                                 u'original-location': u'roll',
                                                 u'thread-groups': [u'i1'],
                                                 u'times': u'0',
                                                 u'type': u'breakpoint'},
                                                {u'addr': u'0x...',
                                                 u'disp': u'keep',
                                                 u'enabled': u'y',
                                                 u'file': u'three_pthreads.c',
                                                 u'fullname': u'.../three_pthreads.c',
                                                 u'func': u'roll',
                                                 u'line': u'5',
                                                 u'number': u'2',
                                                 u'original-location': u'roll',
                                                 u'thread-groups': [u'i1'],
                                                 u'times': u'0',
                                                 u'type': u'breakpoint'}],
    ...}

Insertar otro breakpoint no cambia mucho:

::
   >>> request(gdb, "-break-insert", ["-f", "roll"])       # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'done',
    u'results': {u'bkpts': [{u'addr': u'0x...',
                             u'disp': u'keep',
                             u'enabled': u'y',
                             u'file': u'three_pthreads.c',
                             u'fullname': u'.../three_pthreads.c',
                             u'func': u'roll',
                             u'line': u'5',
                             u'number': u'3',
                             u'original-location': u'roll',
                             u'thread-groups': [u'i1'],
                             u'times': u'0',
                             u'type': u'breakpoint'}]},
    u'token': ...,
    u'type': u'Sync'}

La cosa cambia cuando agregamos otro inferior o thread-group. En este caso lo breakpoints son duplicados, como si
los breakpoints seteados en un thread-group fueran breakpoints pendientes del nuevo inferior.
Pero a diferencia de crear legitimos nuevos breakpoints, se crean subbreakpoints de la forma breakpoint_id.subbreakpoint_id

Vease el bug https://sourceware.org/bugzilla/show_bug.cgi?id=14733
   
::

   >>> request(gdb, "-add-inferior", [])                    # doctest: +PASS
   >>> request(gdb, "-file-exec-and-symbols", ["--thread-group i2", BIN])        # doctest: +PASS

   >>> collector.get_next()                                 # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'breakpoint-modified',
    u'results': {u'bkpts': [{u'addr': u'<MULTIPLE>',
                             u'disp': u'keep',
                             u'enabled': u'y',
                             u'number': u'1',
                             u'original-location': u'roll',
                             u'times': u'0',
                             u'type': u'breakpoint'},
                            {u'addr': u'0x...',
                             u'enabled': u'y',
                             u'file': u'three_pthreads.c',
                             u'fullname': u'.../three_pthreads.c',
                             u'func': u'roll',
                             u'line': u'5',
                             u'number': u'1.1',
                             u'thread-groups': [u'i1']},
                            {u'addr': u'0x...',
                             u'enabled': u'y',
                             u'file': u'three_pthreads.c',
                             u'fullname': u'.../three_pthreads.c',
                             u'func': u'roll',
                             u'line': u'5',
                             u'number': u'1.2',
                             u'thread-groups': [u'i2']}]},
    u'token': None,
    u'type': u'Notify'}

   >>> collector.get_next()                                 # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'breakpoint-modified',
    u'results': {u'bkpts': [{u'addr': u'<MULTIPLE>',
                             u'disp': u'keep',
                             u'enabled': u'y',
                             u'number': u'2',
                             ...},
                            {...
                             u'number': u'2.1',
                             u'thread-groups': [u'i1']},
                            {...
                             u'number': u'2.2',
                             u'thread-groups': [u'i2']}]},
    ...}

   >>> collector.get_next()                                 # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'breakpoint-modified',
    u'results': {u'bkpts': [{u'addr': u'<MULTIPLE>',
                             u'disp': u'keep',
                             u'enabled': u'y',
                             u'number': u'3',
                             ...},
                            {...
                             u'number': u'3.1',
                             u'thread-groups': [u'i1']},
                            {...
                             u'number': u'3.2',
                             u'thread-groups': [u'i2']}]},
    ...}
   
   >>> request(gdb, "-break-list")                    # doctest: +ELLIPSIS
   {u'debugger-id': ...,
    u'klass': u'done',
    u'results': {u'BreakpointTable': {u'body': [{u'addr': u'<MULTIPLE>',
                                                 ...
                                                 u'number': u'1',
                                                 u'original-location': u'roll',
                                                 ...},
                                                {u'addr': u'0x...',
                                                 ...
                                                 u'func': u'roll',
                                                 u'line': u'5',
                                                 u'number': u'1.1',
                                                 u'thread-groups': [u'i1']},
                                                {u'addr': u'0x...',
                                                 ...
                                                 u'func': u'roll',
                                                 u'line': u'5',
                                                 u'number': u'1.2',
                                                 u'thread-groups': [u'i2']},
                                                {u'addr': u'<MULTIPLE>',
                                                 ...
                                                 u'number': u'2',
                                                 u'original-location': u'roll',
                                                 ...},
                                                {u'addr': u'0x...',
                                                 ...
                                                 u'func': u'roll',
                                                 u'line': u'5',
                                                 u'number': u'2.1',
                                                 u'thread-groups': [u'i1']},
                                                {u'addr': u'0x...',
                                                 ...
                                                 u'func': u'roll',
                                                 u'line': u'5',
                                                 u'number': u'2.2',
                                                 u'thread-groups': [u'i2']},
                                                {u'addr': u'<MULTIPLE>',
                                                 ...
                                                 u'number': u'3',
                                                 u'original-location': u'roll',
                                                 ...},
                                                {u'addr': u'0x...',
                                                 ...
                                                 u'func': u'roll',
                                                 u'line': u'5',
                                                 u'number': u'3.1',
                                                 u'thread-groups': [u'i1']},
                                                {u'addr': u'0x...',
                                                 ...
                                                 u'func': u'roll',
                                                 u'line': u'5',
                                                 u'number': u'3.2',
                                                 u'thread-groups': [u'i2']}],
    ...}


Limpiamos todo:

::

   >>> gdb.shutdown()
   0

   >>> stop_notifier("../src/py/publish_subscribe/")
