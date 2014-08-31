define(['jquery', 'w2ui'], function ($, w2ui) {
   var NullParent = {};

   //NullParent.refresh = NullParent.refresh_child = function () {};
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

   Panel.prototype.attach = function (dom_parent_element) {
      if (this.parent() !== NullParent) {
         throw new Error("I can't attach me '"+this+"'because i have a parent '"+this._parent+"'.");
      }

      var root = new Root(dom_parent_element);
      root.add_child(this, 'main');
   };

   /*Panel.prototype.refresh = function () { //TODO rename 'refresh' to 'request_to_be_render'
      this._parent.refresh_child(this);
   };*/

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

      this._$anchor_element = $(dom_parent_element);

      this._name = ("" + Math.random()).slice(2);
      
      this._child = null;
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

   /*Root.prototype.refresh = function () {
      this._subpanel_layout.refresh();
   };*/

   /*Root.prototype.refresh_child = function (panel) {
      this._child.render(this._$anchor_element);   //TODO check if panel is child me
   };*/
   
   Root.prototype.toString = function () {
      return "[root ("+this._name.slice(0,6)+") Root]";
   };

   Root.prototype.render = function () {
      //XXX ignore $box
      this._child.box = this._$anchor_element;
      this._child.render(this._$anchor_element);
   };

   var Splitted = function (splitted_direction) {
      this._parent = NullParent;

      if(splitted_direction !== 'vertically' && splitted_direction !== 'horizontally') {
         throw new Error("Precondition: The split direction must be 'vertically' or 'horizontally', the direction '"+splitted_direction+"' was used.");
      }

      this._splitted_direction = splitted_direction;

      this._name = ("" + Math.random()).slice(2);
      
      var update_bar_and_split_for = function (position_name, dimension_name) {
         if (! ((position_name === 'left' && dimension_name === 'width') ||
                (position_name === 'top'  && dimension_name === 'height')) ) {
                   throw new Error("The position/dimension names are invalid. Accepted 'left-width' and 'top-height' but received '"+position_name+"-"+dimension_name+"'.");
                }

         var opposite_position_name = {
            left: 'right',
            top : 'bottom',
         }[position_name]

         return function (event, ui) {
            var $container = $(this).parent().parent();
            var new_bar_position = $(ui.helper).position();

            var container_position = $container.position();

            var rel_offset = (new_bar_position[position_name] - container_position[position_name]) / $container[dimension_name]();

            if(rel_offset < 0.0001 || rel_offset > 0.9999) {
               console.log("The bar is moving "+position_name+"--"+opposite_position_name+" too far: Bar new position " + new_bar_position[position_name] + " Container position " + container_position[position_name]);
            }
            else {
               var percentage = (rel_offset * 100);
               $container.children("."+position_name+"_panel_of_splitted")[dimension_name](percentage + "%");
               $container.children("."+opposite_position_name+"_side_panel_and_bar_of_splitted")[dimension_name]((100-percentage) + "%");
            }
         };
      };  

      var fix_for_dimension_at_start_bug_for = function (dimension_name) {
         if (! (dimension_name === 'width' || dimension_name === 'height') ) {
            throw new Error("Incorrect dimension name. Accepted width or height but received '"+dimension_name+"'.");
         }

         return function (event, ui) {
            var correct_value_at_start = $(this)[dimension_name]();
            $(ui.helper)[dimension_name](correct_value_at_start);
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
               stop: update_bar_and_split_for('left', 'width'),
               start: fix_for_dimension_at_start_bug_for('height')
            };
         }
         else {
            return { 
               axis: "y", 
               opacity: 0.7, 
               helper: "clone",
               stop: update_bar_and_split_for('top', 'height'),
               start: fix_for_dimension_at_start_bug_for('width')
            };
         }
      };

      if (this._splitted_direction === 'horizontally') {
         this._$container = $(
            '<div class="splitted_container">' +
               '<div class="top_panel_of_splitted"></div>' +
               '<div class="bottom_side_panel_and_bar_of_splitted">' +
                  '<div class="horizontal_bar_splitting"></div>' +
                  '<div class="bottom_panel_of_splitted"></div>' +
               '</div>' +
            '</div>');
         this._$container.find('.horizontal_bar_splitting').draggable(options_for_draggable_bar('horizontal'));
      }
      else {
         this._$container = $(
            '<div class="splitted_container">' +
               '<div class="left_panel_of_splitted"></div>' +
               '<div class="right_side_panel_and_bar_of_splitted">' +
                  '<div class="vertical_bar_splitting"></div>' +
                  '<div class="right_panel_of_splitted"></div>' +
               '</div>' +
            '</div>');
         this._$container.find('.vertical_bar_splitting').draggable(options_for_draggable_bar('vertical'));
      }

      this._children = {};

      this._$out_of_dom = this._$container;
   };


   Splitted.prototype.__proto__ = Parent.prototype;

   Splitted.prototype._get_class_for_child = function (position) {
      return '.'+position+'_panel_of_splitted';
   };

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

   /*Splitted.prototype.refresh = function () {
      this._subpanels_layout.refresh();
   };*/
   
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
            this._children[pos].box = this._$container.children(this._get_class_for_child(pos));
         }
         else {
            this._children[pos].box = this._$container.children('.'+pos+'_side_panel_and_bar_of_splitted').children(this._get_class_for_child(pos));
         }
         this._children[pos].render();
      }
   };

   Splitted.prototype.unlink = function () {
      if (!this._$out_of_dom) {
         this._$out_of_dom = this._$container.detach(); //"container" is "in_the_dom"
         //TODO unlink hay que unlinkear los  sub panels?
      }
   };

   var Tabbed = function () {
      this._parent = NullParent;

      var id = ("" + Math.random()).slice(2);

      this._name = id;
      this._$container = $('<div id="'+id+'"></div>');
      this._$headers = $('<ul></ul>');
      this._tabs = [];

      this._$container.append(this._$headers);
      this._active_on_next_refresh = null;

      var tabs = $(this._$container).tabs({
      });

      var $headers = this._$headers;
      var self = this;
      tabs.find( ".ui-tabs-nav" ).sortable({
         scroll: true,
         revert: 180,   // add an animation to move the dragged tab to its final position
         tolerance: "pointer",
         forcePlaceholderSize: true,
         start: function(ev, ui) {
            // fix: add those styles and append a dummy element so the placeholder
            // (a special tab used to mark the drop zone) can be positioned correctly
            var placeholder = $(ui.placeholder);
            placeholder.css('display', 'inline');
            placeholder.css('float', 'none');
            var txt = ui.helper[0].firstChild.text;
            placeholder.append($('<a class="ui-tabs-anchor" style="float: none; visibility: hidden;">'+ txt +'</a>'));

            // add more style to the placeholder. DON'T USE the 'placeholder' option of 'sortable'.
            placeholder.addClass('ui-state-highlight');
            placeholder.css({
               'visibility': 'visible',
               'border-style': 'solid',
               'border-width': '3px',
               'border-bottom-style': 'none',
               'background-color': 'transparent', //TODO esto podria cambiarse
               'background-image': 'none',
            });

         },
         sort: function(ev, ui) {
            $headers.scrollTop(0); // fix this bug: the headers (tabs) are moved to the top of the container which is ugly
            $(ui.helper).scrollTop(0); // fix this bug: the helper (the tab dragged) is moved to the top, again, ugly
         },
         stop: function() {
            $headers.scrollTop(0); //fix a bug
         }
      });

      tabs.disableSelection();

      this._$headers.css({
          'list-style-type':'none',
          'white-space':'nowrap',
          'overflow-x':'auto',
          'overflow-y': 'hidden',
       });


      //console.log("Init: " + $(this._$container).tabs("instance"));
      this._$out_of_dom = this._$container;
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

      tab.header = $('<li style="display: inline; float: none;"><a style="float: none;" id="header_'+tab.id+'" href="#'+tab.id+'">'+(panel.name()||"tab")+'</a></li>');
      tab.container = $('<div id="'+tab.id+'"></div>');

      this._$headers.append(tab.header);
      this._$container.append(tab.container);
      this._tabs.push(tab);
   };

   /* refresh related
   Tabbed.prototype.add_child = function (panel, position) {
      var result = Tabbed.prototype.__proto__.add_child.apply(this, [panel, position]);
      this.refresh();
      return result;
   };
   */

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

   /*
    * refresh related
   Tabbed.prototype.remove_child = function (panel) {
      var result = Tabbed.prototype.__proto__.remove_child.apply(this, [panel]);
      this.refresh();
      return result;
   };
   */


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
   
   /* refresh related
   Tabbed.prototype.replace_child = function (panel, other_panel) {
      var result = Tabbed.prototype.__proto__.replace_child.apply(this, [panel, other_panel]);
      this.refresh();
      return result;
   };
   */

   /*
   Tabbed.prototype.refresh = function () {
      this._parent.refresh();
   };
   */
   
   Tabbed.prototype.toString = function () {
      return "[tabs ("+this._name.slice(0,6)+") Tabbed]";
   };

   Tabbed.prototype.render = function () {
      if (this._$out_of_dom) {   //XXX ver esta parte junto con unlink. Puede que sea un patron reutilizable.
         this._$out_of_dom.appendTo(this.box);
         this._$out_of_dom = null;
      }

      var box = this.box;

      //console.log("Init: " + $(this._$container).tabs("instance"));
      
      // TODO que pasa si no hay tabs para mostrar???
      /*if ($('#' + this._name).length === 0) {
         $(box).contents().remove();
         $(box).append(this._$container);
         $('#' + this._name).tabs({
            overflowTabs: true
         });
      }*/

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

   Tabbed.prototype.unlink = function () {
      if (!this._$out_of_dom) {
         this._$out_of_dom = this._$container.detach(); //"container" is "in_the_dom"
         //TODO unlink hay que unlinkear los  sub panels?
      }
   };

   return {
      Panel: Panel,
      Tabbed: Tabbed,
      as_tree: as_tree
   };
});
