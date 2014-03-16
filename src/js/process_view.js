define(['d3', 'ko', 'process_graph', 'process_table'], function (d3, ko, pgraph, ptable) {
   var ProcessView = (function () {
      function ProcessView(container_to_attach) {
         this.container_to_attach = container_to_attach;
         this.track_pids = ko.observableArray();
         this.polling = ko.observable(4000);

         this.setInterval_id = null;
         this.view_type = ko.observable('table');
         this.include_all_descendents = ko.observable(true);

         this.table_view = new ptable.ProcessTable();
         this.graph_view = new pgraph.ProcessGraph();

         this.last_data = ko.observable({'processes': [], 'relations': []});

         var self = this;
         this.forced_update = ko.computed((function () {
            if(self.view_type() === 'table') {
               self.graph_view.disable();
               self.table_view.enable(self.container_to_attach);

               var v = self.table_view;
            }
            else {
               self.table_view.disable();
               self.graph_view.enable(self.container_to_attach);

               var v = self.graph_view;
            }

            var last_data = self.last_data();
            v.update(last_data.processes, last_data.relations);
         }), this);
      
         this.set_getter_process_data = ko.computed((function () {
            var pids = self.track_pids().join();
            var descendents = 0 + self.include_all_descendents();
            var url = '/process/parent_children_relation?pids=' + pids + '&all_descendents=' + descendents;

            if (self.setInterval_id) {
               clearInterval(self.setInterval_id);
            }

            self.setInterval_id = setInterval((function () {
               //XXX
               /*d3.json(url, (err, data) {
                  self.last_data(data);
               });*/
            }), self.polling());

         }), this);
      }

      return ProcessView;
   })();

   function start() {
      var main = d3.select('.main')
         .append('div')
         .attr('class', 'col-xs-12 col-sm-9');

      var form = d3.select('.main')
         .append('div')
         .attr('class', 'col-xs-6 col-sm-3 sidebar-offcanvas')
         .attr('role', 'navigation')
         .append('div')
         .attr('class', 'form-group');

      form.append('label')
         .text('View type')
      var s = form.append('select')
         .attr('class', 'form-control')
         .attr('data-bind', 'value: view_type');
      s.append('option').text('graph');
      s.append('option').text('table');

      form.append('label')
         .text('Include all descendents');
      form.append('input')
         .attr('type', 'checkbox')
         .attr('data-bind', 'checked: include_all_descendents');

      form.append('label')
         .text('Polling');
      form.append('input')
         .attr('type', 'text')
         .attr('class', 'form-control')
         .attr('placeholder', 'Polling time')
         .attr('data-bind', 'value: polling');
      
      var p = new ProcessView(main);
      ko.applyBindings(p);
      p.last_data({'processes' :[
         {
            pid: 1, 
            name: 'A',
            status: 'running'
         },
         {
            pid: 2, 
            name: 'B',
            status: 'running'
         },
         {
            pid: 3, 
            name: 'C',
            status: 'running'
         }
         ],
         'relations':[
         [0, 1],
         [0, 2]
            ]
      });
   }

   return {start: start};

});
