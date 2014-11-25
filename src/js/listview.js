define(["jquery"], function ($) {
   /*
                       the buffer (elements in the DOM)
                      /---------------------------------\
                     /                                   \
                     | /-- buffer_position               |
                     |/             view_height          |
         0px         V        /--------------------/     V
         .. .. .. .. |--------|--------------------|-----|.. .. .. .. ..
         :  white    | hi     |                    |hi   |    white    :
         :   top     |   dd   |      visible       | dd  |    bottom   :
         :  space    |     en |                    |   en|    space    :
         .. .. .. .. |--------|--------------------|-----|.. .. .. .. ..
         \           \---------\                   \------\             \
          \           top_buffer_height             bottom_buffer_height \
           \--------------------------------------------------------------\
                                    virtual_height
   */
         
   var ListView = function () {
      this.view_height = 300;
      this.top_buffer_height = 200;
      this.bottom_buffer_height = 200;

      this.buffer_position = 0;
      this.current_scroll_top = 0;
      this.virtual_height = 0;

      this.data = [];
      this.dom_elements = [];
      this.filtered = [];

      //var common_style = "border: 1px solid black; margin: 0px; padding: 0px;";
      var common_style = "border: 0px; margin: 0px; padding: 0px;";
      
      this.$buffer = $('<div style="'+common_style+'"></div>');
      this.$white_top_space = $('<div style="'+common_style+' height: 0px"></div>');
      this.$white_bottom_space = $('<div style="'+common_style+' height: 0px"></div>');
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
      this.onScroll = function () { self.notify_scroll(); };
      this.onResize = function () { self.notify_resize(); };
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

   ListView.prototype.append = function (dom_element, height) {
      if (!height) {
         height = $(dom_element).outerHeight(true);
      }
   
      if (!height || height <= 0) {
         throw new Error("Invalid height for the dom element "+dom_element+": "+height+"");
      }

      var position_of_new_element = this.virtual_height;

      this.data.push({top: position_of_new_element});
      this.dom_elements.push(dom_element);
      this.virtual_height += height;

      if (this._is_position_in_buffer(position_of_new_element)) {
         this._update_buffer_and_white_space(this.current_scroll_top);
      }
      else {
         this._update_white_space();
      }

   };

   ListView.prototype._update_buffer = function (scrollTop) {
      if (this.data.length === 0) {
         return;
      }

      this.current_scroll_top = scrollTop;

      var result = this._get_element_and_index(Math.max(scrollTop-this.top_buffer_height, 0), true);
      
      var roof_element       = result.element;
      var roof_element_index = result.index;

      var result = this._get_element_and_index(Math.min(scrollTop+this.view_height+this.bottom_buffer_height, this.virtual_height), false);

      var floor_element       = result.element;
      var floor_element_index = result.index;

      this.buffer_position = roof_element.top;

      var new_elements_in_buffer = this.dom_elements.slice(roof_element_index, floor_element_index+1);
      this.$buffer.children().detach();
      this.$buffer.append(new_elements_in_buffer);
   };

   ListView.prototype._update_white_space = function () {
      this.$white_top_space.height(this.buffer_position);
      this.$white_bottom_space.height(Math.max(this.virtual_height-this.current_scroll_top-this.view_height-this.bottom_buffer_height, 0));
   };

   ListView.prototype._update_buffer_and_white_space = function (scrollTop) {
      this._update_buffer(scrollTop);
      this._update_white_space();
   };

   ListView.prototype.notify_resize = function () {
      this.view_height = this.$container.height();
      this._update_buffer_and_white_space(this.current_scroll_top);
   };

   ListView.prototype.notify_scroll = function () {
      var new_scroll_top = this.$container.scrollTop();

      if (this.buffer_position <= new_scroll_top && (new_scroll_top+this.view_height) < (Math.min(this.current_scroll_top+this.view_height+this.bottom_buffer_height, this.virtual_height))) {
         // ok, still inside the buffer
      }
      else {
         this._update_buffer_and_white_space(new_scroll_top);
      }
   };

   ListView.prototype._is_position_in_buffer = function (position) {
      return (this.buffer_position <= position && position <= (Math.min(this.current_scroll_top+this.view_height+this.bottom_buffer_height, this.virtual_height)));
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
            if (!round_to_roof && middle < this.data.length) {
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

      this.data.push({top: this.virtual_height});

      var current_scroll_top = this.current_scroll_top;
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
      //set the scroll of the browser TODO
   };

   ListView.prototype.quit_filter = function (skip_update) {
      this.filtered.push({original_index: this.data.length+this.filtered.length-1});
      var offset = 0;
      var current_scroll_top = this.current_scroll_top;
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
         //set the scroll of the browser TODO
      }
   };

   return {ListView:ListView};
});
