'''
Created on 05/11/2013

@author: nicolas
'''

import wx
from wx import xrc

class GUI(wx.App):
    def OnInit(self):
        self.res = xrc.XmlResource('../gui_code/gui.xrc')    
        self.init_frame()
        return True

    def init_frame(self):
        self.frame = self.res.LoadFrame(None, 'MainFrame')
        self.frame.Show()



app = GUI(False)
app.MainLoop()
        