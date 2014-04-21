'''
Created on 19/04/2014

@author: nicolas
'''

import gdb.gdbSpawmer
import messenger
import socket
import subprocess
import os
from sys import stdin

## ESTE MAIN SE DEBE LLAMAR DESDE LA CARPETA SRC

clientsocket = None
ui_process = None
serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
serversocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
try:
   serversocket.bind(("localhost", 5555))
   serversocket.listen(1)

   # lanzo nw
   # print os.getcwd()
   ui_process = subprocess.Popen(['./scripts/run_ui.sh'], shell=True)

   os.chdir("./py/gdb")
   # print os.getcwd()
   (clientsocket, address) = serversocket.accept()
   spawmer = gdb.gdbSpawmer.GdbSpawmer()
   messenger = messenger.Messenger(clientsocket, spawmer)

   # esperar quit
   while(stdin.readline() != "quit\n"):
       print "Entrada invalida, ingrese quit para salir"

finally:
   serversocket.close()
   if clientsocket:
      clientsocket.shutdown(2)
      clientsocket.close()

   if ui_process:
      os.system("killall nw") # XXX this is too much

