Nota: para correr estos tests la UI y el notifier deben estar levantados.


El objeto debugge_tracker mantiene el estado de los debuggers, threads and thread groups
que estan corriendo.
Para ver esto, primero montaremos el sistema de mensajeria (notifier) y un GdbSpawner
quien lanzara a los multiples GDBs

::

    >>> import time
    >>> SLEEPTIME = 1

    #>>> from shortcuts import start_notifier, stop_notifier, request, collect
    #>>> start_notifier("../src/py/publish_subscribe/")
    
    >>> from gdb.gdbSpawner import GdbSpawner
    >>> gdb_spawner = GdbSpawner()


Ahora, del lado de Javascript, hacemos los import correspondientes e instanciamos el tracker.

::
    js> var EventHandler = event_handler.EventHandler;
    js> var DebuggeeTracker = debuggee_tracker.DebuggeeTracker;
    js> var Thread = debuggee_tracker.Thread;
    js> var ThreadGroup = debuggee_tracker.ThreadGroup;
    js> var Debugger = debuggee_tracker.Debugger;
    
    js> var tracker = new DebuggeeTracker();


Podemos lanzar un debugger y luego buscarlo por id o por otros medios

::

    js> tracker.add_debugger();

    >>> time.sleep(SLEEPTIME)

    js> var debugger_1 = u.values(tracker.get_all_debuggers())[0];
    js> debugger_1.get_display_name();                              // doctest: +ELLIPSIS
    'GDB ...'

    js> tracker.get_debugger_with_id(debugger_1.id) === debugger_1;
    true

Asi como lo lanzamos, lo podemos eliminar. El objeto Debugger queda invalido.

::

    js> debugger_1.kill();
    
    >>> time.sleep(SLEEPTIME)

    js> tracker.get_debugger_with_id(debugger_1.id) === undefined
    true

    js> delete debugger_1 
    true
   

Creemos otro debugger. Esta vez, asociemosle un thread group. Por default, GDB siempre tiene
al menos 1 thread group asi que el resultado final seria un debugger con 2 thread groups (el
default y el que creamos nosotros)

::

    js> tracker.add_debugger();

    >>> time.sleep(SLEEPTIME)

    js> var debugger_1 = u.values(tracker.get_all_debuggers())[0];
    js> debugger_1.add_thread_group();
    
    >>> time.sleep(SLEEPTIME)

    js> u.keys(debugger_1.your_thread_groups_by_id()).length;
    2


Como siempre, GDB siempre tiene al menos 1 thread group

::

    js> var tgroups = u.values(debugger_1.your_thread_groups_by_id());
    js> var tgroup_1 = tgroups[0];
    js> var tgroup_2 = tgroups[1];

    js> tgroup_1.remove();
    js> tgroup_2.remove();
    
    >>> time.sleep(SLEEPTIME)
    
    js> u.keys(debugger_1.your_thread_groups_by_id()).length;
    1

Como un thread group representa un proceso, podemos cargar un ejecutable.

::

    js> var BIN = "../src/cppTestCode/exe_with_and_without_symbols/"
    
    js> var tgroup_1 = u.values(debugger_1.your_thread_groups_by_id())[0];
    js> tgroup_1.load_file_exec_and_symbols(BIN + "example_with_debugging_symbol");
    
    >>> time.sleep(SLEEPTIME)
    
    js> tgroup_1.get_display_name();                        // doctest: +ELLIPSIS
    'example_with_debugging_symbol --not running (...)'


El metodo load_file_exec_and_symbols es un metodo conveniente para cargar un ejecutable,
pero en terminos de diseño pedirle a cada ThreadGroup que tenga un metodo por cada posible
invocacion a GDB se hace simplemente inaceptable.
Basta con enumerar algunos como set-breakpoint, remove-breakpoint, continue, run.
Por esa razon los metodos disponibles son limitados. El resto de la funcionalidad de GDB
se debe acceder a traves de la api de eventos (vease shortcuts.gdb_request)

Por ejemplo podemos correr el programa que cargamos

::

    js> shortcuts.gdb_request(null, 
    ...     debugger_1.id, 
    ...     "-exec-run",
    ...     ["--start"]
    ...     );

Ahora podemos ver el nuevo estado del thread group y hasta podemos pedirle ver sus threads.

::
    
    >>> time.sleep(SLEEPTIME)

    js> tgroup_1.get_display_name();                        // doctest: +ELLIPSIS
    'example_with_debugging_symbol --running Process id: ... (...)'

    js> var thread_1 = u.values(tgroup_1.your_threads_by_id())[0];
    js> thread_1.get_display_name();                        // doctest: +ELLIPSIS
    'Thread ... (stopped)'


Si el proceso termina, tambien se actualiza el estado del thread group con el exit code del
proceso.

::
    
    js> shortcuts.gdb_request(null, 
    ...     debugger_1.id, 
    ...     "signal",
    ...     ["SIGINT"]
    ...     );

    >>> time.sleep(SLEEPTIME)

    js> tgroup_1.get_display_name();                        // doctest: +ELLIPSIS
    'example_with_debugging_symbol --not running... (...)'

::

    >>> gdb_spawner.shutdown()
    
    #>>> stop_notifier("../src/py/publish_subscribe/")
