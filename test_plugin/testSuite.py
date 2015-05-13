import unittest
import os
import time 
import sys
import pprint
from time import sleep
sys.path.append("../src/py")
sys.path.append("../src/ipc/pyipc")
import gdbManager

testCodePath = "./cppTestCode/"

class CompleteTest(unittest.TestCase):

    
    def setUp(self):
        self.manager = gdbManager.gdbManager()
    
    def test_stdioRedirect_load(self):
        self.manager.loadRedirect()
        gdbPid = self.manager.starNewProcess(testCodePath + "stdinTest")
        self.manager.publish(str(gdbPid) + ".run", "")
        sleep(2)
        
        event = self.manager.anyEventHasThisString("redirecting Output on Breakpoint")
        self.assertIsNotNone(event, "No se encontro el evento de redireccion de salida")
        
        event = self.manager.anyEventHasThisString("redirecting Input on Breakpoint")
        self.assertIsNotNone(event, "No se encontro el evento de redireccion de entrada")
        
        event = self.manager.anyEventHasThisString("Ingrese un texto:")
        self.assertIsNotNone(event, "No se encontro el evento de string en output")
    
#     def test_stdioRedirect_attach(self):
#         self.assertTrue(True)
    
    def tearDown(self):
        self.manager.close()    
    
if __name__ == '__main__':
    os.chdir("../src")
    print os.getcwd()
    suite = unittest.TestLoader().loadTestsFromTestCase(CompleteTest)
    unittest.TextTestRunner(verbosity=2).run(suite)
