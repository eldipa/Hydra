import gdb
import re

# python exec(open('my2.py').read())
# catch syscall
# commands
# silent
# python syscall_trace()
# continue
# end

# El problema es como "continuar" luego de una syscall. Si no hay un breakpoint, 
# el continue seguira hasta el final del programa.
# No parece tan mal, pero, si se esta sobre un printf y se hace un next, uno 
# esperaria que la siguiente linea sea la siguiente. Sin embargo dado que printf
# llama a una syscall el commando asociado a ese breakpoint se ejecuta  y si este
# llama a continue, la siguiente linea NO va a ser lo que uno esperaria!!!


#TODO ---
import sys
sys.path.append("/home/martin/Downloads/python-ptrace-0.8/")
#--------

try:
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


# TODO options?
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

#out = sys.stdout 
out = open("OUT", "w")

def show_syscall(syscall_tracer, out):
    ''' Write to the out object the syscall's name, arguments and result. '''

    name = syscall_tracer.name
    text = syscall_tracer.format()
    if syscall_tracer.result is not None:
        offset = 40 - len(text)
        if offset > 0:
            space = " " * offset
        else:
            space = ""
        print(")%s = %s\n" % (space, syscall_tracer.result_text),
                end='', file=out, flush=True)

    else:
        #remove the ) at the end
        print(text[:-1], end='', file=out, flush=True) 

#TODO reiniciar estas variables cada vez que se lanza de nuevo la aplicacion
process = ProcessUnderGDB()
tracer_in_syscall_by_inferior = {}

def syscall_trace():
    global tracer_in_syscall_by_inferior
    global process
    global out

    tracer_in_syscall = tracer_in_syscall_by_inferior.get(gdb.selected_inferior(), None)

    leaving = tracer_in_syscall != None
    process.set_inferior(gdb.selected_inferior()) 
    if tracer_in_syscall:
        syscall_tracer = tracer_in_syscall
        syscall_tracer.exit()
        tracer_in_syscall_by_inferior[gdb.selected_inferior()] = None
    else:
        regs = process.getregs()
        syscall_tracer = PtraceSyscall(process, Opts(), regs) 
        
        syscall_tracer.enter(regs)
        tracer_in_syscall_by_inferior[gdb.selected_inferior()] = syscall_tracer

    show_syscall(syscall_tracer, out)

class SyscallBreakpoint(gdb.Breakpoint):
    def __init__(self, spec, in_the_start_of_syscall, end_breakpoint):
        gdb.Breakpoint.__init__(self, spec, gdb.BP_BREAKPOINT, 0, False, False)
        self.silent = True
        self.in_the_start_of_syscall = in_the_start_of_syscall
        self.end_breakpoint = end_breakpoint


    def stop(self):
        if self.in_the_start_of_syscall:
           # get the current eax and save it in the next breakpoint
           orig_eax = process.getreg("eax")
           self.end_breakpoint.orig_eax = orig_eax 
           
        else:
           # set the orig_eax as the value of eax read by the previous breakpoint
           # then, trace the syscall and delete the orig_eax for sanity.
           process.orig_eax = self.orig_eax
           try:
              syscall_trace()
              syscall_trace()   
           finally:
              process.orig_eax = None

        return False

class KernelVSyscallBreakpoint(gdb.Breakpoint):
    def __init__(self):
        gdb.Breakpoint.__init__(self, '__kernel_vsyscall', gdb.BP_BREAKPOINT, 0, False, True)
        #self.silent = True
        self.breakpoint_hit = False

    def stop(self):
        if self.breakpoint_hit:
            return False

        self.breakpoint_hit = True
        disass_text = gdb.execute("disass", False, True)

        # get the source code (assemby)
        source_lines = list(filter(None, map(lambda line: line.strip(), disass_text.split("\n"))))

        index_of_last_edx = None
        index_of_interrupt_call = None
        for i, line in enumerate(source_lines):
            if "int " in line and "0x80" in line:
               index_of_interrupt_call = i
               break

            if "edx" in line:
               index_of_last_edx = i

        if index_of_last_edx is None:
            index_of_last_edx = 1

        if index_of_last_edx is None or index_of_interrupt_call is None or index_of_last_edx == index_of_interrupt_call:
            raise Exception("Parsing byte code failed. Index of last edx usage: %s (%s). Index of interrupt call: %s (%s)." % (
                     str(index_of_last_edx), source_lines[index_of_last_edx] if index_of_last_edx is not None else "",
                     str(index_of_interrupt_call), source_lines[index_of_interrupt_call] if index_of_interrupt_call is not None else ""))


        address_of_start_syscall_breakpoint = int(source_lines[index_of_last_edx+1].split(":")[0].strip().split(" ")[0].strip(), 16)
        address_of_end_syscall_breakpoint = int(source_lines[index_of_interrupt_call+1].split(":")[0].strip().split(" ")[0].strip(), 16)

        end_bp = SyscallBreakpoint("*"+hex(address_of_end_syscall_breakpoint), False, None)
        start_bp = SyscallBreakpoint("*"+hex(address_of_start_syscall_breakpoint), True, end_bp)

        return False

b = KernelVSyscallBreakpoint()
