import unittest
import os
import sys
from time import sleep
sys.path.append("../src/py")
sys.path.append("../src/ipc/pyipc")
import gdbManager
from shortcuts import request
import subprocess
from subprocess import PIPE

testCodePath = "./cppTestCode/"

class CompleteTest(unittest.TestCase):

    
    def setUp(self):
        self.manager = gdbManager.gdbManager()
        
    @unittest.skipIf(False, "Manual Skip")
    def test_stdioRedirect_output_on_load(self):
        gdb = self.manager.addManualGdb()
        self.assertTrue(int(gdb.get_gdb_pid()) > 0, "Pid de gdb erroneo")
        request(gdb, "python import gdb_module_loader; gdb_module_loader.get_module_loader().load('stdioRedirect')", [])
        request(gdb, "gdb-module-stdfd-redirect-activate", [])
        request(gdb, "-file-exec-and-symbols %s" % (testCodePath + "outputTest"))
        
        # Ejecuto de forma normal, redirijo la salida a un archivo temporal para que no pise las salidas de gdb
        request(gdb, "run > Salida.txt")
        sleep(2)
        
        # Compruebo la salida
        archivoSalida = open("Salida.txt")
        textoSalida = archivoSalida.read()
        self.assertEqual(textoSalida, "Linea numero 0\nLinea numero 1\nLinea numero 2\nLinea numero 3\nLinea numero 4\n", "Se recibio: " + textoSalida)
        archivoSalida.close()
        os.remove("Salida.txt")
        
        # Realizo la misma operacion, pero luego de iniciada la ejecucion, redirijo a otro path
        request(gdb, "start > Salida.txt")
        sleep(1)
        open("NuevaSalida.txt", 'a').close()
        request(gdb, "gdb-module-stdfd-redirect-redirect_target_to_destine_file", ["1", "NuevaSalida.txt", "1"])
        request(gdb, "continue")
        sleep(2)
        
        # Compruebo la nueva salida
        archivoSalida = open("NuevaSalida.txt")
        textoSalida = archivoSalida.read()
        self.assertEqual(textoSalida, "Linea numero 0\nLinea numero 1\nLinea numero 2\nLinea numero 3\nLinea numero 4\n", "Se recibio: " + textoSalida)
        archivoSalida.close()
        os.remove("NuevaSalida.txt")
        
        # Compruebo que no haya texto en la salida original
        archivoSalida = open("Salida.txt")
        textoSalida = archivoSalida.read()
        self.assertEqual(textoSalida, "", "Se recibio: " + textoSalida)
        archivoSalida.close()
        os.remove("Salida.txt")

    @unittest.skipIf(False, "Manual Skip")    
    def test_stdioRedirect_input_on_load(self):
        gdb = self.manager.addManualGdb()
        self.assertTrue(int(gdb.get_gdb_pid()) > 0, "Pid de gdb erroneo")
        request(gdb, "python import gdb_module_loader; gdb_module_loader.get_module_loader().load('stdioRedirect')", [])
        request(gdb, "gdb-module-stdfd-redirect-activate", [])
        request(gdb, "-file-exec-and-symbols %s" % (testCodePath + "stdinTest"))
        
        # Ejecuto de forma normal, redirijo la salida a un archivo temporal para que no pise las salidas de gdb
        request(gdb, "run > Salida.txt")
        sleep(1)
        os.write(gdb.gdbInput.fileno(), "Hola\n")  # sin este \n el programa no toma la entrada 
        sleep(1)
        gdb.gdbInput.close()  # Cierro la entrada para que sea tomada como un EOF
        sleep(1)
        
        # Compruebo la salida
        archivoSalida = open("Salida.txt")
        textoSalida = archivoSalida.read()
        self.assertEqual(textoSalida, "Ingrese un texto:\nUsted ingreso: Hola\nIngrese un texto:\nFin\n", "Se recibio: " + textoSalida)
        archivoSalida.close()
        os.remove("Salida.txt")
        
        self.manager.shutdownManualGdb(gdb.get_gdb_pid())
        
        # Repito las operaciones, pero con una entrada desde un archivo
        gdb = self.manager.addManualGdb()
        request(gdb, "python import gdb_module_loader; gdb_module_loader.get_module_loader().load('stdioRedirect')", [])
        request(gdb, "gdb-module-stdfd-redirect-activate", [])
        request(gdb, "-file-exec-and-symbols %s" % (testCodePath + "stdinTest"))
        
        request(gdb, "start > Salida.txt")
        sleep(1)
        
        # Creo el archivo a usar como entrada
        entrada = open("Entrada.txt" , 'a')
        entrada.write("Esta es la entrada desde una archivo\nTiene 2 lineas en total\n")
        entrada.close()
        
        request(gdb, "gdb-module-stdfd-redirect-redirect_target_to_destine_file", ["0", "Entrada.txt", "0"])
        request(gdb, "continue")
        sleep(1)
        gdb.gdbInput.close()  # Cierro la entrada para que sea tomada como un EOF
        sleep(1)
        
        os.remove("Entrada.txt")
        
        # Compruebo la salida
        archivoSalida = open("Salida.txt")
        textoSalida = archivoSalida.read()
        self.assertEqual(textoSalida, "Ingrese un texto:\nUsted ingreso: Esta es la entrada desde una archivo\nIngrese un texto:\nUsted ingreso: Tiene 2 lineas en total\nIngrese un texto:\nFin\n", "Se recibio: " + textoSalida)
        archivoSalida.close()
        os.remove("Salida.txt")
        
    @unittest.skipIf(False, "Manual Skip")
    def test_stdioRedirect_output_on_attach(self):
        #Creo un gdb vacio, e incio el modulo de redireccion
        gdb = self.manager.addManualGdb()
        self.assertTrue(int(gdb.get_gdb_pid()) > 0, "Pid de gdb erroneo")
        request(gdb, "python import gdb_module_loader; gdb_module_loader.get_module_loader().load('stdioRedirect')", [])
        request(gdb, "gdb-module-stdfd-redirect-activate", [])
        
        #Creo un proceso nuevo al cual voy a attacharme
        target = subprocess.Popen([testCodePath + "stdinTest"], stdin=PIPE, 
                        stdout=PIPE, stderr=open('/dev/null', 'w'))
        #Simple prueba de que el programa se esta ejecutando
        os.write(target.stdin.fileno(), "Sin Dirigir\n")
        sleep(1)
        textoSalida = os.read(target.stdout.fileno(), 1024)
        self.assertEqual(textoSalida, "Ingrese un texto:\nUsted ingreso: Sin Dirigir\nIngrese un texto:\n", "Se recibio: " + textoSalida)
        
        #Realizo el attach y hago el redireccionamiento de stdout a NuevaSalida.txt
        request(gdb, "-target-attach", [str(target.pid)])
        open("NuevaSalida.txt", 'a').close()
        request(gdb, "gdb-module-stdfd-redirect-redirect_target_to_destine_file", ["1", "NuevaSalida.txt", "1"])
        request(gdb, "continue")
        sleep(2)

        os.write(target.stdin.fileno(), "Primera linea a ser redireccionada\n")
        sleep(1)

        # Compruebo la nueva salida
        archivoSalida = open("NuevaSalida.txt")
        textoSalida = archivoSalida.read()
        self.assertEqual(textoSalida, "Usted ingreso: Primera linea a ser redireccionada\nIngrese un texto:\n", "Se recibio: " + textoSalida )
        archivoSalida.close()
        os.remove("NuevaSalida.txt")
        sleep(2)
        
        target.stdin.close()
        target.wait()

    @unittest.skipIf(False, "Manual Skip")
    def test_stdioRedirect_input_on_attach(self):
        #Creo un gdb vacio, e incio el modulo de redireccion
        gdb = self.manager.addManualGdb()
        self.assertTrue(int(gdb.get_gdb_pid()) > 0, "Pid de gdb erroneo")
        request(gdb, "python import gdb_module_loader; gdb_module_loader.get_module_loader().load('stdioRedirect')", [])
        request(gdb, "gdb-module-stdfd-redirect-activate", [])
        
        #Creo un proceso nuevo al cual voy a attacharme
        target = subprocess.Popen([testCodePath + "stdinTest"], stdin=PIPE, 
                        stdout=PIPE, stderr=open('/dev/null', 'w'))
        #Simple prueba de que el programa se esta ejecutando
        os.write(target.stdin.fileno(), "Sin Dirigir\n")
        sleep(1)
        textoSalida = os.read(target.stdout.fileno(), 1024)
        self.assertEqual(textoSalida, "Ingrese un texto:\nUsted ingreso: Sin Dirigir\nIngrese un texto:\n", "Se recibio: " + textoSalida)
        
        #Realizo el attach y hago el redireccionamiento de stdin desde Entrada.txt
        request(gdb, "-target-attach", [str(target.pid)])
        
        # Creo el archivo a usar como entrada
        entrada = open("Entrada.txt" , 'a')
        entrada.write("Esta es la entrada desde una archivo\nTiene 2 lineas en total\n")
        entrada.close()
        
        request(gdb, "gdb-module-stdfd-redirect-redirect_target_to_destine_file", ["0", "Entrada.txt", "0"])
        request(gdb, "continue")
        sleep(1)
        gdb.gdbInput.close()  # Cierro la entrada para que sea tomada como un EOF
        sleep(1)
        
        os.remove("Entrada.txt")
        
        #Compruebo la Salida
        textoSalida = os.read(target.stdout.fileno(), 1024)
        self.assertEqual(textoSalida, "Usted ingreso: Esta es la entrada desde una archivo\nIngrese un texto:\nUsted ingreso: Tiene 2 lineas en total\nIngrese un texto:\nFin\n", "Se recibio: " + textoSalida)
        
        target.wait()
        
    def tearDown(self):
        self.manager.close()    
    
#Ejecutar desde la carpeta test_plugin: ".../test_plugin$ python testSuite.py"
if __name__ == '__main__':
    os.chdir("../src")
    print os.getcwd()
    suite = unittest.TestLoader().loadTestsFromTestCase(CompleteTest)
    unittest.TextTestRunner(verbosity=2).run(suite)
