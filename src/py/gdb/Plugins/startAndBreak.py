'''
Created on 19/10/2014

@author: nicolas
'''

import gdb

__FIFO__ = None

class StartAndBreak (gdb.Breakpoint):
    def stop (self):
        fdFifo = __FIFO__.fileno()
        print "redirecting"
        gdb.execute("dup2(" + str(fdFifo) + "," + str(1) + ")")
        gdb.execute("setlinebuf(" + fdFifo + ")")
        return True


StartAndBreak("main", internal=True , temporary=True)

class CommandOutputRedirect(gdb.Command):

    def __init__(self):
        super(CommandPointerPrinter, self).__init__('output-redirect', gdb.COMMAND_DATA)

    def invoke (self , args , from_tty) :            
        argv = gdb.string_to_argv(args)
        __FIFO__ = open(argv[0], 'w')
        
    

CommandOutputRedirect()
