'''
Created on 19/04/2014

@author: nicolas
'''

import gdb.gdbSpawmer
import subprocess
import os
import sys
from sys import stdin
from re import match

if (not match(".*/src$", os.getcwd())):
    print "ESTE MAIN SE DEBE LLAMAR DESDE LA CARPETA SRC"
    sys.exit()

try:

    # lanzo nw
    ui_process = subprocess.Popen(['./scripts/run_ui.sh'], shell=True)

    os.system("python py/publish_subscribe/notifier.py start")

    spawmer = gdb.gdbSpawmer.GdbSpawmer(comandos=True)

    # esperar quit
    while(stdin.readline() not in ["quit\n","q\n"]):
        print "Entrada invalida, ingrese quit o q para salir"

finally:
    
    spawmer.shutdown()
    
    os.system("python py/publish_subscribe/notifier.py stop")
 
    if ui_process:
        os.system("killall nw")  # XXX this is too much

