import doctest, re, sys

class DocTestJSParser(doctest.DocTestParser):
    _EXAMPLE_RE = re.compile(r'''
        # Source consists of a PS1 line followed by zero or more PS2 lines.
        (?P<source>
            (?:^(?P<indent> [ ]*) js>    .*)    # PS1 line
            (?:\n           [ ]*  \.\.\. .*)*)  # PS2 lines
        \n?
        # Want consists of any non-blank lines that do not start with PS1.
        (?P<want> (?:(?![ ]*$)    # Not a blank line
                     (?![ ]*js>)  # Not a line starting with PS1
                     .*$\n?       # But any other line
                  )*)
        ''', re.MULTILINE | re.VERBOSE)


    _IS_BLANK_OR_COMMENT = re.compile(r'^[ ]*(//.*)?$').match
    
    _OPTION_DIRECTIVE_RE = re.compile(r'//\s*doctest:\s*([^\n\'"]*)$',
                                      re.MULTILINE)


import socket
_js_s = socket.socket()

_js_s.connect(('', 5001))

def _js_test(data):
   #import pdb
   #pdb.set_trace()
   if data is not None:
      _js_s.sendall(data)

   buf = _js_s.recv(1024)

   while True:
      while buf[:4] == "... ":
         buf = buf[4:]

      if buf[-4:] == "js> ":
         response = buf[:-4]
         if not response:
            return None

         sys.stdout.write(response)
         return None

      next_chunk = _js_s.recv(1024)
      if not next_chunk:
         return ""

      buf += next_chunk

_js_test(None)

class DocTestMixedParser(doctest.DocTestParser):
   def __init__(self, parsers):
      self.pyparser = doctest.DocTestParser()
      self.jsparser = DocTestJSParser()

   def get_doctest(self, string, globs, name, filename, lineno):
      globs = globs.copy()
      globs["_js_test"] = _js_test

      return doctest.DocTest(self.get_examples(string, name), globs,
                       name, filename, lineno, string)     

   def get_examples(self, string, name):
      self.type_of_source = {}
      all_examples = []
      for type, parser in [("py", self.pyparser), ("js", self.jsparser)]:
         examples = parser.get_examples(string, name)

         for example in examples:
            link = (example.lineno, type)
            try:
               self.type_of_source[example.source].append(link)
            except KeyError:
               self.type_of_source[example.source] = [link]


         all_examples.extend(examples)

      # sort the examples and its types in the same order that were found in the file
      # the types are then reversed so they can be 'pop-ed' in the same order that
      # its example is executed.
      all_examples.sort(lambda this, other: cmp(this.lineno, other.lineno))
      for source in self.type_of_source.keys():
         self.type_of_source[source].sort(lambda this, other: cmp(this[0], other[0]))
         self.type_of_source[source].reverse()

      return all_examples



mixed_parser = DocTestMixedParser([doctest.DocTestParser(), DocTestJSParser()])

import __builtin__

original_compile_func = __builtin__.compile
def compile(source, filename, mode, flags=0, dont_inherit=0):
   _, source_type = mixed_parser.type_of_source[source].pop()

   if source_type == "js":
      js_code = source
      python_code_wrapper = "_js_test(r'''%s''')\n" % js_code

      source = python_code_wrapper

   elif source_type == "py":
      pass

   else:
      raise Exception("Unknow source's type: %s" % source_type)

   return original_compile_func(source, filename, mode, flags, dont_inherit)

__builtin__.compile = compile


original_testfile_func = doctest.testfile
def testfile(filename, module_relative=True, name=None, package=None,
             globs=None, verbose=None, report=True, optionflags=0,
             extraglobs=None, raise_on_error=False, parser=mixed_parser,
             encoding=None):

   return original_testfile_func(filename, module_relative, name, package,
         globs, verbose, report, optionflags, extraglobs, raise_on_error, parser,
         encoding)

doctest.testfile = testfile


# parse the file using the 'parser' (which we can change, so it is ok)
# then, run the doctests with a runner (DocTestRunner/DebugRunner) that
# we can't change, this is NOT ok, calling the 'run' method.
#
# tal vez haciendo que el codigo parseado no sea js sino que sea algo como:
# r = connect_to_jsvm_and_send(jscode).then_recv_response()
# if r looks like an exception:
#   raise that exception
# else:
#   import sys; sys.stdout.write(r); sys.stdout.flush()
#
# excpetions like:
# ReferenceError: f is not defined
#    at repl:1:2
#    at REPLServer.self.eval (repl.js:110:21)
#    at Interface.<anonymous> (repl.js:239:12)
#    at Interface.EventEmitter.emit (events.js:95:17)
#    at Interface._onLine (readline.js:202:10)
#    at Interface._line (readline.js:531:8)
#    at Interface._ttyWrite (readline.js:760:14)
#    at ReadStream.onkeypress (readline.js:99:10)
#    at ReadStream.EventEmitter.emit (events.js:98:17)
#    at emitKey (readline.js:1095:12)
# 
# or
#  TypeError: Cannot read property 'f' of undefined

if __name__ == "__main__":
    sys.exit(doctest._test())
    s.shutdown(2)
    s.close()

