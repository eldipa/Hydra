define([], function () {
   /* The NullParent is an unique object (singleton) which is a Parent with
    * all of its methods implemented as no-ops.
    *
    * All panels that don't have a parent should have the NullParent as its parent.
    * */
   var NullParent = {};

   NullParent._add_child = NullParent._remove_child = NullParent._replace_child = function () {};
   NullParent.toString = function () {
      return "[NullParent]";
   };
   
   /*
    * Generate a tree starting from a NullParent as the root, follows
    * all the panels that have the NullParent as its parent.
    * Then, follows the panels that have the previous panels as its parents and so on.
    *
    * The panels used to build this tree came from the 'panels' parameter (with the
    * exception of NullParent which is always present).
    *
    * The nodes of this tree are of the form:
    *    {
    *       panel: < a panel >,
    *       children: < a list of nodes >,
    *       toString: < a method to stringnify the node >
    *    }
    *
    * The toString method will return panel.toString() + "\n" + the string returned by
    * its children (with a space added at the begin used to indent).
    *
    * Printing the root node will give something like (an example):
         [NullParent]
           [panel (hello ms) Panel]
           [root (939452) Root]
             [split vertically (126589) Splitted]
               [tabs (518413) Tabbed]
                 [panel (bye bye ) Panel]
                 [panel (more bye) Panel]
                 [panel (lorem ms) Panel]
               [tabs (407880) Tabbed]
                 [panel (foo msg) Panel]
           [panel (bar msg) Panel]
           [panel (zaz msg) Panel]
    *
    *
    * This method returns the root node.
    * */
   var as_tree = function (panels) {
      var lineage = [];

      for(var i = 0; i < panels.length; i++) {
         lineage.push(panels[i].ancestry().reverse());
      }

      //sanity check
      for(var i = 0; i < lineage.length; i++) {
         if(lineage[i][0] !== NullParent) {
            throw new Error("The panel '"+panels[i]+"' has as its oldest ancestor to '"+lineage[i][0]+"'. It should be NullParent.");
         }
      }

      var toString = function (ident) {
         var ident = ident || "";
         var s = ident + this.panel + "\n";
         if(this.children) {
            for(var c in this.children) {
               s += ident + " " + this.children[c].toString(ident + " ");
            }
         }

         return s;
      };

      var root = {
         panel: NullParent,
         children: {},
         toString: toString
      };

      var nodes = [root];

      while(nodes.length > 0) {
         var actual = nodes.shift();

         for(var i = 0; i < lineage.length; i++) {
            if(lineage[i][0] === actual.panel) {
               if(lineage[i][1]) {
                  var child = lineage[i][1];

                  if(!actual.children[child]) {
                     actual.children[child] = {
                        panel: child,
                        children: {},
                        toString: toString
                     };

                     nodes.push(actual.children[child]);
                  }
               }

               lineage[i].shift();
            }
         }
      }

      return root;
   };

   /*
    * Base object. You can inherit from it.
    * If you do so, you need to implement some methods.
    * */
   var Panel = function (name) {
      this.super(name);
   };

   Panel.prototype.super = function (name) {
      this._parent = NullParent;
      this._name = name || "panel";
   };

   /* Build a dummy-temporary panel */
   var new_tmp_panel = function () {
      var tmp = new Panel("tmp");
      tmp.render = tmp.unlink = function () {};
      return tmp;
   };
   
   Panel.prototype.parent = function (new_parent) {
      if (new_parent) {
         this._parent = new_parent;
      }

      return this._parent;
   };

   /* Split the panel in two panel, with the new 'panel' put in 'position'. 
    * This will create a Splitted parent panel.*/
   Panel.prototype.split = function (panel, position) {
      this._parent.split_child(this, panel, position);
   };

   /* Swap this panel by the other */
   Panel.prototype.swap = function (panel) {
      var my_parent = this.parent();
      var your_parent = panel.parent();

      var tmp = new_tmp_panel();

      my_parent.replace_child(this, tmp);
      your_parent.replace_child(panel, this);
      my_parent.replace_child(tmp, panel);
   };

   /* 
    * The method will do the rendering. This method may be called more than once, so
    * the code should be prepared for these cases (like adding something twice).*/
   Panel.prototype.render = function () {
      throw new Error("Not implemented error: The 'render' method of '"+this+"' was not implemented!. It should be to render something meaningful in the box '"+this.box+"'.");
   };

   Panel.prototype.toString = function () {
      return "[panel ("+this._name.slice(0,8)+") Panel]";
   };

   /*
    * Remove the panel from its group, this will set the parent to NullParent. 
    * */
   Panel.prototype.remove = function () {
      this._parent.remove_child(this);
   };

   Panel.prototype.name = function (name) {
      if(name !== null && name !== undefined) {
         this._name = "" + name;
      }

      return this._name;
   };

   Panel.prototype._context_menu_items_for_panel_actions = function () {
      var self = this;
      return [
      {
         text: 'Remove',
         action: function(e){
            e.preventDefault();
            self.remove();
         }
      },
      ]
   };

   /*
    * Returns a list with panels starting from self, then its parent, then its
    * grandparent and so on until the last parent in the chain, the NullParent (included). */
   Panel.prototype.ancestry = function () {
      var parent = this.parent();

      var ancestry = [this];
      while (parent !== NullParent) {
         ancestry.push(parent);
         parent = parent.parent();
      }

      ancestry.push(parent);
      return ancestry;
   };

   /*
    * This method should clean and undo all the stuff done in the render method.
    * Again, this method may be called more than once so be prepared. */
   Panel.prototype.unlink = function () {
      throw new Error("Not implemented error: The 'unlink' method of '"+this+"' was not implemented!. It should unlink its stuff from the DOM. This no necessary means to remove-and-delete any element, you just need to remove it from the DOM.");
   };

   Panel.prototype.is_container = function () {
      return false;
   };

   /*
    * Parent object.
    * */
   var Parent = function () { //TODO, se podria obviar usar el prototipo de Parent y usar una unica instancia de Parent (como se hace con NullParent)
   };

   // NullParent --> Parent --> Panel
   Parent.prototype.__proto__ = Panel.prototype;
   NullParent.__proto__ = Parent.prototype;

   /*
    * Add-Remove-Replace child interface.
    * */
   Parent.prototype.add_child = function (panel, position) {
      if (panel.parent() !== NullParent) {
         throw new Error("Precondition: The panel to be my child '"+panel+"' in '"+position+"' must not have another parent ('"+panel.parent()+"').");
      }

      this._add_child(panel, position);
      panel.parent(this);
   };

   Parent.prototype.remove_child = function (panel) {
      if (panel.parent() !== this) {
         throw new Error("Precondition: The panel '"+panel+"' must be a child of my.");
      }

      panel.unlink();

      this._remove_child(panel);
      panel.parent(NullParent);
   };

   Parent.prototype.replace_child = function (my_panel, other_panel) {
      if (my_panel.parent() !== this) {
         throw new Error("Precondition: The panel '"+my_panel+"' must be a child of my.");
      }

      if (other_panel.parent() !== NullParent) {
         throw new Error("Precondition: The panel to be my child '"+other_panel+"' replacing my child '"+my_panel+"' must not have another parent.");
      }

      my_panel.unlink();

      this._replace_child(my_panel, other_panel);
      other_panel.parent(this);
      my_panel.parent(NullParent);
   };
   
   Parent.prototype.is_container = function () {
      return true;
   };

   // Placeholder, see splitted.js
   Parent.prototype.split_child = function () { throw new Error("Not loaded"); };

   // Placeholder, see root.js
   Panel.prototype.attach = function () { throw new Error("Not loaded"); };

   return {
      NullParent: NullParent,
      as_tree: as_tree,
      Panel: Panel,
      new_tmp_panel: new_tmp_panel,
      new_empty_panel: new_tmp_panel, //alias
      Parent: Parent
   };
});
