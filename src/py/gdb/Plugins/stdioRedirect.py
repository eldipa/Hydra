'''
Created on 19/10/2014

@author: nicolas
'''

import gdb


#Esto debe estar definido en algun lado.
readWriteFlag = 2
writeOnlyFlag = 1
readOnlyFlag = 0

stdInFileNo = 0 
stdOutFileNo = 1

def redirectFd(fifoPath, fd, flag = readWriteFlag):
    gdb.execute('call open("%s", %i)' % (fifoPath, flag), to_string=True)
    fdFifo = gdb.parse_and_eval("$")  # obtengo el ultimo valor de retorno
    gdb.execute("call dup2( %i, %i)" % (fdFifo, fd))
    
    
def redirectOutput(fifoPath):
    redirectFd(fifoPath, stdOutFileNo)
    gdb.execute("call setlinebuf(stdout)")
    
def redirectInput(fifoPath):
    redirectFd(fifoPath, stdInFileNo, readOnlyFlag)

class StartAndBreak (gdb.Breakpoint):
    
    def __init__(self, *args, **kwargs):
        super(StartAndBreak, self).__init__(*args, **kwargs)
        self.stdinPath = None
        self.stdoutPath = None        
        
    def register(self, path, fd):
        if (fd == 'stdin'):
            self.stdinPath = path
        elif(fd == 'stdout'):
            self.stdoutPath = path
    
    def stop (self):
        redirectOutput(self.stdoutPath)
        redirectInput(self.stdinPath)
        return True


breakpointStartAndBreak = StartAndBreak("main", internal=True)

# Registra el path del fifo ya sea para input o output
# fifo-register fifoPath stdin/stdout
class CommandFifoRegister(gdb.Command):

    def __init__(self):
        super(CommandFifoRegister, self).__init__('fifo-register', gdb.COMMAND_DATA)

    def invoke (self , args , from_tty) :            
        argv = gdb.string_to_argv(args)
        breakpointStartAndBreak.register(argv[0], argv[1])

comandoFifoRegister = CommandFifoRegister()

# Redirige el stdin/stdout al path dado
# io-redirect stdin/stdout fifoPath
class CommandIORedirect(gdb.Command):

    def __init__(self):
        super(CommandIORedirect, self).__init__('io-redirect', gdb.COMMAND_DATA)

    def invoke (self , args , from_tty) :            
        argv = gdb.string_to_argv(args)
        if (argv[0] == 'stdin'):
            redirectInput(argv[1])
        elif(argv[0] == 'stdout'):
            redirectOutput(argv[1])
        
comandoIORedirect = CommandIORedirect()
