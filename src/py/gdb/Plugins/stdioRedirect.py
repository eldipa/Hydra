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


#breakpointStartAndBreak = StartAndBreak("main", internal=True)

# Registra el path del fifo ya sea para input o output
# fifo-register fifoPath stdin/stdout
class CommandFifoRegister(gdb.Command):

    def __init__(self):
        super(CommandFifoRegister, self).__init__('fifo-register', gdb.COMMAND_DATA)

    def invoke (self , args , from_tty) :            
        argv = gdb.string_to_argv(args)
        breakpointStartAndBreak.register(argv[1], argv[0])

#comandoFifoRegister = CommandFifoRegister()

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
        
#comandoIORedirect = CommandIORedirect()

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
#comandoRedirectCleanup = stdioRedirectCleanup()

from gdb_module import GDBModule

def _call_c(c_call):
    ''' Invoke the a C function or code 'c_call' in the context of the current target
        using the 'call' method of GDB.

        The result is parsed by GDB: an integer >= 0 is expected. Other values
        are not allowed and an exception will be thrown in those cases.

        If every is ok, return the result.
        '''
    gdb.execute('call %s' % c_call, to_string=True)
    result = gdb.parse_and_eval("$")  # get the last value (the return value of c_call)
    result = int(result)
    if not isinstance(result, (int, long)) or result < 0:
        raise Exception("Wrong result: '%s' (we are expecting a number greater than of equal to zero for the C call '%s'" % (str(result), c_call))

    return result

class Redirection(object):
    def __init__(self, fd_target, fd_destine, redirected_to_path, flow_direction):
        self.fd_target = fd_target
        self.fd_destine = fd_destine
        self.redirected_to_path = redirected_to_path
        self.flow_direction = flow_direction

        self.is_redirected = False
        self.is_temporally_disabled = False
    
    def active_target_redirection_to_destine(self):
        ''' Activate the redirection. The file descriptor fd_target will be
            pointing to the file redirected_to_path which file descriptor was
            fd_destine.

            I said "was fd_destine" because as side effect of this call, fd_destine
            will be pointing to the previous file of fd_target. (The file descriptor
            swapped).
            '''
        if self.is_redirected:
            raise Exception("The target is already redirected.")

        if self.is_temporally_disabled:
            self.is_redirected = True
            return  # mark the change but dont do anything

        self._swap_files(self.fd_target, self.fd_destine)
        self.is_redirected = True

    def deactive_redirection(self):
        ''' Remove the redirection, making that the file descriptors fd_target and
            fd_destine be pointing to their original files.
            '''
        if not self.is_redirected:
            raise Exception("The target is not redirected, we cannot remove the redirection because it doesn't exist.")

        if self.is_temporally_disabled:
            self.is_redirected = False
            return  # mark the change but dont do anything

        self._swap_files(self.fd_target, self.fd_destine)
        self.is_redirected = False

    def _swap_files(self, fd_a, fd_b):
        ''' Swap the files pointed by the descriptors fd_a and fd_b.

            If the file A is pointed by fd_a and the file B is pointed by fd_b,
            then, after this method call, fd_a will be pointing to file B and fd_b
            to file A.
            '''
        fd_tmp = _call_c("dup(%i)" % fd_a)
        _call_c("dup2(%i, %i)" % (fd_b, fd_a))
        _call_c("dup2(%i, %i)" % (fd_tmp, fd_b))
        
        _call_c("close(%i)" % fd_tmp)

    def __str__(self):
        if self.is_redirected:
            op = {0: "<===", 1: "===>", 2: "<==>"}[self.flow_direction]
        else:
            op = "X==X"
        extra = " [disabled]" if self.is_temporally_disabled else ""
        return "%03i %s %s  (fd: %03i)%s" % (self.fd_target, op, self.redirected_to_path, self.fd_destine, extra)

    def disable_temporally(self):
        ''' Disable the redirection. If this is an active redirection (is_redirected is True), 
            this is like call deactive_redirection but the status is_redirected will still 
            be True.
            If is_redirected is False, this method has not effect.

            The other effect that has this method is that the methods deactive_redirection and
            active_target_redirection_to_destine will turn off. No file descriptor modifications
            will be taking place anymore (but the is_redirected status will change normally,
            tracking the status of the redirection but don't doing any real redirection at all).

            To revert this situation, call enable.
            '''
        if self.is_temporally_disabled:
            return

        if self.is_redirected:
            self.deactive_redirection() # this set is_redirected to False but...
            self.is_redirected = True  # we still want to redirect, just not right now

        self.is_temporally_disabled = True # at the end, so we dont interfer with the rest of the code


    def enable(self):
        ''' Turn on the redirection again. If is_redirected is False, do nothing.
            But if it is True, restablish the redirection again. 
            '''
        if not self.is_temporally_disabled:
            return
        
        self.is_temporally_disabled = False # set this at the begin so the other code can work

        if self.is_redirected:
            self.is_redirected = False  # we fake this...
            self.active_target_redirection_to_destine() # and now is_redirected is True, not False


    def destroy(self):
        ''' Disable this redirection and close the file destine. After this, this object
            is virtually dead.
            '''
        self.disable_temporally()
        _call_c("close(%i)" % self.fd_destine)
        self.is_redirected = False 


