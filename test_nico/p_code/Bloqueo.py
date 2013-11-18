'''
Created on 18/11/2013

@author: nicolas
'''


import sys
import threading
import datetime
sys.path.append("/home/nicolas/workspace_c++/C-GDB/test_martin/ipc/pyipc")
from ipc import MessageQueue #@UnresolvedImport ignorar!!

_QUEUE_PATH_ = "/tmp/forkHack"
_QUEUE_CHAR_ = 'a'

def conteo():
    while (True):
        print datetime.datetime.now().time()
        
def bloqueante():
    open(_QUEUE_PATH_, _QUEUE_CHAR_)
    msgQueue = MessageQueue(_QUEUE_PATH_, _QUEUE_CHAR_, 0666, True)
    msgQueue.pull(type = 1)
    
    
t1 = threading.Thread(target = conteo)
t2 = threading.Thread(target = bloqueante)
t1.start()
t2.start()