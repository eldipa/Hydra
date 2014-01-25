define(["d3", "ko", "cs!process_table", "cs!process_graph"], (d3, ko, ptable, pgraph) ->

   class ProcessView
      constructor: (@container_to_attach) ->
         @track_pids = ko.observableArray()
         @polling = ko.observable(4000)
         @setInterval_id = null
         @view_type = ko.observable('table')
         @include_all_descendents = ko.observable(true)

         @table_view = new ptable.ProcessTable()
         @graph_view = new pgraph.ProcessGraph()

         @last_data = ko.observable({'processes': [], 'relations': []})

         @forced_update = ko.computed((() =>
            if @view_type() == 'table'
               @graph_view.disable()
               @table_view.enable(@container_to_attach)

               v = @table_view
            else
               @table_view.disable()
               @graph_view.enable(@container_to_attach)

               v = @graph_view

            v.update(@last_data().processes, @last_data().relations)
         ), this)

         @set_getter_process_data = ko.computed((() =>
            pids = @track_pids().join()
            descendents = 0 + @include_all_descendents()
            url = '/process/parent_children_relation?pids=' + pids + '&all_descendents=' + descendents

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

   main = d3.select('.main-container')
      .append('div')
      .attr('class', 'col-xs-12 col-sm-9')


   form = d3.select('.main-container')
      .append('div')
      .attr('class', 'col-xs-6 col-sm-3 sidebar-offcanvas')
      .attr('role', 'navigation')
      .append('div')
      .attr('class', 'form-group')

   
   form.append('label')
      .text('View type')
   s = form.append('select')
      .attr('class', 'form-control')
      .attr('data-bind', 'value: view_type')
   s.append('option').text('graph')
   s.append('option').text('table')

   form.append('label')
      .text('Include all descendents')
   form.append('input')
      .attr('type', 'checkbox')
      .attr('data-bind', 'checked: include_all_descendents')

   form.append('label')
      .text('Polling')
   form.append('input')
      .attr('type', 'text')
      .attr('class', 'form-control')
      .attr('placeholder', 'Polling time')
      .attr('data-bind', 'value: polling')

   p = new ProcessView(main)

   ko.applyBindings(p)

   setTimeout((() ->
      p.track_pids.push(2526)
   ), 4000)
   
)
