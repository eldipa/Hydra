'''
Created on 19/10/2014

@author: nicolas
'''

import gdb

readWriteFlag = 2

def redirectOutput(fifoPath):
    print "redirigiendo a %s" % fifoPath
    gdb.execute('call open("%s", %i)' % (fifoPath, readWriteFlag), to_string=True)
    fdFifo = gdb.parse_and_eval("$")  # obtengo el ultimo valor de retorno
    print  "fdFifo: %i" % fdFifo
    gdb.execute("call dup2( %i, %i)" % (fdFifo, 1))
    dup2 = gdb.parse_and_eval("$")
    print  "dup2: %i" % dup2
    gdb.execute("call setlinebuf(stdout)")
    setlinebuf = gdb.parse_and_eval("$")
    print  "setlinebuf: %i" % setlinebuf
    

class StartAndBreak (gdb.Breakpoint):
        
    def register(self, path):
        self.path = path
        print "registrado %s" % self.path
    
    def stop (self):
        print ("redirecting")
        redirectOutput(self.path)
        return True


breakpointStartAndBreak = StartAndBreak("main", internal=True)


class CommandFifoRegister(gdb.Command):

    def __init__(self):
        super(CommandFifoRegister, self).__init__('fifo-register', gdb.COMMAND_DATA)

    def invoke (self , args , from_tty) :            
        argv = gdb.string_to_argv(args)
#         globalFifoPath = argv[0]
        breakpointStartAndBreak.register(argv[0])
#         print "registrado %s" % globalFifoPath

comandoFifoRegister = CommandFifoRegister()


class CommandOutputRedirect(gdb.Command):

    def __init__(self):
        super(CommandOutputRedirect, self).__init__('output-redirect', gdb.COMMAND_DATA)

    def invoke (self , args , from_tty) :            
        argv = gdb.string_to_argv(args)
        redirectOutput(argv[0])
        
comandoOutputRedirect = CommandOutputRedirect()
