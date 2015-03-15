import unittest
import os
import time 
import sys
import pprint
from time import sleep
sys.path.append("../src/py")
sys.path.append("../src/ipc/pyipc")
import publish_subscribe.eventHandler 
import gdb.gdbSpawmer

testCodePath = "./cppTestCode/"

class CompleteTest(unittest.TestCase):
    
    def __init__(self, *args, **kwargs):
        super(CompleteTest, self).__init__(*args, **kwargs)
        self.events = []
    
    def registerEvent(self, event):
        self.events.append(event)
    
    def setUp(self):
        os.system("python ../src/py/publish_subscribe/notifier.py start") 
        time.sleep(2)  # hace falta reiniciar el notifier en cada test???
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
        self.eventHandler.subscribe("", self.registerEvent)
        # TODO cambiar para que cada test cargue su propio plugin
        self.spawmer = gdb.gdbSpawmer.GdbSpawmer(log=True, debugPlugin= "stdioRedirect.py")
    
    def test_stdioRedirect_load(self):
        gdbPid = self.spawmer.startNewProcessWithGdb(testCodePath + "stdinTest")
        self.eventHandler.publish(str(gdbPid) + ".run", "")
        sleep(0.5)
        self.assertIn("Ingrese un texto:", self.events, "No se detecto la salida, los eventos registrados son:\n %s" % (pprint.pformat(self.events)))
        
    
#     def test_stdioRedirect_attach(self):
#         self.assertTrue(True)
    
    def tearDown(self):
        self.spawmer.shutdown()
        self.eventHandler.close()
        os.system("python ../src/py/publish_subscribe/notifier.py stop")  
        time.sleep(2)
    
    
if __name__ == '__main__':
    os.chdir("../src")
    print os.getcwd()
    suite = unittest.TestLoader().loadTestsFromTestCase(CompleteTest)
    unittest.TextTestRunner(verbosity=2).run(suite)
