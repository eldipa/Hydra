define(["d3"], (d3) ->
   tick = () ->
      console.log('tick')
      link.attr("x1", (d) -> d.source.x )
         .attr("y1", (d) -> d.source.y )
         .attr("x2", (d) -> d.target.x )
         .attr("y2", (d) -> d.target.y )

      node.attr("cx", (d) -> d.x )
         .attr("cy", (d) -> d.y )

   [w, h] = [600, 400]
   force = d3.layout.force()
      .size([w, h])
      .linkDistance(100)
      .on("tick", tick)

   svg = d3.select("body").append("svg")
      .attr("width", w)
      .attr("height", h)

   svg.append("rect")
      .attr("width", w)
      .attr("height", h)
      .attr('fill', 'none')

   nodes = force.nodes()
   links = force.links()
   node = svg.selectAll(".node")
   link = svg.selectAll(".link")


   restart = () ->
      link = link.data(links)
      link.enter().insert("line", ".node")
         .attr('stroke', '#999')
         .attr("class", "link")

      node = node.data(nodes)

      node.enter().insert("circle", ".cursor")
         .attr('fill', '#000')
         .attr("class", "node")
         .attr("r", 5)
         .call(force.drag)
         .append('div')
         .text('aaa')
      
      force.start()

   restart()

   d3.json('/process/parent_children_relation?pids=1803&all_descendents=1', (err, data) ->
      console.log(err)
      console.log(data)

      (nodes.push({pid: pid}) for pid in data['pids'])
      (links.push({source: data['pids'].indexOf(rel[0]), target: data['pids'].indexOf(rel[1])}) for rel in data['relations'])

      restart()
   )
   
)

