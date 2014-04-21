trap "killall nw" EXIT

touch update
./scripts/keep_refreshing.sh &
./scripts/run_ui.sh
