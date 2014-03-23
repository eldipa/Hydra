EVERY=3

while true
do
   make -s -f scripts/check_for_modifications
   sleep $EVERY
done
