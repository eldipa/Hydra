define(["d3", "ko", "cs!process_table", "cs!process_graph"], (d3, ko, ptable, pgraph) ->

   class ProcessView
      constructor: () ->
         @track_pids = ko.observableArray()
         @polling = ko.observable(4000)
         @setInterval_id = null
         @view_type = ko.observable('table')

         @table_view = new ptable.ProcessTable()
         @graph_view = new pgraph.ProcessGraph()

         @last_data = ko.observable({'processes': [], 'relations': []})

         @forced_update = ko.computed((() =>
            if @view_type() == 'table'
               @graph_view.disable()
               @table_view.enable()

               v = @table_view
            else
               @table_view.disable()
               @graph_view.enable()

               v = @graph_view

            v.update(@last_data().processes, @last_data().relations)
         ), this)

         @set_getter_process_data = ko.computed((() =>
            pids = @track_pids().join()
            url = '/process/parent_children_relation?pids=' + pids + '&all_descendents=1'

            if @setInterval_id?
               clearInterval(@setInterval_id)

            @setInterval_id = setInterval((() =>
               d3.json(url, (err, data) =>
                  console.log(err)
                  console.log(data)

                  @last_data(data)
               )
            ), @polling())
         ), this)

   form = d3.select('.main-container')
      .append('div')
      .attr('class', 'col-xs-6 col-sm-3 sidebar-offcanvas')
      .attr('role', 'navigation')
      .append('div')
      .attr('class', 'form-group')

   form.append('label')
      .text('Pids')
   form.append('input')
      .attr('type', 'text')
      .attr('class', 'form-control')
      .attr('placeholder', 'Process ids')

   form.append('label')
      .text('Polling')
   form.append('input')
      .attr('type', 'text')
      .attr('class', 'form-control')
      .attr('placeholder', 'Polling time')
      .attr('data-bind', 'value: polling')
   
   form.append('label')
      .text('View type')
   s = form.append('select')
      .attr('class', 'form-control')
      .attr('data-bind', 'value: view_type')
   s.append('option').text('graph')
   s.append('option').text('table')

   p = new ProcessView()

   ko.applyBindings(p)

   setTimeout((() ->
      p.track_pids.push(1921)
   ), 6000)
   
)
