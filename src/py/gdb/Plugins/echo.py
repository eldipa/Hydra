from gdb_event_handler import _get_global_event_handler

EH = _get_global_event_handler()

def echo(topic, data):
  EH.publish("echo-response", data)

EH.subscribe("echo-request", echo)
