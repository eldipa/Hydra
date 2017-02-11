define(["underscore", "jquery", "layout", "shortcuts", "jstree", "jstree_builder", "observation", 'debuggee_tracker/frame'], function (_, $, layout, shortcuts, jstree, jstree_builder, observation, frame_module) {
   'use strict';
   var Frame = frame_module.Frame;

   var StackView = function (thread_follower) {
       this.super("StackView");
       this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');
       this.build_tree();

       this.thread = null;
       this.thread_follower = thread_follower;
       this.frames = [];
       
       _.bindAll(this, "on_frames_updated_request_variables_update", "_variables_of_frame_updated");
   };
   
   StackView.prototype.__proto__ = layout.Panel.prototype;
   layout.implement_render_and_unlink_methods(StackView.prototype);

   StackView.prototype.request_frames_update = function () {
       if (this.thread_follower.are_you_following_a_specific_thread()) {
           var thread_followed = this.thread_follower.thread_followed;
           thread_followed.request_an_update_thread_stack(this.on_frames_updated_request_variables_update);
       }
       else {
           this.clean_up(); // if there isn't a thread, there aren't any frames
       }
   };

   StackView.prototype.clean_up = function () {
       this.frames = [];
       this._update();
   };

   StackView.prototype.on_frames_updated_request_variables_update = function () {
        var thread_followed = this.thread_follower.thread_followed;
        this.frames = thread_followed.get_stack_frames();
        
        _.each(this.frames, function (frame) {
            this.request_variables_of_frame_update(frame);
        }, this);
   };

   StackView.prototype.request_variables_of_frame_update = function (frame) {
       frame.execute(
               "-stack-list-variables", 
               ["THREAD", "SELF", "--all-values"], 
               _.partial(this._variables_of_frame_updated, frame), 
               1, 0);
   };

   StackView.prototype._variables_of_frame_updated = function (frame, data) {
       frame.load_variables(data.results.variables);
       this._update();
   };

   
   StackView.prototype.build_tree = function () {
      var self = this;
      var Observation = observation.Observation;

      this._jstree_key = shortcuts.randint().toString();
      var results = jstree_builder.build_jstree_with_do_observation_functions_attached(this._$container, [
            null,                                                   // Level 0: myself (nothing)
            function (e, elem_owner) {                              // Level 1: Stack frame
                self._immediate_action_to_hack_jstree(e, elem_owner);
                var data = self._get_data_from_selected();
                var frame_level = "" + (data.level);

                var frame = self.frames[frame_level];
                if (!self.thread_follower.are_you_following_a_specific_thread() || !frame) {
                    return null;
                }

                self.thread_follower.update_button_bar_and_code_editor_to_show(frame.source_fullname, 
                                                                        frame.source_line_number,
                                                                        frame.instruction_address);
                
                return null;
            },
            null,                                                   // Level 2: Variable
          ],
          {
            'core' : {
              "animation" : false,
              "worker": true, 
              "multiple": false,
              "check_callback" : false,
              "themes" : { "url": false, "dots": true, "name": "default-dark", "stripped": true},
              "force_text": true,
              'data' : [],
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


   StackView.prototype._update = function () {
      var data = _.map(this.frames, function (frame) {
          return {
            text: frame.get_display_name(),
            data: {level: frame.level},
            icon: false,
            id: [this._jstree_key, frame.level].join("_"),
            children: _.map(frame.variables, function (value, variable_name) {
                return {
                    text: variable_name + " = " + value,
                    data: {},
                    icon: false,
                    id: [this._jstree_key, frame.level, variable_name].join("_"),
                }
            }, this)
          };
      }, this);

      this._update_tree_data(data);

      if (this.is_in_the_dom()) {
         this.repaint($(this.box));
      }
   };

   return { StackView: StackView };
});
