#!/bin/bash

if [ ! -f ../config/user.sh ]
then
   echo "Necesitas crear un archivo llamado user.sh en la carpeta 'config'."
   echo "El archivo debe definir dos variables para configurar como obtener NW."
   echo "Algo asi:"
   echo "   NW_EXEC=~/node-webkit/nw"
   echo "   UDEV_LIB_PATH=/opt/google/chrome/"
   
   exit 1
fi

source ../config/user.sh

export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$UDEV_LIB_PATH
trap "killall nw" EXIT

$NW_EXEC .
