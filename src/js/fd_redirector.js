define([ 'jquery', 'layout', 'shortcuts', 'springy', 'springyui' ],
		function($, layout, shortcuts, Springy, springyui) {

			function FD_Redirector() {
				this.super("FD Redirector")

				this._$container = $('<canvas width="800" height="400"> Error al cargar Springy </canvas>');

				this._$out_of_dom = this._$container;

				// Ejemplo tipo hola mundo

				// make a new graph
				this.graph = new Springy.Graph();
				this.nodes = []
				this.FDInfo = []
				
				var emptyNode = this.graph.newNode({
					label : 'EmpyNode'
				});
				this.nodes.push(emptyNode);
				
				//TODO Sacar este hardcode
//				this.followPID(2601);
//				this.refresh();
				

				this._$container.springy({
					graph : this.graph
				});

			}
			;
			
			FD_Redirector.prototype.followPID = function (pid) {
				this.pid = pid
			}

			
			FD_Redirector.prototype.refreshGraph = function(DataOfFD) {
				
				for (node in this.nodes){
					this.graph.removeNode(this.nodes[node]);
				}
				
				var pidNode = this.graph.newNode({
					label : this.pid
				})
				
				this.nodes.push(pidNode);
				
				for (fd in DataOfFD){
					fdInfo = DataOfFD[fd];
					
					var newNode = this.graph.newNode({
						label : fdInfo["NAME"]
					});
					
					this.nodes.push(newNode);
					
					var mode = fdInfo["FD"].charAt(fdInfo["FD"].length -1)
					
					if( mode == "w" || mode == "u" )
						this.graph.newEdge(pidNode, newNode);
					
					if( mode == "r" || mode == "u" )
						this.graph.newEdge(newNode, pidNode);
				}
				
				
				this._$container.springy({
					graph : this.graph
				});
				
			}
			
			
			// lsof retorna en esta forma: COMMAND PID USER FD TYPE DEVICE
			// SIZE/OFF NODE NAME

			FD_Redirector.prototype.refresh = function() {
				var exec = require('child_process').exec, child;

				var my_self = this;
				
				child = exec("lsof -p " + this.pid, function(error, stdout, stderr) {
					
					stdoutByLines = stdout.split("\n");
					
					var info = [];
					
					var names = ["COMMAND","PID","USER","FD","TYPE","DEVICE","SIZE/OFF","NODE","NAME"];
					
					for(line in stdoutByLines){
						
						if (!(line == 0 || line == stdoutByLines.length-1)){
							
							info.push({});
							var result = stdoutByLines[line].replace(/\s+/g,"\t").split("\t");
							
							for (data in result){
								info[info.length -1][names[data]] = result[data];
							}
						}
					}

					if (error !== null) {

						console.log('lsof ERROR: ' + error);

					}
					
					my_self.FDInfo = info;
					
					my_self.refreshGraph(info);
					
				});

			};

			FD_Redirector.prototype.render = function() {
				if (this._$out_of_dom) {

					this._$out_of_dom.appendTo(this.box);
					this._$out_of_dom = null;

				}

			};

			FD_Redirector.prototype.unlink = function() {
				if (!this._$out_of_dom) {
					this._$out_of_dom = this._$container.detach();
				}
			};

			FD_Redirector.prototype.__proto__ = layout.Panel.prototype;

			return {
				FD_Redirector : FD_Redirector
			};

		});