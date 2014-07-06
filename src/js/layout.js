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

   var Panel = function () {
   };

   Panel.prototype.position = function () {
      return this._position;
   };

   Panel.prototype.parent = function (new_parent, new_position) {
      if (new_parent) {
         if (!new_position) {
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


   var Root = function (dom_parent_element) {
      this._dom_el = $('<div style="width: 100%; height: 400px;"></div>');
      dom_parent_element.append(this._dom_el);

      this._full = false;
      this._name = ("" + Math.random()).slice(2);
      this._subpanel_layout = $(this._dom_el).w2layout({
         name: this._name,
         panels: [
            {type: 'main', content: ''}
         ]
      });
   };

   Root.prototype.prototype = Panel.prototype;

   Root.prototype.put = function (panel, position) {
      //TODO any position is valid?
      this._subpanel_layout.content('main', panel);
   };

   var Splitted = function () {
      this._splitted_direction = null;
      this._main_position_is_mapping_to = null;
      this._full = false;

      this._name = ("" + Math.random()).slice(2);
      this._subpanels_layout = $().w2layout({
         name: this._name,
         panels: [
            {type: 'main', content: ''}
         ]
      });
   };

   Splitted.prototype.prototype = Panel.prototype;

   Splitted.prototype.put = function (panel, position) {
      if(this._full) {
         throw new Error("You cannot put another panel. I'm full.");
      }

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
      }
      else {
         if(get_opposite_position(position) === this._main_position_is_mapping_to) {
            this._subpanels_layout.content(position, panel);
            this._full = true;
         }
         else {
            throw new Error("I'm splitted '"+this._splitted_direction+"' with my '"+this._main_position_is_mapping_to+"' side occupied. The new panel want to be in the wrong position '"+position+"'.");
         }
      }
   };


   var set_parent_child_relationship = function (parent, child, position) {
      var old = {};

      old.parent = child.parent();
      old.position = child.position();
      
      //TODO notificar al 'viejo' parent de que su 'hijo' se va con otro.
      //y al mismo tiempo, que el nuevo parent tiene un 'hijo' nuevo (potencialmente
      //reemplazando a otro:
      //
      //break_parent_to_child_relationship(parent, position);
      //break_child_to_parent_relationship(child);

      parent.put(child, position);
      child.parent(parent, position);
      
      return old;
   };

   
   var panel_to_splitted_panel = function (panel, new_panel, where_put_new_panel) {
      var splitted = new Splitted();
      var where_put_old_panel = get_opposite_position(where_put_old_panel);

      set_parent_child_relationship(this, splitted, panel.position());
      set_parent_child_relationship(splitted, new_panel, where_put_new_panel);
      set_parent_child_relationship(splitted, panel, where_put_old_panel);
   };

   var panel_to_tabbed_panel = function (panel, new_panel) {
      var tabbed = new Tabbed();

      set_parent_child_relationship(this, tabbed, panel.position());
      set_parent_child_relationship(tabbed, panel, 'first');
      set_parent_child_relationship(tabbed, new_panel, 'last');

      tabbed.on_front(new_panel);
   };


   return {
      Root: Root,
      Panel: Panel
   };
});
