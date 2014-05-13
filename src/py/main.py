'''
Created on 19/04/2014

@author: nicolas
'''

import gdb.gdbSpawmer
import subprocess
import os
from sys import stdin

# # ESTE MAIN SE DEBE LLAMAR DESDE LA CARPETA SRC


try:
    
    


    # lanzo nw
    ui_process = subprocess.Popen(['./scripts/run_ui.sh'], shell=True)


    os.system("python py/publish_subscribe/billboard.py start")

    spawmer = gdb.gdbSpawmer.GdbSpawmer()

    # esperar quit
    while(stdin.readline() != "quit\n"):
        print "Entrada invalida, ingrese quit para salir"
        
    spawmer.eliminarCola()

finally:
    os.system("python py/publish_subscribe/billboard.py stop")
 
    if ui_process:
        os.system("killall nw")  # XXX this is too much

