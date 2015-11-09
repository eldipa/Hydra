define(["underscore", "jquery"], function (_, $) {
    var attach_context_menues_for_each_layer = function ($tree_container, menu_descriptions) {
        var $current_layer = $tree_container;

        _.each(menu_descriptions, function (context_menu_description) {
            if (context_menu_description) {
                $current_layer.data('ctxmenu_controller', context_menu_description);
            }

            $current_layer = $current_layer.children('ul').children('li');
        });
    };

    var create_immediate_action_to_hack_jstree = function ($tree_container) {
        return function (ctx_event, element_ctxmenu_owner) {
            if (ctx_event.jstree_hack_done) {
                return;
            }
            ctx_event.jstree_hack_done = true;

            var node_id = $(element_ctxmenu_owner).attr('id');
            $tree_container.jstree("deselect_all");
            $tree_container.jstree("select_node", node_id);
        };
    };

    var enhance_menu_descriptions_to_hack_jstree_inplace = function ($tree_container, menu_descriptions) {
        var immediate_action_to_hack_jstree = create_immediate_action_to_hack_jstree($tree_container);
        _.each(menu_descriptions, function (context_menu_description, index) {
            if (!context_menu_description) {
                return;
            }

            if (index !== 0) {
                context_menu_description.unshift({
                    immediate_action: immediate_action_to_hack_jstree
                });
            }
        });
    };
    
    var build_getter_for_data_from_selected = function ($tree_container) {
        return function () {
            var nodes_selected = $tree_container.jstree('get_selected');
            var node_selected = nodes_selected[0]; //TODO we only support one of them for now

            return $tree_container.jstree(true).get_node(node_selected).data;
        };
    };

    var build_jstree_with_a_context_menu = function ($tree_container, menu_descriptions, jstree_options, after_open_callback, redraw_callback) {
        enhance_menu_descriptions_to_hack_jstree_inplace($tree_container, menu_descriptions);
        
        var bounded_constructor  = _.bind(attach_context_menues_for_each_layer, this, $tree_container, menu_descriptions);
        var _attach_ctxmenu_safe = _.throttle(bounded_constructor, 500);

        $tree_container.on("after_open.jstree", function () {
              _attach_ctxmenu_safe();
              if (after_open_callback) {
                  after_open_callback();
              }
           }).on("redraw.jstree", function () {
              _attach_ctxmenu_safe();
              if (redraw_callback) {
                  redraw_callback();
              }
           }).jstree(jstree_options);

        return {
            getter_for_data_from_selected: build_getter_for_data_from_selected($tree_container),
        };
    };


    return {
        build_jstree_with_a_context_menu: build_jstree_with_a_context_menu
    };
});
