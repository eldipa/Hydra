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

   p = new ProcessView()

   setTimeout((() ->
      p.track_pids.push(1663)
   ), 6000)
   
   setTimeout((() ->
      p.view_type('graph')
   ), 15000)

)
