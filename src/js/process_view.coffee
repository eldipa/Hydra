define(["d3", "cs!process_table", "cs!process_graph"], (d3, ptable, pgraph) ->

   force = new pgraph.ProcessGraph()
   force.enable()

   setInterval((() ->
      d3.json('/process/parent_children_relation?pids=1663&all_descendents=1', (err, data) ->
         console.log(err)
         console.log(data)

         force.update(data.processes, data.relations)
      )
      return false
   ), 4000)
)
