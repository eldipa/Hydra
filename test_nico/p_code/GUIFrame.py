'''
Created on 17/11/2013

@author: nicolas
'''
from subprocess import PIPE
import subprocess
import tempfile
import wx
from wx.xrc import XRCCTRL
from OutputThread import OutputThread


shared_path = "../shared_code/Debug/libShared_Code.so"
gdb_ld_preload = "set exec-wrapper env LD_PRELOAD="

class GUIFrame():
    
    def __init__(self, res ,path="", pid=0):
        self.path = path
        self.pid = pid
        self.res = res
        
        self.init_frame()
        self.init_text(self.frame)
        
        outFile = tempfile.NamedTemporaryFile()
        self.init_OutputThread(outFile)
        self.startGDB(outFile)
        
    def init_frame(self):
        self.frame = self.res.LoadFrame(None, 'MainFrame')
        self.frame.Show()
        
    def init_text(self, frame):
        self.text = XRCCTRL(frame, "text");
        self.text.Bind(wx.EVT_TEXT_ENTER , self.nuevaLinea)
        
    def init_OutputThread(self, outFile):
        to = OutputThread(outFile, self.text)
        to.daemon = True
        to.start()
        
    def startGDB(self, outFile):
        if (self.path != ""):
            self.gdb = subprocess.Popen(["gdb", self.path], stdout=outFile, stderr=outFile , stdin=PIPE)
            self.gdb.stdin.write(gdb_ld_preload + shared_path + "\n")
        elif (self.pid != 0):
            self.gdb = subprocess.Popen(["gdb", "-p", str(self.pid)], stdout=outFile, stderr=outFile , stdin=PIPE)
        self.frame.SetTitle("PID = " + str(self.gdb.pid))

    def nuevaLinea(self, event):
        lineNum = len(self.text.GetRange(0, self.text.GetInsertionPoint()).split("\n"))
        lineText = self.text.GetLineText(lineNum)
        self.text.AppendText("\n")
        # remuevo el prompt
        lineText = lineText.replace("(gdb) ", "", 1)  
        self.gdb.stdin.write(lineText + "\n")
        
        