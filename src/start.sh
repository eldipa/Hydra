export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/google/chrome/
./concu-debug > /dev/null 2>&1 &
python -m bottle --debug --reload main 2>&1 | python colored.py
