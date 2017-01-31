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
import signal
import traceback
import processInfoRecolector
import ipcsInfoRecolector
import forkDetector


if (not match(".*/src$", os.getcwd())):
    print "ESTE MAIN SE DEBE LLAMAR DESDE LA CARPETA SRC"
    sys.exit()

import globalconfig
import splash
import gdb.gdbSpawner
import publish_subscribe.eventHandler

try:
    spawner = ui_process = None

    globalconfig.load_global_config()
    cfg = globalconfig.get_global_config()

    syslog.openlog(cfg.get("gdbspawner", "name"), logoption=syslog.LOG_PID)
    syslog.setlogmask(syslog.LOG_UPTO(getattr(syslog, cfg.get("gdbspawner", "log_level"))))

    node_webkit_executable_path = cfg.get("ui", "node-webkit-executable-path")
    udev_lib_path = cfg.get("ui", "udev-lib-path")
    
    is_ui_loaded = threading.Event()
    is_ui_closed = threading.Event()
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

    def on_termination_signal(signum, frame):
        is_ui_loaded.set()
        is_ui_closed.set()

    signal.signal(signal.SIGINT, on_termination_signal)
    signal.signal(signal.SIGTERM, on_termination_signal)
    signal.signal(signal.SIGHUP, on_termination_signal)

    with splash.Splash("resources/splash.png", event_to_wait=is_ui_loaded, loading_event_signal=loading_event_signal, loading_event_holder=last_loading_event, wait_timeout=15) as sp:
        sp.update_state("Loading the Notifier...")
        os.system("python py/publish_subscribe/notifier.py start")

        ev = publish_subscribe.eventHandler.EventHandler(name="splash")
        ev.subscribe("ui.closed",  lambda d: is_ui_closed.set(), return_subscription_id=True, send_and_wait_echo=True)
        ev.subscribe("ui.loaded",  the_ui_is_loaded, return_subscription_id=True, send_and_wait_echo=True)
        ev.subscribe("ui.loading", add_new_loading_event, return_subscription_id=True, send_and_wait_echo=True)

        sp.update_state("Loading the Interface...")
        env = os.environ.copy()
        env['LD_LIBRARY_PATH'] = env.get('LD_LIBRARY_PATH', "") + ":" + udev_lib_path
        ui_process = subprocess.Popen([node_webkit_executable_path, "."], shell=False, env=env)

        spawner = gdb.gdbSpawner.GdbSpawner()
        processInfoRecolector = processInfoRecolector.ProcessInfoRecolector()
        processInfoRecolector.start()
        ipcsInfoRecolector = ipcsInfoRecolector.IPCSInfoRecolector()
        ipcsInfoRecolector.start()
        forkDetector = forkDetector.ForkDetector()
        forkDetector.start()

    while not is_ui_closed.wait(15):
        pass

except Exception as inst:
    print type(inst)
    print traceback.format_exc()

finally:
    if spawner:
        spawner.shutdown()
    
    processInfoRecolector.finalizar()
    ipcsInfoRecolector.finalizar()
    forkDetector.finalizar()
    
    processInfoRecolector.join()
    ipcsInfoRecolector.join()
    forkDetector.join()
    
    os.system("python py/publish_subscribe/notifier.py stop")
 
    if ui_process and ui_process.poll() is None:
        ui_process.send_signal(signal.SIGKILL) 

