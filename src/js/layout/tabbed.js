define(['jquery', 'layout/panel'], function ($, P) {
   var NullParent = P.NullParent;
   var Parent = P.Parent;

   var Tabbed = function () {
      this._parent = NullParent;

      var id = ("" + Math.random()).slice(2);

      this._name = id;
      this._$container = $('<div id="'+id+'"></div>');
      this._$headers = $('<ul class="panel_tabbed"></ul>');
      this._tabs = [];

      this._$container.data("panel", this); //XXX

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
         connectWith: ".panel_tabbed", // all the lists 'ul' will be able to share its tabs using a drag and drop feature
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

            // with this, the helper tab is attached to the body and can be moved
            // around the page.
            // this alse require to fix its position (the point of reference is the 
            // 'body' now)
            var offset = ui.helper.offset(); 
            ui.helper.appendTo(document.body);
            ui.helper.offset(offset);
            tabs.find( ".ui-tabs-nav" ).sortable( "refreshPositions" );
         },
         sort: function(ev, ui) {
            $headers.scrollTop(0); // fix this bug: the headers (tabs) are moved to the top of the container which is ugly
            $(ui.helper).scrollTop(0); // fix this bug: the helper (the tab dragged) is moved to the top, again, ugly
         },
         beforeStop: function(ev, ui) {
            // now, we restore the correct position of the helper tab, attaching it to
            // its container (we are using the ui.placeholder 'dummy' tab to mark the
            // correct position between all the tabs of the container).
            ui.helper.insertBefore(ui.placeholder);
         },
         stop: function(ev, ui) {
            $headers.scrollTop(0); //fix a bug
         },
         receive: function (ev, ui) {
            //This will be called only if one tab is dragged form one Tabbed
            //and dropped to other Tabbed.


            //First, mark the final position of the tab
            var marker = $('<li></li>');
            marker.insertBefore(ui.item);

            //Then, the 'beforeStop' put the tab in the destination, 
            //we need to rollback that movement.
            ui.item.appendTo(ui.sender);

            //lookup for the Tabbed sender (the old owener of the tab)
            var sender_tabbed = ui.sender.parent().data('panel');

            //get the panel to be moved
            //XXX this is the only code that assume that the 'sender' object
            //is a Tabbed. Changing this, will enable us to drag and drop other
            //objects between Tabbeds and non-Tabbeds.
            var tab_id = ui.item.children('a')[0].href.split(/#/).slice(1).join("#")
            var panel = sender_tabbed.get_panel(tab_id);

            //move the tab with the high-level "Tabbed" interface
            //(this will put the new tab at the end)
            //with this, "ui.item" is not valid any more
            sender_tabbed.remove_child(panel);
            self.add_child(panel, 'intab');

            //update the position of the tab to its real position (drop)
            var tab = $headers.children('li').last();
            tab.insertBefore(marker);
            marker.remove();

            //Finally, update both Tabbeds
            sender_tabbed.render();
            self.render();
         }
      });

      tabs.disableSelection();

      this._$headers.css({
          'list-style-type':'none',
          'white-space':'nowrap',
          'overflow-x':'auto',
          'overflow-y': 'hidden',
       });

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

   Tabbed.prototype.get_panel = function (tab_id) {
      for (var i = 0; i < this._tabs.length; ++i) {
         var tab = this._tabs[i];
         if (tab.id === tab_id) {
            return tab.panel;
         }
      }

      return null;
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
      $('#' + tab.id).remove();

      this._tabs.splice(index, 1);

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
   
   Tabbed.prototype.toString = function () {
      return "[tabs ("+this._name.slice(0,6)+") Tabbed]";
   };

   Tabbed.prototype.render = function () {
      if (this._$out_of_dom) {   //XXX ver esta parte junto con unlink. Puede que sea un patron reutilizable.
         this._$out_of_dom.appendTo(this.box);
         this._$out_of_dom = null;
      }

      var box = this.box;

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
      Tabbed: Tabbed
   };
});

