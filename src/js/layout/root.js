define(['jquery', 'layout/panel', 'jqueryui'], function ($, P, _) {
   var NullParent = P.NullParent;
   var Parent = P.Parent;
   var Panel = P.Panel;

   /*
    * A Root object is attached to the DOM. The rest of the panels should be
    * children of this (direct or indirect).
    *
    * You can have multiple Root attached.*/
   var Root = function (dom_parent_element) {
      this.super(("" + Math.random()).slice(2));

      this._$anchor_element = $(dom_parent_element);
      this._child = null;

      var self = this;
      var last_resize_render = null;
      $(window).resize(function () {
         if (last_resize_render) {
            clearTimeout(last_resize_render);
         }

         last_resize_render = setTimeout(function () {
            self.render();
            last_resize_render = null;
         }, 100);
      });
   };

   Root.prototype.__proto__ = Parent.prototype;

   Root.prototype._add_child = function (panel, position) {
      if (position !== 'main') {
         throw new Error("Precondition: Invalid position '"+position+"' of the panel '"+panel+"'. It should be 'main'.");
      }
      
      var previous = this._child;
      if(previous) {
         throw new Error("Precondition: The position '"+position+"' of the panel '"+panel+"' is already in use by the panel '"+previous+"'.");
      }

      this._child = panel;
   };

   Root.prototype._remove_child = function (panel) {
      var previous = this._child;
      if(previous !== panel) {
         throw new Error("Inconsistency: The previous panel '"+previous+"' is not '"+panel+"'.");
      }

      this._parent.remove_child(this);
      
      $(this._$anchor_element).empty();
      this._child = null;
   };
   
   Root.prototype._replace_child = function (panel, other_panel) {
      var previous = this._child;
      if(previous !== panel) {
         throw new Error("Inconsistency: I can't replace a panel '"+panel+"' that i can't find.");
      }

      this._child = other_panel;
   };

   Root.prototype.toString = function () {
      return "[root ("+this._name.slice(0,6)+") Root]";
   };

   Root.prototype.render = function () {
      //XXX ignore $box
      if(this._child) {
         this._child.box = this._$anchor_element;
         this._child.render(this._$anchor_element);
      }
   };

   Root.prototype.unlink = function () {
      if(this._child) {
         this._child.unlink();
      }
   };

   // Implement the method of Panel. See panel.js
   Panel.prototype.attach = function (dom_parent_element) {
      if (this.parent() !== NullParent) {
         throw new Error("I can't attach me '"+this+"'because i have a parent '"+this._parent+"'.");
      }

      var root = new Root(dom_parent_element);
      root.add_child(this, 'main');
   };


   return {
      Root: Root
   }
});
