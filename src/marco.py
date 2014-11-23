import py.publish_subscribe.eventHandler

eventHandler = py.publish_subscribe.eventHandler.EventHandler()

eventHandler.publish("marco","")

print("marco!")

eventHandler.close()