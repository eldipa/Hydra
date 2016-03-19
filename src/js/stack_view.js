define(["underscore", "jquery", "layout", "shortcuts", "jstree", "jstree_builder", "observation", 'debuggee_tracker/frame'], function (_, $, layout, shortcuts, jstree, jstree_builder, observation, frame_module) {
   'use strict';
   var Frame = frame_module.Frame;

   var StackView = function () {
       this.super("StackView");
       this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');
       this.build_tree();

       this.thread = null;
       this.follower = null;
       this.frames = [];
       
       _.bindAll(this, "_frames_updated", "_variables_of_frame_updated");
   };
   
   StackView.prototype.__proto__ = layout.Panel.prototype;
   layout.implement_render_and_unlink_methods(StackView.prototype);

   StackView.prototype.follow = function (thread, follower) {
       this.thread = thread;
       this.follower = follower;
       if (! this.thread) {
           this.frames = []; // cleanup
       }
       else {
           this.request_frames_update(); // force a sync
       }
   }
   
   StackView.prototype.request_frames_update = function () {
       if (this.thread) {
           this.thread.execute(
                   "-stack-list-frames", 
                   ["SELF", "--no-frame-filters"], 
                   this._frames_updated, 
                   0);
       }
   };

   StackView.prototype._frames_updated = function (data) {
        var raw_frames = _.pluck(data.results.stack, 'frame');
        var that = this;
        var frames = _.map(raw_frames, function (frame) {
            var processed_frame = {};

            processed_frame.thread = that.thread;

            processed_frame.function_name = frame.func;
            processed_frame.instruction_address = frame.addr;
            processed_frame.level = parseInt(frame.level);

            if (frame.fullname) {
                processed_frame.source_fullname = frame.fullname;
                processed_frame.source_line_number = parseInt(frame.line);
            }

            return new Frame(processed_frame);
        });

        this.frames = _.sortBy(frames, 'level');

        _.each(this.frames, function (frame) {
            that.request_variables_of_frame_update(frame);
        });
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
                var thread_followed = self.thread;
                if (!thread_followed || !self.follower || !frame) {
                    return null;
                }

                self.follower.update_button_bar_and_code_editor_to_show(frame.source_fullname, 
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
