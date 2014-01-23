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
   stop_update_graph_on_level = 0.03
   update_graph_one_round = () ->
      console.log('tick')
      if force.alpha() < stop_update_graph_on_level
         force.alpha(0)
   
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
         .attr('fill', (process) -> color_by_status[process.status])

      # update the text of each node
      d3.selectAll('.node_text')
         .attr('x', (process) -> process.x)
         .attr('y', (process) -> process.y)
         .text((process) -> process.pid + " " + process.name)

   [w, h] = [600, 480]
   force = d3.layout.force()
      .size([w, h])
      .linkDistance(100)
      .charge(-600)
      .on("tick", update_graph_one_round)

   svg = d3.select(".main-container").append("svg")
      .attr("width", w)
      .attr("height", h)

   svg.append("rect")
      .attr("width", w)
      .attr("height", h)
      .attr('fill', 'none')

   #table = d3.select('body').append('table')

   update_table = (processes, relations) ->
      rows = table.selectAll('tr').data(processes, (p) -> p.pid)

      rows.enter()
         .append('tr')

      rows.exit()
         .remove()
      
      cells = rows.selectAll('td').data((p) -> [p.pid, p.name, p.status])

      cells.enter()
         .append('td')
         .text((attr) -> attr)

   #force.start()
   
   update_graph_view = (graph, restart) ->
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

      if restart
         graph.start()
      else
         update_graph_one_round()

   update_graph_data = (graph, processes, relations) ->
      pids = (p.pid for p in processes)
      graph_modified = false

      # remove old processes
      to_remove = (i for p, i in graph.nodes() when p? and pids.indexOf(p.pid) < 0)
      if to_remove.length
         graph_modified = true
      offset = 0
      for i in to_remove
         graph.nodes().splice(i-offset, 1)
         offset += 1
      
      # update processes
      for p in processes
         for gp, i in graph.nodes()
            if gp.pid == p.pid
               for attr of p
                  graph.nodes()[i][attr] = p[attr]
               break

      # add new processes
      gpids = (gp.pid for gp in graph.nodes())
      to_add = (p for p in processes when gpids.indexOf(p.pid) < 0)
      if to_add.length
         graph_modified = true
      for p in to_add
         graph.nodes().push(p)

      
      # remove old links
      to_remove = []
      for l, i in graph.links()
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
         graph.links().splice(i-offset, 1)
         offset += 1

      
      # add new links
      to_add = []
      for rel in relations
         found = false
         for l in graph.links()
            if l.source.pid == processes[rel[0]].pid and l.target.pid == processes[rel[1]].pid
               found = true
               break

         if not found
            source = (p for p in graph.nodes() when p? and p.pid == processes[rel[0]].pid)[0]
            target = (p for p in graph.nodes() when p? and p.pid == processes[rel[1]].pid)[0]
            to_add.push({source: source, target: target})
      
      if to_add.length
         graph_modified = true
      for l in to_add
         graph.links().push(l)

      return graph_modified
      

   setInterval((() ->
      d3.json('/process/parent_children_relation?pids=1676&all_descendents=1', (err, data) ->
         console.log(err)
         console.log(data)

         changed_graph_or_link_count = update_graph_data(force, data.processes, data.relations)
         update_graph_view(force, changed_graph_or_link_count)

         #update_table(data.processes, data.relations)
      )
      return false
   ), 4000)
   
)

