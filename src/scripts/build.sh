echo "Compressing..."
zip -r bin/concu-debug.nw main.js package.json index.html js resources py
#echo "Building..."
#cat ../NodeWebkit/node-webkit-v0.8.4-linux-ia32/nw bin/concu-debug.nw > bin/concu-debug
#chmod u+x  bin/concu-debug
echo "Done"
