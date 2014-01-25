define(["d3"], (d3) ->
   class ProcessGraph
      constructor: (@width = 600, @height = 480) ->
         @graph = d3.layout.force()
            .size([@width, @height])
            .linkDistance(100)
            .charge(-600)

         @stop_update_graph_on_level = 0.03
         
         @color_by_status = {
            "running": '#0f0',
            "sleeping": 'rgb(33, 184, 190)',
            "disk-sleep": 'rgb(190, 71, 33)',
            "stopped": '#f00',
            "tracing-stop": '#f00',
            "zombie": 'rgb(165, 111, 111)',
            "dead": '#fff',
            "wake-kill": 'rgb(111, 165, 120)',
            "waking": 'rgb(111, 165, 120)',
            "idle": '#00f',
            "locked":'#00f',
            "waiting":'#00f'
         }


      
      enable: (container_to_attach = ".main-container") ->
         if @svg?
            @disable()

         @svg = d3.select(container_to_attach).append("svg")
            .attr("width", @width)
            .attr("height", @height)

         @svg.append("rect")
            .attr("width", @width)
            .attr("height", @height)
            .attr('fill', 'none')
         
         @graph.on("tick", @update_graph_one_round)

      disable: () ->
         if @svg?
            @svg.remove()
            @svg = null
      
      update_graph_one_round: () =>
         console.log('tick')
         if @graph.alpha() < @stop_update_graph_on_level
            @graph.alpha(0)
      
         # update links
         d3.selectAll('.link')
            .attr("x1", (d) -> d.source.x )
            .attr("y1", (d) -> d.source.y )
            .attr("x2", (d) -> d.target.x )
            .attr("y2", (d) -> d.target.y )

         # update nodes
         d3.selectAll('.circle_node')
            .attr("cx", (process) -> process.x )
            .attr("cy", (process) -> process.y )
            .attr('fill', (process) => @color_by_status[process.status])

         # update the text of each node
         d3.selectAll('.node_text')
            .attr('x', (process) -> process.x)
            .attr('y', (process) -> process.y)
            .text((process) -> process.pid + " " + process.name)
   
      update_graph_view: (restart) ->
         nodes = @svg.selectAll('.node').data(@graph.nodes(), (gprocess) -> gprocess.pid)

         nodes.exit()
            .remove()

         gnodes = nodes.enter()
            .append('g')
            .attr('class', 'node')

         gnodes.append('circle')
            .attr('class', 'circle_node')
            .attr('r', 6)
            .call(@graph.drag)
         gnodes.append('text')
            .attr('class', 'node_text')

         links = @svg.selectAll('.link').data(@graph.links())

         links.enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', '#999')

         links.exit()
            .remove()

         if restart
            @graph.start()
         else
            @update_graph_one_round()

      update_graph_data: (processes, relations) ->
         pids = (p.pid for p in processes)
         graph_modified = false

         # remove old processes
         to_remove = (i for p, i in @graph.nodes() when p? and pids.indexOf(p.pid) < 0)
         if to_remove.length
            graph_modified = true
         offset = 0
         for i in to_remove
            @graph.nodes().splice(i-offset, 1)
            offset += 1
         
         # update processes
         for p in processes
            for gp, i in @graph.nodes()
               if gp.pid == p.pid
                  for attr of p
                     @graph.nodes()[i][attr] = p[attr]
                  break

         # add new processes
         gpids = (gp.pid for gp in @graph.nodes())
         to_add = (p for p in processes when gpids.indexOf(p.pid) < 0)
         if to_add.length
            graph_modified = true
         for p in to_add
            @graph.nodes().push(p)

         
         # remove old links
         to_remove = []
         for l, i in @graph.links()
            found = false
            for rel in relations
               if l.source.pid == processes[rel[0]].pid and l.target.pid == processes[rel[1]].pid
                  found = true
                  break

            if not found
               to_remove.push(i)
         offset = 0
         if to_remove.length
            graph_modified = true
         for i in to_remove
            @graph.links().splice(i-offset, 1)
            offset += 1

         
         # add new links
         to_add = []
         for rel in relations
            found = false
            for l in @graph.links()
               if l.source.pid == processes[rel[0]].pid and l.target.pid == processes[rel[1]].pid
                  found = true
                  break

            if not found
               source = (p for p in @graph.nodes() when p? and p.pid == processes[rel[0]].pid)[0]
               target = (p for p in @graph.nodes() when p? and p.pid == processes[rel[1]].pid)[0]
               to_add.push({source: source, target: target})
         
         if to_add.length
            graph_modified = true
         for l in to_add
            @graph.links().push(l)

         return graph_modified

      update: (processes, relations) ->
         if @svg?
            changed_graph_or_link_count = @update_graph_data(processes, relations)
            @update_graph_view(changed_graph_or_link_count)

   return {'ProcessGraph': ProcessGraph}
)

