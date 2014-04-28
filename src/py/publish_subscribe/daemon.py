#!/usr/bin/env python

import sys, os, time, atexit, resource, errno
import signal
from signal import SIGTERM, SIGHUP

# Based in http://www.jejik.com/articles/2007/02/a_simple_unix_linux_daemon_in_python/

class Daemon(object):
   def __init__(self, pidfile, 
         name,
         chroot_directory = None,
         must_prevent_core_dump = True,
         working_directory = "/",
         uid = os.getuid(), gid = os.getgid(),
         stdin = os.devnull, stdout = os.devnull, stderr = os.devnull,
         keep_open_fileno = None,
         foreground = False
         ):

      self.pidfile, self.name = pidfile, name
      self.chroot_directory = chroot_directory
      self.must_prevent_core_dump = must_prevent_core_dump
      self.working_directory = working_directory
      self.uid, self.gid = uid, gid
      self.stdin, self.stdout, self.stderr = stdin, stdout, stderr

      self.keep_open = set() if not keep_open_fileno else set(keep_open_fileno)
      self.foreground = foreground

   def be_a_daemon(self):
      self.set_chroot()
      self.prevent_core_dump()
      self.set_enviroment()
      self.detach()
      self.redirect()
      self.close_files()
      self.set_signal_handlers()
      self.create_pidfile()

   def set_chroot(self):
      if self.chroot_directory:
         os.chdir(self.chroot_directory)
         os.chroot(self.chroot_directory)

   def prevent_core_dump(self):
      try:
         core_resource = resource.RLIMIT_CORE
         # Set hard and soft limits to zero, i.e. no core dump at all
         core_limit = (0, 0)
         resource.setrlimit(core_resource, core_limit)
      except:
         if self.must_prevent_core_dump:
            raise
   
   def set_enviroment(self):
      os.setuid(self.uid)
      os.setgid(self.gid)
      os.umask(0)
      os.chdir(self.working_directory)

   def detach(self):
      if not self.foreground:
         if os.fork() > 0:
            sys.exit(0)

         os.setsid() 
         
         if os.fork() > 0:
            sys.exit(0)

   def redirect(self):
      sys.stdout.flush()
      sys.stderr.flush()

      new = [
            file(self.stdin, 'r').fileno() if isinstance(self.stdin, basestring) else self.stdin.fileno(),
            file(self.stdout, 'a+').fileno() if isinstance(self.stdout, basestring) else self.stdout.fileno(),
            file(self.stderr, 'a+', 0).fileno() if isinstance(self.stderr, basestring) else self.stderr.fileno(),
            ]

      old = [
            sys.stdin.fileno(),
            sys.stdout.fileno(),
            sys.stderr.fileno(),
            ]
      
      map(lambda old_fd, new_fd: os.dup2(old_fd, new_fd), old, new)

      self.keep_open.update(set(new))
   

   def close_files(self):
      try:
         limits = resource.getrlimit(resource.RLIMIT_NOFILE)
         max_fd = limits[1]
         if max_fd == resource.RLIM_INFINITY:
            max_fd = 2048
      except:
         max_fd = 2048

      to_close = set(range(max_fd)) - self.keep_open
      for fd in to_close:
         try:
            os.close(fd)
         except OSError, exc:
            if exc.errno != errno.EBADF:
               raise  # File descriptor was open
 
   def set_signal_handlers(self):
      signal.signal(signal.SIGTERM, self.signal_terminate_handler)
      signal.signal(signal.SIGHUP, self.signal_hup_handler)
   
   def signal_terminate_handler(self, sig_num, stack_frame):
      raise SystemExit("Process %s killed by a SIGTERM signal." % self.name)
   
   def signal_hup_handler(self, sig_num, stack_frame):
      pass

   def create_pidfile(self):
      open_flags = (os.O_CREAT | os.O_EXCL | os.O_WRONLY)
      open_mode = (((os.R_OK | os.W_OK) << 6) | ((os.R_OK) << 3) |((os.R_OK)))
      fd = os.open(self.pidfile, open_flags, open_mode)

      f = os.fdopen(fd, 'w')
      f.write("%i\n" % os.getpid())
      f.close()

      atexit.register(self.remove_pidfile)

   def remove_pidfile(self):
      try:
         self.at_the_end()
      finally:
         os.remove(self.pidfile)

   def get_pid_from_pidfile(self):
      try:
         pf = file(self.pidfile,'r')
         pid = int(pf.read().strip())
         pf.close()
      except IOError:
         pid = None

      return pid

   def start(self):
      pid = self.get_pid_from_pidfile()
      if pid:
         message = "Pidfile %s already exist. %s daemon already running? (PID: %s)\nIf not, remove the pid file."
         sys.stderr.write(message % (self.pidfile, self.name, pid))
         sys.exit(1)

      # Start the daemon
      self.be_a_daemon()
      self.run()

   def stop(self, is_a_restart=False):
      pid = self.get_pid_from_pidfile()
      if not pid and not is_a_restart:
         message = "Pidfile %s does not exist. %s daemon not running?\n"
         sys.stderr.write(message % (self.pidfile, self.name))
         sys.exit(1)

      # Try killing the daemon process	
      try:
         while 1:
            os.kill(pid, SIGTERM)
            time.sleep(0.1)
      except OSError, err:
         err = str(err)
         if err.find("No such process") > 0:
            if os.path.exists(self.pidfile):
               os.remove(self.pidfile)
         else:
            sys.stderr.write(err + '\n')
            sys.exit(1)
 

   def status(self):
      pid = self.get_pid_from_pidfile()
      if pid:
         print "%s start/running, process %i" % (self.name, pid)
      else:
         print "%s stop/waiting" % self.name


   def restart(self):
      self.stop(is_a_restart=True)
      self.start()

   def do_from_arg(self, arg):
      if arg not in ("start", "stop", "status", "restart"):
         print "usage: %s start|stop|status|restart" % sys.argv[0]
         sys.exit(2)

      getattr(self, arg)()

   def run(self):
      raise NotImplementedError()

   def at_the_end(self):
      pass
