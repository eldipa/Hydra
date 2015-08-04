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
import syslog

if (not match(".*/src$", os.getcwd())):
    print "ESTE MAIN SE DEBE LLAMAR DESDE LA CARPETA SRC"
    sys.exit()

import globalconfig

try:

    globalconfig.load_global_config()
    cfg = globalconfig.get_global_config()

    syslog.openlog(cfg.get("gdbspawner", "name"), logoption=syslog.LOG_PID)
    syslog.setlogmask(syslog.LOG_UPTO(getattr(syslog, cfg.get("gdbspawner", "log_level"))))

    # lanzo nw
    ui_process = subprocess.Popen(['./scripts/run_ui.sh'], shell=True)

    os.system("python py/publish_subscribe/notifier.py start")

    spawmer = gdb.gdbSpawmer.GdbSpawmer(comandos=True, log =True, inputRedirect=True)

    # esperar quit
    while(stdin.readline() not in ["quit\n","q\n"]):
        print "Entrada invalida, ingrese quit o q para salir"

except Exception as inst:
    print type(inst)    
    print inst.args     
    print inst

finally:
    
    spawmer.shutdown()
    
    os.system("python py/publish_subscribe/notifier.py stop")
 
    if ui_process:
        os.system("killall nw")  # XXX this is too much
        
    

