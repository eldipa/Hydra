define(['jquery', 'w2ui'], function ($, w2ui) {
   var NullParent = {};

   NullParent.refresh = function () {};
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
      tmp.render = function () {};
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

   Panel.prototype.attach = function (dom_parent_element) {
      if (this.parent() !== NullParent) {
         throw new Error("I can't attach me '"+this+"'because i have a parent '"+this._parent+"'.");
      }

      var root = new Root(dom_parent_element);
      root.add_child(this, 'main');
   };

   Panel.prototype.refresh = function () {
      this._parent.refresh();
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
   }

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
      
      this._replace_child(my_panel, other_panel);
      other_panel.parent(this);
      my_panel.parent(NullParent);
   };

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

      splitted.add_child(e1, my_position); //TODO el problema aca es que esto (debido a la implementacion de w2layout) va a generar un refresh y un re-renderizado. Esto por cada add_child y swap lo que lo hace ineficiente en una construccion.
      splitted.add_child(e2, position);

      e1.swap(my_panel);
      e2.swap(panel);
   };

   var Root = function (dom_parent_element) {
      this._parent = NullParent;

      this._dom_el = $('<div style="width: 100%; height: 400px;"></div>');
      dom_parent_element.append(this._dom_el);

      this._name = ("" + Math.random()).slice(2);

      var pstyle = 'border: 2px solid #000000; padding: 0px;'; 
      this._subpanel_layout = $(this._dom_el).w2layout({
         name: this._name,
         panels: [
            {type: 'main', style: pstyle, content: ''}
         ]
      });
   };

   Root.prototype.__proto__ = Parent.prototype;

   Root.prototype._add_child = function (panel, position) {
      if (position !== 'main') {
         throw new Error("Precondition: Invalid position '"+position+"' of the panel '"+panel+"'. It should be 'main'.");
      }
      
      var previous = this._subpanel_layout.content('main');
      if(previous) {
         throw new Error("Precondition: The position '"+position+"' of the panel '"+panel+"' is already in use by the panel '"+previous+"'.");
      }

      this._subpanel_layout.content('main', panel);
   };

   Root.prototype._remove_child = function (panel) {
      var previous = this._subpanel_layout.content('main');
      if(previous !== panel) {
         throw new Error("Inconsistency: The previous panel '"+previous+"' is not '"+panel+"'.");
      }

      delete panel.box;

      this._parent.remove_child(this);
      
      $(this._dom_el).remove();
      this._subpanel_layout.content('main', '');
   };
   
   Root.prototype._replace_child = function (panel, other_panel) {
      var previous = this._subpanel_layout.content('main');
      if(previous !== panel) {
         throw new Error("Inconsistency: I can't replace a panel '"+panel+"' that i can't find.");
      }

      this._subpanel_layout.content('main', other_panel);
   };

   Root.prototype.refresh = function () {
      this._subpanel_layout.refresh();
   };
   
   Root.prototype.toString = function () {
      return "[root ("+this._name.slice(0,6)+") Root]";
   };

   Root.prototype.render = function () {
      this._subpanel_layout.render(this.box);
   };

   var Splitted = function (splitted_direction) {
      this._parent = NullParent;

      if(splitted_direction !== 'vertically' && splitted_direction !== 'horizontally') {
         throw new Error("Precondition: The split direction must be 'vertically' or 'horizontally', the direction '"+splitted_direction+"' was used.");
      }

      this._splitted_direction = splitted_direction;

      this._name = ("" + Math.random()).slice(2);
      var pstyle = 'border: 1px none #0000ef; padding: 0px;'; 

      this._common_style_for_all_positions = pstyle;
      this._extra_style_per_position = {
         'top':      'border-bottom-style: solid;',
         'bottom':   'border-top-style: solid;',
         'left':     'border-right-style: solid;',
         'right':    'border-left-style: solid;',
      };

      if(this._splitted_direction === 'vertically') {
         this._main_position_is_mapping_to = 'right';
         this._subpanels_layout = $().w2layout({ 
            name: this._name,
            padding: 3,
            panels: [
               {type: 'main', style: pstyle + this._extra_style_per_position['right'], content: ''},
               {type: 'left', style: pstyle + this._extra_style_per_position['left'], size: '50%', resizable: true, content: ''},
            ]
         });
      }
      else {
         this._main_position_is_mapping_to = 'bottom';
         this._subpanels_layout = $().w2layout({ 
            name: this._name,
            padding: 3,
            panels: [
               {type: 'main', style: pstyle + this._extra_style_per_position['bottom'], content: ''},
               {type: 'top', style: pstyle + this._extra_style_per_position['top'], size: '50%', resizable: true, content: ''}
            ]
         });
      }
   };

   Splitted.prototype.__proto__ = Parent.prototype;

   Splitted.prototype.menu = function () {
      return [
      {
         header: this.toString()
      },
      {
         text: 'split hello',
         action: function(e){
            e.preventDefault();
            alert('split hello');
         }
      }
      ]
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

      var real_position = position;
      if (position === 'right' || position === 'bottom') {
         real_position = 'main';
      }

      var previous = this._subpanels_layout.content(real_position);
      if(previous) {
         throw new Error("Precondition: The position '"+position+"' of the panel '"+panel+"' is already in use by the panel '"+previous+"'.");
      }

      this._subpanels_layout.content(real_position, panel);
   };

   Splitted.prototype._remove_child = function (panel) {
      var position = null;
      var the_other_position = null;
      var positions = {'top':0, 'left':0, 'main':0};
      for (var pos in positions) {
         if (this._subpanels_layout.content(pos) === panel) {
            position = pos;
         }
         else if (this._subpanels_layout.content(pos)) {
            the_other_position = pos;
         }
      }

      if(position === null) {
         throw new Error("Inconsistency: I can't remove a panel '"+panel+"' that i can't find.");
      }

      if(the_other_position === null) {
         throw new Error("Inconsistency: I found the panel '"+panel+"' to be removed but i can't find the other panel!");
      }

      var the_other_panel = this._subpanels_layout.content(the_other_position);

      var tmp = new_tmp_panel();
      this.swap(tmp);
      tmp.swap(the_other_panel);

      this._parent.remove_child(this);
      
      this._subpanels_layout.content(position, '');
      this._subpanels_layout.content(the_other_position, '');
   };

   Splitted.prototype._replace_child = function (panel, other_panel) {
      var position = null;
      var positions = {'top':0, 'left':0, 'main':0};
      for (var pos in positions) {
         if (this._subpanels_layout.content(pos) === panel) {
            position = pos;
            break;
         }
      }

      if(position === null) {
         throw new Error("Inconsistency: I can't replace a panel '"+panel+"' that i can't find.");
      }

      this._subpanels_layout.content(position, other_panel);
   };

   Splitted.prototype.refresh = function () {
      this._subpanels_layout.refresh();
   };
   
   Splitted.prototype.toString = function () {
      return "[split "+this._splitted_direction+" ("+this._name.slice(0,6)+") Splitted]";
   };
   
   Splitted.prototype.render = function () {
      $(this.box).data('controller', this);
      this._subpanels_layout.render(this.box);
   };

   var Tabbed = function () {
      this._parent = NullParent;

      var id = ("" + Math.random()).slice(2);

      this._name = id;
      this._$tabs_handler = $('<div id="'+id+'"></div>');
      this._headers = $('<ul class="nav nav-pills"></ul>');
      this._tabs = [];

      this._$tabs_handler.append(this._headers);
      this._active_on_next_refresh = null;
   };

   Tabbed.prototype.__proto__ = Parent.prototype;

   Tabbed.prototype._add_child = function (panel, position) {
      if(position !== 'intab') {
         throw new Error("Precondition: Invalid position '"+position+"' of the panel '"+panel+"'. It must be 'intab'.");
      }

      var tab = {
         id: ("" + Math.random()).slice(2),
         panel: panel
      };

      tab.header = $('<li><a id="header_'+tab.id+'" href="#'+tab.id+'">'+(panel.name()||"tab")+'</a></li>');
      tab.container = $('<div id="'+tab.id+'"></div>');

      this._headers.append(tab.header);
      this._$tabs_handler.append(tab.container);
      this._tabs.push(tab);
   };

   Tabbed.prototype.add_child = function (panel, position) {
      var result = Tabbed.prototype.__proto__.add_child.apply(this, [panel, position]);
      this.refresh();
      return result;
   }

   Tabbed.prototype._remove_child = function (panel) {
      var index = null;
      for (var i = 0; i < this._tabs.length; i++) {
         if (panel === this._tabs[i].panel) {
            index = i;
            break;
         }
      }

      if (index === null) {
         throw new Error("I can't remove a panel '"+panel+"' that i can't find ('"+this+"').");
      }

      var tab = this._tabs[index];
      
      $('#header_' + tab.id).parent().remove();
      $('#' + tab.id).remove();

      this._tabs.splice(index, 1);

      //TODO que pasa si no me quedan mas tabs? Debo destruir este objeto tambien.
      //y en ese caso:
      //this._parent.remove_child(this);
   };

   Tabbed.prototype.remove_child = function (panel) {
      var result = Tabbed.prototype.__proto__.remove_child.apply(this, [panel]);
      this.refresh();
      return result;
   }


   Tabbed.prototype._replace_child = function (panel, other_panel) {
      var index = null;
      for (var i = 0; i < this._tabs.length; i++) {
         if (panel === this._tabs[i].panel) {
            index = i;
            break;
         }
      }

      if (index === null) {
         throw new Error("I can't replace a panel '"+panel+"' that i can't find ('"+this+"').");
      }

      this._tabs[index].panel = other_panel;
   };
   
   Tabbed.prototype.replace_child = function (panel, other_panel) {
      var result = Tabbed.prototype.__proto__.replace_child.apply(this, [panel, other_panel]);
      this.refresh();
      return result;
   }


   Tabbed.prototype.refresh = function () {
      this._parent.refresh();
   };
   
   Tabbed.prototype.toString = function () {
      return "[tabs ("+this._name.slice(0,6)+") Tabbed]";
   };

   Tabbed.prototype.render = function () {
      var box = this.box;

      // TODO que pasa si no hay tabs para mostrar???
      if ($('#' + this._name).length === 0) {
         $(box).contents().remove();
         $(box).append(this._$tabs_handler);
         $('#' + this._name).tabs({
            activate: function (ev, ui) {
               ui.oldTab.removeClass('active');
               ui.newTab.addClass('active');
            }
         });
      }

      for(var i = 0; i < this._tabs.length; i++) {
         var tab = this._tabs[i];
         tab.panel.box = $('#' + tab.id);
         tab.panel.render();

         $('#header_' + tab.id).text(tab.panel.name() || "tab");
      }

      if(this._active_on_next_refresh !== null) {
         $('#' + this._name).tabs({active: this._active_on_next_refresh});
         this._active_on_next_refresh = null;
      }
      $('#' + this._name).tabs( "refresh" );

   };

   Tabbed.prototype.split_child = function (my_panel, panel, position) {
      this._parent.split_child(this, panel, position);
   };

   Tabbed.prototype.display = function(tab_index) {
      this._active_on_next_refresh = tab_index;
   };

   return {
      Panel: Panel,
      Tabbed: Tabbed,
      as_tree: as_tree
   };
});
