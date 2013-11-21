import psutil
import json

import sys
import os

sys.path.append("../servant")
sys.path.append("../psutil_ext")
from servant import route, run
from extension import get_open_file_descriptors

@route('/open_files/pids=(?P<pids>(\d)+(,(\d)+)*)')
def get_open_files(pids):
   pids = map(int, pids.split(','))

   open_files_by_pid = {}
   for pid in set(pids):
      open_files_by_pid[pid] = get_open_file_descriptors(psutil.Process(pid))

   return json.dumps(open_files_by_pid)


@route('/shared_open_files/pids=(?P<pids>(\d)+(,(\d)+)*)')
def get_shared_open_files(pids):
   pids = map(int, pids.split(','))

   pids_by_open_files = {}
   for pid in set(pids):
      for filename, fd in psutil.Process(pid).get_open_files():
         if filename in pids_by_open_files:
            pids_by_open_files[filename].append((pid, fd))
         else:
            pids_by_open_files[filename] = [(pid, fd)]

   return json.dumps(pids_by_open_files)

@route('/')
def init():
   return open('index.html', 'r').read()

@route('/static/(?P<filename>[\w./]+)')
def static(filename):
   filename = os.path.join('static', filename)
   filename = os.path.abspath(filename)
   if not os.path.dirname(filename).startswith(os.getcwd()):
      raise ValueError('Invalid filename')

   try:
      return open(filename, 'r').read()
   except:
      raise ValueError('Invalid filename')

@route('/open_file_descriptors/pids=(?P<pids>(\d)+(,(\d)+)*)')
def open_file_descriptors(pids):
   pids = map(int, pids.split(','))
      
   results = []
   for pid in set(pids):
      for val in get_open_file_descriptors(psutil.Process(pid)):
         results.append([pid] + list(val))

   return json.dumps(results)



if __name__ == '__main__':
   run()
