define([ 'jquery', 'layout', 'shortcuts', 'springy', 'springyui' ],
		function($, layout, shortcuts, Springy, springyui) {

			function FD_Redirector() {
				this.super("FD Redirector")

				this._$container = $('<canvas width="400" height="200"> Error al cargar Springy </canvas>');

				this._$out_of_dom = this._$container;

				// Ejemplo tipo hola mundo

				// make a new graph
				graph = new Springy.Graph();

//				// make some nodes
//				var spruce = graph.newNode({
//					label : 'Norway Spruce'
//				});
//				var fir = graph.newNode({
//					label : 'Sicilian Fir'
//				});
//
//				// connect them with an edge
//				graph.newEdge(spruce, fir);
//				graph.newEdge(fir, spruce);
				
				this.getFDfromPID(2785);

				this._$container.springy({
					graph : graph
				});

			}
			;

			// lsof retorna en esta forma: COMMAND PID USER FD TYPE DEVICE
			// SIZE/OFF NODE NAME

			FD_Redirector.prototype.getFDfromPID = function(pid) {
				var exec = require('child_process').exec, child;
				
				var fdInfo;
				
				child = exec("lsof -p " + pid, function(error, stdout, stderr) {
					
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
					
					console.log(info);

					if (error !== null) {

						console.log('lsof ERROR: ' + error);

					}
					
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