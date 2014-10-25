define(['jquery'], function ($) {
   var Docks = function (w, h, sides) {

      var w = w || 120;
      var h = h || 40;

      var id = ("" + Math.random()).slice(2);
      this._id = id;

      // TODO ponerlos ocultos por default
      this._$container = $('<ul class="panel_tabbed"></ul>');
      var _top =    $('<div style="height: '+h+'px; width: '+w+'px;" class="K'+id+' dock_side"></div>');
      var _bottom = $('<div style="height: '+h+'px; width: '+w+'px;" class="K'+id+' dock_side"></div>');
      var _left =   $('<div style="width: '+h+'px; height: '+w+'px;" class="K'+id+' dock_side"></div>');
      var _right =  $('<div style="width: '+h+'px; height: '+w+'px;" class="K'+id+' dock_side"></div>');
//      var _center = $('<div style="height: '+h+'px; width: '+w+'px;" class="K'+id+' dock_side"></div>');

      var _div_in = {
         "top":    _top,
         "bottom": _bottom,
         "left":   _left,
         "right":  _right,
//         "center":  _center
      };

      var _posconfig_of = {
         "top":    "center top",
         "bottom": "center bottom",
         "left":   "left center",
         "right":  "right center",
//         "center":  "center center",
      };

      this._div_in = _div_in;
      this._posconfig_of = _posconfig_of;
      this._$out_of_dom = this._$container;

      var self = this;
      self._panel_target = null;
         
      for (position in this._div_in) {
         this._div_in[position].appendTo(this._$container);
         this._div_in[position].droppable((function (position) { return {
            accept: ".tab_in_panel_tabbed",
            hoverClass: "ui-state-active",
            drop: function (ev, ui) {
               //borrow from layout/tabbed.js
               var tab_id = ui.draggable.children('a')[0].href.split(/#/).slice(1).join("#");
               var sender_tabbed = $("#"+ui.draggable.attr("from_panel_tabbed")).data("panel");
               var panel = sender_tabbed.get_panel(tab_id);
               
               setTimeout(function () {
                  if(!self._panel_target) {
                     return;
                  }

                  // XXX Experimental Hack! 
                  // To avoid collisions, the 'sorting' must be cancelled before
                  // that we can change the layout: split and move the panels.
                  // However this call ('cancel') will disable all the sorting after
                  // its invokation (bug maybe?).
                  // The fix was to set this stuff in another event in the future.
                  // But again, this is not a fix, is more like a hack.
                  // For example, the jquery-ui shows this error in the console:
                  //    Uncaught TypeError: Cannot read property '0' of null", 
                  //    source: file:///.../jquery-ui-1.11.1.js (5549)
                  $("#"+ui.draggable.attr("from_panel_tabbed")).find( ".ui-tabs-nav" ).sortable('cancel');

                  panel.remove();
                  sender_tabbed.render();

                  var T = requirejs("layout/tabbed").Tabbed;
                  var new_tabs = new T();
                  new_tabs.add_child(panel, 'intab');

                  self._panel_target.split(new_tabs, position);
                  self._panel_target.parent().parent().parent().render();
               }, 1);
            }
         }; })(position) );
      }
   };


   Docks.prototype.render = function ($target) {
      if (this._$out_of_dom) {
         this._$out_of_dom.appendTo($('body'));
         this._$out_of_dom = null;
      }

      for (position in this._posconfig_of) {
         position_config = this._posconfig_of[position];
         if (position === 'top') {
            at = "center top";
            $(this._div_in[position]).position({
               of: $target,
               my: position_config,
               at: at,
               collision: "none"
            });
         }
         else {
            $(this._div_in[position]).position({
               of: $target,
               my: position_config,
               at: position_config,
               collision: "none"
            });
         }
      }
   };

   Docks.prototype.unlink = function () {
      if (!this._$out_of_dom) {
         this._$out_of_dom = this._$container.detach();
      }
   };

   return {
      Docks: Docks,
   }
});

