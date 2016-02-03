define(["underscore", "jquery", "layout", "shortcuts", "jstree", "jstree_builder", "observation"], function (_, $, layout, shortcuts, jstree, jstree_builder, observation) {
   'use strict';

   var StackView = function (thread) {
       this.super("StackView");
       this.build_and_initialize_panel_container('<div style="height: 100%; width: 100%"></div>');
       this.build_tree();

       this.follow(thread);
   };

   StackView.prototype.follow = function (thread) {
       this.thread_followed = thread;
   };

   StackView.prototype.__proto__ = layout.Panel.prototype;
   layout.implement_render_and_unlink_methods(StackView.prototype);
   
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

                //self.thread_followed.get_debugger_you_belong().execute('-stack-select-frame', [frame_level]);
                self.thread_followed.get_debugger_you_belong().execute('up');
                //self.thread_followed.frame_level = frame_level;
                
                return null;
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

   StackView.prototype.update_tree_data_from_frames = function (frames) {
      var data = _.map(frames, function (frame) {
          return {
            text: frame.get_display_name(),
            data: {level: frame.level},
            icon: false,
            id: [this._jstree_key, frame.level].join("_"),
          };
      }, this);

      this._update_tree_data(data);

      if (this.is_in_the_dom()) {
         this.repaint($(this.box));
      }
   };

   return { StackView: StackView };
});
