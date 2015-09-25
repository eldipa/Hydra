from gdb_event_handler import noexception 

import gdb
import re
import sys
import atexit
import time, datetime
import syslog

try:
    ## TODO 
    sys.path.append('/home/martin/dummy/python-ptrace-0.8.1/')
    import ptrace
except ImportError as e:
    raise ImportError("External lib 'ptrace' not found (formaly, python-ptrace, version 0.8 or higher)!: %s" % str(e))


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
        self._remove_implementation_of_methods()
        self.orig_eax = None

    def set_inferior(self, inferior):
       self._inferior = inferior

    def get_process_id(self):
       return self._inferior.pid

    # Reading
    #   - readWord(): read a memory word
    #   - readBytes(): read some bytes
    #   - readStruct(): read a structure
    #   - readArray(): read an array
    #   - readCString(): read a C string

    def readBytes(self, address, size):
        return self._inferior.read_memory(address, size).tobytes() #TODO tobytes?

    def readWord(self, address):
        return self.readBytes(address, CPU_WORD_SIZE)

    #TODO
    # bug en readCString. El codigo original define como truncated
    # si el size+chunk_length > max pero si se encuentra un \0 en la
    # operacion de lectura, data no mide chunk_length sino menos.
    # en ese caso, solo habria truncamiento si size+len(data) > max
    # Notificar de este bug a los creadores.
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
        info_register_text = gdb.execute("info registers", False, True)

        # first, uniform the output
        line_per_register = filter(None, info_register_text.replace('\t', ' ').split('\n'))

        # then, get with the first two fields, the name and its value
        names_and_values = dict(map(lambda line: line.split()[:2], line_per_register))

        regs_struct = ptrace_registers_t()
        field_names = map(lambda definition: definition[0], regs_struct._fields_)

        if RUNNING_LINUX:
            for n in field_names:
                if n.startswith("__"): #__cs, __ds, __es, __fs, __gs, __ss
                    v = names_and_values[n[2:]] # TODO use the value of xx for __xx?
                elif n == 'orig_eax': #beware! no all the registers are shown in "info registers"
                    if self.orig_eax is None:
                       v = hex(int(gdb.execute("print $orig_eax", False, True).split("=")[1]))
                    else:
                       v = hex(self.orig_eax)
                else:
                    v = names_and_values[n]

                if v.endswith("L"):
                   v = v[:-1]

                setattr(regs_struct, n, int(v, 16)) # gdb returns the values in hex
        else:
            raise NotImplementedError("Not implemented yet!: The get registers may be supported for other architectures in the future.")

        return regs_struct

    def getreg(self, name):
        regs = self.getregs()
        return getattr(regs, name) #TODO handle sub registers (see ptrace/debugger/process.py line 420)
 

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

   def publish_syscall(self):
       ''' Publish the syscall's name, arguments and result. '''

       self.gdb_module.publish_and_log(syslog.LOG_DEBUG, "Publish Syscall BEGIN")
       name = self.name
       text = self.format()
       pid = self.process.get_process_id()
       timestamp = str(datetime.datetime.now())
       if self.result is not None:
           offset = 40 - len(text)
           if offset > 0:
               space = " " * offset
           else:
               space = ""
           
           data = {
               'timestamp':   timestamp,
               'pid':         pid,
               'result':      self.result,
               'result_text': self.result_text
           }
    
           self.gdb_module.notify("Exec", {"at": "exit", "call": data})

       else:
           arguments = [arg.format() for arg in self.arguments]
           data = {
               'timestamp': timestamp,
               'pid':       pid,
               'restype':   self.restype,
               'name':      self.name,
               'arguments': arguments,
           }
         
           self.gdb_module.notify("Exec", {"at": "enter", "call": data})
       
       self.gdb_module.publish_and_log(syslog.LOG_DEBUG, "Publish Syscall END")


class SyscallBreakpoint(gdb.Breakpoint):
    ''' Special breakpoint to be set before or after a syscall. When this breakpoint
        is hit, the target is stopped, data from it is recollected, a syscall trace
        is created and then, the target is resumed. '''

    def __init__(self, gdb_module, process, spec, in_the_start_of_syscall, end_breakpoint):
        gdb.Breakpoint.__init__(self, spec, gdb.BP_BREAKPOINT, 0, True, False)
        self.silent = True

        self.gdb_module = gdb_module

        self.in_the_start_of_syscall = in_the_start_of_syscall
        self.end_breakpoint = end_breakpoint

        assert (in_the_start_of_syscall and end_breakpoint is not None) or \
               (not in_the_start_of_syscall and end_breakpoint is None)

        self.process = process

    @noexception("Error when stopping in the SyscallBreakpoint", False)
    def stop(self):
        try:
          if self.in_the_start_of_syscall:
            # get the current eax and save it in the next breakpoint
            orig_eax = self.process.getreg("eax")
            self.end_breakpoint.orig_eax = orig_eax 
             
            regs = self.process.getregs()

            syscall_tracer = PtraceSyscallPublisher(self.gdb_module, self.process, Opts(), regs) 
            syscall_tracer.enter(regs)
            
            self.end_breakpoint.syscall_tracer = syscall_tracer # share this object to the 'end' breakpoint

          else:
            # set the orig_eax as the value of eax read by the previous breakpoint
            # then, trace the syscall and delete the orig_eax for sanity.
            self.process.orig_eax = self.orig_eax
            
            syscall_tracer = self.syscall_tracer # created from the 'start' breakpoint
            syscall_tracer.exit()

            del self.syscall_tracer

          # publish the data from the syscall's enter/exit 
          syscall_tracer.publish_syscall()

        finally:
          self.process.orig_eax = None

        return False


