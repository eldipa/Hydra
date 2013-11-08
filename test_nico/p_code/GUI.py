'''
Created on 05/11/2013

@author: nicolas
'''

import subprocess
import tempfile
from wx import xrc
import wx
from wx.xrc import XRCCTRL
from OutputThread import OutputThread
from InputThread import InputThread
import os


class GUI(wx.App):
    def OnInit(self):
        self.res = xrc.XmlResource('../gui_code/gui.xrc')    
        self.init_frame()
        
        tmpdir = tempfile.mkdtemp()
        path = os.path.join(tmpdir, 'myfifo')
        os.mkfifo(path) 
        
        self.outFile = tempfile.NamedTemporaryFile()
        to = OutputThread(self.outFile, self.text)
        to.start()
        
        ti = InputThread(path, self.text)
        ti.start()
        self.infile = open(path, 'r')
        
        self.gdb = subprocess.Popen("gdb", stdout=self.outFile, stdin=self.infile)
        
        
        return True

    def init_frame(self):
        self.frame = self.res.LoadFrame(None, 'MainFrame')
        self.text = XRCCTRL(self.frame, "text");
        self.frame.Show()



app = GUI()
app.MainLoop()


        
