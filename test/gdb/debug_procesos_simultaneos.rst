La pregunta es simple, GDB puede ejecutar varios procesos a la vez?

En una sesion normal, un usuario ejecutaria un *run* y gdb no devolveria el control
hasta que se llegue a un breakpoint o el proceso finalize.

Veremos si es posible usando una interfaz automatizada.

Para ello usaremos el siguiente ejecutable.

.. include:: ../src/cppTestCode/write_one_char_at_time.c
  :code: c


Como se puede ver, el programa abre un archivo y luego escribe en él el patron
'abcde', escribiendo un caracter a la vez hasta llegar a un limite en la cantidad
de caracteres; demorando entre cada escritura.

Si ejecutamos dos procesos en serie, veremos el patron 'abcde' repetirse varias
veces.
En cambio, si los procesos corren en paralelo, el archivo contendran un mix de
patrones entremezclados (*interleaved*).

Creamos primero el archivo de prueba

::

   >>> import os
   >>> import time
   >>> os.system("touch data; > data")                # doctest: +PASS

Iniciamos el sistema publish_subscribe (por ser una dependencia de nuestro wrapper
gdb) e instanciamos uno de esos wrapper.

::

   >>> os.system("python py/publish_subscribe/notifier.py start") # doctest: +PASS

   >>> from gdb import gdb
   >>> gdbInstance = gdb.Gdb()


Ahora cargamos 2 *inferiors* con ese ejecutable

::
   >>> from shortcuts import request

   >>> request(gdbInstance, "-file-exec-and-symbols cppTestCode/write_one_char_at_time", return_none=True)
   >>> request(gdbInstance, "add-inferior -exec cppTestCode/write_one_char_at_time", return_none=True)


Bien, ahora nos moveremos al inferior 1, haremos un *run*, luego iremos al inferior 2 
y ahoremos otro *run*.

::

   >>> request(gdbInstance, "inferior 1", return_none=True)
   >>> request(gdbInstance, "run", return_none=True)

   >>> request(gdbInstance, "inferior 2", return_none=True)
   >>> request(gdbInstance, "run", return_none=True)

Ahora solo esperamos un poco para que puedan ejecutar algunas lineas

::

   >>> time.sleep(10)

Bien, ahora procedemos a matar a ambos procesos y finalizar la session de gdb.

::

   >>> gdbInstance.shutdown()
   0

Bien, si ambos proceso se ejecutaron en paralelo veremos un entremezclado del patron

::

   >>> with open('data', 'r') as src:
   ...   data = src.read()

   >>> data != ''
   True

   >>> data = data.replace('abcde', '')
   >>> data
   ''

Como vemos, el archivo contenia los patrones en orden, probando que ambos proceso corrieron
en serie.

Pero esto aun no termina. En algunos targets, gdb permite ejecutar comandos en paralelo.
Vease: 
 - https://sourceware.org/gdb/onlinedocs/gdb/Background-Execution.html
 - https://sourceware.org/gdb/onlinedocs/gdb/Asynchronous-and-non_002dstop-modes.html

-----
*Sin embargo, en mi computadora Linux 3.8.0-26-generic Ubuntu, no funciona.
Dejo el resto de los doctests 'comentados' para dejar el codigo y reproducirlo (tal vez)
en otra computadora en la que sí funcione ejecutar cosas en background.*

----

Primero borramos el archivo y lanzamos un gdb nuevo

::

   ### os.system("touch data; > data")                # doctest: +PASS

   ### from gdb import gdb
   ### gdbInstance = gdb.Gdb()

Y repetimos los mismos pasos para cargar el ejecutable en 2 inferiores.

::

   ### gdbInstance.directCommand("-file-exec-and-symbols cppTestCode/write_one_char_at_time")
   ### gdbInstance.directCommand("add-inferior -exec cppTestCode/write_one_char_at_time")

Pero esta vez usaremos el comando *run&* en vez de *run*.

::

   ### gdbInstance.directCommand("inferior 1")
   ### gdbInstance.directCommand("run&")

   ### gdbInstance.directCommand("inferior 2")
   ### gdbInstance.directCommand("run&")

   ### time.sleep(5)
   ### gdbInstance.exit()

Ahora vemos si hubo o no interleaved

::

   ### with open('data', 'r') as src:
   ...   data = src.read()

   ### data != ''
   True

   ### data = data.replace('abcde', '')
   ### data != ''
   True

Como vemos, el archivo data *no* esta compuesto por *solamente* patrones bien formados
lo que prueba que ambos procesos se corrieron en paralelo.

Finalmente eliminamos el archivo y cerramos el publish subscriber

::

   >>> os.system("rm data")                                       # doctest: +PASS
   >>> os.system("python py/publish_subscribe/notifier.py stop")  # doctest: +PASS
