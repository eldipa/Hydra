Como siempre, inicializamos nuestro gdb y el sistema de comunicaciones

::

   >>> from shortcuts import start_notifier, stop_notifier, request
   >>> start_notifier("../src/py/publish_subscribe/")

   >>> from gdb.gdb import Gdb
   >>> gdb = Gdb()
   >>> gdb.subscribe()

   >>> BIN="../src/cppTestCode/exe_with_and_without_symbols"


Para comenzar, veamos como se setean breakpoints en un binario con todos los
simbolos para debugging

::

   >>> request(gdb, "-file-exec-and-symbols", ["%s/example_with_debugging_symbol" % BIN]) # doctest: +PASS

Ahora ponemos un breakpoint sobre la funcion "main" y ponemos otro breakpoint
sobre una linea de codigo fuente en particular. Ambas posiciones pueden ser deducidas
por gdb por tener todos los simbolos e informacion de debugging en el ejecutable.

::

   >>> b1 = request(gdb, "-break-insert", ["-p", "1", "main"])
   >>> b1                                                        # doctest: +ELLIPSIS
   {u'klass': u'done',
    u'last_stream_records': [],
    u'results': {u'bkpt': {u'addr': ...,
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
                           u'type': u'breakpoint'}},
    u'token': ...,
    u'type': u'Sync'}

   >>> b2 = request(gdb, "-break-insert", ["-p", "1", "10"])
   >>> b2                                                        # doctest: +ELLIPSIS
   {u'klass': u'done',
    u'last_stream_records': [],
    u'results': {u'bkpt': {u'addr': ...,
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
                           u'type': u'breakpoint'}},
    u'token': ...,
    u'type': u'Sync'}


Antes de seguir, algunas cosas remarcables sobre los datos que se entregan cuando
se setea un breakpoint (para mas info, https://sourceware.org/gdb/onlinedocs/gdb/GDB_002fMI-Breakpoint-Information.html#GDB_002fMI-Breakpoint-Information)

 - Se muestra cual es la direccion fisica real donde esta puesto el breakpoint

::

   >>> bkpt = b1['results']['bkpt']
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
   {u'klass': u'done',
    u'last_stream_records': [],
    u'results': {u'BreakpointTable': {u'body': [[u'bkpt',
                                                 {u'addr': ...
                                                  ...
                                                  u'number': u'1',
                                                  ...
                                                  u'type': u'breakpoint'}],
                                                [u'bkpt',
                                                 {u'addr': ...
                                                  ...
                                                  u'number': u'2',
                                                  ...
                                                  u'type': u'breakpoint'}]],
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
   {u'klass': u'done',
    u'last_stream_records': [],
    u'results': {u'bkpt': {u'addr': ...
                           u'at': ...
                           u'disp': u'keep',
                           u'enabled': u'y',
                           u'number': u'3',
                           u'original-location': u'main',
                           u'thread': [u'1', u'1'],
                           u'thread-groups': [u'i1'],
                           u'times': u'0',
                           u'type': u'breakpoint'}},
    u'token': ...
    u'type': u'Sync'}

   >>> b2 = request(gdb, "-break-insert", ["-p", "1", "10"])
   >>> b2                                                        # doctest: +ELLIPSIS
   {u'klass': u'error',
    u'last_stream_records': [],
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
   {u'klass': u'error',
    u'last_stream_records': [],
    u'results': {u'msg': u'Function "main" not defined.'},
    u'token': ...
    u'type': u'Sync'}

lo cual era de esperarse ese error.

Limiamos todo:

::

   >>> gdb.exit()
   >>> stop_notifier("../src/py/publish_subscribe/")
