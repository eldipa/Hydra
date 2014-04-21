export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/google/chrome/
trap "killall nw; kill 0" EXIT
../NodeWebkit/node-webkit-v0.8.4-linux-ia32/nw .
