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
      this._overlay_children = [];
      this._$overlay_container = $('<div></div>');

      this._$out_of_dom_overlay_container = this._$overlay_container;

      this._register_on_window_resize();

   };

   Root.prototype._register_on_window_resize = function () {
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
      if (position !== 'main' && position !== 'overlay') {
         throw new Error("Precondition: Invalid position '"+position+"' of the panel '"+panel+"'. It should be 'main' or 'overlay'.");
      }

      if (position === 'main') {
          var previous = this._child;
          if(previous) {
             throw new Error("Precondition: The position '"+position+"' of the panel '"+panel+"' is already in use by the panel '"+previous+"'.");
          }

          this._child = panel;
      }
      else {
          this._overlay_children.push(panel);
          var overlay_box = $(
                '<div class="ui-widget-overlay ui-corner-all overlay_panel">' +
                '</div>');

          overlay_box.appendTo(this._$overlay_container);

      }
   };

   Root.prototype._remove_child = function (panel) {
      var index = null;
      for (var i = 0; i < this._overlay_children.length; i++) {
         if (panel === this._overlay_children[i]) {
            index = i;
            break;
         }
      }

      if (index === null && this._child !== panel) {
         throw new Error("I can't remove a panel '"+panel+"' that i can't find ('"+this+"').");
      }

      if (this._child === panel) {
          this._child = null;
      }
      else {
          this._overlay_children.splice(index, 1);
          this._$overlay_container.children('div')[index].remove();
      }

      //$(this._$anchor_element).empty();
   };
   
   Root.prototype._replace_child = function (panel, other_panel) {
      var index = null;
      for (var i = 0; i < this._overlay_children.length; i++) {
         if (panel === this._overlay_children[i]) {
            index = i;
            break;
         }
      }

      if (index === null && this._child !== panel) {
         throw new Error("Inconsistency: I can't replace a panel '"+panel+"' that i can't find.");
      }

      if (this._child === panel) {
          this._child = other_panel;
      }
      else {
          this._overlay_children[index] = other_panel;
      }
   };

   Root.prototype.toString = function () {
      return "[root ("+this._name.slice(0,6)+") Root]";
   };

   Root.prototype.render = function () {
      //XXX ignore $box
      var box = this._$anchor_element;
      if(this._child) {
         this._child.box = box;
         this._child.render(box);
      }

      if (this._$out_of_dom_overlay_container) {
          this._$out_of_dom_overlay_container.appendTo(box);
          this._$out_of_dom_overlay_container = null;
      }
      
      var overlay_boxes = this._$overlay_container.children('div');
      for (var i = 0; i < this._overlay_children.length; i++) {
          var overlay_panel = this._overlay_children[i];
          var overlay_box = $(overlay_boxes[i]);

          if (overlay_panel.is_container()) {
              overlay_box.removeClass("ui-widget-content").addClass("overlay_panel_holding_container");
          }
          else {
              overlay_box.addClass("ui-widget-content").removeClass("overlay_panel_holding_container");
          }

          overlay_panel.box = overlay_box;
          overlay_panel.render(overlay_box);
      }
   };

   Root.prototype.unlink = function () {
      if(this._child) {
         this._child.unlink();
      }
      
      for (var i = 0; i < this._overlay_children.length; i++) {
          var overlay_panel = this._overlay_children[i];
          overlay_panel.unlink();
      }

      if (!this._$out_of_dom_overlay_container) {
         this._$out_of_dom_overlay_container = this._$overlay_container.detach();
      }
   };

   Root.prototype.remove = function () {
      if (this._child) {
         this._child.remove()
      }
      
      for (var i = 0; i < this._overlay_children.length; i++) {
          var overlay_panel = this._overlay_children[i];
          overlay_panel.remove();
      }
   };

   Root.prototype.is_empty = function () {
      return this._child == null;
   };

   // Implement the method of Panel. See panel.js
   Panel.prototype.attach = function (dom_parent_element) {
      if (this.parent() !== NullParent) {
         throw new Error("I can't attach me '"+this+"'because i have a parent '"+this._parent+"'.");
      }

      var root = new Root(dom_parent_element);
      root.add_child(this, 'main');

      return root;
   };

   return {
      Root: Root
   }
});
