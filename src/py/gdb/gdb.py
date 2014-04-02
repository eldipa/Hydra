

class Gdb:

    #crea un nuevo proceso gdb vacio
    #La funcion no retorna hasta que gdb esta listo para recibir intrucciones
    def __init__(self):
        pass
    
    #-Gdb realiza un attach al proceso especificado
    #-Modifica el entorno (ld_preload)
    #-Redirecciona stdout del target
    #-Retorna el numero de linea en el que se encuentra, con el proceso detenido
    def attach(self,pid):
        pass
    
    #-Gdb coloca como proceso target un nuevo proceso del codigo 'file'
    #-Modifica el entorno (ld_preload)
    #-Redirecciona stdout del target
    #-Retorna el numero de linea en el que se encuentra y el pid del nuevo proceso, con el proceso detenido
    def file(self,file):
        pass
    
    #Ejecuta al target desde el comienzo
    #La funcion no retorna hasta que la ejecucion se interrumpa
    #Retorna el numero de linea en que se detuvo y motivo de la interrupcion (error, breakpoint, success, etc)
    def run(self):
        pass
    
    #Ejecuta al target desde el punto donde se encontraba
    #La funcion no retorna hasta que la ejecucion se interrumpa
    #Retorna el numero de linea en que se detuvo y motivo de la interrupcion (error, breakpoint, success, etc)
    def continueExec(self):
        pass
    
    #Ejecuta una sola intruccion del target
    #La funcion no retorna hasta que la ejecucion se interrumpa
    #Retorna el numero de linea en que se detuvo y motivo de la interrupcion (error, breakpoint, success, etc)
    def stepInto(self):
        pass
    
    
    #Finaliza el proceso gdb, junto con su target si este no hubiera finalizado
    def exit(self):
        pass
    
    
    