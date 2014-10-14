define(['d3'], function (d3) {
   var ProcessGraph = function () {
      function ProcessGraph(width, height) {
         this.width = (typeof width === 'undefined') ? 600 : width;
         this.height = (typeof height === 'undefined') ? 400 : height;

         this.graph = d3.layout.force()
            .size([this.width, this.height])
            .linkDistance(100)
            .charge(-600);

         this.stop_update_graph_on_level = 0.03;
         
         this.color_by_status = {
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
         };

         this._$container = $('<div style="width: 100%; height: 100%; min-width: '+this.width+'px; min-height: '+this.height+'px"></div>');
         this._create_graph(this._$container);
         this.enabled = false; 
      }

      ProcessGraph.prototype._create_graph = function (container_to_attach) {
         this.svg = d3.select($(container_to_attach).get()[0]).append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

         this.svg.append("rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr('fill', 'none');
         
         var self = this; 
         this.graph.on("tick", function () { 
            return self.update_graph_one_round(); });
      };

      ProcessGraph.prototype.update_graph_one_round = function () {
         if (this.graph.alpha() < this.stop_update_graph_on_level) {
            this.graph.alpha(0);
         }
      
         // update links
         d3.selectAll('.link')
            .attr("x1", function (d) { return d.source.x; } )
            .attr("y1", function (d) { return d.source.y; } )
            .attr("x2", function (d) { return d.target.x; } )
            .attr("y2", function (d) { return d.target.y; } );

         // update nodes
         var self = this;
         d3.selectAll('.circle_node')
            .attr("cx", function (process) { return process.x; } )
            .attr("cy", function (process) { return process.y; } )
            .attr('fill', function (process) { return self.color_by_status[process.status];} );

         // update the text of each node
         d3.selectAll('.node_text')
            .attr('x', function (process) { return process.x; })
            .attr('y', function (process) { return process.y; })
            .text(function (process) { return process.pid + " " + process.name;});
      };

      ProcessGraph.prototype.update_graph_view = function (restart) {
         var nodes = this.svg.selectAll('.node')
            .data(this.graph.nodes(), function (gprocess) { return gprocess.pid; });

         nodes.exit()
            .remove()

         var links = this.svg.selectAll('.link').data(this.graph.links());

         links.enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', '#999');

         links.exit()
            .remove();

         var gnodes = nodes.enter()
            .append('g')
            .attr('class', 'node');

         gnodes.append('circle')
            .attr('class', 'circle_node')
            .attr('r', 6)
            .call(this.graph.drag);
         gnodes.append('text')
            .attr('class', 'node_text');

         if (restart) {
            this.graph.start();
         }
         else {
            var self = this;
            (function () { self.update_graph_one_round(); })();
         }
      };

      ProcessGraph.prototype.update_graph_data = function (processes, relations) {
         var pids = [];
         processes.forEach(function (p) { pids.push(p.pid);}, this);
         var graph_modified = false;

         // remove old processes
         var to_remove = [];
         this.graph.nodes().forEach(function (gp, i) {
            if(gp && pids.indexOf(gp.pid) < 0) {
               to_remove.push(i);
            }
         }, this);

         if (to_remove.length) {
            graph_modified = true;
         }

         var offset = 0;
         to_remove.forEach(function (i) { this.graph.nodes().splice(i-offset, 1); offset += 1; }, this);
         
         // update processes
         processes.forEach(function (p) {
            this.graph.nodes().every(function (gp, i) {
               if (gp.pid === p.pid) {
                  for (attr in p) {
                     this.graph.nodes()[i][attr] = p[attr];
                  }
                  return false;
               }
               return true;
            }, this);
         }, this);

         // add new processes
         var gpids = [];
         this.graph.nodes().forEach(function (gp) { gpids.push(gp.pid); }, this); 
         var to_add = [];
         processes.forEach(function (p) {
            if (gpids.indexOf(p.pid) < 0) {
               to_add.push(p);
            }
         }, this);
         if (to_add.length) {
            graph_modified = true;
         }
         to_add.forEach(function (p) {
            this.graph.nodes().push(p);
         }, this);
         
         // remove old links
         var to_remove = [];
         this.graph.links().forEach(function(link, i) {
            var found = false;

            relations.every(function (rel) {
               if(link.source.pid === processes[rel[0]].pid && link.target.pid === processes[rel[1]].pid) {
                  found = true;
                  return false;
               }
               return true;
            }, this);

            if(!found) {
               to_remove.push(i);
            }
         }, this);

         var offset = 0;
         if(to_remove.length) {
            graph_modified = true;
         }
         to_remove.forEach(function (i) {
            this.graph.links().splice(i-offset, 1);
            offset += 1;
         }, this);

         
         // add new links
         var to_add = [];
         relations.forEach(function (rel) {
            var found = false;
            this.graph.links().every(function (link) {
               if (link.source.pid === processes[rel[0]].pid && link.target.pid === processes[rel[1]].pid) {
                  found = true;
                  return false;
               }
               return true;
            }, this);

            if(!found) {
               var source = null;
               var target = null;

               this.graph.nodes().every(function (gp) {
                  if(gp){
                     if(gp.pid === processes[rel[0]].pid) {
                        source = gp;
                     }
                     else if(gp.pid === processes[rel[1]].pid) {
                        target = gp;
                     }
                     
                     if(source !== null && target !== null) {
                        return false;
                     }
                  }
                  return true;
               }, this);

               to_add.push({source: source, target: target});
            }
         }, this);
         
         if (to_add.length) {
            graph_modified = true;
         }
         to_add.forEach(function (link) {
            this.graph.links().push(link);
         }, this);

         return graph_modified;
      };

      ProcessGraph.prototype.update = function (processes, relations) {
         if (this.enabled) {
            var changed_graph_or_link_count = this.update_graph_data(processes, relations);
            this.update_graph_view(changed_graph_or_link_count);
         }
      };

      return ProcessGraph;
   }();

   return {ProcessGraph: ProcessGraph};
});
