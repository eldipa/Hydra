trap "killall nw" EXIT

python py/publish_subscribe/notifier.py start
touch update
./scripts/keep_refreshing.sh &
./scripts/run_ui.sh
