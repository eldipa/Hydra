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
from subprocess import PIPE

shared_path = "../shared_code/Debug/libShared_Code.so"
gdb_ld_preload = "set exec-wrapper env LD_PRELOAD="

class GUI(wx.App):
    def __init__(self, path="", pid=0):
        wx.App.__init__(self)
        outFile = tempfile.NamedTemporaryFile()
        self.init_OutputThread(outFile)
        if (path != ""):
            self.gdb = subprocess.Popen(["gdb", path], stdout=outFile, stderr=outFile , stdin=PIPE)
            self.gdb.stdin.write(gdb_ld_preload + shared_path + "\n")
        elif (pid != 0):
            self.gdb = subprocess.Popen(["gdb", "-p", pid], stdout=outFile, stderr=outFile , stdin=PIPE)
        
        
    def OnInit(self):
        self.res = xrc.XmlResource('../gui_code/gui.xrc')           
        self.init_frame()
        self.init_text()
        return True

    def init_frame(self):
        self.frame = self.res.LoadFrame(None, 'MainFrame')
        self.frame.Show()
        
    def init_text(self):
        self.text = XRCCTRL(self.frame, "text");
        self.text.Bind(wx.EVT_TEXT_ENTER , self.nuevaLinea)
        
    def init_OutputThread(self, outFile):
        to = OutputThread(outFile, self.text)
        to.daemon = True
        to.start()
        
        

    def nuevaLinea(self, event):
        lineNum = len(self.text.GetRange(0, self.text.GetInsertionPoint()).split("\n"))
        lineText = self.text.GetLineText(lineNum)
        self.text.AppendText("\n")
        # remuevo el prompt
        lineText = lineText.replace("(gdb) ", "", 1)  
        self.gdb.stdin.write(lineText + "\n")


def GDBStart(path):
    app = GUI(path=path)
    app.MainLoop()
    
def GDBAttach(pid):
    app = GUI(pid=pid)
    app.MainLoop()

# Para ejecutar este archivo .py
GDBStart('../c_code/Debug/Cpp_Code')
        
