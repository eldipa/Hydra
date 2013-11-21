from multiprocessing import Pool
import sys
import time
import random
import tempfile

def square(x):
   with tempfile.NamedTemporaryFile() as f:
      time.sleep(0.5*random.random())
      return x * x

if __name__ == '__main__':
   process_count = int(sys.argv[1])
   N = int(sys.argv[2])

   pool = Pool(process_count)
   
   try:
      t = time.time()
      pool.map(square, xrange(N))
      print 'map(square, xrange(%d)):\t%s seconds' % (N, time.time() - t)
   finally:
      print "Closing...."
      pool.terminate()
      pool.join()

