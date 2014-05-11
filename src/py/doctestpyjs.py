import doctest, re, sys, subprocess, time, socket, traceback

JS_SESSION_ADDRESS = ('', 5001)

class DocTestJSParser(doctest.DocTestParser):
   '''This is an adaptation of the original parser. Instead of
      be using '>>>' for the interactive session and '#' for commenting
      a line, they are replaced by 'js>' and '//' respectively, so they
      can be used with a javascript session.'''
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


class JavascriptSessionError(Exception):
   def __init__(self, *args, **kargs):
      Exception.__init__(self, *args, **kargs)

class JavascriptSession(object):
   def __init__(self, address):
      self.address = address
      self.PS1, self.PS2 = "js> ", "... "

   def connect(self):
      # Connect with the remote javascript session
      # TODO this is a problem, the connection is not explicit closed
      count = 0
      self.remote_console = socket.socket()
      self.remote_console.settimeout(5)
      while True:
         try:
            self.remote_console.connect(self.address)
            self.remote_console.settimeout(60*5)
            
            # Wait for the prompt of the remote session
            self.test(None, discard_response=True)

            # Send a 'clean up' command
            self.test(".clear\n", discard_response=True)

            return
         except socket.error, e:
            count = count + 1
            if count > 5:
               raise JavascriptSessionError(str(e))

            time.sleep(1)

   def close_connection(self):
      try:
         self.remote_console.shutdown(socket.SHUT_RDWR)
      except:
         pass

      self.remote_console.close()

   def shutdown(self):
      self.close_connection()


   def test(self, data, discard_response=False):
      '''Takes the data as valid javascript code and send it to the remote 
         javascript session. Then, waits for the prompt 'js> ' (see the
         PS1 attribute) so we can assume that the code was executed and 
         its output was received by us. Finally write this output into the 
         stdout stream (so it can be captured by the doctest's workflow.'''

      try:
         #import pdb
         #pdb.set_trace()
         if data is not None:
            self.remote_console.sendall(data)

         buf = self.remote_console.recv(1024)

         while True:
            while buf[:4] == self.PS2:
               buf = buf[4:]

            if buf[-4:] == self.PS1:
               response = buf[:-4]
               if not response:
                  return None

               if not discard_response:
                  sys.stdout.write(response)

               return None

            next_chunk = self.remote_console.recv(1024)
            if not next_chunk:
               return None

            buf += next_chunk
      except socket.error, e:
         raise JavascriptSessionError("Original traceback:\n%s\n%s" % (traceback.format_exc(), str(e)))


class DocTestMixedParser(doctest.DocTestParser):
   '''This object will parse python and javascript code and will keep
      track of which type is each source code.
      Then, all the tests are mixed and sorted so their order match the 
      lexical order in which the tests were found during the parsing stage.'''

   def __init__(self, parsers):
      self.pyparser = doctest.DocTestParser()
      self.jsparser = DocTestJSParser()

      self.javascript_remote_session = JavascriptSession(JS_SESSION_ADDRESS)

   def get_doctest(self, string, globs, name, filename, lineno):
      try:
         self.javascript_remote_session.connect()
         self.skip_javascript_tests = False
      except JavascriptSessionError, e:
         print "[Warning] The javascript tests will BE SKIPPED! because the connection failed:\n %s" % str(e)
         self.skip_javascript_tests = True

      globs = globs.copy()
      globs["_js_test"] = self.javascript_remote_session.test

      return doctest.DocTest(self.get_examples(string, name), globs,
                       name, filename, lineno, string)     

   def get_examples(self, string, name):
      self.type_of_source = {}
      all_examples = []
      for type, parser in [("py", self.pyparser), ("js", self.jsparser)]:
         examples = parser.get_examples(string, name)

         if self.skip_javascript_tests and type == "js":
            for example in examples:
               example.options[doctest.OPTIONFLAGS_BY_NAME["SKIP"]] = True

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

   def shutdown(self):
      self.javascript_remote_session.shutdown()


# Create the mixed parser
mixed_parser = DocTestMixedParser([doctest.DocTestParser(), DocTestJSParser()])

# This a very funny and dirty part. Because the DocTestRunner uses the built-in
# 'compile' function to compile the source code (because he assume that it is python 
# code), this is the only way to change that behaviour so he can support python
# and javascript code.
import __builtin__
original_compile_func = __builtin__.compile

def compile(source, filename, mode, flags=0, dont_inherit=0):
   '''Take the source and compile it into a runnable python code.
      Each source is looked up in the global mixed parser table
      to know of what type the source is it.
      If it is python, just  execute the 'compile' built-in function.
      If it is javascript, invoke the _js_test function to send the
      source to the remote javascript session so it is evaluated there.'''
   _, source_type = mixed_parser.type_of_source[source].pop()

   if source_type == "js":
      js_code = source
      python_code_wrapper = "_js_test(r'''%s''')\n" % js_code

      source = python_code_wrapper

   elif source_type == "py":
      pass

   else:
      raise Exception("Unknown source's type: %s" % source_type)

   return original_compile_func(source, filename, mode, flags, dont_inherit)

__builtin__.compile = compile    # patching!


# This is to override the default argument 'parser' so we can use DocTestMixedParser
# here, instead of the default DocTestParser.
original_testfile_func = doctest.testfile
def testfile(filename, module_relative=True, name=None, package=None,
             globs=None, verbose=None, report=True, optionflags=0,
             extraglobs=None, raise_on_error=False, parser=mixed_parser,
             encoding=None):

   try:
      return original_testfile_func(filename, module_relative, name, package,
            globs, verbose, report, optionflags, extraglobs, raise_on_error, parser,
            encoding)
   finally:
      mixed_parser.shutdown() # this object is VERY coupled!!

doctest.testfile = testfile   # patching!


if __name__ == "__main__":
    sys.exit(doctest._test())

