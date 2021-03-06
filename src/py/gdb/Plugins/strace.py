from gdb_event_handler import noexception 

import gdb
import re
import sys
import atexit
import time, datetime
import syslog

try:
    import ptrace
except ImportError as e:
    raise ImportError("External lib 'ptrace' not found (formaly, python-ptrace, version 0.8.1 or higher)!: %s" % str(e))


import ptrace.debugger
import ptrace.syscall

from ptrace.syscall.ptrace_syscall import PtraceSyscall
from ptrace.debugger.process import PtraceProcess
from ptrace.six import b

from ptrace.cpu_info import CPU_X86_64, CPU_POWERPC, CPU_I386, CPU_64BITS, CPU_WORD_SIZE
from ptrace.os_tools import RUNNING_LINUX, RUNNING_BSD, RUNNING_OPENBSD
from ptrace.syscall import SYSCALL_NAMES

# from ptrace/binding/func.py   (python-ptrace)
if RUNNING_OPENBSD:
    from ptrace.binding.openbsd_struct import reg as ptrace_registers_t

elif RUNNING_BSD:
    from ptrace.binding.freebsd_struct import reg as ptrace_registers_t

elif RUNNING_LINUX:
    from ptrace.binding.linux_struct import user_regs_struct as ptrace_registers_t

else:
    raise NotImplementedError("Unknown OS!: Unsupported OS or supported but it wasn't detected correctly.")



class ProcessUnderGDB(PtraceProcess):
    def __init__(self):
        PtraceProcess.__init__(self, None, None, True, None)
        self._inferior = None
        self._thread = None
        self._remove_implementation_of_methods()

    def set_inferior(self, inferior, thread):
       self._inferior = inferior
       self._thread = thread

    def get_process_id(self):
       return self._inferior.pid

    def get_thread_id(self):
       return self._thread.num

    # Reading
    #   - readWord(): read a memory word
    #   - readBytes(): read some bytes
    #   - readStruct(): read a structure
    #   - readArray(): read an array
    #   - readCString(): read a C string

    def readBytes(self, address, size):
        return str(self._inferior.read_memory(address, size))


    def readWord(self, address):
        return self.readBytes(address, CPU_WORD_SIZE)

    #TODO
    # bug en readCString. El codigo original define como truncated
    # si el size+chunk_length > max pero si se encuentra un \0 en la
    # operacion de lectura, data no mide chunk_length sino menos.
    # en ese caso, solo habria truncamiento si size+len(data) > max
    # Notificar de este bug a los creadores. (presente en versiones 0.8.1 y 0.9 
    # tal vez en otras tambien)
    def readCString(self, address, max_size, chunk_length=256):
        string = []
        size = 0
        truncated = False
        while True:
            done = False
            data = self.readBytes(address, chunk_length)
            pos = data.find(b('\0'))
            if pos != -1:
                done = True
                data = data[:pos]
            if max_size <= size+len(data):      #XXX aca esta el fix!
                data = data[:(max_size-size)]
                string.append(data)
                truncated = True
                break
            string.append(data)
            if done:
                break
            size += chunk_length
            address += chunk_length
        return b''.join(string), truncated

    def getregs(self):
        # TODO, change to MI?
        info_register_text = gdb.execute("info registers", False, True)

        # first, uniform the output
        line_per_register = filter(None, info_register_text.replace('\t', ' ').split('\n'))

        # then, get with the first two fields, the name and its value
        names_and_values = dict(map(lambda line: line.split()[:2], line_per_register))

        regs_struct = ptrace_registers_t()
        field_names = map(lambda definition: definition[0], regs_struct._fields_)

        if RUNNING_LINUX:
            for n in field_names:
                if n in ("fs_base", "gs_base"):
                    continue # TODO see https://www.sourceware.org/ml/gdb-patches/2015-11/msg00078.html

                if n.startswith("__"): #__cs, __ds, __es, __fs, __gs, __ss
                    v = names_and_values[n[2:]] # TODO use the value of xx for __xx?
                elif n == 'orig_eax': #beware! no all the registers are shown in "info registers"
                    v = hex(int(gdb.execute("print $orig_eax", False, True).split("=")[1]))
                elif n == 'orig_rax': #beware! no all the registers are shown in "info registers"
                    v = hex(int(gdb.execute("print $orig_rax", False, True).split("=")[1]))
                else:
                    v = names_and_values[n]

                if v.endswith("L"):
                   v = v[:-1]

                setattr(regs_struct, n, int(v, 16)) # gdb returns the values in hex
        else:
            raise NotImplementedError("Not implemented yet!: The get registers may be supported for other architectures in the future.")

        return regs_struct


    # BSD
    def getStackPointer(self):
        raise NotImplementedError("Not implemented yet!: The get stack pointer may be implemented in the future.")

    def detach(self):
        pass # we didn't an attach with this lib, so we don't detach

    def _remove_implementation_of_methods(self):
        def not_implememented_error(*args, **kargs):
            raise NotImplementedError("Not implemented yet!: It was expected that this method wasn't called never.")

        for method in ('attach', 'ptraceEvent', 'setregs', 'singleStep', 'syscall',
                'getsiginfo', 'writeBytes', 'writeWord', 'cont', 'setoptions',):
            setattr(self, method, not_implememented_error)


