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
        self.manager.loadPlugIn("stdioRedirect.py")
        gdbPid = self.manager.starNewProcess(testCodePath + "stdinTest")
        self.manager.publish(str(gdbPid) + ".run", "")
        sleep(0.5)
        self.assertIn("Ingrese un texto:", self.manager.events, "No se detecto la salida, los eventos registrados son:\n %s" % (pprint.pformat(self.manager.events)))
    
#     def test_stdioRedirect_attach(self):
#         self.assertTrue(True)
    
    def tearDown(self):
        self.manager.close()    
    
if __name__ == '__main__':
    os.chdir("../src")
    print os.getcwd()
    suite = unittest.TestLoader().loadTestsFromTestCase(CompleteTest)
    unittest.TextTestRunner(verbosity=2).run(suite)
