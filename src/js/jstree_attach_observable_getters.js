define(["underscore", "jquery"], function (_, $) {
    var attach_observable_getters_for_each_layer = function ($tree_container, getters_of_observables) {
        var $current_layer = $tree_container;

        _.each(getters_of_observables, function (getter) {
            if (getter) {
                $current_layer.data('observable_getter', getter);
            }

            $current_layer = $current_layer.children('ul').children('li');
        });

    };

    var create_immediate_action_to_hack_jstree = function ($tree_container) {
        return function (ctx_event, dom_node_owner) {
            if (!ctx_event || !dom_node_owner) {
                throw new Error("Missing arguments in the function to hack jstree.");
            }

            if (ctx_event.jstree_hack_done) {
                return;
            }
            ctx_event.jstree_hack_done = true;

            var node_id = $(dom_node_owner).attr('id');
            $tree_container.jstree("deselect_all");
            $tree_container.jstree("select_node", node_id);
        };
    };

    var build_getter_for_data_from_selected = function ($tree_container) {
        return function () {
            var nodes_selected = $tree_container.jstree('get_selected');

            if (nodes_selected.length === 0) { // for some reason, jstree hasn't selected nodes so we need to do this to avoid a crash
                return null; 
            }

            var node_selected = nodes_selected[0]; //TODO we only support one of them for now

            var node = $tree_container.jstree(true).get_node(node_selected)
            return node.data;
        };
    };

    var build_jstree_with_observable_getters_attached = function ($tree_container, getters_of_observables, jstree_options, after_open_callback, redraw_callback) {
        var immediate_action_to_hack_jstree = create_immediate_action_to_hack_jstree($tree_container);
        
        var bounded_constructor  = _.bind(attach_observable_getters_for_each_layer, this, $tree_container, getters_of_observables);
        var _attach_safe = _.throttle(bounded_constructor, 500);

        $tree_container.on("after_open.jstree", function () {
              _attach_safe();
              if (after_open_callback) {
                  after_open_callback();
              }
           }).on("redraw.jstree", function () {
              _attach_safe();
              if (redraw_callback) {
                  redraw_callback();
              }
           }).jstree(jstree_options);

        return {
            getter_for_data_from_selected: build_getter_for_data_from_selected($tree_container),
            immediate_action_to_hack_jstree: immediate_action_to_hack_jstree
        };
    };


    return {
        build_jstree_with_observable_getters_attached: build_jstree_with_observable_getters_attached
    };
});
