
from gdb import Gdb
import publish_subscribe.eventHandler

import globalconfig
import traceback, syslog

class GdbSpawner(object):
    def __init__(self, count_gdbs_at_begin=None): 
        cfg = globalconfig.get_global_config()
        name = cfg.get('gdbspawner', 'name')
        if count_gdbs_at_begin is None:
            count_gdbs_at_begin = cfg.getint('gdbspawner', 'count_gdbs_at_begin')
        
        self.gdb_by_its_pid = {}
        
        self.ev = publish_subscribe.eventHandler.EventHandler(name=name)
        self._subscribe_to_interested_events_for_me()

        for i in range(count_gdbs_at_begin):
            self._spawn_a_gdb(None)
        

    def _subscribe_to_interested_events_for_me(self):
        self.subscriptions = [
            self.ev.subscribe("spawner.request.debuggers-info", self._response_debuggers_info, return_subscription_id=True, send_and_wait_echo=True),
            self.ev.subscribe("spawner.add-debugger", self._spawn_a_gdb, return_subscription_id=True, send_and_wait_echo=True),
            self.ev.subscribe("spawner.kill-debugger", self._shutdown_a_gdb, return_subscription_id=True, send_and_wait_echo=True),
            self.ev.subscribe("spawner.kill-all-debuggers", self._shutdown_all_gdbs, return_subscription_id=True, send_and_wait_echo=True),
            ]
    
    def _unsubscribe_me_for_all_events(self):
        for s in self.subscriptions:
            self.ev.unsubscribe(s)
        
    def _response_debuggers_info(self, _):
        debuggers_data = dict((debugger_id, {'debugger-id': debugger_id}) for debugger_id in self.gdb_by_its_pid.keys())
        self.ev.publish("spawner.debuggers-info", {'debuggers': debuggers_data})

    def _spawn_a_gdb(self, _):
        gdb = Gdb()
        gdb_pid = gdb.get_gdb_pid()

        self.gdb_by_its_pid[gdb_pid] = gdb

        self.ev.publish("spawner.debugger-started", {"debugger-id": gdb_pid})

        return gdb_pid

    def _shutdown_a_gdb(self, data):
        ''' Shutdown the GDB process with process id data['pid']. '''
        pid = data['debugger-id']
        returncode = self.gdb_by_its_pid[pid].shutdown()
        self.ev.publish("spawner.debugger-exited", {"debugger-id": pid,
                                                              "exit-code": returncode})

        self.gdb_by_its_pid.pop(pid)
    
    def _shutdown_all_gdbs(self, _):
        for gdb_pid, gdb in self.gdb_by_its_pid.iteritems():
            returncode = gdb.shutdown() 
            self.ev.publish("spawner.debugger-exited", {"debugger-id": gdb_pid,
                                                                  "exit-code": returncode})

        self.gdb_by_its_pid.clear()
                
    def shutdown(self):
        ''' This will shutdown everything, all the GDBs and myself included. '''
        self._unsubscribe_me_for_all_events()
        self.ev.close() # wait until all the events are flushed out, so there should not be any race condition with the thread of my event-handler
    
        for gdb_pid, gdb in self.gdb_by_its_pid.iteritems():
            try:
                gdb.shutdown()
            except Exception, e:
                syslog.syslog(syslog.LOG_INFO, traceback.format_exc())
                pass # we did our best effort
