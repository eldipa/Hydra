define(["underscore", "jquery", "jstree", "layout", "jstree_builder", "shortcuts", "observation", "event_handler"], function (_, $, jstree, layout, jstree_builder, shortcuts, observation, event_handler) {
   'use strict';

   var IPCSInfoView = function () { 
      this.super("IPCS Info View");
      this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');

      this.data = {"sem": [], "shmem": [], "msq": []};
      
//      this.add_observer(this);
      
      this.EH = event_handler.get_global_event_handler();   
      
      this.configureEventsSubscription()  ;

//      this.update_tree_data_debounced = _.debounce(_.bind(this.update_tree_data, this), 500);

//      this.build_tree();
   };

   IPCSInfoView.prototype.__proto__ = layout.Panel.prototype;
   layout.implement_render_and_unlink_methods(IPCSInfoView.prototype);
   
   IPCSInfoView.prototype.configureEventsSubscription = function() {
	   	var my_self = this;
	   	
	   	this.EH.subscribe('IPCSInfo.info', function(data) {
	   		
	   		var update = false;
	
	       	if (data.add.length >0){
		        	my_self.addData(data.add, data.type);
		        	update = true
	       	}
	       	
	       	if (data.remove.length >0){
		        	my_self.removeData(data.remove, data.type);
		        	update = true
	       	}
	       	
	       	if (update){
	       		console.log(data);
	       	}
	       });
	   	
	   	this.EH.publish('IPCSInfo.restart',{});
   }
   
   IPCSInfoView.prototype.addData = function(data, type) {
	   this.data[type].push(data);
   }
   
   IPCSInfoView.prototype.removeData = function(data, type) {
		//TODO
   }
   
//
//   IPCSInfoView.prototype.update = function () {
//      this.update_tree_data_debounced();
//   };
//
//   IPCSInfoView.prototype.build_tree = function () {
//      var self = this;
//      var Observation = observation.Observation;
//
//      this._jstree_key = shortcuts.randint().toString();
//      var results = jstree_builder.build_jstree_with_do_observation_functions_attached(this._$container, [
//            function (e, elem_owner) {                              // Level 0: 
//                return new Observation({target: self, context: self}); 
//            },
//            function (e, elem_owner) {                              // Level 1: IPCS type
//                self._immediate_action_to_hack_jstree(e, elem_owner);
//                var ids = self._get_data_from_selected();
//
//                if (ids === null || ids === undefined) {
//                    return null;
//                }
//
//                var debugger_id =  ids.debugger_id;
//                var debugger_obj = self.debuggee_tracker.get_debugger_with_id(debugger_id);
//                return new Observation({target: debugger_obj, context: self});
//            }
//          ],
//          {
//            'core' : {
//              "animation" : false,
//              "worker": true, 
//              "multiple": false,
//              "check_callback" : false,
//              "themes" : { "url": false, "dots": true, "name": "default-dark", "stripped": true},
//              "force_text": true,
//              'data' : this.get_data_from_tracker(),
//            },
//            "plugins" : ["state"],
//            'state' : {
//                "key": this._jstree_key,
//                events: 'open_node.jstree close_node.jstree',
//            }
//          }
//      );
//
//      this._get_data_from_selected = results.getter_for_data_from_selected;
//      this._immediate_action_to_hack_jstree = results.immediate_action_to_hack_jstree;
//      this._update_tree_data = results.update_tree_data;
//      this._is_loading_data_in_the_tree = results.is_loading_data_in_the_tree;
//   };
//
//   IPCSInfoView.prototype.update_tree_data = function () {
//      var data = this.get_data();
//      this._update_tree_data(data);
//
//      if (this.is_in_the_dom()) {
//         this.repaint($(this.box));
//      }
//   };
//   
//   IPCSInfoView.prototype.get_data = function () {
//
//	      var tree_data = _.map(data, 
//	         function (ipcs) {   
//	            // first level
//	            return {
//	                text: "ipcs",
//	                data: ipcs,
//	                icon: false,
//	                id: [this._jstree_key, ipcs.id].join("_"),
////	                children: _.map(thread_groups_by_id,
////	                       function (thread_group) {
////	                          
////	                          // second level          
////	                          return {
////	                              text: thread_group.get_display_name(),
////	                              data: {debugger_id: debugger_obj.id, thread_group_id: thread_group.id},
////	                              icon: false,
////	                              id: [this._jstree_key, debugger_obj.id, thread_group.id].join("_"),
////	                              children: _.map(thread_group.your_threads_by_id(),
////	                                  function (thread) {
////
////	                                     // third level
////	                                     return {
////	                                         text: thread.get_display_name(),
////	                                         data: {debugger_id: debugger_obj.id, thread_group_id: thread_group.id, thread_id: thread.id},
////	                                         id: [this._jstree_key, debugger_obj.id, thread_group.id, thread.id].join("_"),
////	                                         icon: (thread.state === "running")? 'fa fa-spinner fa-pulse' : 'fa fa-circle'
////	                                     };
////	                                  }, this)
////	                             };
////	                       }, this)
//	               };
//	         }, this);
//
//	      return tree_data;
//	   };
//   
//   IPCSInfoView.prototype.notify = function (event_topic, data_object) {
////	      for (var i = 0; i < this.observers.length; i++) {
////	         try {
////	            this.observers[i].update(data_object, event_topic, this);
////	         } catch(e) {
////	            console.warn("" + e);
////	         }
////	      }
//	   };
//
//   IPCSInfoView.prototype.add_observer = function (observer) {
//      this.remove_observer(observer); // remove duplicates (if any)
//      this.observers.push(observer);
//   };
//
//   IPCSInfoView.prototype.remove_observer = function (observer) {
//      this.observers = _.filter(
//                              this.observers, 
//                              function (obs) { 
//                                 return obs !== observer; 
//                              });
//   };

   return {IPCSInfoView: IPCSInfoView};
});
