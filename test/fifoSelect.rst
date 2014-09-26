Este test consiste en probar la funcion select junto con fifos.

Primero creamos un par de fifos:

::
   >>> import os
   >>> fifoPath = "/tmp/fifo"
   >>> os.mkfifo(fifoPath + '1')
   >>> os.mkfifo(fifoPath + '2')

Defino las funciones que van a utilizar a los fifos:

:: 
   >>> import time
   >>> def escritor(path, numero):
   ...  fifo = open(path,'w')
   ...  for i in range(3):
   ...     time.sleep(1)
   ...     fifo.write(str(numero) + ": linea " + str(i) + '\n')
   
Defino al lector:

::
   >>> import select
   >>> salidas = []
   
   >>> def lector():
   ...   fifo1 = open(fifoPath + '1','r')
   ...   fifo2 = open(fifoPath + '2','r')
   ...   salir1 = False
   ...   salir2 = False
   ...   overflowProtector = 30
   ...   fifos = [fifo1,fifo2]
   ...   while ((not salir1) or (not salir2)) and overflowProtector > 0:
   ...      overflowProtector -= 1
   ...      [paraLeer, paraEscribir, otros] = select.select(fifos,[],[])
   ...      for fifo in paraLeer:
   ...         linea = fifo.read()
   ...         salidas.append(linea)
   ...         if ("1: linea 2" in linea):
   ...            salir1 = True
   ...            fifos.remove(fifo1)
   ...         if ("2: linea 2" in linea): 
   ...            salir2 = True
   ...            fifos.remove(fifo2)

Ejecutamos primero el lector, luego los dos escritores:


::
   >>> import threading
   >>> t_escritor1 = threading.Thread(target = escritor, args = [fifoPath + '1', 1])
   >>> t_escritor2 = threading.Thread(target = escritor, args = [fifoPath + '2', 2])
   >>> t_lector = threading.Thread(target= lector, args = ())
   >>> t_lector.start()
   >>> t_escritor1.start()
   >>> t_escritor2.start()
  
   
Esperamos que se ejecuten y vemos la salida:

::
   >>> time.sleep(5)
   >>> salidas #doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS  

Limpieza: 


::

   >>> os.remove(fifoPath + '1')
   >>> os.remove(fifoPath + '2')
   
   >>> t_escritor1.join()
   >>> t_escritor2.join()
   >>> t_lector.join()


    

