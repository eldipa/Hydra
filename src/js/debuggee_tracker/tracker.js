define(["underscore", "event_handler", "debuggee_tracker/debugger", "debuggee_tracker/thread_group", "debuggee_tracker/thread", "debuggee_tracker/breakpoint"], function (_, event_handler, debugger_module, thread_group_module, thread_module, breakpoint_module) {
   'use strict';

   var Debugger = debugger_module.Debugger;
   var ThreadGroup = thread_group_module.ThreadGroup;
   var Thread = thread_module.Thread;
   var Breakpoint = breakpoint_module.Breakpoint;

   var DebuggeeTracker = function () {
      this.EH = event_handler.get_global_event_handler();

      this.observers = [];

      this.thread_groups_by_debugger = {};
      this.threads_by_debugger = {};
      this.breakpoints_by_debugger = {};

      this.subscription_ids_by_debugger = {};

      this.debuggers_by_id = {};

      _.bindAll(this, "_debugger_started",     "_debugger_exited",
                      "_debuggers_info",
                      "_thread_group_added",   "_thread_group_removed",
                      "_thread_group_started", "_thread_group_exited",
                      "_thread_created",       "_thread_exited",
                      "_running",              "_stopped",
                      "_breakpoints_modified", "_breakpoint_deleted");

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
 
   DebuggeeTracker.prototype.get_debugger_with_id = function (debugger_id) {
       return this.debuggers_by_id[debugger_id];
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
      this.breakpoints_by_debugger[debugger_id] = {};

      var debugger_obj = new Debugger(debugger_id, this, {});
      this.debuggers_by_id[debugger_id] = debugger_obj;

      var subscription_ids_of_all_interested_events = this.track_this_debugger(debugger_id);
      this.subscription_ids_by_debugger[debugger_id] = subscription_ids_of_all_interested_events;
      
      // we are subscripted but some events may were emitted between the start of the
      // debugger and our subscriptions.
      // so those events are lost. to avoid real data lost, we request an update of the
      // data to be in sync with the debugger state
      this._request_an_update_thread_groups_info(this.thread_groups_by_debugger[debugger_id], debugger_id);

      this.notify("debugger_started", { 
                                       event_data: data,
                                       debugger_obj: debugger_obj,
                                       });
   };

   /*
      Call this to release all the resources bound with the debugger exited.
   */
   DebuggeeTracker.prototype._debugger_exited = function (data) {
      var debugger_id = data['debugger-id'];
      var exit_code = data['exit-code'];           // not used it can be undefined
      
      var debugger_obj = this.debuggers_by_id[debugger_id];
      this.notify("debugger_exited", { 
                                       event_data: data,
                                       debugger_obj: debugger_obj,
                                       });

      _.each(this.subscription_ids_by_debugger[debugger_id], this.EH.unsubscribe, this.EH);
      delete this.subscription_ids_by_debugger[debugger_id];
      delete this.thread_groups_by_debugger[debugger_id];
      delete this.breakpoints_by_debugger[debugger_id];
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
         EH.subscribe(topic_prefix + 'exec.stopped', this._stopped),
         
         EH.subscribe(topic_prefix + 'notify.breakpoints-modified', this._breakpoints_modified),
         EH.subscribe(topic_prefix + 'notify.breakpoint-deleted', this._breakpoint_deleted)
      ];

      return subscription_ids;
   };

   DebuggeeTracker.prototype._thread_group_added = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results.id;

      var debugger_obj = this.debuggers_by_id[debugger_id];
      var thread_group = new ThreadGroup(thread_group_id, this, {
         debugger_id: debugger_id,
         state: "not-started",
      });

      this.thread_groups_by_debugger[debugger_id][thread_group_id] = thread_group;
      
      this.notify("thread_group_added", { 
                                       event_data: data,
                                       debugger_obj: debugger_obj,
                                       thread_group: thread_group
                                       });
   };

   DebuggeeTracker.prototype._thread_group_removed = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results.id;

      var debugger_obj = this.debuggers_by_id[debugger_id];
      var thread_group = this.thread_groups_by_debugger[debugger_id][thread_group_id];

      this.notify("thread_group_removed", { 
                                       event_data: data,
                                       debugger_obj: debugger_obj,
                                       thread_group: thread_group
                                       });

      delete this.thread_groups_by_debugger[debugger_id][thread_group_id];
   };

   DebuggeeTracker.prototype._thread_group_started = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results.id;
      var thread_group_pid = data.results.pid;

      var debugger_obj = this.debuggers_by_id[debugger_id];
      var thread_group = this.thread_groups_by_debugger[debugger_id][thread_group_id];
      thread_group.update({process_id: thread_group_pid, state: "started"});
      
      this.notify("thread_group_started", { 
                                       event_data: data,
                                       debugger_obj: debugger_obj,
                                       thread_group: thread_group
                                       });
   };

   DebuggeeTracker.prototype._thread_group_exited = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results.id;
      var exit_code = data.results['exit-code'];

      var debugger_obj = this.debuggers_by_id[debugger_id];
      var thread_group = this.thread_groups_by_debugger[debugger_id][thread_group_id];
      thread_group.update({state: "not-started", exit_code: exit_code});
      
      this.notify("thread_group_exited", { 
                                       event_data: data,
                                       debugger_obj: debugger_obj,
                                       thread_group: thread_group
                                       });
   };
   
   DebuggeeTracker.prototype._thread_created = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results['group-id'];
      var thread_id = data.results.id;
      
      var thread = new Thread(thread_id, this, {debugger_id: debugger_id, thread_group_id: thread_group_id});

      var thread_group = this.thread_groups_by_debugger[debugger_id][thread_group_id];
      var debugger_obj = this.debuggers_by_id[debugger_id];

      this.threads_by_debugger[debugger_id][thread_id] = thread;
      thread_group.threads_by_id[thread_id] = thread;
      
      this.notify("thread_created", { 
                                       event_data: data,
                                       debugger_obj: debugger_obj,
                                       thread_group: thread_group,
                                       thread: thread
                                       });
   };

   DebuggeeTracker.prototype._thread_exited = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_group_id = data.results['group-id'];
      var thread_id = data.results.id;
      
      var debugger_obj = this.debuggers_by_id[debugger_id];
      var thread_group = this.thread_groups_by_debugger[debugger_id][thread_group_id];
      var thread = this.threads_by_debugger[debugger_id][thread_id];

      this.notify("thread_exited", { 
                                       event_data: data,
                                       debugger_obj: debugger_obj,
                                       thread_group: thread_group,
                                       thread: thread
                                       });

      var thread_group = this.thread_groups_by_debugger[debugger_id][thread_group_id];
      
      delete this.threads_by_debugger[debugger_id][thread_id];
      delete thread_group.threads_by_id[thread_id];
   };

   DebuggeeTracker.prototype._running = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_id = data.results['thread-id'];    // this can be 'all' too 

      var debugger_obj = this.debuggers_by_id[debugger_id];

      var threads_selected = this._get_threads_selected_by(thread_id, debugger_id);

      _.each(threads_selected, function (thread) {
         thread.update({state: "running"});
      });
      
      this.notify("running", { 
                              event_data: data,
                              debugger_obj: debugger_obj,
                              //thread_group_id: thread_group_id, TODO? un thread group para el hilo actual y los otros, pero podrian haber multiples thread groups si se corre "ALL" todos los hilos de todos los thread groups.
                              threads: threads_selected
                              });
   };

   DebuggeeTracker.prototype._stopped = function (data) {
      var debugger_id = data['debugger-id'];
      var thread_id = data.results['thread-id'];
      var stopped_threads = data.results['stopped-threads']; // this can be 'all'

      if (thread_id === undefined && stopped_threads === undefined) {
         return; // ignore this, probably it was "the debugger" that was "stopped" and not a thread 
      }

      var debugger_obj = this.debuggers_by_id[debugger_id];

      var threads_selected = this._get_threads_selected_by(stopped_threads, debugger_id);

      _.each(threads_selected, function (thread) {
         thread.update({state: "stopped"});
      });

      var self = this;
      this._request_an_update_threads_info(debugger_id, function () {
          self.notify("stopped", { 
                                  event_data: data,
                                  debugger_obj: debugger_obj,
                                  //thread_group_id: thread_group_id, TODO? un thread group para el hilo actual y los otros, pero podrian haber multiples thread groups si se corre "ALL" todos los hilos de todos los thread groups.
                                  threads: threads_selected
                                  });
      });
      
   };

   /* Get the thread objects selected by 'thread_id'. This will return always a
      list of thread objects.
      In the simple case, thread_id will be one identifier and then, this method
      will  return a list with only one element inside.
      However, thread_id can be the string 'all' in which case all the threads are
      returned.

   */
   DebuggeeTracker.prototype._get_threads_selected_by = function (thread_id, debugger_id) {
      var threads = this.threads_by_debugger[debugger_id];
      if (thread_id === 'all') {
         var threads_selected = _.values(threads);
      }
      else if (_.isArray(thread_id)) {
         var threads_selected = _.map(thread_id, function (id) { return threads[id];});
      }
      else {
         var threads_selected = [threads[thread_id]];
      }

      return threads_selected;
   };

   /*
      Request an update about the thread groups of one particular debugger (with 
      'debugger_id').
      The response or results of this request will be processed asynchronously and
      it will update the thread_groups_object.

      This will also update the threads of those thread groups and their breakpoints.
   */
   DebuggeeTracker.prototype._request_an_update_thread_groups_info = function (thread_group_by_id, debugger_id) {
      var self = this;
      var debugger_obj = this.debuggers_by_id[debugger_id];

      debugger_obj.execute("-list-thread-groups", ["--recurse", "1"], 
              function (data) {
                 var groups_data = data.results.groups;

                 var thread_groups_by_id = self.thread_groups_by_debugger[debugger_id];

                 var our_current_thread_group_ids = _.keys(thread_groups_by_id);
                 var real_thread_group_ids = _.pluck(groups_data, "id");

                 var removed_thread_group_ids = _.difference(our_current_thread_group_ids, real_thread_group_ids);

                 // remove the old thread groups
                 _.each(removed_thread_group_ids, function (removed_thread_group_id) {
                     delete thread_groups_by_id[removed_thread_group_id];
                 });

                 // update (and add if necessary) the new thread groups
                 _.each(groups_data, function (group_data) {
                    var thread_group_id = group_data.id;
                    var thread_group = thread_group_by_id[thread_group_id];

                    if (thread_group === undefined) {
                       thread_group = new ThreadGroup(thread_group_id, this, {debugger_id: debugger_id});
                       thread_group_by_id[thread_group_id] = thread_group; 
                    }

                    if (group_data.pid == undefined || group_data.pid == null) {
                       thread_group.update({state: "not-started"});
                    }
                    else {
                       thread_group.update({state: "started"});
                    }

                    thread_group.update({process_id: group_data.pid,
                                                executable: group_data.executable});

                    var threads_data = group_data.threads;
                    _.each(threads_data, _.partial(self._update_thread_info, _, self.threads_by_debugger[debugger_id], thread_group, debugger_id), self);
                 });
                    
                 self.notify("thread_group_update", { 
                                        event_data: groups_data,
                                        debugger_obj: debugger_obj
                                        });
                
                 var breakpoints_by_id = self.breakpoints_by_debugger[debugger_id];
                 self._request_an_update_of_the_breakpoint_info(breakpoints_by_id, debugger_id);
            });
   };
   
   /*
      Request an update about the breakpoints of one particular debugger (with 
      'debugger_id').
      The response or results of this request will be processed asynchronously and
      it will update the breakpoint objects.
   */
   DebuggeeTracker.prototype._request_an_update_of_the_breakpoint_info = function (breakpoints_by_id, debugger_id) {
      var self = this;
      var debugger_obj = this.debuggers_by_id[debugger_id];
      
      debugger_obj.execute("-break-list", [], 
              function (data) {
                  var breakpoint_data_rows = data.results.BreakpointTable.body;
                  var last_breakpoint_type_seen = undefined;

                  var our_current_breakpoint_ids = _.keys(breakpoints_by_id);
                  var real_breakpoint_ids = _.keys(_.filter(breakpoint_data_rows, function (bkpt_data) { return bkpt_data.type === "breakpoint"}));

                  var removed_breakpoint_ids = _.difference(our_current_breakpoint_ids, real_breakpoint_ids);

                  // remove old breakpoints
                  _.each(removed_breakpoint_ids, function (removed_breakpoint_id) {
                      delete breakpoints_by_id[removed_breakpoint_id];
                  });

                  // update (and create if necessary) new breakpoints
                  _.each(breakpoint_data_rows, function (breakpoint_data) {
                      var type = breakpoint_data.type;

                      if (type === undefined) {
                          type = last_breakpoint_type_seen;
                      }
                      else {
                          last_breakpoint_type_seen = type;
                      }

                      if (type !== "breakpoint") {
                          console.warn("Not supported Xpoint type '"+type+"', we only support 'breakpoint's.");
                          return;
                      }

                      
                      var breakpoint_id = breakpoint_data.number;
                      
                      var attributes = self._parse_attributes_from_breakpoint_data(breakpoint_data, debugger_id);
                      
                      var breakpoint = breakpoints_by_id[breakpoint_id];

                      if (breakpoint === undefined) {
                          breakpoint = new Breakpoint(breakpoint_id, self, attributes);
                          breakpoints_by_id[breakpoint_id] = breakpoint;
                      }
                      else {
                          breakpoint.update(attributes);
                      }

                  }, this);
                  
                  self.notify("breakpoints_update", { 
                                            event_data: breakpoint_data_rows,
                                            debugger_obj: debugger_obj,
                                            });
              });
   };

   /*
    * Update the status of a modified breakpoint (if exists).
    * If the breakpoint dont exist, create it.
    * */
   DebuggeeTracker.prototype._breakpoints_modified = function (data) {
       var debugger_id = data['debugger-id'];
       var debugger_obj = this.debuggers_by_id[debugger_id];

       var last_breakpoint_type_seen = undefined;
       _.each(data.results.bkpts, function (breakpoint_data) {
           var type = breakpoint_data.type;
          
           if (type === undefined) {
              type = last_breakpoint_type_seen;
           }
           else {
              last_breakpoint_type_seen = type;
           }

           if (type !== "breakpoint") {
              console.warn("Not supported Xpoint type '"+type+"', we only support 'breakpoint's.");
              return;
           }

           var breakpoint_id = breakpoint_data.number;
           var attributes = this._parse_attributes_from_breakpoint_data(breakpoint_data, debugger_id);
            
           var breakpoints_by_id = this.breakpoints_by_debugger[debugger_id];
           var breakpoint = breakpoints_by_id[breakpoint_id];

           if (breakpoint === undefined) {
              breakpoint = new Breakpoint(breakpoint_id, this, attributes);
              breakpoints_by_id[breakpoint_id] = breakpoint;
           }
           else {
              breakpoint.update(attributes);
           }
                          
           this.notify("breakpoint_update", { 
                                    event_data: breakpoint_data,
                                    debugger_obj: debugger_obj,
                                    breakpoint: breakpoint,
                                    });
       }, this);
   };

   /* Call this to update several breakpoints from the data. This method was designed to be called from
    * the same object that modified the breakpoint through GDB.
    * */
   DebuggeeTracker.prototype.breakpoint_changed = function () {
       this.notify("breakpoint_changed", {})
   };

   DebuggeeTracker.prototype.delete_breakpoint = function (bkpt) {
       delete this.breakpoints_by_debugger[bkpt.debugger_id][bkpt.id];
       this.notify("breakpoint_changed", {})
   };

   DebuggeeTracker.prototype._breakpoint_deleted = function (data) {
       var debugger_id = data['debugger-id'];
       var debugger_obj = this.debuggers_by_id[debugger_id];
       
       var breakpoint_id = data.results.id;

       var breakpoints_by_id = this.breakpoints_by_debugger[debugger_id];
       var breakpoint = breakpoints_by_id[breakpoint_id];

       this.notify("breakpoint_deleted", { 
                                event_data: data,
                                debugger_obj: debugger_obj,
                                breakpoint: breakpoint,
                                });

       delete breakpoints_by_id[breakpoint_id];
   };

   DebuggeeTracker.prototype._parse_attributes_from_breakpoint_data = function (breakpoint_data, debugger_id) {
          var is_pending = breakpoint_data.pending !== undefined;
          var apply_to_all_threads = breakpoint_data.thread === undefined;
          var is_enabled = breakpoint_data.enabled === 'y';
          var is_temporal = breakpoint_data.disp !== 'keep';
          var original_location = breakpoint_data['original-location'] || "<??>";

          var thread_ids = [];
          if (!apply_to_all_threads) {
             thread_ids = _.unique(breakpoint_data.thread); // remove duplicates (gdb bug)
          }

          var thread_group_ids = breakpoint_data['thread-groups'];
          
          var instruction_address = breakpoint_data.addr;
          var source_fullname = breakpoint_data.fullname;
          var source_line_number = breakpoint_data.line;

          if (source_line_number) {
              source_line_number = parseInt(source_line_number);
          }

          var attributes = {
                  debugger_id: debugger_id,
                  is_pending: is_pending,
                  apply_to_all_threads: apply_to_all_threads,
                  is_enabled: is_enabled,
                  is_temporal: is_temporal,
                  thread_ids: thread_ids,
                  thread_group_ids: thread_group_ids,
                  source_fullname: source_fullname,
                  source_line_number: source_line_number,
                  instruction_address: instruction_address,
                  original_location: original_location
              };

          return attributes;
   };

   /* 
      Request an update about the threads of a particular debugger (debugger_id).

      The response will be processed asynchronously, updating the state, the source
      (fullname and line), the address of the threads.
      
      NOTE: this will update the thread info and the threads_by_debugger object BUT
            IT WILL NOT update the threads_by_id object of a particular thread_group.
            To do this, call _request_an_update_thread_groups_info.
   */
   DebuggeeTracker.prototype._request_an_update_threads_info = function (debugger_id, callback_after_update) {
      var self = this;
      var debugger_obj = this.debuggers_by_id[debugger_id];
      
      debugger_obj.execute("-thread-info", [], 
              function (data) {
                 var threads_data = data.results.threads;
                 _.each(threads_data, _.partial(self._update_thread_info, _, self.threads_by_debugger[debugger_id], undefined, debugger_id), self);

                 if (callback_after_update) {
                     callback_after_update();
                 }
              }); 
   };

   DebuggeeTracker.prototype._update_thread_info = function (thread_data, threads, thread_group, debugger_id) {
      var thread_id = thread_data.id;
      var thread = threads[thread_id];
      
      var debugger_obj = this.debuggers_by_id[debugger_id];

      if (thread === undefined) {
         thread = new Thread(thread_id, this, {});
         threads[thread_id] = thread; 
      }

      if (thread_group !== undefined) {
         if (!(thread_id in thread_group.threads_by_id)) {
            thread_group.threads_by_id[thread_id] = thread;
         }
      }

      if (thread_data.state == "running") {
          thread.update({state: thread_data.state}); // if it is running, we dont have a frame
      } else {
          thread.update({state: thread_data.state,
                                source_fullname: thread_data.frame.fullname,
                                source_line: thread_data.frame.line,
                                instruction_address: thread_data.frame.addr});
      }
      
      this.notify("thread_update", { 
                              event_data: thread_data,
                              debugger_obj: debugger_obj,
                              thread_group: thread_group,
                              thread: thread,
                              });
   };

   /* Notify to all of our observers that a new event has arrived like
      a inferior or thread group has stopped or created or like a thread
      is running.

      'data_object' will be an object with the following structure:
         - event_data: the data arrived that triggered this event.
         - debugger_obj: the debugger from where the event cames.
      
      In some cases --but not always-- the data_object will contain:
         - thread_group: the thread group (inferior)
         - thread: the thread involved.

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
            this.observers[i].update(data_object, event_topic, this);
         } catch(e) {
            console.warn("" + e);
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
                                 return obs !== observer; 
                              });
   };

   return {DebuggeeTracker: DebuggeeTracker,
           Debugger: Debugger,
           ThreadGroup: ThreadGroup,
           Thread: Thread};
});
