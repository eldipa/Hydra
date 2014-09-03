
'''
Created on 31/08/2014

@author: nicolas
'''

import gdb

bp1 = gdb.Breakpoint("pipe")

def stopHandler(stopEvent):
    for b in stopEvent.breakpoints:
        if b == bp1:
            print "Se hizo Pipe"
            print "args = " ,gdb.parse_and_eval("$rdi") #o quiza en ebx? 
            gdb.execute("continue")

gdb.events.stop.connect(stopHandler)