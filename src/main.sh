if [ $# -eq 2 ]; then
	echo $1,$2 > ../config/start.cfg
fi
python ./py/main.py
