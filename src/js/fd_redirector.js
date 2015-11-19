define(
		[ 'jquery', 'layout', 'shortcuts', 'springy', 'springyui' ],
		function($, layout, shortcuts, Springy, springyui) {

			function FD_Redirector() {
				this.super("FD Redirector")

				this._$container = $('<canvas width="800" height="400"> Error al cargar Springy </canvas>');

				this._$out_of_dom = this._$container;

				// make a new graph
				this.graph = new Springy.Graph();
				this.nodes = [];
				this.selectedNodeInfo = null;

				this.pid = 0;
				this.gdb = 0;

				var my_self = this;

				var emptyNode = this.graph.newNode({
					label : 'EmpyNode',
					info : {
						"COMMAND" : "undefined",
						"PID" : "undefined",
						"USER" : "undefined",
						"FD" : "undefined",
						"TYPE" : "undefined",
						"DEVICE" : "undefined",
						"SIZE/OFF" : "undefined",
						"NODE" : "undefined",
						"NAME" : "undefined"
					}
				});
				this.nodes.push(emptyNode);

				this._$container.springy({
					graph : this.graph,
					nodeSelected : function(node) {
						my_self.selectedNodeInfo = node.data.info;
					}
				});

				// Creo el menu contextual
				var menu_description = [
						{
							header : 'A este FD'
						},
						{
							text : 'Redirect',
							action : function(e) {
								e.preventDefault();
								if (my_self.selectedNodeInfo["FD"] != "undefined") {
									var input_file_dom = $('<input style="display:none;" type="file" />');
									input_file_dom.change(function(evt) {
										var file_path = "" + $(this).val();
										if (file_path) {
											console.log(file_path);
										} else {
											console.log("Loading nothing");
										}
									});
									input_file_dom.trigger('click');
								}
							}

						} ];

				this._$container.data('ctxmenu_controller', menu_description);

			}
			;

			FD_Redirector.prototype.follow = function(thread) {
				this.pid = thread.get_thread_group_you_belong().process_id;
				this.gdb = thread.get_thread_group_you_belong().debugger_id;
			}

			FD_Redirector.prototype.refreshGraph = function(DataOfFD) {

				var ignorar = [ "DIR", "REG" ];

				for (node in this.nodes) {
					this.graph.removeNode(this.nodes[node]);
				}

				var pidNode = this.graph.newNode({
					label : this.pid,
					info : {
						"COMMAND" : "undefined",
						"PID" : "undefined",
						"USER" : "undefined",
						"FD" : "undefined",
						"TYPE" : "undefined",
						"DEVICE" : "undefined",
						"SIZE/OFF" : "undefined",
						"NODE" : "undefined",
						"NAME" : "undefined"
					}
				})

				this.nodes.push(pidNode);

				for (fd in DataOfFD) {
					fdInfo = DataOfFD[fd];

					if (ignorar.indexOf(fdInfo["TYPE"]) != -1)
						continue;

					var newNode = this.graph.newNode({
						label : "FD: " + fdInfo["FD"] + " " + "NAME: "
								+ fdInfo["NAME"],
						info : fdInfo
					});

					this.nodes.push(newNode);

					var mode = fdInfo["FD"].charAt(fdInfo["FD"].length - 1)

					if (mode == "w" || mode == "u")
						this.graph.newEdge(pidNode, newNode);

					if (mode == "r" || mode == "u")
						this.graph.newEdge(newNode, pidNode);
				}

			}

			// lsof retorna en esta forma: COMMAND PID USER FD TYPE DEVICE
			// SIZE/OFF NODE NAME

			FD_Redirector.prototype.refresh = function() {
				var exec = require('child_process').exec, child;

				var my_self = this;

				child = exec(
						"lsof -p " + this.pid,
						function(error, stdout, stderr) {

							stdoutByLines = stdout.split("\n");

							var info = [];

							var names = [ "COMMAND", "PID", "USER", "FD",
									"TYPE", "DEVICE", "SIZE/OFF", "NODE",
									"NAME" ];

							for (line in stdoutByLines) {

								if (!(line == 0 || line == stdoutByLines.length - 1)) {

									info.push({});
									var result = stdoutByLines[line].replace(
											/\s+/g, "\t").split("\t");

									for (data in result) {
										info[info.length - 1][names[data]] = result[data];
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