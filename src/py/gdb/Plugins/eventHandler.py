
import sys
import gdb

sys.path.append("./py")

import publish_subscribe.eventHandler

eventHandler = publish_subscribe.eventHandler.EventHandler()

def polo(data):
    print("polo!")
    eventHandler.publish("polo", "")
#     print("argc:")
#     argc = gdb.parse_and_eval("argc") #muere horriblemente


eventHandler.subscribe("marco", polo)
