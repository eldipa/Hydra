
El objetivo es lograr enviar a travez de un fifo un eof, sin cerrar de manera
permanente ninguno de los extremos del mismo.

Para la pruebas creamos el fifo:

:: 
   >>> import os 
   >>> fifoPath = "/tmp/fifoTest" 
   >>> os.mkfifo(fifoPath) 

Un espacio de memoria compartida para intercambiar mensajes fuera de la fifo:

:: 
   >>> import threading, time 
   >>> shared_list = [] 
   >>> shared_lock = threading.Lock() 
   >>>                               
   >>> def add_sync(data):
   ...   global shared_lock 
   ...   global shared_list 
   ... 
   ...   shared_lock.acquire() 
   ...   shared_list.append(data) 
   ...   shared_lock.release()

Defino un lector cuya funcionalidad es leer hasta un eof, al finalizar guarda un
mensaje en el array:

::
   >>> def lector():
   ...   fifo = open(fifoPath,'r') # Esta linea deberia bloquear hasta que se haga open de escritura del fifo
   ...   line = os.read(fifo.fileno(), 15)
   ...   while (line != ''):
   ...      add_sync(line)
   ...      line = os.read(fifo.fileno(), 15)
   ...   add_sync("EOF")
   ...   fifo.close()
   
   >>> t_lector = threading.Thread(target= lector, args = ())
   >>> t_lector.start()
   
Abrimos el fifo como escritura y mandamos algunos mensajes:

::
   >>> fifo = open(fifoPath,'w')  
   >>> os.write(fifo.fileno(), "Linea 1") #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   7
   >>> fifo.close()
   
Si todo salio bien, deberiamos ver los mensajes 'linea 1' y 'EOF' en el array
compartido, luego de haer un join:

:: 
   >>> t_lector.join()
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   ['Linea 1', 'EOF']
   
Ahora probamos de modificar al lector, para que luego del eof, siga leyendo,
digamos hasta que encuentre 3 eof.


:: 
   >>> def lector():
   ...   fifo = open(fifoPath,'r') # Esta linea deberia bloquear hasta que se haga open de escritura del fifo
   ...   for i in range(3):
   ...      line = os.read(fifo.fileno(), 15)
   ...      while (line != ''):
   ...         add_sync(line)
   ...         line = os.read(fifo.fileno(), 15)
   ...      add_sync("EOF")
   ...   fifo.close()

   >>> shared_list = [] 
   >>> t_lector = threading.Thread(target= lector, args = ())
   >>> t_lector.start()
   
Enviamos la primer linea y eof, y vemos si los mismos llegan
   

:: 

   >>> fifo = open(fifoPath,'w')  
   >>> os.write(fifo.fileno(), "Linea 1") #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS 
   7 
   >>> fifo.close()
   >>> t_lector.join()
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   ['Linea 1', 'EOF', 'EOF', 'EOF']
   
Como se observa, esta vez hay 3 EOF, esto se debe a que del lado lector una vez
que el fd llego al EOF, se levanta un flag que hace retornar directamente al
read siguiente. Esto de querer manejarse distintio, ya forma parte del programa
cliente, por ejemplo, cerrando y abriendo de nuevo al fd:

::
   >>> def lector():
   ...   for i in range(3):
   ...      fifo = open(fifoPath,'r') # Esta linea deberia bloquear hasta que se haga open de escritura del fifo
   ...      line = os.read(fifo.fileno(), 15)
   ...      while (line != ''):
   ...         add_sync(line)
   ...         line = os.read(fifo.fileno(), 15)
   ...      add_sync("EOF")
   ...      fifo.close()
   
   >>> shared_list = [] 
   >>> t_lector = threading.Thread(target= lector, args = ())
   >>> t_lector.start()
   
Repetimos el procedimiento:

::   
   >>> fifo = open(fifoPath,'w')  
   >>> os.write(fifo.fileno(), "Linea 1") #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS 
   7 
   >>> fifo.close()
   >>> time.sleep(2)
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   ['Linea 1', 'EOF']
   
Esta vez, solo llego un EOF, lo hacemos dos veces mas:

:: 

   >>> fifo = open(fifoPath,'w')  
   >>> os.write(fifo.fileno(), "Linea 2") #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS 
   7 
   >>> fifo.close()
   >>> time.sleep(2) #sin este sleep, el otro extremo no llega a darse cuenta de que hubo un EOF
   >>> fifo = open(fifoPath,'w')  
   >>> os.write(fifo.fileno(), "Linea 3") #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS 
   7 
   >>> fifo.close()
   >>> t_lector.join()
   >>> shared_list #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
   ['Linea 1', 'EOF', 'Linea 2', 'EOF', 'Linea 3', 'EOF']
   
   
Es importante destacar que si al hacer close del lado escritor, y se hace un
open antes de que el extremo lector realice el read, el lado lector nunca vera
el EOF. Es decir, llega esto:

['Linea 1', 'EOF', 'Linea 2Linea 3', 'EOF']

Lo que es una complicación.... ya que no hay forma de asegurarse de que el
target lo capture.

Limpieza:

::
   >>> os.remove(fifoPath)


