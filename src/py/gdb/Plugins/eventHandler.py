
import sys
import gdb

sys.path.append("./py")

import publish_subscribe.eventHandler

eventHandler = publish_subscribe.eventHandler.EventHandler()

def polo(data):
    print("polo!")
    eventHandler.publish("polo", "")
    print("argc:")
    argc = gdb.parse_and_eval("argc")
    print argc
#     eventHandler.publish("argc.value", str(argc))
#     print("i:")
#     i = gdb.parse_and_eval("i")
#     eventHandler.publish("i.value", i.string(encoding = "ascii"))
#     print(i)

eventHandler.subscribe("marco", polo)