# see strace.py, method parseOptions, line 34
class Opts:
    D = {
            'string_max_length': 300,    # String max length
            'array_count': 20,           # Maximum number of array items
            'ignore_regexp': None,
            'write_types': False,          # Display arguments type and result type
            'write_argname': False,        # Display argument name
            'replace_socketcall': True,     # Raw socketcall form
            'write_address': False,         # Display structure addressl
            }

    def __getattr__(self, name):
        return Opts.D.get(name, False)  # other options, set them to False


class PtraceSyscallPublisher(PtraceSyscall):
   def __init__(self, gdb_module, *args, **kargs):
      PtraceSyscall.__init__(self, *args, **kargs)
      self.gdb_module = gdb_module
      self._syscall_enter_decode_bug = None
      self._syscall_arg_decode_bugs = []
      self._syscall_exit_decode_bug = None
      self._are_we_at_exit = False
      self._str_sys_call = ""

   def publish_syscall(self):
       ''' Publish the syscall's name, arguments and result. '''

       name = self.name
       pid  = self.process.get_process_id()
       tid  = self.process.get_thread_id()
       now  = datetime.datetime.now().time()
       timestamp = str((now.hour*3600 + now.minute*60 + now.second) * 1000000 + now.microsecond)
       if self._are_we_at_exit:
           data = {
               'timestamp':     timestamp,
               'pid':           pid,
               'tid':           tid,
               'restype':       "void<??>",
               'result':        self.result,
               'result_text':   self.result_text,
               'decode_errors': self.get_decode_errors(),
           }
    
           #self.gdb_module.DEBUG(self._str_sys_call + ")   = " + str(self.result))
           self.gdb_module.notify("Exec", {"at": "exit", "call": data})

       else:
           arguments = self.get_format_of_arguments()

           data = {
               'timestamp':     timestamp,
               'pid':           pid,
               'tid':           tid,
               'restype':       self.restype,
               'name':          self.name,
               'args':          arguments,
               'decode_errors': self.get_decode_errors(),
           }
        
           self._str_sys_call = "%s(%s" % (self.name, ", ".join(arguments))
           self.gdb_module.notify("Exec", {"at": "enter", "call": data})


   def enter(self, *args, **kargs):
        try:
            PtraceSyscall.enter(self, *args, **kargs)
        except Exception, e:
            self._syscall_enter_decode_bug = e

            # set the syscall's name if we don't have one
            self.name = getattr(self, 'name', "syscall<??>")

            # and the arguments too
            self.arguments = getattr(self, 'arguments', [])


   def exit(self, *args, **kargs):
        self._are_we_at_exit = True
        try:
            PtraceSyscall.exit(self, *args, **kargs)
        except Exception, e:
            self._syscall_exit_decode_bug = e 

            # set the syscall's result if we couldn't get one
            self.result = -1
            self.result_text = "<??>"

   def get_format_of_arguments(self):
        def safe_format(arg):
            try:
                return arg.format()
            except Exception, e:
                self._syscall_arg_decode_bugs.append(e)
                return "arg<??>"

        return [safe_format(arg) for arg in self.arguments]

   def get_decode_errors(self):
       decode_errors = {}
       if self._are_we_at_exit:
           if self._syscall_exit_decode_bug:
               decode_errors['syscall_exit_decode_error'] = str(self._syscall_exit_decode_bug)

       else:
           if self._syscall_enter_decode_bug:
               decode_errors['syscall_enter_decode_error'] = str(self._syscall_enter_decode_bug)
           if self._syscall_arg_decode_bugs:
               decode_errors['syscall_args_decode_error'] = [str(e) for e in self._syscall_arg_decode_bugs]

       return decode_errors

