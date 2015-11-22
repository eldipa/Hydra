define([ 'jquery', 'layout', 'shortcuts', 'springy', 'springyui', 'event_handler' ], function($, layout, shortcuts,
        Springy, springyui, event_handler) {

    function FD_Redirector() {
        this.super("FD Redirector")

        this._$container = $('<canvas width="800" height="400"> Error al cargar Springy </canvas>');

        this._$out_of_dom = this._$container;

        this.EH = event_handler.get_global_event_handler();

        // make a new graph
        this.graph = new Springy.Graph();
        this.nodes = [];
        this.selectedNodeInfo = null;

        this.pid = 0;
        this.debugger_id = 0;

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
                                // Saco la ultima letra (modo)
                                // para que quede solo el numero
                                // del FD
                                var fd = my_self.selectedNodeInfo["FD"].slice(0, -1);

                                // Vero el modo de apertura del
                                // archivo
                                var modos_posibles = {
                                    "r" : 0,
                                    "w" : 1,
                                    "u" : 2
                                };
                                var modo = modos_posibles[my_self.selectedNodeInfo["FD"].slice(-1)];

                                console.log(fd);
                                console.log(modo);
                                if (file_path) {
                                    console.log(file_path);
                                    shortcuts.gdb_request(my_self.refresh, this.debugger_id,
                                            "gdb-module-stdfd-redirect-redirect_target_to_destine_file", [ fd,
                                                    file_path, modo ]);
                                } else {
                                    console.log("Wont Redirect");
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
        this.debugger_id = thread.get_thread_group_you_belong().debugger_id;
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
                label : "FD: " + fdInfo["FD"] + " " + "NAME: " + fdInfo["NAME"],
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

        child = exec("lsof -p " + this.pid, function(error, stdout, stderr) {

            stdoutByLines = stdout.split("\n");

            var info = [];

            var names = [ "COMMAND", "PID", "USER", "FD", "TYPE", "DEVICE", "SIZE/OFF", "NODE", "NAME" ];

            for (line in stdoutByLines) {

                if (!(line == 0 || line == stdoutByLines.length - 1)) {

                    info.push({});
                    var result = stdoutByLines[line].replace(/\s+/g, "\t").split("\t");

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