define(['jquery', 'w2ui'], function ($, w2ui) {
   /*
   var get_opposite_position = function (position) {
      var opposite_position = null;
      switch(position) {
         case 'left':
            opposite_position = 'right';
            break;
         case 'right':
            opposite_position = 'left';
            break;
         case 'top':
            opposite_position = 'bottom';
            break;
         case 'bottom':
            opposite_position = 'top';
            break;
         default:
            throw new Error("Unknow position '"+position+"'. Should be left/right/top/bottom.");
      };

      return opposite_position;
   };
   
   var set_parent_child_relationship = function (parent, child, position) {
      var old = {};

      old.parent = child.parent();
      old.position = child.position();

      parent.put(child, position);
      child.parent(parent, position);
      
      return old;
   };

   

   var NullParent = {};
   var Panel = function () {
      this._parent = NullParent;
   };

   Panel.prototype.position = function () {
      return this._position;
   };

   Panel.prototype.parent = function (new_parent, new_position) {
      if (new_parent) {
         if (new_parent !== NullParent && !new_position) {
            throw new Error("Empty new-position.");
         }

         this._parent = new_parent;
         this._position = new_position;
      }

      return this._parent;
   };

   Panel.prototype.put = function (other_panel, position) {
      throw new Error("You cannot put another panel in me.");
   };

   Panel.prototype.refresh = function () {
      this._parent.refresh();
   };

   Panel.prototype.split = function (new_panel, where_put_new_panel) {
      if (this._parent.is_tabbed()) {
         new_panel.remove();
         panel_to_splitted_panel(this._parent, new_panel, where_put_new_panel);
      }
      else {
         new_panel.remove();
         panel_to_splitted_panel(this, new_panel, where_put_new_panel);
      }
   };

   Panel.prototype.swap = function (other_panel) {
      swap_panels(this, other_panel);
   };

   Panel.prototype.remove = function () {
      this._parent.remove_me(this);

      this._parent = NullParent;
      delete this._position;
   };

   Panel.prototype.is_attached = function () {
      return this._parent.is_attached();
   };
   
   Panel.prototype.push = function (new_panel) {
      new_panel.remove();
      panel_to_tabbed_panel(this, new_panel);
   };


   NullParent.prototype = Panel.prototype;
   NullParent.refresh = NullParent.remove_me = NullParent.put = NullParent.replace_panel = function () {};
   NullParent.is_attached = NullParent.is_tabbed = function () { return false; };

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

   Root.prototype.__proto__ = Panel.prototype;
   Root.prototype.is_tabbed = function () { return false; };

   Root.prototype.put = function (panel, position) {
      //TODO any position is valid?
      this._subpanel_layout.content('main', panel);
   };

   Root.prototype.refresh = function () {
      this._subpanel_layout.refresh();
   };

   Root.prototype.push = function (panel) {
      //TODO check if there is an other panel already?
      var child = this._subpanel_layout.content('main');
      if (child) {
         child.remove();
      }

      set_parent_child_relationship(this, panel, 'main');
   };

   Root.prototype.render = function () {
      this._subpanel_layout.render(this.box);
   };

   Root.prototype.replace_panel = function (panel, other_panel) {
      if (panel.parent() !== this) {
         throw new Error("I can't replace a panel that isn't my.");
      }

      this._subpanel_layout.content('main', other_panel);
   };

   Root.prototype.remove_me = function (panel) {
      if (panel.parent() !== this) {
         throw new Error("I can't replace a panel that isn't my.");
      }
      
      this._subpanel_layout.content('main', '');
   };

   Root.prototype.is_attached = function () {
      return true;
   };

   var Splitted = function () {
      this._parent = NullParent;
      this._splitted_direction = null;
      this._main_position_is_mapping_to = null;

      this._name = ("" + Math.random()).slice(2);
      var pstyle = 'border: 1px none #0000ef; padding: 0px;'; 

      this._common_style_for_all_positions = pstyle;
      this._extra_style_per_position = {
         'top':      'border-bottom-style: solid;',
         'bottom':   'border-top-style: solid;',
         'left':     'border-right-style: solid;',
         'right':    'border-left-style: solid;',
      };

      this._subpanels_layout = $().w2layout({ 
         name: this._name,
         padding: 3,
         panels: [
            {type: 'main', style: pstyle, content: ''},
            {type: 'left', style: pstyle, size: '50%', resizable: true, hidden: true, content: ''},
            {type: 'right', style: pstyle, size: '50%', resizable: true, hidden: true, content: ''},
            {type: 'bottom', style: pstyle, size: '50%', resizable: true, hidden: true, content: ''},
            {type: 'top', style: pstyle, size: '50%', resizable: true, hidden: true, content: ''}
         ]
      });
   };

   Splitted.prototype.__proto__ = Panel.prototype;
   Splitted.prototype.is_tabbed = function () { return false; };

   Splitted.prototype.render = function () {
      this._subpanels_layout.render(this.box);
   };

   Splitted.prototype.put = function (panel, position) {
      if(!this._splitted_direction) {
         switch(position) {
            case 'left':
            case 'right':
               this._splitted_direction = "vertically";
               break;

            case 'top':
            case 'bottom':
               this._splitted_direction = "horizontally";
               break;

            default:
               throw new Error("Unexpected subpanel position '"+position+"'. Should be left/right/top/bottom.");
         };

         this._subpanels_layout.content('main', panel);
         this._main_position_is_mapping_to = position;

         this._subpanels_layout.set('main', {
            style: this._common_style_for_all_positions + " " + this._extra_style_per_position[position] 
         });
      }
      else {
         if(get_opposite_position(position) === this._main_position_is_mapping_to) {
            this._subpanels_layout.content(position, panel);
            this._subpanels_layout.show(position);
            
            this._subpanels_layout.set(position, {
               style: this._common_style_for_all_positions + " " + this._extra_style_per_position[position] 
            });
         }
         else if(position === this._main_position_is_mapping_to) {
            this._subpanels_layout.content('main', panel);

            this._subpanels_layout.set('main', {
               style: this._common_style_for_all_positions + " " + this._extra_style_per_position[position] 
            });
         }
         else {
            throw new Error("I'm splitted '"+this._splitted_direction+"' with my '"+this._main_position_is_mapping_to+"' side occupied. The new panel want to be in the wrong position '"+position+"'.");
         }
      }
   };

   Splitted.prototype.replace_panel = function (panel, other_panel) {
      if (panel.parent() !== this) {
         throw new Error("I can't replace a panel that isn't my.");
      }

      var position = panel.position();
      if(position === this._main_position_is_mapping_to) {
         this._subpanels_layout.content('main', other_panel);
      }
      else {
         this._subpanels_layout.content(position, other_panel);
      }
   };

   Splitted.prototype.remove_me = function (panel) {
      if (panel.parent() !== this) {
         throw new Error("I can't replace a panel that isn't my.");
      }

      var other_position = get_opposite_position(panel.position());
      var other_panel = null;
      if(this._main_position_is_mapping_to === other_position) {
         other_panel = this._subpanels_layout.content('main');
         this._subpanels_layout.content('main', '');
         this._subpanels_layout.content(panel.position, '');
      }
      else {
         other_panel = this._subpanels_layout.content(other_position);
         this._subpanels_layout.content(other_position, '');
         this._subpanels_layout.content('main', '');
      }

      var temporal = new Panel();
      temporal.render = function () {};

      this.swap(temporal);
      temporal.swap(other_panel);
   };


   var Tabbed = function () {
      this._parent = NullParent;

      var id = ("" + Math.random()).slice(2);

      this._id = id;
      this._tabs_handler = $('<div id="'+id+'"></div>');
      this._headers = $('<ul></ul>');
      this._tabs = [];

      this._tabs_handler.append(this._headers);
   };

   Tabbed.prototype.__proto__ = Panel.prototype;

   Tabbed.prototype.is_tabbed = function () {
      return true;
   };

   Tabbed.prototype.put = function (panel, position) {
      var tab = {
         id: ("" + Math.random()).slice(2),
         panel: panel
      };

      tab.header = $('<li><a href="#'+tab.id+'">AAA</a></li>');
      tab.container = $('<div id="'+tab.id+'"></div>');

      this._headers.append(tab.header);
      this._tabs_handler.append(tab.container);
      this._tabs.push(tab);
   };

   Tabbed.prototype.render = function () {
      var box = this.box;

      if ($('#' + this._id).length === 0 ) {
         $(box).contents().remove();
         $(box).append(this._tabs_handler);
      }

      for(var i = 0; i < this._tabs.length; i++) {
         var tab = this._tabs[i];
         tab.panel.box = $('#' + tab.id);
         tab.panel.render();
         //TODO update header
      }

      $('#' + this._id).tabs();
      $('#' + this._id).tabs( "refresh" );
   };

   Tabbed.prototype.on_front = function (panel) {
      if (panel.parent() !== this) {
         throw new Error("I can't put on front a panel that isn't my.");
      }
    
      //TODO  
   };
   
   Tabbed.prototype.replace_panel = function (panel, other_panel) {
      if (panel.parent() !== this) {
         throw new Error("I can't replace a panel that isn't my.");
      }

      var index = null;
      for (var i = 0; i < this._tabs.length; i++) {
         if (panel === this._tabs[i].panel) {
            index = i;
            break;
         }
      }

      if (index === null) {
         throw new Error("I can't replace a panel that i can't find.");
      }

      this._tabs[index].panel = other_panel; //TODO update title?
   };

   var panel_to_splitted_panel = function (panel, new_panel, where_put_new_panel) {
      var splitted = new Splitted();
      var where_put_old_panel = get_opposite_position(where_put_new_panel);
      var parent = panel.parent();
      var position = panel.position();

      set_parent_child_relationship(parent, splitted, position);
      set_parent_child_relationship(splitted, new_panel, where_put_new_panel);
      set_parent_child_relationship(splitted, panel, where_put_old_panel);

      if (splitted.parent() !== parent || splitted.position() !== position) {
         throw new Error("Inconsistent 1");
      }

      if (new_panel.parent() !== splitted || new_panel.position() !== where_put_new_panel) {
         throw new Error("Inconsistent 2");
      }

      if (panel.parent() !== splitted || panel.position() !== where_put_old_panel) {
         throw new Error("Inconsistent 3");
      }

   };

   var panel_to_tabbed_panel = function (panel, new_panel) {
      var parent = panel.parent();

      if (parent.is_tabbed() !== true) {
         var position = panel.position();
         var tabbed = new Tabbed();

         set_parent_child_relationship(parent, tabbed, position);
         set_parent_child_relationship(tabbed, panel, 'first');
      }
      else {
         var tabbed = parent;
      }

      set_parent_child_relationship(tabbed, new_panel, 'last');

      //tabbed.on_front(new_panel); TODO
   };

   var swap_panels = function (panel, other_panel) {
      var old = {
         parent: panel.parent(),
         position: panel.position()
      };

      var other_old = {
         parent: other_panel.parent(),
         position: other_panel.position()
      };
      
      old.parent.replace_panel(panel, other_panel);
      other_old.parent.replace_panel(other_panel, panel);

      panel.parent(other_old.parent, other_old.position);
      other_panel.parent(old.parent, old.position);
   };
   */

   /* --------- XXX --------- */

   var NullParent = {};

   NullParent.refresh = function () {};
   NullParent._add_child = NullParent._remove_child = NullParent._replace_child = function () {};
   NullParent.toString = function () {
      return "[NullParent]";
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
      this._subpanels_layout.render(this.box);
   };

   var Tabbed = function () {
      this._parent = NullParent;

      var id = ("" + Math.random()).slice(2);

      this._name = id;
      this._tabs_handler = $('<div id="'+id+'"></div>');
      this._headers = $('<ul></ul>');
      this._tabs = [];

      this._tabs_handler.append(this._headers);
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
      this._tabs_handler.append(tab.container);
      this._tabs.push(tab);
   };

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

      this._tabs.splice(index, 1);
      this._tabs_handler.splice(index, 1);

      //TODO que pasa si no me quedan mas tabs? Debo destruir este objeto tambien.
      //y en ese caso:
      //this._parent.remove_child(this);
   };

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

   Tabbed.prototype.refresh = function () {
      this._parent.refresh();
   };
   
   Tabbed.prototype.toString = function () {
      return "[tabs ("+this._name.slice(0,6)+") Tabbed]";
   };

   Tabbed.prototype.render = function () {
      var box = this.box;

      if ($('#' + this._name).length === 0 ) {
         $(box).contents().remove();
         $(box).append(this._tabs_handler);
      }

      for(var i = 0; i < this._tabs.length; i++) {
         var tab = this._tabs[i];
         tab.panel.box = $('#' + tab.id);
         tab.panel.render();

         $('#header_' + tab.id).text(tab.panel.name() || "tab");
      }

      $('#' + this._name).tabs();
      $('#' + this._name).tabs( "refresh" );
   };

   Tabbed.prototype.split_child = function (my_panel, panel, position) {
      this._parent.split_child(this, panel, position);
   };

   return {
      Panel: Panel,
      Tabbed: Tabbed
   };
});