class StdfdRedirect(GDBModule):
    def __init__(self):
        GDBModule.__init__(self, 'stdfd-redirect')

        self.redirections_by_fd_target = {}

        self.register_gdb_command_from(self.redirect_target_to_destine_file)
        self.register_gdb_command_from(self.deactive_redirection_of)
    

    def redirect_target_to_destine_file(self, fd_target, destine_filepath, flow_direction=2):
        ''' Redirect the opened file with file descriptor fd_target to the still-no-open file 
            with path destine_filepath. 
            
            First, i will open the new file with path destine_filepath with the 'flow_direction'
            and i will save its file descriptor fd_destine;
            then, i will swap the file descriptors fd_target and fd_destine so fd_target will be
            pointing to the new file and fd_destine will be pointing to the old file.
            
            flow_direction can be
                0 - open file in read-only mode
                1 - open file in write-only mode
                2 - open file in read-write mode

            The default is flow_direction == 2 (read-write mode)
            '''
        fd_target = int(fd_target)
        flow_direction = int(flow_direction)

        if not flow_direction in (0, 1, 2):
            raise ValueError("Unexpected flags for open the file: '%s'" % flow_direction)

        if fd_target in self.redirections_by_fd_target:
            old_redirection = self.redirections_by_fd_target[fd_target]
            old_redirection.destroy()

        # TODO acceptar fd_target nombres simbolicos "stdout" "stdin" que ademas le manden setlinebuf
        fd_destine = _call_c('open("%s", %i)' % (destine_filepath, flow_direction))
        redirection = Redirection(fd_target = fd_target,
                                    fd_destine = fd_destine,
                                    redirected_to_path = destine_filepath,
                                    flow_direction = flow_direction)

        redirection.active_target_redirection_to_destine()
        self.redirections_by_fd_target[fd_target] = redirection

    def deactive_redirection_of(self, fd_target):
        fd_target = int(fd_target)
        self.redirections_by_fd_target[fd_target].deactive_redirection()

    def activate(self, *args):
        if self.are_activated():
            return

        for fd_target, redirection in self.redirections_by_fd_target.items():
            redirection.enable()

        self._activated = True

    def deactivate(self, *args):
        if not self.are_activated():
            return
    
        for fd_target, redirection in self.redirections_by_fd_target.items():
            redirection.disable_temporally()

        self._activated = False
  
    def status(self):
        self.notify("Status", {'activated': self._activated, 
            'redirections': {fd: str(r) for fd, r in self.redirections_by_fd_target.items()}})

    def cleanup(self):
        self.deactivate()
        for fd_target, redirection in self.redirections_by_fd_target.items():
            redirection.destroy()

        self.redirections_by_fd_target.clear()


def init():
    return StdfdRedirect()
