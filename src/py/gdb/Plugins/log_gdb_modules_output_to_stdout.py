from gdb_module import GDBModule
import pprint

class LogGDBModulesOutputToStdout(GDBModule):
    def __init__(self):
        GDBModule.__init__(self, 'log-gdb-modules-output-to-stdout')

        gdb_id = self.ev.get_gdb_id()
        self.topics = [
                "stream-gdb.%i.console.gdb-module" % gdb_id,
                "notification-gdb.%i.gdb-module" % gdb_id,
                "gdb-error",
                ]

        self.subscriptions_by_topic = {}

    def print_message(self, data):
        pprint.pprint(data)
    
    def activate(self, *args):
        if self.are_activated():
            return

        for topic in self.topics:
            self.subscriptions_by_topic[topic] = self.ev.subscribe(topic, self.print_message, return_subscription_id=True)

        self._activated = True

    def deactivate(self, *args):
        if not self.are_activated():
            return
 
        for subscription_id in self.subscriptions_by_topic.values():
            self.ev.unsubscribe(subscription_id)

        self.subscriptions_by_topic.clear()
        self._activated = False

def init():
    return LogGDBModulesOutputToStdout()

