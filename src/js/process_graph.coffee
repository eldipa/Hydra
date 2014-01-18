define(["d3"], (d3) ->
   color_by_status = {
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
   tick = () ->
      console.log('tick')
      d3.selectAll('.link')
         .attr("x1", (d) -> d.source.x )
         .attr("y1", (d) -> d.source.y )
         .attr("x2", (d) -> d.target.x )
         .attr("y2", (d) -> d.target.y )

      d3.selectAll('.circle_node')
         .attr("cx", (process) -> process.x )
         .attr("cy", (process) -> process.y )
         .attr('fill', (process) -> color_by_status[process.status])

      d3.selectAll('.node_text')
         .attr('x', (process) -> process.x)
         .attr('y', (process) -> process.y)
         .text((process) -> process.pid + " " + process.name)

   [w, h] = [600, 400]
   force = d3.layout.force()
      .size([w, h])
      .linkDistance(100)
      .charge(-200)
      .on("tick", tick)

   svg = d3.select("body").append("svg")
      .attr("width", w)
      .attr("height", h)

   svg.append("rect")
      .attr("width", w)
      .attr("height", h)
      .attr('fill', 'none')

   #force.start()
   
   update = (graph) ->
      nodes = svg.selectAll('.node').data(graph.nodes(), (gprocess) -> gprocess.pid)

      nodes.exit()
         .remove()

      gnodes = nodes.enter()
         .append('g')
         .attr('class', 'node')

      gnodes.append('circle')
         .attr('class', 'circle_node')
         .attr('r', 6)
         .call(graph.drag)
      gnodes.append('text')
         .attr('class', 'node_text')

      links = svg.selectAll('.link').data(graph.links())

      links.enter()
         .append('line')
         .attr('class', 'link')
         .attr('stroke', '#999')

      links.exit()
         .remove()

      
      console.log(graph.links())
      console.log(graph.nodes())
      graph.start()

   update_graph = (graph, processes, relations) ->
      pids = (p.pid for p in processes)

      # remove old processes
      to_remove = (i for p, i in graph.nodes() when p? and pids.indexOf(p.pid) < 0)
      offset = 0
      for i in to_remove
         graph.nodes().splice(i-offset, 1)
         offset += 1


      # add new processes
      gpids = (gp.pid for gp in graph.nodes())
      to_add = (p for p in processes when gpids.indexOf(p.pid) < 0)
      for p in to_add
         graph.nodes().push(p)

      
      # remove old links
      to_remove = []
      for l, i in graph.links()
         found = false
         for rel in relations
            if l.source.pid == rel[0] and l.target.pid == rel[1]
               found = true
               break

         if not found
            to_remove.push(i)
      offset = 0
      for i in to_remove
         graph.links().splice(i-offset, 1)
         offset += 1

      
      # add new links
      to_add = []
      for rel in relations
         found = false
         for l in graph.links()
            if l.source.pid == rel[0] and l.target.pid == rel[1]
               found = true
               break

         if not found
            source = (p for p in graph.nodes() when p? and p.pid == processes[rel[0]].pid)[0]
            target = (p for p in graph.nodes() when p? and p.pid == processes[rel[1]].pid)[0]
            to_add.push({source: source, target: target})

      for l in to_add
         graph.links().push(l)
      
      
      update(graph)

   setInterval((() ->
      d3.json('/process/parent_children_relation?pids=1853&all_descendents=1', (err, data) ->
         console.log(err)
         console.log(data)

         update_graph(force, data.processes, data.relations)
      )
      return false
   ), 8000)
   
)

