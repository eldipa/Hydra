define(["underscore", "jquery", "jstree", "layout", "jstree_builder", "shortcuts", "observation", "event_handler"], function (_, $, jstree, layout, jstree_builder, shortcuts, observation, event_handler) {
   'use strict';

   var IPCSInfoView = function () { 
      this.super("IPCS Info View");
      this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');

      this.data = {"sem": [], "shmem": [], "msq": []};
      
      this.EH = event_handler.get_global_event_handler();   
      
      this.configureEventsSubscription()  ;

      this.update_tree_data_debounced = _.debounce(_.bind(this.update_tree_data, this), 500);

      this.build_tree();
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
	       		my_self.update();
	       	}
	       });
	   	
	   	this.EH.publish('IPCSInfo.restart',{});
   }
   
   IPCSInfoView.prototype.addData = function(data, type) {
	   this.data[type].push(data);
   }
   
   IPCSInfoView.prototype.removeData = function(data, type) {
	   for (var ipcs in data){
		   var index = this.findIndexOfIPC(data[ipcs], type);
		   if(index != -1)
			   this.data[type].splice(index, 1);
	   }
   }
   
   IPCSInfoView.prototype.findIndexOfIPC = function(IPCToFind, typeOfIPC) {
	   var index = -1;
	   for (var ipc in this.data[typeOfIPC]){
		   if (JSON.stringify(IPCToFind) === JSON.stringify(this.data[typeOfIPC][ipc][0]))
			   index = ipc;
	   }
	   return index;
   }
   

   IPCSInfoView.prototype.update = function () {
      this.update_tree_data_debounced();
   };

   IPCSInfoView.prototype.build_tree = function () {
      var self = this;
      var Observation = observation.Observation;

      this._jstree_key = shortcuts.randint().toString();
      var results = jstree_builder.build_jstree_with_do_observation_functions_attached(this._$container, [
            function (e, elem_owner) {                              // Level 0: 
                return new Observation({target: self, context: self}); 
            }
          ],
          {
            'core' : {
              "animation" : false,
              "worker": true, 
              "multiple": false,
              "check_callback" : false,
              "themes" : { "url": false, "dots": true, "name": "default-dark", "stripped": true},
              "force_text": true,
              'data' : this.get_data(),
            },
            "plugins" : ["state"],
            'state' : {
                "key": this._jstree_key,
                events: 'open_node.jstree close_node.jstree',
            }
          }
      );

      this._get_data_from_selected = results.getter_for_data_from_selected;
      this._immediate_action_to_hack_jstree = results.immediate_action_to_hack_jstree;
      this._update_tree_data = results.update_tree_data;
      this._is_loading_data_in_the_tree = results.is_loading_data_in_the_tree;
   };

   IPCSInfoView.prototype.update_tree_data = function () {
      var data = this.get_data();
      this._update_tree_data(data);

      if (this.is_in_the_dom()) {
         this.repaint($(this.box));
      }
   };
   
   IPCSInfoView.prototype.get_data = function () {
	   
	   	  var data = this.data;

	      var tree_data = _.map(data, 
	         function (ipcs , ipcs_key) {   
	            // first level
	    	  var level1key = this._jstree_key;

	            return {
	            	text: ipcs_key,
	                data: ipcs,
	                icon: false,
	                id: [level1key, ipcs_key].join("_"),
	                children: _.map(data[ipcs_key][0],
	                       function (individual_ipcs, individual_ipcs_key) {
	         
	                          var level2key = individual_ipcs.shmid || individual_ipcs.msqid || individual_ipcs.semid
	                          // second level          
	                          return {
	                              text: level2key,
	                              data: individual_ipcs,
	                              icon: false,
	                              id: [level1key, ipcs_key, level2key].join("_"),
	                              children: _.map(individual_ipcs,
	                                  function (individual_data, individual_data_key) {
	                                     // third level
	                            	  		if(individual_data_key != "sems"){
	                            	  			return {
		   	                                         text: individual_data_key + " = " + individual_data,
		   	                                         data: individual_data,
		   	                                         id: [level1key, ipcs_key, level2key, individual_data_key].join("_"),
		   	                                         icon: false
	                            	  			}
	                            	  		} else {
	                            	  			return {
		   	                                         text: individual_data_key,
		   	                                         data: individual_data,
		   	                                         id: [level1key, ipcs_key, level2key, individual_data_key].join("_"),
		   	                                         icon: false,
		   	                                         children: _.map(individual_data, 
		   	                                        		 function(sems_data, sems_data_key) {
				   	                                        	 //optional fourth level
				   	                                        	 return {
				   	                                        		 text: sems_data.semnum,
						   	                                         data: sems_data,
						   	                                         id: [level1key, ipcs_key, level2key, individual_data_key,sems_data_key].join("_"),
						   	                                         icon: false,
						   	                                         children: _.map(sems_data, 
						   	                                        		 function(individual_sems_data, individual_sems_data_key) {
								   	                                        	 //fifth level
								   	                                        	 return {
								   	                                        		 text: individual_sems_data_key + ' = ' + individual_sems_data,
										   	                                         data: individual_sems_data,
										   	                                         id: [level1key, ipcs_key, level2key, individual_data_key,sems_data_key, individual_sems_data_key].join("_"),
										   	                                         icon: false
								   	                                        	 }
																		
						   	                                         })
				   	                                        	 }
														
													})
	                            	  			}
	                            	  		}
	                                     ;
	                                  }, this)
	                             };
	                       }, this)
	               };
	         }, this);

	      return tree_data;
	   };

   return {IPCSInfoView: IPCSInfoView};
});
