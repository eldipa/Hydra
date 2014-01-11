from bottle import get, request
import psutil

@get('/process/parent_children_relation')
def get_parent_children_relation():
   pids_query = request.query['pids']
   all_descendents = bool(int(request.query.get('all_descendents', 0)))

   pids = set(map(int, filter(None, pids_query.split(','))))

   parent_children = []
   for pid in pids:
      try:
         process = psutil.Process(pid)

         parent_children.append((process.ppid, pid))
         for cprocess in process.get_children(recursive=all_descendents):
            parent_children.append((pid, cprocess.pid))

      except psutil.NoSuchProcess:
         pass # the process 'pid' is dead

   return {'results': set(parent_children)}

@get('/process/state')
def get_process_state():
   pids_query = request.query['pids']
   pids = set(map(int, filter(None, pids_query.split(','))))

   state_by_pid = {}
   for pid in pids:
      try:
         process = psutil.Process(pid)
         state_by_pid[pid] = process.status
   
      except psutil.NoSuchProcess:
         state_by_pid[pid] = "unknow/destryed"

   return {'results': state_by_pid}
         
