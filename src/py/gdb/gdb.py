

class Gdb:

    #crea un nuevo proceso gdb vacio
    #La funcion no retorna hasta que gdb esta listo para recibir intrucciones
    def __init__(self):
        self.gdb = subprocess.Popen("gdb", stdout=PIPE, stderr=PIPE , stdin=PIPE)
        self.gdbInput = self.gdb.stdin
        self.gdbOutput = self.gdb.stdout
        #TODO esperar hasta propmpt
    
    #-Gdb realiza un attach al proceso especificado
    #-Modifica el entorno (ld_preload)
    #-Redirecciona stdout del target
    #-Retorna el numero de linea en el que se encuentra, con el proceso detenido
    def attach(self,pid):
        self.gdbInput.write("-target-attach " + str(pid) + '\n')
        #TODO esperar ok
        #TODO entorno (como?), redirect stdout(como?)
        #TODO obtener linea
    
    #-Gdb coloca como proceso target un nuevo proceso del codigo 'file'
    #-Modifica el entorno (ld_preload)
    #-Redirecciona stdout del target
    #-Retorna el numero de linea en el que se encuentra y el pid del nuevo proceso, con el proceso detenido
    def file(self,file):
        self.gdbInput.write("-file-exec-and-symbols " + file + '\n')
        #TODO esperar ok
        #self.gdbInput.write("-gdb-set " + "exec-wrapper env LD_PRELOAD=" + pathToSO + '\n')
        #TODO esperar ok
        self.setBreakPoint("main")
        self.run()
        #TODO retornar lo pedido
        #TODO redireccionar stdout
    
    #Ejecuta al target desde el comienzo
    #La funcion no retorna hasta que la ejecucion se interrumpa
    #Retorna el numero de linea en que se detuvo y motivo de la interrupcion (error, breakpoint, success, etc)
    def run(self):
        self.gdbInput.write("-exec-run" + '\n')
        #TODO esperar al prompt y retornar lo pedido
    
    #Ejecuta al target desde el punto donde se encontraba
    #La funcion no retorna hasta que la ejecucion se interrumpa
    #Retorna el numero de linea en que se detuvo y motivo de la interrupcion (error, breakpoint, success, etc)
    def continueExec(self):
        self.gdbInput.write("-exec-continue" + '\n')
        #TODO esperar al prompt y retornar lo pedido
    
    #Ejecuta una sola intruccion del target
    #La funcion no retorna hasta que la ejecucion se interrumpa
    #Retorna el numero de linea en que se detuvo y motivo de la interrupcion (error, breakpoint, success, etc)
    def stepInto(self):
        self.gdbInput.write("-exec-next-instruction" + '\n')
        #TODO esperar al prompt y retornar lo pedido
    
    
    #Finaliza el proceso gdb, junto con su target si este no hubiera finalizado
    #Retorna ok/error
    def exit(self):
        #TODO finalizar target
        self.gdbInput.write("-gdb-exit" + '\n')
        #TODO esperar ok
    
    #Establece un nuevo breakpoint al comienzo de la funcion dada
    #retorna ok/error
    def setBreakPoint(self, funcion):
        self.gdbInput.write("-break-insert " + funcion + '\n')
        #TODO esperar prompt
    
    
    