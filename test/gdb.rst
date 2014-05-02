Introduccion
------------

Gdb es uno de los debuggers mas usados y mas eficientes existentes en la
actualidad. En el proyecto actual se realizo un front-end del mismo. Como esta
compuesto y como utilizarlo se explica a continuacion

Estructura
----------

El modulo de gdb esta compuesto por tres partes. 
 - Objeto gdb
 - Proceso gdb
 - Thread OutputReader

Dependencias
------------

El modulo depende de *publish_subscribe* y de *gdb_mi*. Para poder ejecutar las
pruebas en primer lugar debemos dar de alta al servidor de *publish_subscribe*:

:: 
   >>> import os
   >>> from subprocess import check_output
   >>> def is_running():
   ...   out = check_output(["python", "publish_subscribe/billboard.py", "status"])
   ...   return "running" in out
   >>> os.system("python publish_subscribe/billboard.py start")
   0
   >>> is_running()
   True
   

Ademas se necesita un ejecutable que debuggear:

(mostrar fuente)


Para instaciar un nuevo proceso gdb se debe hacer:

::
   >>> ##from gdb import gdb
   >>> ##gdb = gdb.Gdb()



::
   >>> ##finalizo al server.
   >>> os.system("python publish_subscribe/billboard.py stop")
   0
   >>> is_running()
   False
  
