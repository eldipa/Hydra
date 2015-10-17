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

testCodePath = "./cppTestCode/"

class CompleteTest(unittest.TestCase):

    
    def setUp(self):
        self.manager = gdbManager.gdbManager()
    
    def test_stdioRedirect_load(self):
        gdb = self.manager.addManualGdb()
        self.assertTrue(int(gdb.get_gdb_pid()) > 0, "Pid de gdb erroneo")
        
        
#         self.manager.printEvents()

        
#     def test_stdioRedirect_attach(self):
#         self.assertTrue(True)
    
    def tearDown(self):
        self.manager.close()    
    
if __name__ == '__main__':
    os.chdir("../src")
    print os.getcwd()
    suite = unittest.TestLoader().loadTestsFromTestCase(CompleteTest)
    unittest.TextTestRunner(verbosity=2).run(suite)
