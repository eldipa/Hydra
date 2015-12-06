define(['jquery', 'layout/panel', 'jqueryui'], function ($, P, _) {
   var NullParent = P.NullParent;
   var Parent = P.Parent;
   var new_tmp_panel = P.new_tmp_panel;

   /*
    * A Splitted panel represent a compound of two panels joined by a vertical u
    * horizontal bar.
    * The bar can be moved, resizing the width or height of both panels.
    * */
   var Splitted = function (splitted_direction) {
      this.super(("" + Math.random()).slice(2));

      if(splitted_direction !== 'vertically' && splitted_direction !== 'horizontally') {
         throw new Error("Precondition: The split direction must be 'vertically' or 'horizontally', the direction '"+splitted_direction+"' was used.");
      }

      this._splitted_direction = splitted_direction;

      var self = this;
      this.__original_cursor_style = null; // used to try to force a consistent look and feel of the mouse when it is dragging the bar of the splitted.

      var restore_cursor_style_and_update_bar_and_split_for = function (position_name, dimension_name) {
         if (! ((position_name === 'left' && dimension_name === 'width') ||
                (position_name === 'top'  && dimension_name === 'height')) ) {
                   throw new Error("The position/dimension names are invalid. Accepted 'left-width' and 'top-height' but received '"+position_name+"-"+dimension_name+"'.");
                }

         var opposite_position_name = {
            left: 'right',
            top : 'bottom',
         }[position_name]

         return function (event, ui) {
            $('body').css({'cursor': self.__original_cursor_style});

            var $container = $(this).parent().parent();
            var new_bar_position = $(ui.helper).position();

            var container_position = $container.position();

            var rel_offset = (new_bar_position[position_name] - container_position[position_name]) / $container[dimension_name]();

            if(rel_offset < 0.0001 || rel_offset > 0.9999) {
               console.warn("Upss, the bar was moved too far. Try it again.");
            }
            else {
               var percentage = (rel_offset * 100);
               self.set_percentage(percentage);
            }
         };
      };  

      var set_cursor_style_and_fix_for_dimension_at_start_bug_for = function (dimension_name, cursor_style) {
         if (! (dimension_name === 'width' || dimension_name === 'height') ) {
            throw new Error("Incorrect dimension name. Accepted width or height but received '"+dimension_name+"'.");
         }

         return function (event, ui) {
            var body = $('body');
            self.__original_cursor_style = body.css('cursor');
            body.css({'cursor': cursor_style});

            var correct_value_at_start = $(this)[dimension_name]();
            $(ui.helper)[dimension_name](correct_value_at_start);

            $(ui.helper).removeClass("ui-state-hover").removeClass("bar_of_splitted_transparent").addClass("ui-state-active");
         };
      };

      var options_for_draggable_bar = function (type) {
         if (! (type === 'vertical' || type === 'horizontal') ) {
            throw new Error("You cannot create a '"+type+"' draggable bar. Only 'vertical' or 'horizontal' draggable bars are allowed.");
         }
         
         if (type === 'vertical') {
            return { 
               axis: "x", 
               opacity: 0.7, 
               helper: "clone",
               stop: restore_cursor_style_and_update_bar_and_split_for('left', 'width'),
               start: set_cursor_style_and_fix_for_dimension_at_start_bug_for('height', 'ew-resize')
            };
         }
         else {
            return { 
               axis: "y", 
               opacity: 0.7, 
               helper: "clone",
               stop: restore_cursor_style_and_update_bar_and_split_for('top', 'height'),
               start: set_cursor_style_and_fix_for_dimension_at_start_bug_for('width', 'ns-resize')
            };
         }
      };

      if (this._splitted_direction === 'horizontally') {
         this._$container = $(
            '<div class="splitted_container ui-widget">' +
               '<div class="top_panel_of_splitted"><div class="panel_of_splitted_conteiner"></div></div>' +
               '<div class="bottom_side_panel_and_bar_of_splitted">' +
                  '<div class="horizontal_bar_splitting ui-state-default bar_of_splitted_transparent"></div>' +
                  '<div class="bottom_panel_of_splitted"><div class="panel_of_splitted_conteiner"></div></div>' +
               '</div>' +
            '</div>');
         this._$container.find('.horizontal_bar_splitting').hover(function () {$(this).toggleClass("ui-state-hover").toggleClass("bar_of_splitted_transparent")}).draggable(options_for_draggable_bar('horizontal'));
         this._position_name = 'top';
         this._dimension_name = 'height';
      }
      else {
         this._$container = $(
            '<div class="splitted_container ui-widget">' +
               '<div class="left_panel_of_splitted"><div class="panel_of_splitted_conteiner"></div></div>' +
               '<div class="right_side_panel_and_bar_of_splitted">' +
                  '<div class="vertical_bar_splitting ui-state-default bar_of_splitted_transparent"></div>' +
                  '<div class="right_panel_of_splitted"><div class="panel_of_splitted_conteiner"></div></div>' +
               '</div>' +
            '</div>');
         this._$container.find('.vertical_bar_splitting').hover(function () {$(this).toggleClass("ui-state-hover").toggleClass("bar_of_splitted_transparent")}).draggable(options_for_draggable_bar('vertical'));
         this._position_name = 'left';
         this._dimension_name = 'width';
      }

      this._children = {};

      this._$out_of_dom = this._$container;
   };


   Splitted.prototype.__proto__ = Parent.prototype;

   Splitted.prototype.set_percentage = function (percentage) {
      var opposite_position_name = {
            left: 'right',
            top : 'bottom',
         }[this._position_name];

      // get the children
      var one_panel = this._$container.children("."+this._position_name+"_panel_of_splitted");
      var the_other_panel_and_bar = this._$container.children("."+opposite_position_name+"_side_panel_and_bar_of_splitted");

      // remove the borders, margins and paddings because they will interfer with the width/height setting.
      one_panel.css({border: "none", margin: "none", padding: "none"});
      the_other_panel_and_bar.css({border: "none", margin: "none", padding: "none"});

      // set the dimension
      one_panel[this._dimension_name](percentage + "%");
      the_other_panel_and_bar[this._dimension_name]((100-percentage) + "%");

      // restore the borders, margins and paddings
      one_panel.css({border: "", margin: "", padding: ""});
      the_other_panel_and_bar.css({border: "", margin: "", padding: ""});

      this.render();
   }

   Splitted.prototype._get_class_for_child = function (position) {
      return '.'+position+'_panel_of_splitted';
   };

   Splitted.prototype._add_child = function (panel, position) {
      if(this._splitted_direction === 'vertically') {
         if(position !== 'left' && position !== 'right') {
            throw new Error("Precondition: Invalid position '"+position+"' of the panel '"+panel+"'. It should be 'left' or 'right' (the parent is splitted '"+this._splitted_direction+"').");
         }
      }
      else {
         if(position !== 'top' && position !== 'bottom') {
            throw new Error("Precondition: Invalid position '"+position+"' of the panel '"+panel+"'. It should be 'top' or 'bottom' (the parent is splitted '"+this._splitted_direction+"').");
         }
      }

      var previous = this._children[position];
      if(previous) {
         throw new Error("Precondition: The position '"+position+"' of the panel '"+panel+"' is already in use by the panel '"+previous+"'.");
      }

      this._children[position] = panel;

      //draw?
   };

   Splitted.prototype._remove_child = function (panel) {
      var position = null;
      var the_other_position = null;
      for (var pos in this._children) {
         if (this._children[pos] === panel) {
            position = pos;
         }
         else if (this._children[pos]) {
            the_other_position = pos;
         }
      }

      if(position === null) {
         throw new Error("Inconsistency: I can't remove a panel '"+panel+"' that i can't find.");
      }

      if(the_other_position === null) {
         throw new Error("Inconsistency: I found the panel '"+panel+"' to be removed but i can't find the other panel!");
      }

      var the_other_panel = this._children[the_other_position];

      var tmp = new_tmp_panel();
      this.swap(tmp);
      tmp.swap(the_other_panel);

      this._parent.remove_child(this);
      this._children = {};
      // clean up the draw?
   };

   Splitted.prototype._replace_child = function (panel, other_panel) {
      var position = null;
      for (var pos in this._children) {
         if (this._children[pos] === panel) {
            position = pos;
            break;
         }
      }

      if(position === null) {
         throw new Error("Inconsistency: I can't replace a panel '"+panel+"' that i can't find.");
      }

      this._children[position] = other_panel;

      //redraw?
   };

   
   Splitted.prototype.toString = function () {
      return "[split "+this._splitted_direction+" ("+this._name.slice(0,6)+") Splitted]";
   };
   
   Splitted.prototype.render = function () {
      if (this._$out_of_dom) {   //XXX ver esta parte junto con unlink. Puede que sea un patron reutilizable.
         this._$out_of_dom.appendTo(this.box);
         this._$out_of_dom = null;
      }
      for (var pos in this._children) {
         if (pos === 'left' || pos === 'top') {
            var panel_side = this._$container.children(this._get_class_for_child(pos))
            this._children[pos].box = panel_side.children();
         }
         else {
            var panel_side = this._$container.children('.'+pos+'_side_panel_and_bar_of_splitted').children(this._get_class_for_child(pos));
            this._children[pos].box = panel_side.children();
         }

         if (this._children[pos].is_container()) {
            panel_side.removeClass("ui-widget-content").removeClass("ui-corner-all");
         }
         else {
            panel_side.addClass("ui-widget-content").addClass("ui-corner-all");
         }

         this._children[pos].render();
      }
   };

   Splitted.prototype.unlink = function () {
      for (var pos in this._children) {
         this._children[pos].unlink();
      }

      if (!this._$out_of_dom) {
         this._$out_of_dom = this._$container.detach(); //"container" is "in_the_dom"
      }
   };


   // Implement the method of Parent. See panel.js
   Parent.prototype.split_child = function (my_panel, panel, position) {
      var splitted_direction = null;
      var my_position = null;
      switch(position) {
         case 'top':
            my_position = 'bottom';
            splitted_direction = 'horizontally';
            break;
         case 'bottom':
            my_position = 'top';
            splitted_direction = 'horizontally';
            break;

         case 'left':
            my_position = 'right';
            splitted_direction = 'vertically';
            break;
         case 'right':
            my_position = 'left';
            splitted_direction = 'vertically';
            break;

         default:
            throw new Error("Invalid position '"+position+"' for the panel '"+panel+"'.");
      }

      var splitted = new Splitted(splitted_direction);

      my_panel.swap(splitted);

      var e1 = new_tmp_panel()
      var e2 = new_tmp_panel()

      splitted.add_child(e1, my_position);
      splitted.add_child(e2, position);

      e1.swap(my_panel);
      e2.swap(panel);
   };

   return {
      Splitted: Splitted
   };

});
