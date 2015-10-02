import os, sys
import os.path 

def doctests(source_dir, whitelist):
   return [os.path.abspath(fname) for fname in whitelist if os.path.isfile(fname) \
                     and os.path.splitext(fname)[1] == ".rst"]


def run_doctests(sources, working_directory, flags):
   for source in sources:
      print "Run tests in %s" % source
      cmd = ("cd %s; python %s %s %s" % (
         working_directory, 
         "py/doctestpyjs.py", 
         flags,
         source))

      os.system(cmd)
   

def generate_wiki_pages(sources, wiki_directory):
   wiki_pages = map(lambda s: \
         os.path.join(wiki_directory, os.path.splitext(os.path.basename(s))[0] + ".wiki"), 
         sources)
   
   for source, page in zip(sources, wiki_pages):
      # the source is newer?
      if not os.path.exists(page) or (os.path.getmtime(source) > os.path.getmtime(page)): 
         print "Generating wiki for %s" % source
         os.system("wikir %s > %s" % (source, page))


if __name__ == '__main__':
   source_dir = "."
   working_directory = "../src"
   wiki_directory = "../../wiki"

   # Flags:
   #    d:  Diff output, doctest.REPORT_NDIFF
   #    L:  Log each test
   if sys.argv[1].startswith("-"):
      flags = sys.argv[1]
      del sys.argv[1]
   else:
      flags = ""

   try:
      blacklist_token_pos = sys.argv[1:].index("--")
      
      whitelist = set(sys.argv[1:1+blacklist_token_pos])
      blacklist = set(sys.argv[blacklist_token_pos+2:])

   except ValueError:
      whitelist = set(sys.argv[1:])
      blacklist = set()
      

   whitelist = list((whitelist - blacklist))
   whitelist.sort()

   sources = doctests(source_dir, whitelist)
   run_doctests(sources, working_directory, flags)
   #generate_wiki_pages(sources, wiki_directory)

