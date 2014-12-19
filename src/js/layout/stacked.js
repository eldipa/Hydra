define(['jquery', 'layout/panel', 'jqueryui'], function ($, P, _) {
   var NullParent = P.NullParent;
   var Parent = P.Parent;
   var new_tmp_panel = P.new_tmp_panel;

   // Note: you cannot nest stackeds
   var Stacked = function (stack_direction) {
      this.super(("" + Math.random()).slice(2));

      if(stack_direction !== 'vertically' && stack_direction !== 'horizontally') {
         throw new Error("Precondition: The stack direction must be 'vertically' or 'horizontally', the direction '"+stack_direction+"' was used.");
      }

      this._stack_direction = stack_direction;

      if (this._stack_direction === 'vertically') {
         this._$container = $(
            '<div class="vertical_stacked_container ui-widget">' +
            '</div>');
         this._child_class = "vertical_panel_of_stacked";
      }
      else {
         this._$container = $(
            '<div class="horizontal_stacked_container ui-widget">' +
            '</div>');
         this._child_class = "horizontal_panel_of_stacked";
      }

      this._children = [];

      this._$out_of_dom = this._$container;
   };


   Stacked.prototype.__proto__ = Parent.prototype;

   Stacked.prototype._add_child = function (panel, opts) {
      var position = opts.position;
      var grow = opts.grow || 0;
      var shrink = (opts.shrink === undefined)? 1 : opts.shrink;

      if(this._stack_direction === 'horizontally') {
         if(position !== 'left' && position !== 'right') {
            throw new Error("Precondition: Invalid position '"+position+"' of the panel '"+panel+"'. It should be 'left' or 'right' (the parent is stacked '"+this._splitted_direction+"').");
         }
      }
      else {
         if(position !== 'top' && position !== 'bottom') {
            throw new Error("Precondition: Invalid position '"+position+"' of the panel '"+panel+"'. It should be 'top' or 'bottom' (the parent is stacked '"+this._splitted_direction+"').");
         }
      }

      var new_dom_child = $('<div style="flex: '+grow+' '+shrink+' auto;" class="'+this._child_class+'"></div>');
      if (position === 'top' || position === 'left') {
         this._children.splice(0, 0, panel);
         this._$container.prepend(new_dom_child);
      }
      else {
         this._children.push(panel);
         this._$container.append(new_dom_child);
      }

      //draw?
   };

   Stacked.prototype._remove_child = function (panel) {
      var index = null;
      for (var i = 0; i < this._children.length; i++) {
         if (panel === this._children[i]) {
            index = i;
            break;
         }
      }

      if (index === null) {
         throw new Error("I can't remove a panel '"+panel+"' that i can't find ('"+this+"').");
      }

      this._children.splice(index, 1);
      this._$container.children()[index].remove();
   };

   Stacked.prototype._replace_child = function (panel, other_panel) {
      var index = null;
      for (var i = 0; i < this._children.length; i++) {
         if (panel === this._children[i]) {
            index = i;
            break;
         }
      }

      if(index === null) {
         throw new Error("Inconsistency: I can't replace a panel '"+panel+"' that i can't find.");
      }

      this._children[index] = other_panel;

      //redraw?
   };

   
   Stacked.prototype.toString = function () {
      return "[stack "+this._stack_direction+" ("+this._name.slice(0,6)+") Stacked]";
   };
   
   Stacked.prototype.render = function () {
      if (this._$out_of_dom) {   //XXX ver esta parte junto con unlink. Puede que sea un patron reutilizable.
         this._$out_of_dom.appendTo(this.box);
         this._$out_of_dom = null;
      }

      var dom_children = this._$container.children();
      for (var i = 0; i < this._children.length; i++) {
         this._children[i].box = dom_children[i];
         this._children[i].render();
      }
   };

   Stacked.prototype.unlink = function () {
      if (!this._$out_of_dom) {
         this._$out_of_dom = this._$container.detach(); //"container" is "in_the_dom"
         //TODO unlink hay que unlinkear los  sub panels?
      }
   };

   return {
      Stacked: Stacked
   };
});

