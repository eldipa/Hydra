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
    gdb.execute("call dup( %i)" % (fd))
    fdBackup = gdb.parse_and_eval("$")
    gdb.execute("call dup2( %i, %i)" % (fdFifo, fd))
    return {'old': fdBackup, 'new': fdFifo}
    
    
def redirectOutput(fifoPath):
    fd = redirectFd(fifoPath, stdOutFileNo)
    gdb.execute("call setlinebuf(stdout)")
    return fd
    
def redirectInput(fifoPath):
    fd = redirectFd(fifoPath, stdInFileNo, readOnlyFlag)
    return fd

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
        self.revertIn = False
        self.InFd = {}
        self.revertOut = False
        self.OutFd = {}

    def invoke (self , args , from_tty) :            
        argv = gdb.string_to_argv(args)
        if (argv[0] == 'stdin'):
            fd = redirectInput(argv[1])
            self.InFd = fd
            print "Redirecting stdin to new: %i, old: %i" % (fd['new'], fd['old'])
            self.revertIn = True
        elif(argv[0] == 'stdout'):
            fd = redirectOutput(argv[1])
            self.OutFd = fd
            print "Redirecting stdout to new: %i, old: %i" % (fd['new'], fd['old'])
            self.revertOut = True
        
comandoIORedirect = CommandIORedirect()

class stdioRedirectCleanup(gdb.Command):
    
    def __init__(self):
        super(stdioRedirectCleanup, self).__init__('io-revert', gdb.COMMAND_DATA)
        
    def invoke (self , args , from_tty) :       
        if comandoIORedirect.revertIn:
            print "Reverting stdin: %i -> %i" % (comandoIORedirect.InFd['old'], stdInFileNo)
            gdb.execute("call dup2( %i, %i)" % (comandoIORedirect.InFd['old'], stdInFileNo))
        if comandoIORedirect.revertOut:
            print "Reverting stdout: %i -> %i" % (comandoIORedirect.OutFd['old'], stdOutFileNo)
            gdb.execute("call dup2( %i, %i)" % (comandoIORedirect.OutFd['old'], stdOutFileNo))

comandoRedirectCleanup = stdioRedirectCleanup()
