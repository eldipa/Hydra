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
                   overflowTabs: false
           },
           
           _create: function() {
                   this._super("_create");
                   this.tabsWidth = 0;
                   this.containerWidth = 0;
                   
                   if (!this.options.overflowTabs)
                           return;
                   
                   // create the container for the overflowed tabs (ul)
                   $(this.element).find('.ui-tabs-overflow').remove();
                   $(this.element).find('.ui-tabs-nav').after('<ul class="ui-tabs-overflow hide"></ul>');

                   // create the dropdown button for the selection of the overflowed tab
                   $(this.element).find('.overflow-selector').remove();
                   $(this.element).find('.ui-tabs-nav').append('<div class="overflow-selector">9999 more</div>');


                   this.dropdownSize = $(this.element).find('.overflow-selector').outerWidth();

                   // update the tabs
                   this.updateOverflowTabs();
                   
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
                   this.containerWidth = $(this.element).parent().width() - this.dropdownSize;

                   // Loop until tabsWidth is less than the containerWidth
                   var showed = $(this.element).find('.ui-tabs-nav > li').size();
                   var looped = false;
                   while (this.tabsWidth > this.containerWidth && failsafe < 30 && showed > 1)
                   {
                           this._hideTab();
                           this._calculateWidths();
                           failsafe++;
                           showed--;
                           looped = true;
                   }
           
                   // Finish now if there are no tabs in the overflow list
                   // or if we can't hide and show tabs at the same time
                   if ($(this.element).find('.ui-tabs-overflow li').size() == 0 || looped) {
                           this._setTabOverflowedCount();
                           return;
                   }

                           
                   // Reset
                   failsafe = 0;
                   looped = false;
                   
                   // Get the first tab in the overflow list
                   var next = this._nextTab();

                   // Loop until we cannot fit any more tabs
                   while (next !== null && failsafe < 30)
                   {
                           this._showTab(next);
                           this._calculateWidths();

                           if(this.tabsWidth > this.containerWidth) {
                              this._hideTab();
                              break;
                           }

                           next = this._nextTab();
                           failsafe++;
                   }
                   this._setTabOverflowedCount();
           },
           
           _calculateWidths: function() {
                   var width = 0;
                   $(this.element).find('.ui-tabs-nav > li').each(function(){
                           width += $(this).outerWidth(true);
                   });
                   
                   this.tabsWidth = width;
                   
           },

           _setTabOverflowedCount: function () {
                   $('.overflow-selector').html("" + $(this.element).find('.ui-tabs-overflow li').size() + " more");
           },
           

           _hideTab: function() {
                   var lastTab = $(this.element).find('.ui-tabs-nav li').last();
                   lastTab.appendTo($(this.element).find('.ui-tabs-overflow'));
           },
           
           _showTab: function(tab) {
                   tab.appendTo($(this.element).find('.ui-tabs-nav'));
           },
           
           _nextTab: function() {
                   if($(this.element).find('.ui-tabs-overflow li').size() === 0) {
                      return null;
                   }
                   return $(this.element).find('.ui-tabs-overflow li').first();
           }
   });
});
