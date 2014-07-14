define(['jquery', 'w2ui'], function ($, w2ui) {
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
      new_panel.remove();
      panel_to_splitted_panel(this, new_panel, where_put_new_panel);
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


   return {
      Root: Root,
      Panel: Panel
   };
});
