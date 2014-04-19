'''
Created on 19/04/2014

@author: nicolas
'''

from gdb.gdbSpawmer import GdbSpawmer
from Messenger import Messenger
import socket
import subprocess
import os
from sys import stdin

## ESTE MAIN SE DEBE LLAMAR DESDE LA CARPETA SRC

serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
serversocket.bind(("localhost", 5555))
serversocket.listen(1)

# lanzo nw
# print os.getcwd()
subprocess.Popen(['./scripts/start.sh'], shell=True)

os.chdir("./py/gdb")
# print os.getcwd()
(clientsocket, address) = serversocket.accept()

spawmer = GdbSpawmer()
messenger = Messenger(clientsocket, spawmer)

# esperar quit
while(stdin.readline() != "quit"):
    print "Entrada invalida, ingrese quit para salir"

serversocket.close()

