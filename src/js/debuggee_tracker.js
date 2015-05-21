define(["underscore", "shortcuts"], function (_, shortcuts) {
   var Thread = function (obj) {
      this.thread_group_id = obj.thread_group_id;
      this.state = obj.state;
      this.source_fullname = obj.source_fullname;
      this.source_line = obj.source_line;
      this.instruction_address = obj.instruction_address;
   };
   var ThreadGroup = function (obj) {
      this.state = obj.state;
      this.process_id = obj.process_id;
      this.exit_code = obj.exit_code;

      this.threads_by_id = [];
   };
   var Debugger = function () {};

   var DebuggeeTracker = function (EH) {
      this.EH = EH;

      this.observers = [];

      this.thread_groups_by_debugger = {};
      this.threads_by_debugger = {};
      this.subscription_ids_by_debugger = {};

      this.debuggers_by_id = {};

      _.bindAll(this, "_debugger_started",     "_debugger_exited",
                      "_debuggers_info",
                      "_thread_group_added",   "_thread_group_removed",
                      "_thread_group_started", "_thread_group_exited",
                      "_thread_created",       "_thread_exited",
                      "_running",              "_stopped");

      EH.subscribe('spawner.debugger-started', this._debugger_started);
      EH.subscribe('spawner.debugger-exited',  this._debugger_exited);
      EH.subscribe('spawner.debuggers-info',   this._debuggers_info);

      EH.publish('spawner.request.debuggers-info', {}); // send this to force a resync
   };

   /*
      Call this when a new debugger is started. This will register several 
      event handlers to track the state of the thread groups and threads handled
      by that debugger.

      After the registration, request all the information to be in synchronization
      with the debugger state.
   */
   DebuggeeTracker.prototype._debugger_started = function (data) {
      var debugger_id = data['debugger-id'];
      this.thread_groups_by_debugger[debugger_id] = {};
      this.threads_by_debugger[debugger_id] = {};

      this.debuggers_by_id[debugger_id] = new Debugger();

      var subscription_ids_of_all_interested_events = this.track_this_debugger(debugger_id);
      this.subscription_ids_by_debugger[debugger_id] = subscription_ids_of_all_interested_events;
      
      // we are subscripted but some events may were emitted between the start of the
      // debugger and our subscriptions.
      // so those events are lost. to avoid real data lost, we request an update of the
      // data to be in sync with the debugger state
      this._request_an_update_thread_groups_info(this.thread_groups_by_debugger[debugger_id], debugger_id);
   };

   /*
      Call this to release all the resources bound with the debugger exited.
   */
   DebuggeeTracker.prototype._debugger_exited = function (data) {
      var debugger_id = data['debugger-id'];
      var exit_code = data['exit-code'];           // not used it can be undefined
      
      _.each(this.subscription_ids_by_debugger[debugger_id], this.EH.unsubscribe, this.EH);
      delete this.subscription_ids_by_debugger[debugger_id];
      delete this.thread_groups_by_debugger[debugger_id];
      delete this.threads_by_debugger[debugger_id];
      delete this.debuggers_by_id[debugger_id];
   };

   /*
      Call this to resync which debuggers are live and running and which are dead.

      For the debuggers that are dead, clean up the resources (call _debugger_exited)
      For the running debuggers that are new, register all the necessary handlers
      and force an update of the state of each debugger (call _debugger_started)
   */
   DebuggeeTracker.prototype._debuggers_info = function (data) {
      var debuggers_data = data['debuggers'];
      var debugger_ids = _.keys(debuggers_data);

      var known_debugger_ids = _.keys(this.debuggers_by_id);

      var debugger_ids_of_new_debuggers = _.difference(debugger_ids, known_debugger_ids);
      var debugger_ids_of_already_dead_debuggers = _.difference(known_debugger_ids, debugger_ids);

      _.each(debugger_ids_of_already_dead_debuggers, function (id) { 
         this._debugger_exited(debuggers_data[id]);
      },
      this);

      _.each(debugger_ids_of_new_debuggers, function (id) {
         this._debugger_started(debuggers_data[id]);
         this._request_an_update_threads_info(id);
      },
      this);
   };

   /* Start to track the debugger (with debugger_id as its id). The idea
      is to track the debuggees, the processes and threads debugged by this
      debugger.
      For this, we need to track when a process holder is added/removed, 
      when a process is started/exited, when a thread is created/exited and
      when a thread is running/stopped.
   */
   DebuggeeTracker.prototype.track_this_debugger = function (debugger_id) {
      var topic_prefix = 'notification-gdb.'+debugger_id+'.';
      var EH = this.EH;
      var subscription_ids = [
         EH.subscribe(topic_prefix + 'notify.thread-group-added',  this._thread_group_added),
         EH.subscribe(topic_prefix + 'notify.thread-group-removed',this._thread_group_removed),

         EH.subscribe(topic_prefix + 'notify.thread-group-started', this._thread_group_started),
         EH.subscribe(topic_prefix + 'notify.thread-group-exited',  this._thread_group_exited),

         EH.subscribe(topic_prefix + 'notify.thread-created', this._thread_created),
         EH.subscribe(topic_prefix + 'notify.thread-exited',  this._thread_exited),

         EH.subscribe(topic_prefix + 'exec.running', this._running),
         EH.subscribe(topic_prefix + 'exec.stopped', this._stopped)
      ];

      return subscription_ids;
   };

   DebuggeeTracker.prototype._thread_group_added = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results.id;

      this.thread_groups_by_debugger[debugger_id][thread_group_id] = new ThreadGroup({
         state: "not-started",
      });
   };

   DebuggeeTracker.prototype._thread_group_removed = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results.id;

      delete this.thread_groups_by_debugger[debugger_id][thread_group_id];
   };

   DebuggeeTracker.prototype._thread_group_started = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results.id;
      var thread_group_pid = data.results.pid;

      var thread_group_object = this.thread_groups_by_debugger[debugger_id][thread_group_id];
      thread_group_object.process_id = thread_group_pid;
      thread_group_object.state = "started";
   };

   DebuggeeTracker.prototype._thread_group_exited = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results.id;
      var exit_code = data.results['exit-code'];

      var thread_group_object = this.thread_groups_by_debugger[debugger_id][thread_group_id];
      thread_group_object.state = "not-started";
      thread_group_object.exit_code = exit_code;
   };
   
   DebuggeeTracker.prototype._thread_created = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results['group-id'];
      var thread_id = data.results.id;
      
      var thread_object = new Thread({thread_group_id: thread_group_id});

      var thread_group_object = this.thread_groups_by_debugger[debugger_id][thread_group_id];

      this.threads_by_debugger[debugger_id][thread_id] = thread_object;
      thread_group_object.threads_by_id[thread_id] = thread_object;
   };

   DebuggeeTracker.prototype._thread_exited = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results['group-id'];
      var thread_id = data.results.id;
      
      var thread_group_object = this.thread_groups_by_debugger[debugger_id][thread_group_id];
      
      delete this.threads_by_debugger[debugger_id][thread_id];
      delete thread_group_object.threads_by_id[thread_id];
   };

   DebuggeeTracker.prototype._running = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_id = data.results['thread-id'];    // this can be 'all' too 

      var thread_objects_selected = this._get_thread_objects_selected_by(thread_id, debugger_id);

      _.each(thread_objects_selected, function (thread_object) {
         thread_object.state = "running";
      });
   };

   DebuggeeTracker.prototype._stopped = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_id = data.results['thread-id'];
      var stopped_threads = data.results['stopped-threads']; // this can be 'all'

      if (thread_id === undefined && stopped_threads === undefined) {
         return; // ignore this, probably it was "the debugger" that was "stopped" and not a thread 
      }

      var thread_objects_selected = this._get_thread_objects_selected_by(stopped_threads, debugger_id);

      _.each(thread_objects_selected, function (thread_object) {
         thread_object.state = "stopped";
      });

      this._request_an_update_threads_info(debugger_id);
   };

   /* Get the thread objects selected by 'thread_id'. This will return always a
      list of thread objects.
      In the simple case, thread_id will be one identifier and then, this method
      will  return a list with only one element inside.
      However, thread_id can be the string 'all' in which case all the threads are
      returned.

   */
   DebuggeeTracker.prototype._get_thread_objects_selected_by = function (thread_id, debugger_id) {
      var threads = this.threads_by_debugger[debugger_id];
      if (thread_id === 'all') {
         var thread_objects_selected = _.values(threads);
      }
      else if (_.isArray(thread_id)) {
         var thread_objects_selected = _.map(thread_id, function (id) { return threads[id];});
      }
      else {
         var thread_objects_selected = [threads[thread_id]];
      }

      return thread_objects_selected;
   };

   /*
      Request an update about the thread groups of one particular debugger (with 
      'debugger_id').
      The response or results of this request will be processed asynchronously and
      it will update the thread_groups_object.

      This will also update the threads of those thread groups.
   */
   DebuggeeTracker.prototype._request_an_update_thread_groups_info = function (thread_group_by_id, debugger_id) {
      var self = this;
      shortcuts.gdb_request(function (data) {
         var groups_data = data.results.groups;
         _.each(groups_data, function (group_data) {
            var thread_group_id = group_data.id;
            var thread_group_object = thread_group_by_id[thread_group_id];

            if (thread_group_object === undefined) {
               thread_group_object = new ThreadGroup();         // new thread group
               thread_group_by_id[thread_group_id] = thread_group_object; 
            }

            if (group_data.pid == undefined || group_data.pid == null) {
               thread_group_object.state = "not-started";
            }
            else {
               thread_group_object.state = "started";
            }

            thread_group_object.pid = group_data.pid;
            thread_group_object.executable = group_data.executable;

            var threads_data = group_data.threads;
            _.each(threads_data, _.partial(self._update_thread_info, _, self.threads_by_debugger[debugger_id]));
         });
         }, 
         debugger_id, 
         "-list-thread-groups",
         ["--recurse", "1"]
      );
   };

   /* 
      Request an update about the threads of a particular debugger (debugger_id).

      The response will be processed asynchronously, updating the state, the source
      (fullname and line), the address of the threads.
   */
   DebuggeeTracker.prototype._request_an_update_threads_info = function (debugger_id) {
      var self = this;
      shortcuts.gdb_request(function (data) {
         var threads_data = data.results.threads;
         _.each(threads_data, _.partial(self._update_thread_info, _, self.threads_by_debugger[debugger_id]));
         }, 
         debugger_id, 
         "-thread-info"
      );
   };

   DebuggeeTracker.prototype._update_thread_info = function (thread_data, thread_objects) {
      var thread_id = thread_data.id;
      var thread_object = thread_objects[thread_id];

      if (thread_object === undefined) {
         thread_object = new Thread();          // new thread
         thread_objects[thread_id] = thread_object; 
      }

      thread_object.state = thread_data.state;
      thread_object.source_fullname = thread_data.frame.fullname;
      thread_object.source_line = thread_data.frame.line;
      thread_object.instruction_address = thread_data.frame.addr;
   };

   /* Notify to all of our observers that a new event has arrived like
      a inferior or thread group has stopped or created or like a thread
      is running.
   */
   DebuggeeTracker.prototype.notify = function (event_topic, event_data) {
      for (var i = 0; i < this.observers.length; i++) {
         try {
            this.observers[i].update(event_topic, event_data, this);
         } catch(e) {
            console.log("" + e);
         }
      }
   };

   DebuggeeTracker.prototype.add_observer = function (observer) {
      this.remove_observer(observer); // remove duplicates (if any)
      this.observers.push(observer);
   };

   DebuggeeTracker.prototype.remove_observer = function (observer) {
      this.observers = _.filter(
                              this.observers, 
                              function (obs) { 
                                 return obs !== observers; 
                              });
   };

   return {DebuggeeTracker: DebuggeeTracker};
});
