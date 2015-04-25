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
    if (fdFifo < 0):
        print "ERROR fdFifo " + "fifoPath=" + str(fifoPath)
    gdb.execute("call dup( %i)" % (fd))
    fdBackup = gdb.parse_and_eval("$")
    if (fdBackup < 0):
        print "ERROR fdBackup"
    gdb.execute("call dup2( %i, %i)" % (fdFifo, fd))
    dup2Result = gdb.parse_and_eval("$")
    if (dup2Result < 0):
        print "ERROR dup2Result"
    gdb.execute("call close(%i)" %(fdFifo))
    closeResult = gdb.parse_and_eval("$")
    if (closeResult < 0):
        print "ERROR closeResult"
    return {'old': fdBackup, 'new': fdFifo}
    
    
def redirectOutput(fifoPath):
    fd = redirectFd(fifoPath, stdOutFileNo)
    gdb.execute("call setlinebuf(stdout)")
    comandoIORedirect.revertOut = True
    comandoIORedirect.OutFd = fd
    return fd
    
def redirectInput(fifoPath):
    fd = redirectFd(fifoPath, stdInFileNo, readOnlyFlag)
    comandoIORedirect.revertIn = True
    comandoIORedirect.InFd = fd
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
        if(self.stdoutPath):
            redirectOutput(self.stdoutPath)
            print "redirecting Output on Breakpoint"
        if(self.stdinPath):
            redirectInput(self.stdinPath)
            print "redirecting Input on Breakpoint"
        return False


breakpointStartAndBreak = StartAndBreak("main", internal=True)

# Registra el path del fifo ya sea para input o output
# fifo-register fifoPath stdin/stdout
class CommandFifoRegister(gdb.Command):

    def __init__(self):
        super(CommandFifoRegister, self).__init__('fifo-register', gdb.COMMAND_DATA)

    def invoke (self , args , from_tty) :            
        argv = gdb.string_to_argv(args)
        breakpointStartAndBreak.register(argv[1], argv[0])

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
            print "Redirecting stdin to new: %i, old: %i" % (fd['new'], fd['old'])
        elif(argv[0] == 'stdout'):
            fd = redirectOutput(argv[1])
            print "Redirecting stdout to new: %i, old: %i" % (fd['new'], fd['old'])
        
comandoIORedirect = CommandIORedirect()

class stdioRedirectCleanup(gdb.Command):
    
    def __init__(self):
        super(stdioRedirectCleanup, self).__init__('io-revert', gdb.COMMAND_DATA)
        
    def invoke (self , args , from_tty) :    
        print "in" + str(comandoIORedirect.revertIn)
        print "out" + str(comandoIORedirect.revertOut)
        if comandoIORedirect.revertIn:
            print "Reverting stdin: %i -> %i" % (comandoIORedirect.InFd['old'], stdInFileNo)
            gdb.execute("call dup2( %i, %i)" % (comandoIORedirect.InFd['old'], stdInFileNo))
            dup2Result = gdb.parse_and_eval("$")
            if (dup2Result < 0):
                print "ERROR dup2Result Revert In"
            gdb.execute("call close(%i)" %(comandoIORedirect.InFd['old']))
            closeResult = gdb.parse_and_eval("$")
            if (closeResult < 0):
                print "ERROR closeResult In"
            
        if comandoIORedirect.revertOut:
            print "Reverting stdout: %i -> %i" % (comandoIORedirect.OutFd['old'], stdOutFileNo)
            gdb.execute("call dup2( %i, %i)" % (comandoIORedirect.OutFd['old'], stdOutFileNo))
            dup2Result = gdb.parse_and_eval("$")
            if (dup2Result < 0):
                print "ERROR dup2Result Revert Out"
            gdb.execute("call close(%i)" %(comandoIORedirect.OutFd['old']))
            closeResult = gdb.parse_and_eval("$")
            if (closeResult < 0):
                print "ERROR closeResult Out"
comandoRedirectCleanup = stdioRedirectCleanup()