class KernelVSyscallBreakpoint(gdb.Breakpoint):
    ''' This special breakpoint will be set on the internal function __kernel_vsyscall
        which call almost every syscall.
        When the breakpoint is hit, this will dissamble the __kernel_vsyscall and
        it will find the 'sysenter' instruction to set a SyscallBreakpoint before
        and after it.
        '''
    def __init__(self, gdb_module):
        gdb.Breakpoint.__init__(self, '__kernel_vsyscall', gdb.BP_BREAKPOINT, 0, True, True)
        self.silent = True
        self.breakpoint_hit = False

        self.gdb_module = gdb_module

    @noexception("Error when stopping in the KernelVSyscall Breakpoint", False)
    def stop(self):
        if self.breakpoint_hit:
            return False

        self.breakpoint_hit = True
        disass_text = gdb.execute("disass", False, True)

        # get the source code (assemby)
        # TODO algunas veces el commando "disass" viene en formato MI arruinando el parseo.
        source_lines = []
        for line in disass_text.split("\n"):
            line = line.strip()
            if line.startswith("=>"):
               line = line.replace("=>", "").strip()

            if not line.startswith("0x"):
               continue

            source_lines.append(line)

        index_of_sysenter = None
        index_of_interrupt_call = None
        for i, line in enumerate(source_lines):
            if "int " in line and "0x80" in line:
               index_of_interrupt_call = i
               break

            if "sysenter" in line:
               index_of_sysenter = i

        if index_of_sysenter is None:
            index_of_sysenter = (index_of_interrupt_call - 1) if index_of_interrupt_call is not None else None

        if index_of_sysenter is None or index_of_interrupt_call is None or index_of_sysenter == index_of_interrupt_call:
            raise Exception("Parsing byte code failed. Index of last edx usage: %s (%s). Index of interrupt call: %s (%s). Original assembly dump: %s" % (
                     str(index_of_sysenter), source_lines[index_of_sysenter] if index_of_sysenter is not None else "",
                     str(index_of_interrupt_call), source_lines[index_of_interrupt_call] if index_of_interrupt_call is not None else "",
                     disass_text))


        address_of_end_syscall_breakpoint = int(source_lines[index_of_interrupt_call+1].split(":")[0].strip().split(" ")[0].strip(), 16)
        address_of_start_syscall_breakpoint = int(source_lines[index_of_sysenter].split(":")[0].strip().split(" ")[0].strip(), 16)

        brk_spec_of_start_syscall = "*"+hex(address_of_start_syscall_breakpoint)
        brk_spec_of_end_syscall   = "*"+hex(address_of_end_syscall_breakpoint)

        if brk_spec_of_start_syscall.endswith('L'):
          brk_spec_of_start_syscall = brk_spec_of_start_syscall[:-1]
        
        if brk_spec_of_end_syscall.endswith('L'):
          brk_spec_of_end_syscall = brk_spec_of_end_syscall[:-1]

        process = ProcessUnderGDB()
        process.set_inferior(gdb.selected_inferior()) 

        self.gdb_module.publish_and_log(syslog.LOG_DEBUG, "Start at " + brk_spec_of_start_syscall)
        self.gdb_module.publish_and_log(syslog.LOG_DEBUG, "End at " + brk_spec_of_end_syscall)

        self.gdb_module.syscall_end_breakpoint   = SyscallBreakpoint(self.gdb_module, process, brk_spec_of_end_syscall,   False, None)
        self.gdb_module.syscall_start_breakpoint = SyscallBreakpoint(self.gdb_module, process, brk_spec_of_start_syscall, True,  self.gdb_module.syscall_end_breakpoint)

        return False



from gdb_module import GDBModule

class GDBSyscallTrace(GDBModule):
  def __init__(self):
    GDBModule.__init__(self, 'strace')
    self.kernel_vsyscall_breakpoint = None

    self.syscall_start_breakpoint = None
    self.syscall_end_breakpoint = None
  
  def activate(self, *args):
    ''' When activated, this plugin will install a breakpoint at __kernel_vsyscall
        function. And will enable two more breakpoints in the body of __kernel_vsyscall
        just before and after the syscall execution so we can retrieve its parameters
        and its result and log them. '''
    if self.are_activated():
      return

    if self.kernel_vsyscall_breakpoint is None:
      self.kernel_vsyscall_breakpoint = KernelVSyscallBreakpoint(self)
    else:
      self.kernel_vsyscall_breakpoint.enabled = True
    
    if self.syscall_start_breakpoint is not None:
      self.syscall_start_breakpoint.enabled = True
    
    if self.syscall_end_breakpoint is not None:
      self.syscall_end_breakpoint.enabled = True

    self._activated = True


  def deactivate(self, *args):
    ''' This will disable all the breakpoints created by this module.
        This will not remove the breakpoints, just disable them.'''
    if not self.are_activated():
      return
    
    if self.kernel_vsyscall_breakpoint is not None:
      self.kernel_vsyscall_breakpoint.enabled = False

    if self.syscall_start_breakpoint is not None:
      self.syscall_start_breakpoint.enabled = False
    
    if self.syscall_end_breakpoint is not None:
      self.syscall_end_breakpoint.enabled = False
    
    self._activated = False


  # on thread-group created ... what? create a KernelVSyscallBreakpoint?
  # if then a process is attached, what is it the point?


def init():
    return GDBSyscallTrace()
