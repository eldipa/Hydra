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
                    v = hex(int(gdb.execute("print $orig_eax", False, True).split("=")[1]))
                else:
                    v = names_and_values[n]

                setattr(regs_struct, n, int(v, 16)) # gdb returns the values in hex
        else:
            raise NotImplementedError("Not implemented yet!: The get registers may be supported for other architectures in the future.")

        return regs_struct

    #def getreg(self, name):
    #    regs = self.getregs()
    #    return getattr(regs, name) #TODO handle sub registers (see ptrace/debugger/process.py line 420)
        

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

out = open("OUT", "w")

def show_syscall(syscall_tracer, out):
    ''' Write to the out object the syscall name, arguments and result. '''

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
        #pass

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


catch_syscall_break_id = 1          #TODO esto es un parametro
hit_count = 0

# TODO this code should support multiple inferiors!!
def syscall_trace_on_stop(stop_event):
    global catch_syscall_break_id
    global hit_count

    # See https://sourceware.org/gdb/onlinedocs/gdb/Events-In-Python.html
    # The 'catch' breakpoints aren't of a specific type of StopEvent, so
    # we cannot know if a stop is because a catch or something else.
    if isinstance(stop_event, (gdb.BreakpointEvent, gdb.SignalEvent)):
        return

    # Best effort. If the counter of hits changed, we are in the correct stop event
    info = gdb.execute("info breakpoints %i" % catch_syscall_break_id, False, True)
    match = re.search("catchpoint already hit (\d+) times", info)
    if match:
        current_hit_count = int(match.groups()[0])
    else:
        current_hit_count = 0

    # The counter didn't change, skip this stop
    if hit_count == current_hit_count:
        return

    if hit_count > current_hit_count:
        raise NotImplementedError("The hit counter was reset?")
    
    hit_count = current_hit_count

    #gdb.execute('continue')
    #return
    syscall_trace()


#gdb.events.stop.connect(syscall_trace_on_stop)

