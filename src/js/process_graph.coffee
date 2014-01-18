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

      d3.selectAll('.node')
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

   (() ->
      d3.json('/process/parent_children_relation?pids=1853&all_descendents=1', (err, data) ->
         console.log(err)
         console.log(data)

         processes = data['processes']

         (force.nodes().push(process) for process in processes)
         (force.links().push({source: rel[0], target: rel[1]}) for rel in data['relations'])

         nodes = svg.selectAll('.node').data(processes, (process) -> process.pid)

         nodes.exit()
            .remove()

         nodes.enter()
            .append('circle')
            .attr('class', 'node')
            .attr('r', 6)
            .call(force.drag)
         nodes.enter()
            .append('text')
            .attr('class', 'node_text')

         links = svg.selectAll('.link').data(force.links())

         links.exit()
            .remove()

         links.enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', '#999')
         
         console.log(force.links())
         console.log(force.nodes())
         force.start()
      )
      return false
   )()
   
)

