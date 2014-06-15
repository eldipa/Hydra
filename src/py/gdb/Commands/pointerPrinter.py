'''
Created on 12/06/2014

@author: nicolas
'''

import gdb
import StringIO

# Modo de uso:
# (gdb) python execfile ("./py/gdb/Commands/pointerPrinter.py")
# (gdb) pointer-printer punteroEntero 0xbffff25c

class CommandPointerPrinter(gdb.Command):

    def __init__(self):
        super(CommandPointerPrinter, self).__init__('pointer-printer', gdb.COMMAND_DATA)

    def invoke (self , args , from_tty) :
                
        argv = gdb.string_to_argv(args)
    
        output = StringIO.StringIO()
        print >> output, "[",
        print >> output, (argv[0] + ':'),
        print >> output, gdb.parse_and_eval('*' + argv[0]),
        
        for i in range(1,len(argv)):
            print >> output, ",",
            print >> output, (argv[i] + ':'),
            print >> output, gdb.parse_and_eval('*' + argv[i]),
            
        print >> output, "]",
        resultado = output.getvalue()
        print resultado
        output.close()

CommandPointerPrinter()
