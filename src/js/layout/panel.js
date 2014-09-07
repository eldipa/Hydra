define([], function () {
   var NullParent = {};

   NullParent._add_child = NullParent._remove_child = NullParent._replace_child = function () {};
   NullParent.toString = function () {
      return "[NullParent]";
   };
   
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

   var Panel = function (name) {
      this._parent = NullParent;
      this._name = name || "panel";
   };

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

   Panel.prototype.split = function (panel, position) {
      this._parent.split_child(this, panel, position);
   };

   Panel.prototype.swap = function (panel) {
      var my_parent = this.parent();
      var your_parent = panel.parent();

      var tmp = new_tmp_panel();

      my_parent.replace_child(this, tmp);
      your_parent.replace_child(panel, this);
      my_parent.replace_child(tmp, panel);
   };

   Panel.prototype.render = function () {
      throw new Error("Not implemented error: The 'render' method of '"+this+"' was not implemented!. It should be to render something meaningful in the box '"+this.box+"'.");
   };

   Panel.prototype.toString = function () {
      return "[panel ("+this._name.slice(0,8)+") Panel]";
   };

   Panel.prototype.remove = function () {
      this._parent.remove_child(this);
   };

   Panel.prototype.name = function (name) {
      if(name !== null && name !== undefined) {
         this._name = "" + name;
      }

      return this._name;
   };

   Panel.prototype.menu = function () {
      var myself = this;
      return [
      {
         header: this.toString()
      },
      {
         text: 'remove',
         action: function(e){
            e.preventDefault();
            myself.remove();
         }
      }
      ]
   };

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

   Panel.prototype.unlink = function () {
      throw new Error("Not implemented error: The 'unlink' method of '"+this+"' was not implemented!. It should unlink its stuff from the DOM. This no necessary means to remove-and-delete any element, you just need to remove it from the DOM.");
   };

   var Parent = function () { //TODO, se podria obviar usar el prototipo de Parent y usar una unica instancia de Parent (como se hace con NullParent)
   };

   // NullParent --> Parent --> Panel
   Parent.prototype.__proto__ = Panel.prototype;
   NullParent.__proto__ = Parent.prototype;

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

   // Placeholder, see splitted.js
   Parent.prototype.split_child = function () { throw new Error("Not loaded"); };

   // Placeholder, see root.js
   Panel.prototype.attach = function () { throw new Error("Not loaded"); };

   return {
      NullParent: NullParent,
      as_tree: as_tree,
      Panel: Panel,
      new_tmp_panel: new_tmp_panel,
      Parent: Parent
   };
});
