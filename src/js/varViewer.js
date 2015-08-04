define([ 'event_handler', 'layout', 'jquery' ], function(event_handler, layout,
		$) {

	function VarViewer() {
		this.super("Var View");

		this.variables = {};

		this.eventHandler = new event_handler.EventHandler();
		this.eventHandler.init();

		this._$container = $('<div></div>');

		this._$out_of_dom = this._$container;

		var my_self = this;

		// Espero una nueva session
		this.eventHandler.subscribe('debugger.new-session', function(data) {
			var session_id = data - 0;
			var target_pid = 0;

			my_self.variables[session_id] = $('<div></div>');
			my_self._$container.append(my_self.variables[session_id]);

			// Me suscribo al evento que se genera cada vez que se detiene el
			// proceso
			my_self.eventHandler.subscribe("gdb." + session_id
					+ ".type.Exec.klass.stopped",
					function(data) {

						my_self.eventHandler.publish(session_id
								+ ".get-variables", "");

					});

			my_self.eventHandler.subscribe("debugger.new-target." + session_id,
					function(data) {

						target_pid = data.targetPid;

					});

			// Me suscribo al evento que da los valores de las variables
			my_self.eventHandler.subscribe("gdb." + session_id
					+ ".type.Sync.klass.done", function(data) {
				if (data.results && data.results.variables) {

					var lista = "<ul><li>" + target_pid + "<ul>";

					var divide = function(lista, value) {
						var separado;
						do {
							separado = value.split(',', 1);
							value = value.slice(separado[0].length + 1);
							if (separado[0] != "") {
								lista += "<li>" + separado[0] + "</li>";
							}
						} while (separado[0] != "");
						
						
						return lista;
					};

					for (variable in data.results.variables) {
						var nombre = data.results.variables[variable].name;
						var value = data.results.variables[variable].value;
						value = $('<i></i>').text(value).html();

						if (value[0] == '{') {
							lista += "<li>" + nombre + "<ul>"
							console.log(value);
							lista = divide(lista, value);

							lista += "</ul></li>";
						} else {
							lista += "<li>" + nombre + " = " + value + "</li>";
						}
					}

					lista += "</ul></li></ul>";

					my_self.variables[session_id].html('<div>' + lista
							+ '</div>');
				}

			});

		});
	}

	VarViewer.prototype.render = function() {
		/*if (this._$out_of_dom) {
			this._$out_of_dom.appendTo(this.box);
			this._$out_of_dom = null;
		}*/
	};

	VarViewer.prototype.unlink = function() {
		/*if (!this.$out_of_dom) {
			this.$out_of_dom = this._$container.detach();
		}*/
	};

	VarViewer.prototype.__proto__ = layout.Panel.prototype;

	return {
		VarViewer : VarViewer
	};
});
