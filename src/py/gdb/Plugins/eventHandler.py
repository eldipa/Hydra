
import sys

sys.path.append("./py")

import publish_subscribe.eventHandler

eventHandler = publish_subscribe.eventHandler.EventHandler()

def polo(data):
    print("polo!")

eventHandler.subscribe("marco", polo)
