'''
Created on 08/11/2013

@author: nicolas
'''
import threading
import wx
import time


class OutputThread(threading.Thread):
    
    def __init__(self, fd, text):
        threading.Thread.__init__(self)
        self.fd = fd
        self.text = text
        
        

    def run(self):
        while True:
            where = self.fd.tell()
            line = self.fd.readline()
            if not line:
                time.sleep(.5)
                self.fd.seek(where)
            else:
                wx.CallAfter(self.text.AppendText, line)
            
