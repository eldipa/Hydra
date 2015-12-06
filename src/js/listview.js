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
      this.view_height = 1;
      this.buffer_height_factor = 1.3;

      if (this.buffer_height_factor < 1) {
         throw new Error("The buffer height factor must be greater than 1 ("+this.buffer_height_factor+" was found).");
      }

      this.buffer_position = 0;
      this.current_scroll_top = 0;
      this.virtual_height = 0;
      this.is_at_bottom = true;

      this.data = [];

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

   /*
      Return true if the view  is at bottom and the autoscroll functionality
      is enabled.

      See _is_at_bottom for more info.
   */
   ListView.prototype._should_be_at_bottom = function () {
      return (this.if_at_bottom_stay_there && this.is_at_bottom)
   };

   /*
      Calculate the greater value for the scroll top. This should be 
      the value of the view when it is at bottom.

      This method requires that the virtual_height and the view_height have
      correct values.
   */
   ListView.prototype._get_greater_scroll_top_at_bottom = function () {
      return Math.max(this.virtual_height-this.view_height, 0);
   };

   /*
      See _move_scroll_and_update_all
   */
   ListView.prototype._ensure_valid_scroll_top_value = function (new_scroll_top) {
      return Math.min(Math.max(new_scroll_top, 0), this._get_greater_scroll_top_at_bottom());
   };
   
   /*
      Set a new scroll top value.
      
      This method will set the current_scroll_top property and then will call
      _update_buffer_and_white_space to get the correct white space and buffer
      space. With that, the view_height, virtual_height and buffer_position
      should be set to the correct one.

      Only then, the real scroll top property of the container is set.

      If the new_scroll_top is invalid (negative or greater than the _get_greater_scroll_top_at_bottom),
      the value is set to 0 or the value returner by _get_greater_scroll_top_at_bottom.
   */
   ListView.prototype._move_scroll_and_update_all = function (new_scroll_top) {
      this._set_current_scroll_top_property(new_scroll_top);

      this._update_buffer_and_white_space();
      this.$container.scrollTop(this.current_scroll_top);
   };

   ListView.prototype._set_current_scroll_top_property = function (new_scroll_top) {
      new_scroll_top = this._ensure_valid_scroll_top_value(new_scroll_top);
      this.current_scroll_top = new_scroll_top;
      this._recalculate_if_it_is_at_bottom();
   };

   ListView.prototype.push = function (obj, height) {
      var dom_element = obj.dom_element;

      if (height === undefined) {
         var tmp = $(dom_element)
         tmp.appendTo(this.$white_bottom_space);

         height = (tmp.css("display") === "none")? 0 : tmp.outerHeight(true);

         tmp.detach();
      }
   
      if (height < 0) {
         throw new Error("Invalid height for the dom element "+dom_element+": "+height+"");
      }

      // get the current state before the change
      var force_to_be_at_bottom = this._should_be_at_bottom();

      var position_of_new_element = this.virtual_height;

      // update the data
      obj.top = position_of_new_element;
      this.data.push(obj);

      // update the virtual_height
      this.virtual_height += height;

      // no change at all, so return quickly
      if(height===0) {
         return;
      }

      if (force_to_be_at_bottom) { 
         // update the current_scroll_top and the buffer and the white space
         var new_scroll_top = this._get_greater_scroll_top_at_bottom();
         this._move_scroll_and_update_all(new_scroll_top);
      }
      else {
         // dont update the current_scroll_top
         if (this._is_position_in_buffer(position_of_new_element)) {
            // the new element may be is visible, we need to update the buffer too ...
            this._update_buffer_and_white_space();
         }
         else {
            // ... but in this case, we need to update the white space only
            this._update_white_space();
         }
      }
   };

   /*
      Given a scrollTop position, where the buffer should start?

                      /--- buffer_position  
                     /    /------------------- scrollTop                   
                    V     V                   
       .. ... ...   |-----|-------------|-----| ... ... ...
                    |     |             |     |
                    |     |             |     |
       .. ... ...   |-----|-------------|-----| ... ... ...
                   /-----/
                    get_max_extra_height_in_buffer()/2

      The scrollTop position MUST be a valid one: see _ensure_valid_scroll_top_value
   */
   ListView.prototype._get_estimated_buffer_position = function (scrollTop) {
      return Math.max(scrollTop-(this.get_max_extra_height_in_buffer()/2), 0);
   };

   
   /*
      Given a buffer's start position, where the buffer should end?

                    /-- buffer's start        /-- buffer's ends            
                    V                         V
       .. ... ...   |-----|-------------|-----| ... ... ...
                    |     |             |     |
                    |     |             |     |
       .. ... ...   |-----|-------------|-----| ... ... ...
                   /====================|=====/
              get_max_buffer_height()  /-----/
                                          get_max_extra_height_in_buffer()/2

   */
   ListView.prototype._get_estimated_buffer_end_position = function (buffer_start_position) {
      return Math.min(buffer_start_position+this.get_max_buffer_height(), this.virtual_height);
   };

   /*
      This will update the buffer with the correct elements in the dom
      and it will update the buffer_position.

      The current_scroll_top must be a valid one.

      If no data is in the this.data array, the buffer is not updated and
      the buffer_position value is set to 0.
   */
   ListView.prototype._update_buffer = function () {
      if (this.data.length === 0) {
         this.buffer_position = 0;
         return;
      }
      
      var result = this._get_element_and_index(this._get_estimated_buffer_position(this.current_scroll_top), true);
      
      var roof_element       = result.element;
      var roof_element_index = result.index;
      this.buffer_position = roof_element.top;

      var result = this._get_element_and_index(this._get_estimated_buffer_end_position(this.buffer_position), false);

      var floor_element       = result.element;
      var floor_element_index = result.index;

      var elements_in_buffer_range = this.data.slice(roof_element_index, floor_element_index+1);
      var visible_elements_in_buffer_range = _.filter(elements_in_buffer_range, function (obj, i, elements) { return (i === elements.length-1 || obj.top < elements[i+1].top); });
      var visible_dom_elements_in_buffer_range = _.pluck(visible_elements_in_buffer_range, 'dom_element')

      this.$buffer.children().detach();
      this.$buffer.append(visible_dom_elements_in_buffer_range);
   };

   /*
      Recalculate the heights of all the elements updating the virtual_height.

      This method will remove any element in the buffer. You need to rebuild it.
   */
   ListView.prototype._recalculate_heights_and_update_virtual_height = function () {
      if (this.data.length === 0) {
         this.virtual_height = 0;
         return;
      }
         
      var offset = 0;
      for (var i = 0; i < this.data.length; i+=30) {
         var j = Math.min(i + 30, this.data.length);
      
         var new_elements_in_buffer = _.pluck(this.data.slice(i, j), 'dom_element');
         this.$buffer.children().detach();
         this.$buffer.append(new_elements_in_buffer);

         for (var k = i; k < j; k++) { 
            this.data[k].top = offset;
            
            var $el = $(this.data[k].dom_element);
            offset += ($el.css("display") === "none")? 0 : $el.outerHeight(true);
         }
      }

      this.$buffer.children().detach();
      this.virtual_height = offset;
   };

   /*
      Recalculate the scroll top propety without using the DOM and return its value.
      Two things can happen:
         - the force_to_be_at_bottom is true, so the current_scroll_top will be
           set to the greater scroll top possible (at bottom)
         - or we need to guess what it is the correct current_scroll_top:
            * we cannot trust in the buffer_position property (this will updated after us)
            * we cannot trust in the scrollTop() property of $container (this will updated after us)
           the only thing we can do is to calculate the element pointed by the current_scroll_top
           before the update and then, after the update we ask to that elements its new
           top-position. We use that to calculate the new current_scroll_top.
           This element's index is the second parameter of this method.

      */
   ListView.prototype._recalculate_scroll_top = function (force_to_be_at_bottom, roof_element_index) {
      if (force_to_be_at_bottom) {
         var new_scroll_top = this._get_greater_scroll_top_at_bottom();
      }
      else {
         var new_scroll_top = Math.max(Math.min(this.data[roof_element_index].top, this.virtual_height-this.view_height), 0);
      }
      return new_scroll_top;
   };

   /*
      Set to true the property is_at_bottom if the view is at bottom:
         - the virtual height is less than the view height, then, the view is at bottom.
         - or the current_scroll_top plus the view height is greater than the virtual height.

      This method must be invoked only if the virtual_height, view_height and the current_scroll_top
      are the correct one.
   */
   ListView.prototype._recalculate_if_it_is_at_bottom = function () {
      var tol = 2;
      this.is_at_bottom = (this.virtual_height <= this.view_height) || (Math.max(this.current_scroll_top, 0) + this.view_height) >= (this.virtual_height - tol);
   };

   /*
      Update the buffer detaching the elements out of the buffer and attaching the
      new elements.
      Then, recalculate the white space before and after the buffer.
      
      At the end, the buffer_position is updated.
   */
   ListView.prototype._update_buffer_and_white_space = function () {
      this._update_buffer();
      this._update_white_space();
   };

   /*
      Update the space before and after the buffer.
      The buffer and the buffer_position must be already updated.
   */
   ListView.prototype._update_white_space = function () {
      this.$white_top_space.height(this.buffer_position);
      this.$white_bottom_space.height(Math.max(this.virtual_height-this.buffer_position-this.get_max_buffer_height(), 0));
   };


   /*
      A resize will change the view_height and the virtual_height (the elements 
      inside can change their size in the new resized container).
      
      With those changes, the current_scroll_top is updated and then the buffer too.
   */
   ListView.prototype.notify_resize = function () {
      if (this.data.length === 0) {
         this.view_height = this.$container.height();
         return;
      }

      // get the element marked by the current_scroll_top before the update
      // so we can use its new position (after the update) to recalculate the current_scroll_top
      var result = this._get_element_and_index(this.current_scroll_top, true);
      var roof_element_index_before_update = result.index;

      // see if we are at the bottom and we want to continue there (all before the update)
      var should_be_at_bottom = this._should_be_at_bottom();
      
      // update the heigth.
      this.view_height = this.$container.height();

      // recalculate the heights and the virtual_height.
      // then, recalculate the current_scroll_top and set its new value,
      // updating the buffer in the process.
      this._recalculate_heights_and_update_virtual_height();
      var new_scroll_top = this._recalculate_scroll_top(should_be_at_bottom, roof_element_index_before_update);
      this._move_scroll_and_update_all(new_scroll_top);
   };


   ListView.prototype.notify_scroll = function () {
      var new_scroll_top = this.$container.scrollTop();
      this._set_current_scroll_top_property(new_scroll_top);

      if (this.buffer_position <= this.current_scroll_top && (this.current_scroll_top+this.view_height) < this.buffer_position+(this.get_max_buffer_height()/2)) {
         // ok, still inside the buffer: all the elements visible by the user are in the
         // buffer (in the DOM) so we don't need to update the buffer.
      }
      else {
         this._update_buffer_and_white_space();
      }
   };

   /*
      Return true if the position is inside the buffer:
      
                       /--- buffer_position     /--- buffer_position + get_max_buffer_height() 
                      /                        /
                     V                        V
       .. ... ...   |-----|-------------|-----| ... ... ...
                    |     |             |     |
                    |     |             |     |
       .. ... ...   |-----|-------------|-----| ... ... ...

      This method will correctly return true  only if the virtual_height is
      large enough and the buffer is not at the top or the bottom of the virtual view.
      That is, the buffer must have enough space to extend its white spaces.

      If not, this method may return true when it shouldn't.

      In any case, this method will return false correctly.
   */
   ListView.prototype._is_position_in_buffer = function (position) {
      return (this.buffer_position <= position && position <= this.buffer_position+this.get_max_buffer_height());
   };

   ListView.prototype._get_element_and_index = function (position, round_to_roof, start, end) {
      this.data.push({top: Number.POSITIVE_INFINITY});

      var left  = (start==null)? 0 : start;
      var right = (end==null)? this.data.length-2 : end; // dont count the dummy node

      while (left <= right) {
         var middle = Math.floor((left+right) / 2);

         var found = this.data[middle];
         var next  = this.data[middle+1];

         /*           /-- found.top
                     /        /--- next.top
                     V        V
                     |        |
                     | found  |  next
                     |        |
                    /=========/
                        ^is position here?
            
            Because the condition is found.top <= position < next.top we can ensure
            that found.top < next.top and that implies that the found element has
            height of (next.top-found.top) which is greater than zero, so the found
            element is not invisible.
         */
         if (found.top <= position && position < next.top) {
            this.data.pop();
            if (!round_to_roof) {
               
               // get the next element (we are rounding to the floor)
               // but this "next" element can be invisible, so we need to search for the
               // correct one.
               if (middle + 1 < this.data.length) {
                  // so we look for the element with the same top position 
                  var result = this._get_element_and_index(next.top, true, middle+1);
                  
                  // by definition, _get_element_and_index returns elements that
                  // are visible, so "results" has the correct data.
                  return result;
               }
               else {
                  return {element: found, index: middle};
               }
            }
            else {
               // found.top <= position so found.top is rounded to the roof already
               return {element: found, index: middle};
            }
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

   ListView.prototype.apply = function (cb, recalculate_heights, context) {
      recalculate_heights = recalculate_heights || false;
      
      _.each(this.data, cb, context);
      if (recalculate_heights) {
         this.notify_resize();
      }
   };

   ListView.prototype._show_coordinates_and_sizes = function () {
      console.debug("BufPos: "+this.buffer_position+" BufHeight: "+this.get_max_buffer_height()+" View: "+this.view_height+" CurrScroll: "+this.current_scroll_top+" VHeight: "+this.virtual_height+"");
   };
   
   /*
      Get the max buffer height: the view_height * buffer_height_factor.
      The value is rounded to up.
   */
   ListView.prototype.get_max_buffer_height = function () {
      return Math.floor(this.buffer_height_factor*this.view_height)+1;
   };

   /*
      Get the max extra buffer height. This is the space of the buffer
      that is not visible by the user.
   */
   ListView.prototype.get_max_extra_height_in_buffer = function () {
      return Math.floor((this.buffer_height_factor-1)*this.view_height);
   };

   return {ListView:ListView};
});
