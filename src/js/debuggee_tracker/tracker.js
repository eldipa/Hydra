define(["underscore", "shortcuts", "event_handler", "debuggee_tracker/debugger", "debuggee_tracker/thread_group", "debuggee_tracker/thread"], function (_, shortcuts, event_handler, debugger_module, thread_group_module, thread_module) {
   'use strict';

   var Debugger = debugger_module.Debugger;

   var _update_properties = function (obj) {
      _.each(_.keys(obj), function (k) {
         if (!(_.contains(this._properties, k))) {
            throw Error("Unexpected key '"+k+"' to be read and updated");
         }
         this[k] = obj[k];

      }, this);
   };

   var Thread = function (obj) {
      this._properties = ["EH", "id", "thread_group_id", "state", "source_fullname",
                          "source_line",  "instruction_address"];

      this.update(obj);

   };
   Thread.prototype.update = _update_properties;
   Thread.prototype.get_display_name = function () {
      return "Thread "+this.id+" ("+this.state+")";
   };

   var ThreadGroup = function (obj) {
      this._properties = ["EH", "id", "debugger_id", "state", "executable", "process_id", "exit_code"];
      this.update(obj);

      this.threads_by_id = {};

   };
   ThreadGroup.prototype.update = _update_properties;
   ThreadGroup.prototype.get_display_name = function () {
      var base = "Group " + this.id + " ";
      var more = [];
      
      if (this.executable != undefined) {
         if (this.executable.length > 16) {
            more.push("..."+this.executable.substr(this.executable.lastIndexOf("/")));
         }
         else {
            more.push(this.executable);
         }
      }

      if (this.state === "started") {
         if (this.executable != undefined && this.process_id !== undefined) {
            more.push("PID: " + this.process_id);
         }
      }
      else {
         if (this.exit_code !== undefined) {
            more.push("Exit code: " + this.exit_code);
         }
      }

      if (this.executable != undefined) {
         if (this.executable.length > 16) {
            more.push("(" + this.executable + ")");
         }
      }

      return base + more.join(" ");
   };

   ThreadGroup.prototype.remove = function () {
      shortcuts.gdb_request(null, 
         this.debugger_id, 
         "-remove-inferior",
         [""+this.id]
      );
   };

   ThreadGroup.prototype.load_file_exec_and_symbols = function (debugger_tracker, filepath) {
      var self = this;
      var update_my_status_when_file_is_loaded = function () {
          var s = debugger_tracker.thread_groups_by_debugger[self.debugger_id];
          debugger_tracker._request_an_update_thread_groups_info(s, self.debugger_id);
      };

      shortcuts.gdb_request(update_my_status_when_file_is_loaded, 
         this.debugger_id, 
         "-file-exec-and-symbols",
         [filepath]
      );
   };


   var DebuggeeTracker = function (EH) {
      this.EH = event_handler.get_global_event_handler();

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

      this.EH.subscribe('spawner.debugger-started', this._debugger_started);
      this.EH.subscribe('spawner.debugger-exited',  this._debugger_exited);
      this.EH.subscribe('spawner.debuggers-info',   this._debuggers_info);

      this.EH.publish('spawner.request.debuggers-info', {}); // send this to force a resync
   };
   
   /* 
      ===== Public API =======
   */

   DebuggeeTracker.prototype.get_all_debuggers = function () {
      return this.debuggers_by_id;
   };

   DebuggeeTracker.prototype.add_debugger = function () {
      this.EH.publish("spawner.add-debugger", {});
   };
 
   DebuggeeTracker.prototype.get_thread_groups_of = function (debugger_id) {
      return this.thread_groups_by_debugger[debugger_id];
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

      this.debuggers_by_id[debugger_id] = new Debugger(debugger_id, {});

      var subscription_ids_of_all_interested_events = this.track_this_debugger(debugger_id);
      this.subscription_ids_by_debugger[debugger_id] = subscription_ids_of_all_interested_events;
      
      // we are subscripted but some events may were emitted between the start of the
      // debugger and our subscriptions.
      // so those events are lost. to avoid real data lost, we request an update of the
      // data to be in sync with the debugger state
      this._request_an_update_thread_groups_info(this.thread_groups_by_debugger[debugger_id], debugger_id);

      this.notify("debugger_started", { 
                                       event_data: data,
                                       debugger_id: debugger_id,
                                       });
   };

   /*
      Call this to release all the resources bound with the debugger exited.
   */
   DebuggeeTracker.prototype._debugger_exited = function (data) {
      var debugger_id = data['debugger-id'];
      var exit_code = data['exit-code'];           // not used it can be undefined
      
      this.notify("debugger_exited", { 
                                       event_data: data,
                                       debugger_id: debugger_id,
                                       });

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
         EH: this.EH,
         id: thread_group_id,
         debugger_id: debugger_id,
         state: "not-started",
      });
      
      this.notify("thread_group_added", { 
                                       event_data: data,
                                       debugger_id: debugger_id,
                                       thread_group_id: thread_group_id
                                       });
   };

   DebuggeeTracker.prototype._thread_group_removed = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results.id;

      this.notify("thread_group_removed", { 
                                       event_data: data,
                                       debugger_id: debugger_id,
                                       thread_group_id: thread_group_id
                                       });

      delete this.thread_groups_by_debugger[debugger_id][thread_group_id];
   };

   DebuggeeTracker.prototype._thread_group_started = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results.id;
      var thread_group_pid = data.results.pid;

      var thread_group_object = this.thread_groups_by_debugger[debugger_id][thread_group_id];
      thread_group_object.update({process_id: thread_group_pid, state: "started"});
      
      this.notify("thread_group_started", { 
                                       event_data: data,
                                       debugger_id: debugger_id,
                                       thread_group_id: thread_group_id
                                       });
   };

   DebuggeeTracker.prototype._thread_group_exited = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results.id;
      var exit_code = data.results['exit-code'];

      var thread_group_object = this.thread_groups_by_debugger[debugger_id][thread_group_id];
      thread_group_object.update({state: "not-started", exit_code: exit_code});
      
      this.notify("thread_group_exited", { 
                                       event_data: data,
                                       debugger_id: debugger_id,
                                       thread_group_id: thread_group_id
                                       });
   };
   
   DebuggeeTracker.prototype._thread_created = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results['group-id'];
      var thread_id = data.results.id;
      
      var thread_object = new Thread({EH: this.EH, id: thread_id, thread_group_id: thread_group_id});

      var thread_group_object = this.thread_groups_by_debugger[debugger_id][thread_group_id];

      this.threads_by_debugger[debugger_id][thread_id] = thread_object;
      thread_group_object.threads_by_id[thread_id] = thread_object;
      
      this.notify("thread_created", { 
                                       event_data: data,
                                       debugger_id: debugger_id,
                                       thread_group_id: thread_group_id,
                                       thread_id: thread_id
                                       });
   };

   DebuggeeTracker.prototype._thread_exited = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results['group-id'];
      var thread_id = data.results.id;
      
      this.notify("thread_exited", { 
                                       event_data: data,
                                       debugger_id: debugger_id,
                                       thread_group_id: thread_group_id,
                                       thread_id: thread_id
                                       });

      var thread_group_object = this.thread_groups_by_debugger[debugger_id][thread_group_id];
      
      delete this.threads_by_debugger[debugger_id][thread_id];
      delete thread_group_object.threads_by_id[thread_id];
   };

   DebuggeeTracker.prototype._running = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_id = data.results['thread-id'];    // this can be 'all' too 

      var thread_objects_selected = this._get_thread_objects_selected_by(thread_id, debugger_id);

      _.each(thread_objects_selected, function (thread_object) {
         thread_object.update({state: "running"});
      });
      
      this.notify("running", { 
                              event_data: data,
                              debugger_id: debugger_id,
                              //thread_group_id: thread_group_id, TODO?
                              //thread_id: thread_id              TODO?
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
         thread_object.update({state: "stopped"});
      });

      this._request_an_update_threads_info(debugger_id);
      
      this.notify("stopped", { 
                              event_data: data,
                              debugger_id: debugger_id,
                              //thread_group_id: thread_group_id, TODO?
                              //thread_id: thread_id              TODO?
                              });
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
               thread_group_object = new ThreadGroup({EH: self.EH, id: thread_group_id, debugger_id: debugger_id});
               thread_group_by_id[thread_group_id] = thread_group_object; 
            }

            if (group_data.pid == undefined || group_data.pid == null) {
               thread_group_object.update({state: "not-started"});
            }
            else {
               thread_group_object.update({state: "started"});
            }

            thread_group_object.update({process_id: group_data.pid,
                                        executable: group_data.executable});

            var threads_data = group_data.threads;
            _.each(threads_data, _.partial(self._update_thread_info, _, self.threads_by_debugger[debugger_id], thread_group_object, debugger_id), self);
            
            self.notify("thread_group_update", { 
                                    event_data: group_data,
                                    debugger_id: debugger_id,
                                    thread_group_id: thread_group_id,
                                    });
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
      
      NOTE: this will update the thread info and the threads_by_debugger object BUT
            IT WILL NOT update the threads_by_id object of a particular thread_group_object.
            To do this, call _request_an_update_thread_groups_info.
   */
   DebuggeeTracker.prototype._request_an_update_threads_info = function (debugger_id) {
      var self = this;
      shortcuts.gdb_request(function (data) {
         var threads_data = data.results.threads;
         _.each(threads_data, _.partial(self._update_thread_info, _, self.threads_by_debugger[debugger_id], undefined, debugger_id), self);
         }, 
         debugger_id, 
         "-thread-info"
      );
   };

   DebuggeeTracker.prototype._update_thread_info = function (thread_data, thread_objects, thread_group_object, debugger_id) {
      var thread_id = thread_data.id;
      var thread_object = thread_objects[thread_id];

      if (thread_object === undefined) {
         thread_object = new Thread({EH: this.EH, id: thread_id});
         thread_objects[thread_id] = thread_object; 
      }

      if (thread_group_object !== undefined) {
         if (!(thread_id in thread_group_object.threads_by_id)) {
            thread_group_object.threads_by_id[thread_id] = thread_object;
         }
      }

      thread_object.update({state: thread_data.state,
                            source_fullname: thread_data.frame.fullname,
                            source_line: thread_data.frame.line,
                            instruction_address: thread_data.frame.addr});
      
      this.notify("thread_update", { 
                              event_data: thread_data,
                              debugger_id: debugger_id,
                              thread_id: thread_id,
                              });
   };

   /* Notify to all of our observers that a new event has arrived like
      a inferior or thread group has stopped or created or like a thread
      is running.

      'data_object' will be an object with the following structure:
         - event_data: the data arrived that triggered this event.
         - debugger_id: the id of the debugger from where the event cames.
      
      In some cases --but not always-- the data_object will contain:
         - thread_group_id: the id of the thread group (inferior)
         - thread_id: the id of the thread involved.

      Two kinds of topics are emmited. The first class are the topics which
      event implies a deletion of some part of the information in this tracker,
      like 'thread_group_removed' or 'debugger_exited'.
      Those events are notified before that the deletion is takes place, so the
      observer has a chance to copy the info before that this is deleted.

      The other kinds of topics are emmited after apply all the modification to
      this tracker.
  
   */
   DebuggeeTracker.prototype.notify = function (event_topic, data_object) {
      for (var i = 0; i < this.observers.length; i++) {
         try {
            this.observers[i].update(event_topic, data_object, this);
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

   return {DebuggeeTracker: DebuggeeTracker,
           Debugger: Debugger,
           ThreadGroup: ThreadGroup,
           Thread: Thread};
});
