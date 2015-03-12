import unittest
import os
import time 
import sys
sys.path.append("../src/py")
import publish_subscribe.eventHandler 


class CompleteTest(unittest.TestCase):
    
    def setUp(self):
        os.system("python ../src/py/publish_subscribe/notifier.py start") 
        time.sleep(2) #hace falta reiniciar el notifier en cada test???
        self.eventHandler = publish_subscribe.eventHandler.EventHandler()
    
    def test_stdioRedirect(self):
        self.assertTrue(True)
    
    
    def tearDown(self):
        self.eventHandler.close()
        os.system("python ../src/py/publish_subscribe/notifier.py stop")  
        time.sleep(2)
    
    
if __name__ == '__main__':
    suite = unittest.TestLoader().loadTestsFromTestCase(CompleteTest)
    unittest.TextTestRunner(verbosity=2).run(suite)