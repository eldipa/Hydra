define(['jquery', 'layout', 'listview'], function ($, layout, listview) {
   var Panel = layout.Panel;

   var ListViewPanel = function () {
      var id = ("" + Math.random()).slice(2);
      this.super(id);

      this.id = id;
      
      this._$container = $('<div id="'+id+'" style="height: 100%; overflow: scroll"></div>');
      this._$out_of_dom = this._$container;
      
      this.listView = new listview.ListView();
   };

   ListViewPanel.prototype.__proto__ = Panel.prototype;

   ListViewPanel.prototype.render = function () {
      if (this._$out_of_dom) {
         this._$out_of_dom.appendTo(this.box);
         this._$out_of_dom = null;

         this.listView.attach(this._$container);
      }

      this.listView.notify_resize();
   };

   ListViewPanel.prototype.unlink = function () {
      if (!this._$out_of_dom) {
         this.listView.detach()
         this._$out_of_dom = this._$container.detach();
      }
   };

   // The dom_element must be in the DOM or you must give its height.
   ListViewPanel.prototype.push = function (dom_element, height) {
      this.listView.push(dom_element, height);
   };

   ListViewPanel.prototype.filter = function (cb) {
      this.listView.filter(cb);
   };

   ListViewPanel.prototype.quit_filter = function () {
      this.listView.quit_filter();
   };

   ListViewPanel.prototype.autoscroll = function (enable) {
      this.listView.autoscroll(enable);
   };

   return {ListViewPanel: ListViewPanel};

});
