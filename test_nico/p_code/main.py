import subprocess
import os

code_path = '../c_code/Debug/Cpp_Code'
shared_path = '../shared_code/Debug/libShared_Code.so'

print 'Hola mundo Python!'
print ""

print 'Ejecutando codigo c++ virgo:'
subprocess.Popen(code_path).wait()
print ""

print 'Ejecutando mismo codigo c++ hackeado:'
env = dict(os.environ)
env['LD_PRELOAD'] = shared_path
subprocess.Popen(code_path, env = env).wait()


