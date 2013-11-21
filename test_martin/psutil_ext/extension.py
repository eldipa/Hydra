import os, sys, errno, stat
from psutil._pslinux import wrap_exceptions
from psutil._compat import namedtuple

nt_fd = namedtuple('opendescriptor', 'path fd type')

_fd_types = filter(lambda s: not isinstance(s[1], int), map(lambda s: (s[4:], getattr(stat, s)), filter(lambda s: s.startswith("S_IS"), dir(stat))))

def type_of_file_descriptor(mode):
   for name, flag_func in _fd_types:
      if flag_func(mode):
         return name

@wrap_exceptions
def get_open_file_descriptors(self):
     retlist = []
     files = os.listdir("/proc/%s/fd" % self.pid)
     hit_enoent = False
     for fd in files:
         file = "/proc/%s/fd/%s" % (self.pid, fd)
         if os.path.islink(file):
             try:
                 type = type_of_file_descriptor(os.stat(file).st_mode)
                 file = os.readlink(file)
             except OSError:
                 # ENOENT == file which is gone in the meantime
                 err = sys.exc_info()[1]
                 if err.errno == errno.ENOENT:
                     hit_enoent = True
                     continue
                 raise
             else:
                 ntuple = nt_fd(file, int(fd), type)
                 retlist.append(ntuple)
     if hit_enoent:
         # raise NSP if the process disappeared on us
         os.stat('/proc/%s' % self.pid)
     return retlist

if __name__ == '__main__':
   import psutil
   import pprint
   import sys

   p = psutil.Process(int(sys.argv[1]))
   pprint.pprint(get_open_file_descriptors(p))
   print
   pprint.pprint(p.get_open_files())
