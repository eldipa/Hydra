import os, sys
import os.path 

def doctests(source_dir):
   return [os.path.abspath(fname) for fname in os.listdir(source_dir) if \
         os.path.isfile(fname) \
         and os.path.splitext(fname)[1] == ".rst"]


def run_doctests(sources, working_directory):
   for source in sources:
      print "Run tests in %s" % source
      os.system("cd %s; python %s %s" % (
         working_directory, 
         "doctestpyjs.py", 
         source))
   

def generate_wiki_pages(sources, wiki_directory):
   wiki_pages = map(lambda s: \
         os.path.join(wiki_directory, os.path.splitext(os.path.basename(s))[0] + ".wiki"), 
         sources)
   
   for source, page in zip(sources, wiki_pages):
      # the source is newer?
      if not os.path.exists(page) or (os.path.getmtime(source) > os.path.getmtime(page)): 
         os.system("wikir %s > %s" % (source, page))


if __name__ == '__main__':
   source_dir = "."
   working_directory = "../src/py"
   wiki_directory = "../../wiki"

   sources = doctests(source_dir)
   run_doctests(sources, working_directory)
   generate_wiki_pages(sources, wiki_directory)

