import unittest
import os
import time 
import sys
import pprint
import select
from time import sleep
sys.path.append("../src/py")
sys.path.append("../src/ipc/pyipc")
import gdbManager
from shortcuts import request

testCodePath = "./cppTestCode/"

class CompleteTest(unittest.TestCase):

    
    def setUp(self):
        self.manager = gdbManager.gdbManager()
        
    @unittest.skipIf(True, "Manual Skip")
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
        self.assertEqual(textoSalida, "Linea numero 0\nLinea numero 1\nLinea numero 2\nLinea numero 3\nLinea numero 4\n", "La salida normal no fue la esperada")
        archivoSalida.close()
        os.remove("Salida.txt")
        
        # Realizo la misma operacion, pero luego de iniciada la ejecucion, redirijo a otro path
        request(gdb, "start > Salida.txt")
        sleep(1)
        open("NuevaSalida.txt", 'a').close()
        request(gdb, "gdb-module-stdfd-redirect-redirect_target_to_destine_file", ["1", "NuevaSalida.txt"])
        request(gdb, "continue")
        sleep(2)
        
        # Compruebo la nueva salida
        archivoSalida = open("NuevaSalida.txt")
        textoSalida = archivoSalida.read()
        self.assertEqual(textoSalida, "Linea numero 0\nLinea numero 1\nLinea numero 2\nLinea numero 3\nLinea numero 4\n", "La salida nueva no fue la esperada")
        archivoSalida.close()
        os.remove("NuevaSalida.txt")
        
        # Compruebo que no haya texto en la salida original
        archivoSalida = open("Salida.txt")
        textoSalida = archivoSalida.read()
        self.assertEqual(textoSalida, "", "La salida vieja no fue la esperada")
        archivoSalida.close()
        os.remove("Salida.txt")

        
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
        self.assertEqual(textoSalida, "Ingrese un texto:\nUsted ingreso: Hola\nIngrese un texto:\nFin\n", "La salida no fue la esperada")
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
        
        request(gdb, "gdb-module-stdfd-redirect-redirect_target_to_destine_file", ["0", "Entrada.txt"])
        request(gdb, "continue")
        sleep(1)
        gdb.gdbInput.close()  # Cierro la entrada para que sea tomada como un EOF
        sleep(1)
        
        os.remove("Entrada.txt")
        
        # Compruebo la salida
        archivoSalida = open("Salida.txt")
        textoSalida = archivoSalida.read()
        self.assertEqual(textoSalida, "Ingrese un texto:\nUsted ingreso: Esta es la entrada desde una archivo\nIngrese un texto:\nUsted ingreso: Tiene 2 lineas en total\nIngrese un texto:\nFin\n", "La salida no fue la esperada")
        archivoSalida.close()
        os.remove("Salida.txt")
    
    def tearDown(self):
        self.manager.close()    
    
if __name__ == '__main__':
    os.chdir("../src")
    print os.getcwd()
    suite = unittest.TestLoader().loadTestsFromTestCase(CompleteTest)
    unittest.TextTestRunner(verbosity=2).run(suite)
