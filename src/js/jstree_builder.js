define(["underscore", "jquery"], function (_, $) {
    var attach_do_observation_func_to_each_layer = function ($tree_container, do_observation_functions) {
        var $current_layer = $tree_container;

        _.each(do_observation_functions, function (getter) {
            if (getter) {
                $current_layer.data('do_observation', getter);
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

    var build_updater_tree_data_callbacks = function ($tree_container) {
        var _loading_the_data_in_the_tree = true;

        var updater_tree_data_callback = function (tree_data) {
            _loading_the_data_in_the_tree = true;

            $($tree_container).jstree(true).settings.core.data = tree_data;
            $($tree_container).jstree(true).load_node('#', function (x, is_loaded) {
                if (is_loaded) {
                    _loading_the_data_in_the_tree = false;
                    $($tree_container).jstree(true).restore_state();
                }
            });
        };

        var is_loading_data_in_the_tree = function () {
            return _loading_the_data_in_the_tree;
        };

        return {
            updater_tree_data_callback: updater_tree_data_callback,
            is_loading_data_in_the_tree: is_loading_data_in_the_tree
        };
    };

    // Create a jstree object and attach it to the $tree_container DOM object which its
    // custom configuration can be set in jstree_options parameter
    //
    // The jstree object represent an hieratchical structure with possible several layers
    // 
    // Each layer can export an Observation abstraction to interact with that layer:
    // the do_observation_functions is a array of functions to export that Observation,
    // one function per layer (of course, if one layer doesn't want to export anything, the
    // function can be replaced by a null).
    //
    // Two special callback can be set so the jstree object can interact with the rest of the UI
    // nicely:
    //  - after_open_callback
    //  - redraw_callback
    //
    // Once built the jstree object and attached, this builder function will return an object with:
    //  - getter_for_data_from_selected: a callback to get the selected data/node in jstree that is currently selected
    //  - immediate_action_to_hack_jstree: a callback that should be called before the call to getter_for_data_from_selected (this is a hack for jstree)
    //  - update_tree_data: call this to update the data of the tree without destroying jstree in the process. You need to update the UI and the rendering, this function will NOT do it for you.
    //  - is_loading_data_in_the_tree: return if the jstree is loading the data or no right now.
    //
    var build_jstree_with_do_observation_functions_attached = function ($tree_container, do_observation_functions, jstree_options, after_open_callback, redraw_callback) {
        var immediate_action_to_hack_jstree = create_immediate_action_to_hack_jstree($tree_container);
        
        var bounded_constructor  = _.bind(attach_do_observation_func_to_each_layer, this, $tree_container, do_observation_functions);
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

        var updater_callbacks = build_updater_tree_data_callbacks($tree_container);

        return {
            getter_for_data_from_selected: build_getter_for_data_from_selected($tree_container),
            immediate_action_to_hack_jstree: immediate_action_to_hack_jstree,
            update_tree_data: updater_callbacks.updater_tree_data_callback,
            is_loading_data_in_the_tree: updater_callbacks.is_loading_data_in_the_tree
        };
    };


    return {
        build_jstree_with_do_observation_functions_attached: build_jstree_with_do_observation_functions_attached,
    };
});
