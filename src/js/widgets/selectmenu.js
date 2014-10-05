define(['jquery', 'jqueryui'], function ($, _) {
   var SelectMenu = function (options, selected, config) {
      this._name = ("" + Math.random()).slice(2);
      this._config = config;

      this._select = $('<select id="'+this._name+'"></select>');
      this._$out_of_dom = this._select;

      this.update_options(options, selected);
   };

   SelectMenu.prototype.update_options = function (options, selected) {
      var select = this._select;
      select.empty();

      for(var i = 0;  i < options.length; i++) {
         var opt = options[i];

         var optgroup_name = opt.name;
         var optgroup_options = opt.options;

         // create (if required) a group of options
         if (optgroup_name) {
            var optgroup = $('<optgroup label="'+optgroup_name+'"></optgroup>');
            select.append(optgroup);
         }
         else {
            var optgroup = select;
         }

         // load de options
         for(var j = 0; j < optgroup_options.length; j++) {
            var option_label = optgroup_options[j];

            //TODO las option_label no son unicas!
            if (selected === option_label) {
               optgroup.append($('<option value="'+option_label+'" selected="selected">'+option_label+'</option>'));
            }
            else {
               optgroup.append($('<option value="'+option_label+'">'+option_label+'</option>'));
            }
         }
      }

      if (!this._$out_of_dom) {
         this._select.selectmenu("refresh");
         this.box.find("#"+this._name+"-button").css("width", ''); //fix a bug
      }
   };

   SelectMenu.prototype.render = function () {
      if (this._$out_of_dom) {
         this._$out_of_dom.appendTo($(this.box));
         this._select.selectmenu(this._config);
         this.box.find("#"+this._name+"-button").css("width", '');
         this._$out_of_dom = null;
      }
   };

   SelectMenu.prototype.unlink = function () {
      if (!this._$out_of_dom) {
         this._select.selectmenu('destroy');
         this._$out_of_dom = this._select.detach();
      }
   };

   return {
      SelectMenu: SelectMenu
   };

});
