define(["jquery", "underscore"], function ($, _) {
   /*
                       the buffer (elements in the DOM)
                      /---------------------------------\
                     /  /-- buffer_position              \
                     | /      /-- current_scroll_top     |
                     |/       |     view_height          |
         0px         V        V/-------------------/     V
         .. .. .. .. |--------|--------------------|-----|.. .. .. .. ..
         :  white    | hi     |                    |hi   |    white    :
         :   top     |   dd   |      visible       | dd  |    bottom   :
         :  space    |     en |                    |   en|    space    :
         .. .. .. .. |--------|--------------------|-----|.. .. .. .. ..
         \           \------------------------------------\             \
          \                      buffer_height                           \
           \--------------------------------------------------------------\
                                    virtual_height
   */
         
   var ListView = function () {
      this.view_height = 300;
      this.buffer_height_factor = 1.3;
      this.recalculate_heights_on_resize = true;

      if (this.buffer_height_factor < 1) {
         throw new Error("The buffer height factor must be greater than 1 ("+this.buffer_height_factor+" was found).");
      }

      this.buffer_position = 0;
      this.current_scroll_top = 0;
      this.virtual_height = 0;

      this.data = [];
      this.dom_elements = [];
      this.filtered = [];
      this.filter_func = null;

      //var common_style = "border: 1px solid black; margin: 0px; padding: 0px;";
      var common_style = "border: 0px; margin: 0px; padding: 0px;";
      
      this.$buffer = $('<div style="'+common_style+'"></div>');
      this.$white_top_space = $('<div style="'+common_style+' height: 0px"></div>');
      this.$white_bottom_space = $('<div style="'+common_style+' height: 0px"></div>');

      this.if_at_bottom_stay_there = false;
   };

   ListView.prototype.autoscroll = function (enable) {
      this.if_at_bottom_stay_there = !!enable;
   };

   ListView.prototype.attach = function (dom_element) {
      if (this.$container) {
         throw new Error("Already attached!");
      }

      this.$container = $(dom_element);
      this.$white_top_space.appendTo(this.$container);
      this.$buffer.appendTo(this.$container);
      this.$white_bottom_space.appendTo(this.$container);

      this.notify_resize();

      var self = this;
      this.onScroll = _.throttle(function () { self.notify_scroll(); }, 100, {leading: false});
      this.onResize = _.throttle(function () { self.notify_resize(); }, 100, {leading: false});
      this.$container.on('scroll', this.onScroll);
      $(window).on('resize', this.onResize);
   };

   ListView.prototype.detach = function () {
      if (!this.$container) {
         throw new Error("No attached!");
      }

      $(window).off('resize', this.onResize);
      this.$container.off('scroll', this.onScroll);
      this.$white_bottom_space.detach();
      this.$buffer.detach();
      this.$white_top_space.detach();

      this.$container = this.onScroll = this.onResize = undefined;
   };

   ListView.prototype.push = function (dom_element, height) {
      if (!height) {
         var tmp = $(dom_element)
         tmp.appendTo(this.$white_bottom_space);
         height = tmp.outerHeight(true);

         tmp.detach();
      }
   
      if (!height || height <= 0) {
         throw new Error("Invalid height for the dom element "+dom_element+": "+height+"");
      }
      
      var force_to_be_at_bottom = false;
      if (this.if_at_bottom_stay_there && this._is_at_bottom()) {
         force_to_be_at_bottom = true;
      }

      var position_of_new_element = this.virtual_height;

      if (this.filter_func !== null) {
         var index_of_the_new_element = this.filtered.length + this.dom_elements.length;
         var pass = this.filter_func(dom_element, index_of_the_new_element);

         if (!pass) {
            this.filtered.push({
                     original_index: index_of_the_new_element, 
                     top: position_of_new_element, 
                     height: height, 
                     dom_element: dom_element
            });

            return;  // done, we don't need to update the buffer or the view
         }
      }

      this.data.push({top: position_of_new_element});
      this.dom_elements.push(dom_element);
      this.virtual_height += height;

      if (force_to_be_at_bottom) { 
         var new_scroll_top = Math.max(this.virtual_height-this.view_height, 0);
         this.current_scroll_top = new_scroll_top;
         this._update_buffer_and_white_space(new_scroll_top);
         this.$container.scrollTop(new_scroll_top);
      }
      else {
         if (this._is_position_in_buffer(position_of_new_element)) {
            this._update_buffer_and_white_space(Math.max(this.current_scroll_top, 0));
         }
         else {
            this._update_white_space();
         }
      }

   };

   ListView.prototype._update_buffer = function (scrollTop) {
      if (this.data.length === 0) {
         return;
      }
      
      this.current_scroll_top = scrollTop;

      var result = this._get_element_and_index(Math.max(scrollTop-(this.get_extra_height_in_buffer()/2), 0), true);
      
      var roof_element       = result.element;
      var roof_element_index = result.index;
      this.buffer_position = roof_element.top;

      var result = this._get_element_and_index(Math.min(this.buffer_position+this.get_buffer_height()-(this.get_extra_height_in_buffer()/2), this.virtual_height), false);

      var floor_element       = result.element;
      var floor_element_index = result.index;

      var new_elements_in_buffer = this.dom_elements.slice(roof_element_index, floor_element_index+1);
      this.$buffer.children().detach();
      this.$buffer.append(new_elements_in_buffer);
   };

   ListView.prototype._recalculate_heights = function () {
      if (this.data.length === 0) {
         return;
      }
      
      var force_to_be_at_bottom = false;
      if (this.if_at_bottom_stay_there && this._is_at_bottom()) {
         force_to_be_at_bottom = true;
      }

      var result = this._get_element_and_index(Math.max(this.current_scroll_top, 0), true);
      var roof_element_index = result.index;

      var offset = 0;
      for (var i = 0; i < this.dom_elements.length; i+=30) {
         var j = Math.min(i + 30, this.dom_elements.length);
      
         var new_elements_in_buffer = this.dom_elements.slice(i, j);
         this.$buffer.children().detach();
         this.$buffer.append(new_elements_in_buffer);

         for (var k = i; k < j; k++) { 
            this.data[k].top = offset;

            offset += this.dom_elements[k].outerHeight(true);
         }
      }

      this.$buffer.children().detach();
      this.virtual_height = offset;
      this.view_height = this.$container.height();

      this.current_scroll_top = Math.max(Math.min(this.data[roof_element_index].top, this.virtual_height-this.view_height), 0);
      
      this._update_buffer_and_white_space(this.current_scroll_top);
      
      if (force_to_be_at_bottom) { 
         var new_scroll_top = Math.max(this.virtual_height-this.view_height, 0);
         this.current_scroll_top = new_scroll_top;
         this._update_buffer_and_white_space(new_scroll_top);
         this.$container.scrollTop(new_scroll_top);
      }
      else {
         this.$container.scrollTop(this.current_scroll_top);
      }
   };

   ListView.prototype._is_at_bottom = function () {
      var tol = 2;
      return (this.virtual_height <= this.view_height) || (Math.max(this.current_scroll_top, 0) + this.view_height) >= (this.virtual_height - tol);
   };

   ListView.prototype._update_white_space = function () {
      this.$white_top_space.height(this.buffer_position);
      this.$white_bottom_space.height(Math.max(this.virtual_height-this.buffer_position-this.get_buffer_height(), 0));
   };

   ListView.prototype._update_buffer_and_white_space = function (scrollTop) {
      this._update_buffer(scrollTop);
      this._update_white_space();
   };

   ListView.prototype.notify_resize = function () {
      if (this.recalculate_heights_on_resize) {
         this._recalculate_heights();
      }
      else {
         this.view_height = this.$container.height();
         this._update_buffer_and_white_space(Math.max(this.current_scroll_top, 0));
      }
   };


   ListView.prototype.notify_scroll = function () {
      var new_scroll_top = this.$container.scrollTop();

      if (this.buffer_position <= new_scroll_top && (new_scroll_top+this.view_height) < this.buffer_position+this.get_buffer_height()) {
         // ok, still inside the buffer
         this.current_scroll_top = new_scroll_top;
      }
      else {
         this._update_buffer_and_white_space(new_scroll_top);
      }
   };

   ListView.prototype._is_position_in_buffer = function (position) {
      return (this.buffer_position <= position && position <= this.buffer_position+this.get_buffer_height());
   };

   ListView.prototype._get_element_and_index = function (position, round_to_roof) {
      this.data.push({top: Number.POSITIVE_INFINITY});

      var left = 0;
      var right = this.data.length-2; // dont count the dummy node

      while (left <= right) {
         var middle = Math.floor((left+right) / 2);

         var found = this.data[middle];
         var next  = this.data[middle+1];

         if (found.top <= position && position < next.top) {
            this.data.pop();
            if (!round_to_roof && middle+1 < this.data.length) {
               found = next;
               middle = middle+1;
            }
            return {element: found, index: middle};
         }

         if (position < found.top) {
            right = middle-1;
         }
         else {
            left = middle+1;
         }
      }

      this.data.pop();
      throw new Error("None element was found in the position "+position+" (searched in "+this.data.length+" elements).");
   };

   ListView.prototype.filter = function (cb) {
      if (this.filtered) {
         this.quit_filter(true);
      }

      this.filter_func = cb;

      this.data.push({top: this.virtual_height});

      var current_scroll_top = Math.max(this.current_scroll_top, 0);
      var adjusted_scroll_top = false;
      var offset = 0;
   
      for (var i = 0; i < this.data.length-1; i++) {
         var pass = cb(this.dom_elements[i], i);
         var obj = this.data[i];
         var next = this.data[i+1];

         if (!adjusted_scroll_top && obj.top > current_scroll_top) {
            current_scroll_top -= offset;
            adjusted_scroll_top = true;
         }

         if (pass) {
            obj.top -= offset;
            continue;
         }

         var height = next.top - obj.top;
         offset += height;
         
         this.filtered.push({original_index: i, top: obj.top, height: height, dom_element: this.dom_elements[i]});
         this.data[i] = this.dom_elements[i] = null;
      }

      this.virtual_height -= offset;
      this.data.pop();

      this.data = this.data.filter(function (v) { return v !== null; });
      this.dom_elements = this.dom_elements.filter(function (v) { return v !== null; });

      this._update_buffer_and_white_space(current_scroll_top);
      this.$container.scrollTop(current_scroll_top);
   };

   ListView.prototype.quit_filter = function (skip_update) {
      this.filter_func = null;
      this.filtered.push({original_index: this.data.length+this.filtered.length-1});
      var offset = 0;
      var current_scroll_top = Math.max(this.current_scroll_top, 0);
      var adjusted_scroll_top = false;

      for (var i = 0; i < this.filtered.length-1; i++) {
         var obj = this.filtered[i];
         var next = this.filtered[i+1];

         this.data.splice(obj.original_index, 0, {top: obj.top});
         this.dom_elements.splice(obj.original_index, 0, obj.dom_element);

         offset += obj.height;

         for (var j = obj.original_index+1; j < next.original_index; j++) {
            if (!adjusted_scroll_top && current_scroll_top < this.data[j].top) {
               current_scroll_top += offset;
               adjusted_scroll_top = true;
            }

            this.data[j].top += offset;
         }
      }

      this.filtered = [];
      this.virtual_height += offset;

      if (!skip_update) {
         this._update_buffer_and_white_space(current_scroll_top);
         this.$container.scrollTop(current_scroll_top);
      }
   };

   ListView.prototype._show_coordinates_and_sizes = function () {
      console.log("BufPos: "+this.buffer_position+" BufHeight: "+this.get_buffer_height()+" View: "+this.view_height+" CurrScroll: "+this.current_scroll_top+" VHeight: "+this.virtual_height+"");
   };
   
   ListView.prototype.get_buffer_height = function () {
      return Math.floor(this.buffer_height_factor*this.view_height)+1;
   };

   ListView.prototype.get_extra_height_in_buffer = function () {
      return Math.floor((this.buffer_height_factor-1)*this.view_height);
   };

   return {ListView:ListView};
});
