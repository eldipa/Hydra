define([ 'jquery', 'layout', 'shortcuts', 'event_handler', 'd3' ], function($, layout, shortcuts, event_handler, d3) {

    function ProcessView() {
        this.super("Process View");

        this._$container = $('<div style="width: 100%; height: 100%;"> </div>');

        this._$out_of_dom = this._$container;

        this.EH = event_handler.get_global_event_handler();   
        
        var my_self = this;
        
        this.initValues();
        
        this.configGraph();
        
        this.configureCtxMenu();
        
        this.configureEventsSubscription()  
        
    };
    
    ProcessView.prototype.initValues = function() {
    	//tick
    	this.skipFrame = 1; //Modificar este valor para saltaear frame de renderizado, debe ser mayor a 0
    	
    	//force
    	this.charge = -1000;
    	this.linkDistance = 30;
    	
    	//nodes
    	this.smallRadius = 8;
    	this.bigRadius = 30;

	}
    
    ProcessView.prototype.configureEventsSubscription = function() {
    	var my_self = this;
    	
    	this.EH.subscribe('processInfo.info', function(data) {
    		
    		var update = false;

        	if (data.add.length >0){
	        	my_self.addNodes(data.add);
	        	update = true
        	}
        	
        	if (data.remove.length >0){
	        	my_self.removeNodes(data.remove);
	        	update = true
        	}
        	
        	if (update){
        		my_self.updateGraph();
        	}
        });
    	
    	this.EH.publish('processInfo.restart',{});
    }
  
    ProcessView.prototype.configGraph = function() {
    	var my_self = this;
    	
    	//Set up the force layout
        this.force = d3.layout.force().charge(this.charge).linkDistance(this.linkDistance);
        
        this.nodes = this.force.nodes();
        this.links = this.force.links();
        
        this.zoom = d3.behavior.zoom().on("zoom", function() {my_self.autoPanZoom()});
        
        var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", this.dragstarted)
        .on("drag", this.dragged)
        .on("dragend", this.dragended);

        var margin = {top: -5, right: -5, bottom: -5, left: -5};
        
        //Append a SVG to the body of the html page. Assign this SVG as an object to svg
        this.svg = d3.select(this._$container.get(0)).append("svg").attr('style', 'width: 100%; height: 100%;');

        this.rect = this.svg.append("g").append("rect")
            .attr("width", this._$container.width())
            .attr("height", this._$container.height())
            .style("fill", "none")
            .style("pointer-events", "all")
            .call(this.zoom);
            
        this.g = this.svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.right + ")")
            .call(this.zoom);
        
        this.g_links = this.g.append("g");
        this.g_nodes = this.g.append("g");
        
        this.tooltip = d3.select($(this._$container).get(0)).append("div").attr("class", "tooltip").style("opacity", 0);
               
		this.createZoomControl(); 
    };
    
    ProcessView.prototype.addNodes = function (nodeList) {
    	for ( var node in nodeList) {
    		this.nodes.push(nodeList[node]);
		}
    };
    
    ProcessView.prototype.removeNodes = function (nodeList) {
        for ( var node in nodeList) {
        	var nodeIndex = this.findNodeIndex(nodeList[node].pid);
        	if(nodeIndex != -1)
        		this.nodes.splice(nodeIndex, 1);
		}
        
    };
    
    ProcessView.prototype.findNodeIndex = function (pid) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].pid == pid) {
                return i;
            }
        };
        return -1;
    };
    
    ProcessView.prototype.findNode = function (pid) {
        for (var i in this.nodes) {
            if (this.nodes[i]["pid"] === pid) return this.nodes[i];
        };
        return undefined;
    };
    
    ProcessView.prototype.updateLinks = function (add) {
    	this.links.splice(0, this.links.length);
    	for (var node in this.nodes) {
    		if(this.nodes[node].ppid != "0"){
    			var sourceNode = this.findNode(this.nodes[node].ppid);
    			var targetNode = this.findNode(this.nodes[node].pid);
    			if(sourceNode && targetNode)
    				this.links.push({"source": sourceNode, "target": targetNode, "value":1})
    		}
		}
    };
    
    
    ProcessView.prototype.tickConfig = function() {
    	//Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
        var tickCount = 0;
        
        var my_self = this;
        
        this.force.on("tick", function() {
            tickCount = tickCount + 1;
            if (tickCount % my_self.skipFrame == 0) {
            	my_self.link.attr("x1", function(d) {
                    return d.source.x;
                }).attr("y1", function(d) {
                    return d.source.y;
                }).attr("x2", function(d) {
                    return d.target.x;
                }).attr("y2", function(d) {
                    return d.target.y;
                });

            	my_self.node.attr("cx", function(d) {
                    return d.x;
                }).attr("cy", function(d) {
                    return d.y;
                });
            }
            ;
        });
    };
    
    
    ProcessView.prototype.updateGraph = function() {
		var color = d3.scale.category20();
		var my_self = this;
		
		this.updateLinks();
		
		this.link = this.g_links.selectAll(".link")
	    .data(this.links, function (d) {
	    	if(!d.source || !d.target)
	    		console.log(JSON.stringify(d))
	        return d.source.pid + "-" + d.target.pid;
	    });
	
		this.link.enter().append("g").append("line")
		        .attr("id", function (d) {
		            return d.source.pid + "-" + d.target.pid;
		        })
		        .attr("stroke-width", function (d) {
		            return d.value;
		        })
		        .attr("class", "link");

		this.link.exit().remove();
		

		
		this.node = this.g_nodes.selectAll(".node")
		        .data(this.nodes, function (d) {
		            return d.pid;
		        });
		
		var nodeEnter = this.node.enter().append("g").on("dblclick", this.dblclick);
		
		nodeEnter.append("svg:circle").attr("class", "node").attr("r", this.smallRadius)
		      .style("fill", function(d) {
		      		return color(Math.floor((Math.random() * 20) + 1));
		      	}).call(this.force.drag).on("mouseover",
		          function(d, i) {
		          	// disable zoom
		          	my_self.g.on(".zoom", null);
		          	my_self.tooltip.transition().duration(200).style("opacity", .9);
		          	my_self.tooltip.html(d.command + " " + d.pid).style("left", (d3.event.pageX) + "px").style("top",
		                      (d3.event.pageY - 28) + "px");
		          }).on("mouseout", function(d) {
		          	my_self.tooltip.transition().duration(500).style("opacity", 0);
		          	//reenable zoom
		          	my_self.g.call(my_self.zoom);
		      });
		
		this.node.exit().remove();
		
		this.node = this.g.selectAll(".node"); 
		this.link = this.g.selectAll(".link");
		
		this.tickConfig();
		
		// Restart the force layout.
        this.force.charge(this.charge).linkDistance(this.linkDistance).start();

    	
    };
    
    ProcessView.prototype.startAnimation = function() {
    	this.force.start();
    };
    
    ProcessView.prototype.stopAnimation = function() {
    	this.force.stop();
    };
    
    ProcessView.prototype.dragstarted = function(d) {
    	d3.event.sourceEvent.stopPropagation();
  	  	d3.select(this).classed("dragging", true);
    };
    
    ProcessView.prototype.dragged = function(d) {
    	d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    };
    
    ProcessView.prototype.dragended = function(d) {
    	d3.select(this).classed("dragging", false);
    };
    
    
    //Resize: Cambia el tamaño del cuadro donde se dibuja el grafo
    ProcessView.prototype.resize = function() {
    	width = this._$container.width(), height = this._$container.height();
        this.svg.attr("width", width).attr("height", height);
        this.rect.attr("width", width).attr("height", height);
        this.force.size([ width, height ]).resume();
    };
    
    //Rescale: cambia el zoom del grafo segun la rueda del mouse
    ProcessView.prototype.autoPanZoom = function() {
    	trans=d3.event.translate;
  	  	scale=d3.event.scale;

  	  	this.g.attr("transform",
  	      "translate(" + trans + ")"
  	      + " scale(" + scale + ")");
    };
    
    ProcessView.prototype.manualPan = function(dx, dy) {
    	var currentx = d3.transform(this.g.attr("transform")).translate[0];
    	var currenty = d3.transform(this.g.attr("transform")).translate[1];
    	var currentScale = d3.transform(this.g.attr("transform")).scale[0];
    	
    	trans = (currentx + dx) + "," + (currenty + dy);
    	this.g.attr("transform",
      	      "translate(" + trans + ")"
      	      + " scale(" + currentScale + ")");
    	
    	this.zoom.scale(currentScale);
    	this.zoom.translate([currentx + dx, currenty + dy]);
    };
    
    ProcessView.prototype.manualZoom = function(scale) {
    	var currentx = d3.transform(this.g.attr("transform")).translate[0];
    	var currenty = d3.transform(this.g.attr("transform")).translate[1];
    	var currentScale = d3.transform(this.g.attr("transform")).scale[0];
    	var newScale = scale * currentScale;
    	trans = currentx  + "," +currenty ;
    	
    	this.g.attr("transform",
        	      "translate(" + trans + ")"
        	      + " scale(" + newScale + ")");
    	
    	this.zoom.scale(newScale);
    	this.zoom.translate([currentx, currenty]);
    };
    
    ProcessView.prototype.createZoomControl = function() {
    	//Control de zoom y pan manual
    	var my_self = this;
    	
        this.svg.append("circle").attr("cx", 50).attr("cy", 50).attr("r", 42).attr("fill", "white").attr("opacity", "0.75");
        
        this.svg.append("path").attr("d", "M50 10 l12   20 a40, 70 0 0,0 -24,  0z").attr("class", "button").on("click", function() {my_self.manualPan( 0, 50)});
        this.svg.append("path").attr("d", "M10 50 l20  -12 a70, 40 0 0,0   0, 24z").attr("class", "button").on("click", function() {my_self.manualPan( 50, 0)});
        this.svg.append("path").attr("d", "M50 90 l12  -20 a40, 70 0 0,1 -24,  0z").attr("class", "button").on("click", function() {my_self.manualPan( 0, -50)});
        this.svg.append("path").attr("d", "M90 50 l-20 -12 a70, 40 0 0,1   0, 24z").attr("class", "button").on("click", function() {my_self.manualPan( -50, 0)});
        
        this.svg.append("circle").attr("cx", 50).attr("cy", 50).attr("r", 20).attr("class", "compass");
        this.svg.append("circle").attr("cx", 50).attr("cy", 41).attr("r", 8).attr("class", "button").on("click", function() {my_self.manualZoom(0.8)});
        this.svg.append("circle").attr("cx", 50).attr("cy", 59).attr("r", 8).attr("class", "button").on("click", function() {my_self.manualZoom(1.2)});
        
        this.svg.append("rect").attr("x", 46).attr("y", 39.5).attr("width", 8).attr("height", 3).attr("class", "plus-minus");
        this.svg.append("rect").attr("x", 46).attr("y", 57.5).attr("width", 8).attr("height", 3).attr("class", "plus-minus");
        this.svg.append("rect").attr("x", 48.5).attr("y", 55).attr("width", 3).attr("height", 8).attr("class", "plus-minus");

    };
    
    
    ProcessView.prototype.configureCtxMenu = function () {
    	my_self = this;
    	
    	getNodeFromEvent = function(event) {
    		var node = event.target.__data__;
			return node
		}
    	
    	this._$container.data('do_observation', function (ev, el) { 
            return {
                target: my_self, 
                context: getNodeFromEvent(ev)
                }; 
    	});
    }
    
    
    
    ProcessView.prototype.get_display_controller = function (node) {
    	var my_self = this;
    	
    	var debug = {
        	    text: 'Debug this',
        	    action: function(e){
        	    	my_self.EH.publish("attachTo", {"process": node.pid})
        	    }
        	   };
    	
    	var anchor = {
           	    text: 'Toggle anchor',
           	    action: function(e){
           	    	node.fixed = !node.fixed;
           	    }
           	   };
    	
    	return [{
    	    header: node.command + " (" + node.pid + ")"
    	   },
    	   debug,
    	   anchor
    	   ];
    	};
    	
    	
	// action to take on mouse double click
	ProcessView.prototype.dblclick = function() {
	    var circle = d3.select(this).select("circle");
	    var IsBig = JSON.parse(circle.attr("IsBig"));
	    if (!IsBig){
	    	circle.transition().duration(750).attr("r", my_self.bigRadius).style("fill", "#ccc");
	    	circle.attr("IsBig", true);
	    }else{
	    	circle.transition().duration(750).attr("r", my_self.smallRadius).style("fill", "#ccc");
	    	circle.attr("IsBig", false);
	    }
//	    d3.select(this).select("text").transition()
//	        .duration(750)
//	        .attr("x", 12)
//	        .style("stroke", "none")
//	        .style("fill", "black")
//	        .style("stroke", "none")
//	        .style("font", "10px sans-serif");
	}
    
   
    ProcessView.prototype.render = function() {
        if (this._$out_of_dom) {

            this._$out_of_dom.appendTo(this.box);
            this._$out_of_dom = null;

        }
        
        this.resize();

    };

    ProcessView.prototype.unlink = function() {
        if (!this._$out_of_dom) {
            this._$out_of_dom = this._$container.detach();
        }
    };

    ProcessView.prototype.__proto__ = layout.Panel.prototype;

    return {
        ProcessView : ProcessView
    };

});
