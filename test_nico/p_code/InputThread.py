'''
Created on 08/11/2013

@author: nicolas
'''
import threading
import time


class InputThread(threading.Thread):
    
    def __init__(self, path, text):
        threading.Thread.__init__(self)
        self.path = path
        self.text = text
        

    def run(self):
        fd= open(self.path, 'w')
        for i in range(5):
            time.sleep(3)
            fd.write("help")
            print i
