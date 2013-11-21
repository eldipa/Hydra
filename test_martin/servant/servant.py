import BaseHTTPServer
import re

_subscribers = {}

class Servant(BaseHTTPServer.BaseHTTPRequestHandler):
   def __init__(self, *args, **kargs):
      BaseHTTPServer.BaseHTTPRequestHandler.__init__(self, *args, **kargs)


   def build_send_response(self, payload_response, status_code=200):
      self.send_response(status_code)

      if payload_response != None:
         self.send_header('Content-type', 'text/html')
         self.send_header('Content-Length', len(payload_response))
      
      self.end_headers()

      if payload_response != None:
         self.wfile.write(str(payload_response))

   def handler(self, method):
      m = method
      candidate = None
      best_count = -1
      for funcs in _subscribers[m]:
         match = funcs.url_pattern.match(self.path)
         if not match:
            continue

         if match.end() < len(self.path):
            continue

         count = len(match.groups())
         if best_count >= count:
            continue

         args = dict(filter(lambda k_v: k_v[1] != None, match.groupdict(None).items()))
         candidate = (funcs, args)

      if candidate != None:
         funcs, args = candidate
         try:
            response = (funcs(**args), 200)
         except ValueError, e:
            response = str(e), 400
         except Exception, e:
            response = str(e), 500
            
         self.build_send_response(*response)
      else:
         self.build_send_response("Not found", 404)

   def __getattr__(self, name):
      if name.startswith("do_") and name[3:] in _subscribers:
         return lambda: self.handler(name[3:])

      raise AttributeError(name)


def route(url, methods='GET', regexp_flags=0):
   url_pattern = re.compile(url, regexp_flags)

   if isinstance(methods, basestring):
      methods = set([methods])
   else:
      methods = set(methods)

   def decorator_builder(f):
      f.url_pattern = url_pattern
      for m in methods:
         if m in _subscribers:
            _subscribers[m].append(f)
         else:
            _subscribers[m] = [f]
      
      return f

   return decorator_builder



def run(port=8000, ip=''):
   server_class = BaseHTTPServer.HTTPServer
   handler_class = Servant
   server_address = (ip, port)

   httpd = server_class(server_address, handler_class)
   httpd.serve_forever()

if __name__ == '__main__':
   @route('/(?P<id>\d+)?')
   def print_hello(id='0'):
      return '<html><head></head><body>' + 'hello world ' + id + '</body></html>'

      
   @route('/(?P<id>\d+)')
   def print_hello2(id):
      return '<html><head></head><body>' + 'hello world (2) ' + id + '</body></html>'

   run()
