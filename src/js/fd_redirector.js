define(
        [ 'jquery', 'layout', 'shortcuts', 'springy', 'springyui', 'event_handler' ],
        function($, layout, shortcuts, Springy, springyui, event_handler) {

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
                this.thread = null;

                var my_self = this;

                var emptyNode = this.graph.newNode({
                    label : 'EmpyNode',
                    info : {
                        "f" : "undefined",
                        "n" : "undefined"
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
                                if (my_self.selectedNodeInfo["f"] != "undefined") {
                                    var input_file_dom = $('<input style="display:none;" type="file" />');
                                    input_file_dom.change(function(evt) {
                                        var file_path = "" + $(this).val();
                                        // Saco la ultima letra (modo)
                                        // para que quede solo el numero
                                        // del FD
                                        var fd = my_self.selectedNodeInfo["f"];

                                        // Vero el modo de apertura del
                                        // archivo
                                        var modos_posibles = {
                                            "r" : "0",
                                            "w" : "1",
                                            "u" : "2"
                                        };
                                        var modo = modos_posibles[my_self.selectedNodeInfo["a"]];

                                        if (file_path) {
                                            shortcuts.gdb_request(null, my_self.debugger_id,
                                                    "gdb-module-stdfd-redirect-redirect_target_to_destine_file", [ fd,
                                                            file_path, modo ]);
                                        } else {
                                            console.log("Wont Redirect");
                                        }
                                    });
                                    input_file_dom.trigger('click');
                                }
                            }

                        },
                        {
                            text : "Enable Plugin",
                            action : function(e) {
                                e.preventDefault();
                                shortcuts
                                        .gdb_request(
                                                null,
                                                my_self.debugger_id,
                                                "python import gdb_module_loader; gdb_module_loader.get_module_loader().load('stdioRedirect')",
                                                []);
                                shortcuts.gdb_request(null, my_self.debugger_id, "gdb-module-stdfd-redirect-activate",
                                        []);
                            }
                        } ];

                this._$container.data('ctxmenu_controller', menu_description);

            }
            ;

            FD_Redirector.prototype.follow = function(thread) {
                this.pid = thread.get_thread_group_you_belong().process_id;
                this.debugger_id = thread.get_thread_group_you_belong().debugger_id;
                this.thread = thread;
            }

            FD_Redirector.prototype.refreshGraph = function(DataOfFD) {

                var ignorar = [ "DIR", "REG" ];

                for (node in this.nodes) {
                    this.graph.removeNode(this.nodes[node]);
                }

                var pidNode = this.graph.newNode({
                    label : this.pid,
                    info : {
                        "f" : "undefined",
                        "n" : "undefined"
                    }
                })

                this.nodes.push(pidNode);

                for (fd in DataOfFD) {
                    fdInfo = DataOfFD[fd];
                    var image = undefined;

                    if (ignorar.indexOf(fdInfo["t"]) != -1)
                        continue;

                    if (fdInfo["f"] == 0 || fdInfo["f"] == 1)
                        image = {
                            src : "./IN_AND_OUT.png",
                            width : 120,
                            height : 32
                        };

                    var newNode = this.graph.newNode({
                        label : "FD: " + fdInfo["f"] + " " + "NAME: " + fdInfo["n"],
                        info : fdInfo,
                        image : image
                    });

                    this.nodes.push(newNode);

                    var mode = fdInfo["a"]

                    if (mode == "w" || mode == "u")
                        this.graph.newEdge(pidNode, newNode);

                    if (mode == "r" || mode == "u")
                        this.graph.newEdge(newNode, pidNode);
                }

            }

            /* Salida de LSOF con parametro -F
            a    file access mode
            c    process command name (all characters from proc or
             user structure)
            C    file structure share count
            d    file's device character code
            D    file's major/minor device number (0x<hexadecimal>)
            f    file descriptor
            F    file structure address (0x<hexadecimal>)
            G    file flaGs (0x<hexadecimal>; names if +fg follows)
            g    process group ID
            i    file's inode number
            K    tasK ID
            k    link count
            l    file's lock status
            L    process login name
            m    marker between repeated output
            n    file name, comment, Internet address
            N    node identifier (ox<hexadecimal>
            o    file's offset (decimal)
            p    process ID (always selected)
            P    protocol name
            r    raw device number (0x<hexadecimal>)
            R    parent process ID
            s    file's size (decimal)
            S    file's stream identification
            t    file's type
            T    TCP/TPI information, identified by prefixes (the
             `=' is part of the prefix):
                 QR=<read queue size>
                 QS=<send queue size>
                 SO=<socket options and values> (not all dialects)
                 SS=<socket states> (not all dialects)
                 ST=<connection state>
                 TF=<TCP flags and values> (not all dialects)
                 WR=<window read size>  (not all dialects)
                 WW=<window write size>  (not all dialects)
             (TCP/TPI information isn't reported for all supported
               UNIX dialects. The -h or -? help output for the
               -T option will show what TCP/TPI reporting can be
               requested.)
            u    process user ID
            z    Solaris 10 and higher zone name
            Z    SELinux security context (inhibited when SELinux is disabled)
            0    use NUL field terminator character in place of NL
            1-9  dialect-specific field identifiers (The output
             of -F? identifies the information to be found
             in dialect-specific fields.)
            */

            FD_Redirector.prototype._parseLSOF = function(stdout) {

                if (stdout == "")
                    return null;

                var stdoutByLines = stdout.split("\n");

                var info = [];
                var identifier;
                var specialIdentifiers = {
                    "p" : null,
                    "g" : null,
                    "R" : null,
                    "c" : null,
                    "u" : null,
                    "L" : null
                };

                for (line in stdoutByLines) {

                    identifier = stdoutByLines[line].charAt(0);

                    if (identifier == "f") {
                        info.push({});
                        for (specialId in specialIdentifiers) {
                            info[info.length - 1][specialId] = specialIdentifiers[specialId];
                        }
                    }

                    if (identifier in specialIdentifiers)
                        specialIdentifiers[identifier] = stdoutByLines[line].substring(1);
                    else
                        info[info.length - 1][identifier] = stdoutByLines[line].substring(1);
                }

                return info;

            }

            FD_Redirector.prototype.refresh = function() {
                var exec = require('child_process').exec, child;

                var my_self = this;

                child = exec("lsof -w -F -p " + this.pid, function(error, stdout, stderr) {

                    my_self.FDInfo = my_self._parseLSOF(stdout);

                    if (my_self.FDInfo)
                        my_self.refreshGraph(my_self.FDInfo);

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