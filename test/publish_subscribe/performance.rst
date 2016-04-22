Probaremos distintas comunicaciones y esquemas para ver la performance del publish_subscribe.

::

   >>> import os, time
   >>> from subprocess import check_output
   >>> from threading import Lock

   >>> # just an auxiliary function for testing purpose only to know if the process 
   >>> # is running
   >>> def is_running():
   ...   time.sleep(0.01)
   ...   out = check_output(["python", "py/publish_subscribe/notifier.py", "status"])
   ...   return "running" in out

   >>> os.system("python py/publish_subscribe/notifier.py start")
   0
   >>> is_running()
   True


::
   
   >>> import syslog
   >>> syslog.setlogmask(syslog.LOG_UPTO(syslog.LOG_ERR))

   >>> import publish_subscribe.eventHandler 
   >>> agent1 = publish_subscribe.eventHandler.EventHandler()

::

   >>> last_message_found = Lock()
   >>> last_message_found.acquire()
   >>> def foo_handler(event):
   ...   global last_message_found
   ...   if event['n'] == 0:
   ...      last_message_found.release()
   ...
   >>>
   >>> agent1.subscribe('foo', foo_handler)

En este primer experimento crearemos N eventos de tipo foo con un minimo de bytes en el payload y
con solo un agente suscripto a el.
Con esto probamos la performance del sistema en condiciones casi ideales al no incluir el overhead
de copia de mensajes grandes. Este experimento marca un minimo.

::

   >>> begin_experiment_time = time.time()
   >>> for i in reversed(range(1000, -1, -1)):
   ...    agent1.publish('foo', {'n':i, 'd':''})
   >>> last_message_found.acquire(); elapsed_time = time.time() - begin_experiment_time
   >>> elapsed_time
   0

a


::

   >>> payload = "a" * (7000 * 9)
   >>> begin_experiment_time = time.time()
   >>> for i in reversed(range(1000, -1, -1)):
   ...    agent1.publish('foo', {'n':i, 'd': payload})
   >>> last_message_found.acquire(); elapsed_time = time.time() - begin_experiment_time
   >>> elapsed_time
   0

a

::

   >>> payload = "}a{}{d}{{}" * (700 * 9)
   >>> begin_experiment_time = time.time()
   >>> for i in reversed(range(1000, -1, -1)):
   ...    agent1.publish('foo', {'n':i, 'd': payload})
   >>> last_message_found.acquire(); elapsed_time = time.time() - begin_experiment_time
   >>> elapsed_time
   0

a

::

   js> var agent2 = new event_handler.EventHandler();
   js> agent2.init();            // this method is NOT blocked

   >>> time.sleep(3)    # workaround!!!
   >>> begin_experiment_time = time.time()
   
   js> for (var i = 1000; i >= 0; --i) {
   ...    agent2.publish('foo', {'n':i, 'd':''});
   ... }

   >>> last_message_found.acquire(); elapsed_time = time.time() - begin_experiment_time
   >>> elapsed_time
   0

a

::

   js> var bar_handler = function(event) {
   ...   if (event['n'] === 0) {
   ...       agent2.publish('foo', {'n':0, 'd':''});
   ...   }
   ... };

   js> agent2.subscribe('bar', bar_handler);
   

   >>> payload = "}a{}{d}{{}" * (700 * 9)
   >>> begin_experiment_time = time.time()
   >>> for i in reversed(range(1000, -1, -1)):
   ...    agent1.publish('bar', {'n':i, 'd': payload})
   >>> last_message_found.acquire(); elapsed_time = time.time() - begin_experiment_time
   >>> elapsed_time
   0

::

   >>> agent1.close();
   
   >>> os.system("python py/publish_subscribe/notifier.py stop")
   0
   >>> is_running()
   False

