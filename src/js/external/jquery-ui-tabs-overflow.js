define(['jquery', 'jqueryui'], function ($, _) {
   // http://jsfiddle.net/boreded/2JK7K/10/
   // http://jsfiddle.net/boreded/2JK7K/10/embedded/result/
   // http://stackoverflow.com/questions/6660370/how-to-make-jquery-ui-tabs-scroll-horizontally-if-there-are-too-many-tabs

   //
   // Fixed:
   //  - refresh in case that the tabs is not 'overflow'
   //
   $.widget("ui.tabs", $.ui.tabs, {
           options: {
                   overflowTabs: false,
                   tabPadding: 25,
                   containerPadding: 0,
                   dropdownSize: 50
           },
           
           _create: function() {
                   this._super("_create");
                   this.tabsWidth = 0;
                   this.containerWidth = 0;
                   
                   if (!this.options.overflowTabs)
                           return;
                   
                   // update the tabs
                   this.updateOverflowTabs();
                   
                   // Detect a window resize and check the tabs again
                   var that = this;
                   $(window).resize(function() {
                           // Add a slight delay after resize, to fix Maximise issue.
                           setTimeout(function() {
                                   that.updateOverflowTabs();
                           }, 150);
                   });
                   
                   // Detect dropdown click
                   $(".overflow-selector").click(function() {
                           if ($('.ui-tabs-overflow').hasClass('hide')) {
                                   $('.ui-tabs-overflow').removeClass('hide');
                           } else {
                                   $('.ui-tabs-overflow').addClass('hide');
                           }
                   });
           },
           
           refresh: function() {
                   this._super("refresh");
                   if (!this.options.overflowTabs)
                           return;
                   this.updateOverflowTabs();
           },
           
           updateOverflowTabs: function() {
                   var failsafe = 0;
                   this._calculateWidths();
                   console.log(this.containerWidth);
                   
                   // Loop until tabsWidth is less than the containerWidth
                   while (this.tabsWidth > this.containerWidth && failsafe < 30)
                   {
                           this._hideTab();
                           this._calculateWidths();
                           failsafe++;
                   }
           
                   // Finish now if there are no tabs in the overflow list
                   if ($(this.element).find('.ui-tabs-overflow li').size() == 0)
                           return;
                           
                   // Reset
                   failsafe = 0;
                   
                   // Get the first tab in the overflow list
                   var next = this._nextTab();

                   // Loop until we cannot fit any more tabs
                   while (next.totalSize < this.containerWidth && $(this.element).find('.ui-tabs-overflow li').size() > 0 && failsafe < 30)
                   {
                           this._showTab(next.tab);
                           this._calculateWidths();
                           
                           next = this._nextTab();

                           failsafe++;
                   }
           },
           
           //
           // - Sum the 'outer width of each tab (li objects) and save the value in 'tabsWidth'
           // - Calculate the container width, the parent width minus the button-dropdown width and some padding
           // ? Update the count of 'overflowed' tabs 
           _calculateWidths: function() {
                   var width = 0;
                   $(this.element).find('.ui-tabs-nav > li').each(function(){
                           width += $(this).outerWidth(true);
                   });
                   
                   this.tabsWidth = width;
                   this.containerWidth = $(this.element).parent().width() - this.options.containerPadding - this.options.dropdownSize;
                   
                   $('.overflow-selector .total').html($(this.element).find('.ui-tabs-overflow li').size());
           },
           

           //
           // - Create the container for the overflowed tabs (ul) if not exists 
           // - The last tab showed is overflowed and hidden.
           _hideTab: function() {
                   if (!$('.ui-tabs-overflow').length)
                   {
                           $(this.element).find('.ui-tabs-nav').after('<ul class="ui-tabs-overflow hide"></ul>');
                           $(this.element).find('.ui-tabs-overflow').after('<div class="overflow-selector">&#8595 <span class="total">0</span></div>');
                   }

                   var lastTab = $(this.element).find('.ui-tabs-nav li').last();
                   lastTab.appendTo($(this.element).find('.ui-tabs-overflow'));
           },
           
           //
           // - Put that tab into the visible tabs
           // - If the overflowed tabs are zero, remove its container and the button
           _showTab: function(tab) {
                   tab.appendTo($(this.element).find('.ui-tabs-nav'));

                   // Check to see if overflow list is now empty
                   if ($(this.element).find('.ui-tabs-overflow li').size() == 0)
                   {
                           $(this.element).find('.ui-tabs-overflow').remove();
                           $(this.element).find('.overflow-selector').remove();
                   }
           },
           
           _nextTab: function() {
                   var result = {};
                   var firstTab = $(this.element).find('.ui-tabs-overflow li').first();
                   
                   result['tab'] = firstTab;
                   result['totalSize'] = this.tabsWidth + this._textWidth(firstTab) + this.options.tabPadding;
                   
                   return result;
           },

           //
           // - Wrap the element with a span, calculate the width of the span and unwrap it. Return the width.
           _textWidth: function(element) {
                   var self = $(element),
                           children = self.children(),
                           calculator = $('<span style="display: inline-block;" />'),
                           width;

                   children.wrap(calculator);
                   width = children.parent().width();
                   children.unwrap();
                   
                   return width;
           }
   });
});
