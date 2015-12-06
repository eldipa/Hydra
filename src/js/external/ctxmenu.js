/* 
 * Context.js
 * Copyright Jacob Kelley
 * MIT License
 */

define(['jquery', 'underscore'], function ($, _) {
   return (function () {
           var options = {
                   fadeSpeed: 100,
                   filter: function ($obj) {
                           // Modify $obj, Do not return
                   },
                   above: 'auto',
                   preventDoubleContext: true,
                   compress: false
           };

           function initialize(opts) {
                   
                   options = $.extend({}, options, opts);
                   
                   $(document).on('click', 'html', function () {
                           $('.dropdown-context').fadeOut(options.fadeSpeed, function(){
                                   $('.dropdown-context').css({display:''}).find('.drop-left').removeClass('drop-left');
                           });
                   });
                   if(options.preventDoubleContext){
                           $(document).on('contextmenu', '.dropdown-context', function (e) {
                                   e.preventDefault();
                           });
                   }
                   $(document).on('mouseenter', '.dropdown-submenu', function(){
                           var $sub = $(this).find('.dropdown-context-sub:first'),
                                   subWidth = $sub.width(),
                                   subLeft = $sub.offset().left,
                                   collision = (subWidth+subLeft) > window.innerWidth;
                           if(collision){
                                   $sub.addClass('drop-left');
                           }
                   });
                   
           }

           function updateOptions(opts){
                   options = $.extend({}, options, opts);
           }

           function buildMenu(data, id, subMenu, ctx_event) {
                   var subClass = (subMenu) ? ' dropdown-context-sub' : '',
                           compressed = (options.compress ? ' compressed-context' : '') + " ui-widget",
                           $menu = $('<ul class="dropdown-menu dropdown-context' + subClass + compressed+'" id="dropdown-' + id + '"></ul>');
           var i = 0, linkTarget = '';
           var element_ctxmenu_owner = null;
           for(i; i<data.length; i++) {
                   if (data[i].element_ctxmenu_owner) {
                      element_ctxmenu_owner = data[i].element_ctxmenu_owner;
                      continue;
                   }

                   if (data[i].immediate_action) {
                      try {
                        data[i].immediate_action(ctx_event, element_ctxmenu_owner);
                      }
                      catch (e) {
                        console.warn(e);
                      }

                      continue;
                   }

                   if (typeof data[i].divider !== 'undefined') {
                                   $menu.append('<li class="divider"></li>');
                           } else if (typeof data[i].header !== 'undefined') {
                                   $menu.append('<li class="nav-header">' + data[i].header + '</li>');
                           } else {
                                   if (typeof data[i].href == 'undefined') {
                                           data[i].href = '#';
                                   }
                                   if (typeof data[i].target !== 'undefined') {
                                           linkTarget = ' target="'+data[i].target+'"';
                                   }
                                   if (typeof data[i].subMenu !== 'undefined') {
                                           $sub = $('<li class="dropdown-submenu"><a tabindex="-1" href="' + data[i].href + '">' + data[i].text + '</a></li>');
                                   } else {
                                           $sub = $('<li><a tabindex="-1" href="' + data[i].href + '"'+linkTarget+'>' + data[i].text + '</a></li>');
                                   }
                                   if (typeof data[i].action !== 'undefined') {
                                           var actiond = new Date(),
                                                   actionID = 'event-' + actiond.getTime() * Math.floor(Math.random()*100000),
                                                   eventAction = data[i].action;
                                           $sub.find('a').attr('id', actionID);
                                           $('#' + actionID).addClass('context-event');
                                           $(document).on('click', '#' + actionID, _.partial(eventAction, _, element_ctxmenu_owner));
                                   }
                                   $menu.append($sub);
                                   if (typeof data[i].subMenu != 'undefined') {
                                           var subMenuData = buildMenu(data[i].subMenu, id, true, ctx_event);
                                           $menu.find('li:last').append(subMenuData);
                                   }
                           }
                           if (typeof options.filter == 'function') {
                                   options.filter($menu.find('li:last'));
                           }

                        if (data[i].end_menu_here) {
                            break;
                        }
                   }
                   return $menu;
           }

           function addContext(selector, data) {
                   
                   var d = new Date(),
                           id = d.getTime(),
                           $menu = buildMenu(data, id);
                           
                   $('body').append($menu);
                   
                   
                   $(document).on('contextmenu', selector, function (e) {
                           e.preventDefault();
                           e.stopPropagation();
                           
                           $('.dropdown-context:not(.dropdown-context-sub)').hide();
                           
                           $dd = $('#dropdown-' + id);
                           if (typeof options.above == 'boolean' && options.above) {
                                   $dd.addClass('dropdown-context-up').css({
                                           top: e.pageY - 20 - $('#dropdown-' + id).height(),
                                           left: e.pageX - 13
                                   }).fadeIn(options.fadeSpeed);
                           } else if (typeof options.above == 'string' && options.above == 'auto') {
                                   $dd.removeClass('dropdown-context-up');
                                   var autoH = $dd.height() + 12;
                                   if ((e.pageY + autoH) > $('html').height()) {
                                           $dd.addClass('dropdown-context-up').css({
                                                   top: e.pageY - 20 - autoH,
                                                   left: e.pageX - 13
                                           }).fadeIn(options.fadeSpeed);
                                   } else {
                                           $dd.css({
                                                   top: e.pageY + 10,
                                                   left: e.pageX - 13
                                           }).fadeIn(options.fadeSpeed);
                                   }
                           }
                   });
           }
 

           var old_dynamic_context_id = null;

           /* For the dom-element-target clicked, if he has a observable_attrname
            * and for its parents, from the closer parent to the more
            * far ancester, and only if they have a observable_attrname:
            *     - collect the content of their observable_attrname which
            *     should be a function to return an observable object (and its context object)
            *     - then, build a context menu with the concatenation of the 
            *     submenus collected from the observables invoking to each one the method get_display_controller
            *     which must return an array of dictionaries with the description
            *     of the context menu (see the help of this lib)
            *
            * See addContext
            **/
           function addDynamicContext(selector) {
                   var observable_attrname = 'do_observation';
                   $(document).on('contextmenu', selector, function (e) {
                      e.preventDefault();
                      e.stopPropagation();
                     
                      var $target = $(e.target);
                      var $parents = $target.parents(); 

                      var do_observation = null;
                      var observation = null;
                      var current_observable = null;
                      var current_context = null;

                      var controllers = [];
                      if($target.length === 1) {
                         do_observation = $target.data(observable_attrname);
                         if (do_observation) {
                             observation = do_observation(e, $target[0]);

                             if (observation) {
                                 current_observable = observation.target;
                                 current_context = observation.context;

                                 var subctxmenu = current_observable.get_display_controller(current_context);
                                 if (subctxmenu) { 
                                    controllers.push({
                                       element: $target[0],
                                       subctxmenu: subctxmenu 
                                    });
                                 }
                             }
                         }
                      }

                      $parents.each(function () {
                         do_observation = null;
                         current_observable = null;
                         observation = null;

                         do_observation = $(this).data(observable_attrname);
                         if (do_observation) {
                             observation = do_observation(e, $(this)[0]);

                             if (observation) {
                                 current_observable = observation.target;;
                                 current_context = observation.context;

                                 var subctxmenu = current_observable.get_display_controller(current_context);
                                 if (subctxmenu) { 
                                    controllers.push({
                                       element: $(this)[0],
                                       subctxmenu: subctxmenu
                                    });
                                 }
                             }
                         }
                      });

                      var menu_data = [];
                      for(var i = 0; i < controllers.length  &&  i < 1; i++) {
                         var dom_element = controllers[i].element;
                         var submenu = controllers[i].subctxmenu;

                         menu_data.push({element_ctxmenu_owner: dom_element});
                         menu_data = menu_data.concat(submenu);
                      }

                      if(menu_data.length === 0) {
                         return;
                      }

                      var d = new Date();
                      var id = d.getTime();
                      var $menu = buildMenu(menu_data, id, false, e);

                      $('body').append($menu);
                      $('.dropdown-context:not(.dropdown-context-sub)').hide();

                      if (old_dynamic_context_id !== null) {
                         var $old = $('#dropdown-' + old_dynamic_context_id);
                         $old.remove();
                      }

                      old_dynamic_context_id = id;
                           
                           $dd = $('#dropdown-' + id);
                           if (typeof options.above == 'boolean' && options.above) {
                                   $dd.addClass('dropdown-context-up').css({
                                           top: e.pageY - 20 - $('#dropdown-' + id).height(),
                                           left: e.pageX - 13
                                   }).fadeIn(options.fadeSpeed);
                           } else if (typeof options.above == 'string' && options.above == 'auto') {
                                   $dd.removeClass('dropdown-context-up');
                                   var autoH = $dd.height() + 12;

                                   /* Fix a bug: if the menu is at the right of the page
                                    * and the page doesn't allow overflow, the menu will
                                    * be trucated. */
                                   var autoW = $dd.width() + 10;
                                   if ((e.pageX + autoW) < $('html').width()) {
                                      autoW = 0; //dont move.
                                   }
                                   /* ***** */

                                   if ((e.pageY + autoH) > $('html').height()) {
                                           $dd.addClass('dropdown-context-up').css({
                                                   top: e.pageY - 20 - autoH,
                                                   left: e.pageX - 13 - autoW
                                           }).fadeIn(options.fadeSpeed);
                                   } else {
                                           $dd.css({
                                                   top: e.pageY + 10,
                                                   left: e.pageX - 13 - autoW
                                           }).fadeIn(options.fadeSpeed);
                                   }
                           }
                   });
           }
           
           function destroyContext(selector) {
                   $(document).off('contextmenu', selector).off('click', '.context-event');
           }
           
           return {
                   init: initialize,
                   settings: updateOptions,
                   attach: addContext,
                   destroy: destroyContext,
                   attachDynamic: addDynamicContext
           };
   })();
});
