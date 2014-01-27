
import socket
from subprocess import PIPE
import subprocess


node_path = '../../../NodeWebkit/node-webkit-v0.8.4-linux-ia32/nw'
node_code_path = '../node_src/test.nw' 
cpp_path = '../cpp_bin/Cpp_Code'
shared_path = "../cpp_bin/libShared_Code.so"
gdb_ld_preload = "set exec-wrapper env LD_PRELOAD="

serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
serversocket.bind(('localhost', 5555))

gui = subprocess.Popen([node_path, node_code_path])

serversocket.listen(5)
 
(clientsocket, address) = serversocket.accept()

clientsocket.send("@pid@1234") #cambiar para llevar control de numero de proceso

gdb = subprocess.Popen(["gdb", cpp_path], stdout=clientsocket, stderr=clientsocket)#, stdin=PIPE)
# gdb.stdin.write(gdb_ld_preload + shared_path + "\n")
    
gui.wait()
