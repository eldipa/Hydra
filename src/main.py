from bottle import get, request, static_file
import psutil

@get('/process/parent_children_relation')
def get_parent_children_relation():
   pids_query = request.query['pids']
   all_descendents = bool(int(request.query.get('all_descendents', 0)))

   pids = set(map(int, filter(None, pids_query.split(','))))

   parent_children = []
   data = []
   seen = set()
   indexs = dict()
   for pid in pids:
      try:
         process = psutil.Process(pid)
         if pid not in indexs:
            #data.append(process.as_dict())
            data.append({'pid':process.pid, 'name':process.name, 'status':process.status})
            indexs[pid] = len(data)-1
         
         ppid = process.ppid

         pprocess = psutil.Process(ppid)
         if pprocess.pid not in indexs:
            data.append({'pid':pprocess.pid, 'name':pprocess.name, 'status':pprocess.status})
            #data.append(pprocess.as_dict())
            indexs[pprocess.pid] = len(data)-1

         parent_children.append((indexs[ppid], indexs[pid]))

         for cprocess in process.get_children(recursive=all_descendents):
            if cprocess.pid not in indexs:
               data.append({'pid':cprocess.pid, 'name':cprocess.name, 'status':cprocess.status})
               #data.append(cprocess.as_dict())
               indexs[cprocess.pid] = len(data)-1

            parent_children.append((indexs[cprocess.ppid], indexs[cprocess.pid]))

      except psutil.NoSuchProcess:
         pass # the process 'pid' is dead

   return {'relations': list(set(parent_children)), 'processes': data}

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
 



@get('/')
def index():
   return static_file("main.html", root=".")

@get('/js/<resource:path>')
def javascript(resource):
   return static_file(resource, root="./js")

