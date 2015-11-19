::

   >>> import sys
   >>> sys.path.append("../src/py/")

   >>> from shortcuts import start_notifier, stop_notifier, request, collect
   >>> start_notifier("../src/py/publish_subscribe/")

   >>> import time
   >>> from gdb.gdb import Gdb
   >>> gdb = Gdb()

   >>> request(gdb, "python import gdb_module_loader; gdb_module_loader.get_module_loader().load('echo')", [])      # doctest: +PASS
   >>> request(gdb, "gdb-module-echo-activate", [])        # doctest: +PASS
   
   >>> request(gdb, "gdb-module-echo-request", ["hello-world!"])   # doctest: +PASS
   
   >>> gdb.shutdown()
   0

   >>> stop_notifier("../src/py/publish_subscribe/")
