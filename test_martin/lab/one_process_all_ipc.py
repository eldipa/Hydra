import os, sys, stat, socket

fifo_name = None
node_names = []
try:
   pipe_read, pipe_write = os.pipe()
   print "Pipe: (%i) >====> (%i)" % (pipe_write, pipe_read)

   pty_master, pty_slave = os.openpty()
   print "Pseudo terminal: Master %i ---> Slave %i" % (pty_master, pty_slave)

   fifo_name = 'tmp_fifo'
   os.mkfifo(fifo_name)
   fifo_read, fifo_write = os.open(fifo_name, os.O_RDONLY | os.O_NONBLOCK), os.open(fifo_name, os.O_WRONLY | os.O_NONBLOCK)
   print "FIFO: [%s] (%i) >====> (%i)" % (fifo_name, fifo_write, fifo_read)
   
   for flag_name, flag in zip(['reg', 'fifo'], [stat.S_IFREG, stat.S_IFIFO]):
      name = "tmp_node_%s" % flag_name
      os.mknod(name, 0666|flag)
      node_names.append(name)
   
      read, write = os.open(name, os.O_RDONLY | os.O_NONBLOCK), os.open(name, os.O_WRONLY | os.O_NONBLOCK)
      print "Node: [%s : %s] (%i) >====> (%i)" % (name, flag_name.upper(), write, read)


   s1, s2 = socket.socketpair()
   print "Socket: [%s] (%i) <======> (%i)" % ('Unix Queue', s1.fileno(), s2.fileno())

   f = os.open(__file__, os.O_RDONLY)
   print "File: [%s] (%i)" % (__file__, f)
   
   f = os.open('..', os.O_RDONLY)
   print "Directory: [%s] (%i)" % ('..', f)


   print "Process id:", os.getpid()
   sys.stdin.read(1)
except Exception, e:
   print e
finally:
   os.closerange(0, 1024)

   for name in [fifo_name] + node_names:
      if name:
         os.unlink(name)


