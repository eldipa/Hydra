export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/google/chrome/
#./concu-debug > /dev/null 2>&1 &
#python -m bottle --debug --reload main 2>&1 | python colored.py
../NodeWebkit/node-webkit-v0.8.4-linux-ia32/nw ./bin/concu-debug.nw
