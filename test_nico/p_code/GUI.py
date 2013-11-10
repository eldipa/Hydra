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


class GUI(wx.App):
    def __init__(self, path):
        wx.App.__init__(self)
        self.path = path
        
    def OnInit(self):
        self.res = xrc.XmlResource('../gui_code/gui.xrc')   
        outFile = tempfile.NamedTemporaryFile()
        
        self.init_frame()
        self.init_text()
        self.init_OutputThread(outFile)
        
        self.gdb = subprocess.Popen(["gdb", "../c_code/Debug/Cpp_Code"], stdout=outFile, stderr =outFile , stdin=PIPE)
        
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
        lineNum = len(self.text.GetRange( 0, self.text.GetInsertionPoint() ).split("\n"))
        lineText = self.text.GetLineText(lineNum)
        self.text.AppendText("\n")
        lineText = lineText[6:]
        self.gdb.stdin.write(lineText + "\n")


app = GUI(path = '../c_code/Debug/Cpp_Code')
app.MainLoop()


        