class NotifySyscall(gdb.Function):
    ''' Special funtion to be called before or after a syscall. When this function is call
        from a catchpoint-syscall (from a condition) data from it is recollected, a syscall trace
        is created and then, the target is resumed (this function will return 0, so the catchpoint's condition
        will be false and the target will not be stopped). '''

    def __init__(self, gdb_module):
        name = "notify_syscall"   # TODO put a random prefix to hide this from the user
        super(NotifySyscall, self).__init__(name)
        self.name = name

        self.gdb_module = gdb_module
        self.process = ProcessUnderGDB()

        self._syscall_tracer_by_invokation_id = {}

    def as_a_convenient_function_call(self):
        return "$%s()" % self.name

    @noexception("Error when stopping in the NotifySyscall", False)
    def invoke(self, *args):
        self.process.set_inferior(gdb.selected_inferior(), gdb.selected_thread())

        selected_thread = gdb.selected_thread()
        if selected_thread is None:
            raise Exception("You are calling the 'NotifySyscall' function with no thread running. This should never happen because only the catchpoint-syscall should call this function and by definition those require an running thread.")

        my_id = (gdb.selected_inferior().num, selected_thread.num)
        syscall_tracer = self._syscall_tracer_by_invokation_id.get(my_id) 

        am_at_syscall_enter = syscall_tracer is None  # if None no tracing was started so we must be at the enter of a syscall

        if am_at_syscall_enter:
            syscall_tracer = PtraceSyscallPublisher(self.gdb_module, self.process, Opts())
            self._syscall_tracer_by_invokation_id[my_id] = syscall_tracer # save this tracer to be called at the syscall's exit
            syscall_tracer.enter()

        else:
            syscall_tracer = self._syscall_tracer_by_invokation_id[my_id]  # created at the syscall's enter
            syscall_tracer.exit()

            del self._syscall_tracer_by_invokation_id[my_id] # clean up

        # publish the data from the syscall's enter/exit 
        syscall_tracer.publish_syscall()

        return False




from gdb_module import GDBModule

ARE_IN_MI_MODE = False # change this to False for debugging (TODO MI not supported at all from a module?)
if ARE_IN_MI_MODE:
    def enable_breakpoint(bkpt_id): # -break-enable   -break-delete  -break-condition
        gdb.execute("-break-enable %i" % bkpt_id)

    def disable_breakpoint(bkpt_id):
        gdb.execute("-break-disable %i" % bkpt_id)
    
    def delete_breakpoint(bkpt_id):
        gdb.execute("-break-delete %i" % bkpt_id)

    #def set_condition_over_breakpoint(bkpt_id, condition_string):
    #    gdb.execute("-break-condition %i %s" % (bkpt_id, condition_string))

else:
    def enable_breakpoint(bkpt_id):
        gdb.execute("enable %i" % bkpt_id)

    def disable_breakpoint(bkpt_id):
        gdb.execute("disable %i" % bkpt_id)
    
    def delete_breakpoint(bkpt_id):
        gdb.execute("delete %i" % bkpt_id)

# There is a MI version but it is available for GDB 7.11 and superior.
def set_condition_over_breakpoint(bkpt_id, condition_string):
    gdb.execute("condition %i %s" % (bkpt_id, condition_string))

# Because there isn't a MI version of the 'catch' command for the syscalls, we define
# this outside of the if.
def set_catchpoint(syscall_whitelisted_string=None):
    if syscall_whitelisted_string is None:
        syscall_whitelisted_string = "" # this means that gdb will match any syscall

    # format of msg:  Catchpoint 6 (syscall 'read' [0])  or  Catchpoint 1 (any syscall)
    msg = gdb.execute("catch syscall %s" % syscall_whitelisted_string, to_string=True).strip()
    for word in msg.split():
        try:
            catchpoint_id = int(word)
            break
        except:
            pass

    return catchpoint_id


class GDBSyscallTrace(GDBModule):
  ''' Module to log the system calls (syscalls) in a similar fashion like strace does.'''
  def __init__(self):
    GDBModule.__init__(self, 'strace')
    self.catchpoint_id = None
    self.notify_syscall_function = NotifySyscall(self)

    self._set_catchpoint('')
    self._activated = True # we are activated but we shouldn't so...
    self.deactivate()
  
  def activate(self, *args):
    ''' When activated, this plugin will install a catchpoint in the syscalls
        to stop the thread just before and after the syscall execution so we can retrieve its parameters
        and its result and log them. '''
    if self.are_activated():
      return

    enable_breakpoint(self.catchpoint_id)
    self._activated = True


  def deactivate(self, *args):
    ''' This will disable the catchpoint. 
        This will not remove it, just disable it.'''
    if not self.are_activated():
      return
    
    disable_breakpoint(self.catchpoint_id)
    self._activated = False

  def cleanup(self):
    self.deactivate()
    
    for brk in (self.syscall_start_breakpoint,
                self.syscall_end_breakpoint):
        brk.delete()

  def _set_catchpoint(self, syscall_whitelisted_string):
    if self.catchpoint_id is not None:
        delete_breakpoint(self.catchpoint_id)

    self.catchpoint_id = set_catchpoint(syscall_whitelisted_string)
    self._configure_condition_over_catchpoint_to_call_notify()

  def _configure_condition_over_catchpoint_to_call_notify(self):
    set_condition_over_breakpoint(self.catchpoint_id, self.notify_syscall_function.as_a_convenient_function_call())

  # on thread-group created ... what? create a KernelVSyscallBreakpoint?
  # if then a process is attached, what is it the point?


def init():
    return GDBSyscallTrace()
