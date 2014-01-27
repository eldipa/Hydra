echo "Compressing..."
zip -r concu-debug.nw package.json nw-main.html 
echo "Building..."
cat ../test_nico/NodeWebkitTest/NodeWebkit/node-webkit-v0.8.4-linux-ia32/nw concu-debug.nw > concu-debug
chmod u+x  concu-debug
rm concu-debug.nw
echo "Done"
