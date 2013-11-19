'''
Created on 05/11/2013

@author: nicolas
'''


from wx import xrc
import  wx.lib.newevent

from GUIFrame import GUIFrame
from GDBSpawmer import Spawmer

NewFrameEvent, EVT_NEW_FRAME_EVENT = wx.lib.newevent.NewEvent()

class GUI(wx.App):
    def __init__(self, path="", pid=0):
        wx.App.__init__(self)
        self.frames = []
        self.AddFrame(path, pid)        
        spawmer = Spawmer(self)
        spawmer.start()
        
    def OnInit(self):
        self.res = xrc.XmlResource('../gui_code/gui.xrc')           
        return True
    
    def AddFrame(self, path="", pid=0):
        print "path = " + str(path) + " pid = " + str(pid)
        self.frames.append(GUIFrame(self.res, path, pid))
        


gui = GUI(path = '../c_code/Debug/Cpp_Code')
gui.MainLoop()
    

    

        
