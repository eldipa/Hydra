'''
Created on 19/04/2014

@author: nicolas
'''

import subprocess
import os
import sys
from sys import stdin
from re import match
import syslog
import threading

if (not match(".*/src$", os.getcwd())):
    print "ESTE MAIN SE DEBE LLAMAR DESDE LA CARPETA SRC"
    sys.exit()

import globalconfig
import splash
import gdb.gdbSpawner
import publish_subscribe.eventHandler

try:
    globalconfig.load_global_config()
    cfg = globalconfig.get_global_config()

    syslog.openlog(cfg.get("gdbspawner", "name"), logoption=syslog.LOG_PID)
    syslog.setlogmask(syslog.LOG_UPTO(getattr(syslog, cfg.get("gdbspawner", "log_level"))))
    
    is_ui_loaded = threading.Event()
    loading_event_signal = threading.Condition()
    last_loading_event = {'ev': None}

    def add_new_loading_event(data):
        loading_event_signal.acquire()
        try:
            last_loading_event['ev'] = data['what']
        finally:
            loading_event_signal.notify()
            loading_event_signal.release()

    def the_ui_is_loaded(data):
        is_ui_loaded.set()
        add_new_loading_event({'what': "Interface loaded"})

    with splash.Splash("resources/splash.png", event_to_wait=is_ui_loaded, loading_event_signal=loading_event_signal, loading_event_holder=last_loading_event, wait_timeout=15) as sp:
        sp.update_state("Loading the Notifier...")
        os.system("python py/publish_subscribe/notifier.py start")

        ev = publish_subscribe.eventHandler.EventHandler(name="splash")
        ev.subscribe("ui.loaded",  the_ui_is_loaded, return_subscription_id=True, send_and_wait_echo=True),
        ev.subscribe("ui.loading", add_new_loading_event, return_subscription_id=True, send_and_wait_echo=True),

        sp.update_state("Loading the Interface...")
        ui_process = subprocess.Popen(['./scripts/run_ui.sh'], shell=True)

        spawner = gdb.gdbSpawner.GdbSpawner()

    # esperar quit
    while(stdin.readline() not in ["quit\n","q\n"]):
        print "Entrada invalida, ingrese quit o q para salir"

except Exception as inst:
    print type(inst)    
    print inst.args     
    print inst

finally:
    
    spawner.shutdown()
    
    os.system("python py/publish_subscribe/notifier.py stop")
 
    if ui_process:
        os.system("killall nw")  # XXX this is too much
        
    

