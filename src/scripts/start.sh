trap "killall nw; kill 0" EXIT

touch update
./scripts/keep_refreshing.sh &
./scripts/run_ui.sh
