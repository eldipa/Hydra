define([ 'event_handler', 'layout' ], function(event_handler, layout) {

	function VarViewer() {
		this.super("Var View");

		this.variables = {};
		this.session_id = null;
		this.log = "";

		this.eventHandler = new event_handler.EventHandler();
		this.eventHandler.init();

		var my_self = this;

		// Espero una nueva session
		this.eventHandler.subscribe('debugger.new-session', function(data) {
			my_self.session_id = data - 0;

			// Me suscribo al evento que se genera cada vez que se detiene el
			// proceso
			my_self.eventHandler.subscribe("gdb." + my_self.session_id
					+ ".type.Exec.klass.stopped", function(data) {

				my_self.eventHandler.publish(my_self.session_id
						+ ".get-variables", "");

			});

			// Me suscribo al evento que da los valores de las variables
			my_self.eventHandler.subscribe("gdb." + my_self.session_id
					+ ".type.Sync.klass.done", function(data) {
				if (data.results && data.results.variables) {
					my_self.variables = data.results.variables;
					var mostrar = JSON.stringify(my_self.variables);
					mostrar = mostrar.replace(/},/g, "} <br/>");
					my_self.log = mostrar;
                                        my_self.render();
				}

			});

		});
	}
	VarViewer.prototype.render = function () {
		this._$rendered_in = $(this.box);
		this._$rendered_in.html(this.log);
	};

	VarViewer.prototype.unlink = function () {
		if (this._$rendered_in) {
			this._$rendered_in.empty();
			this._$rendered_in = null;
		}
	};

	VarViewer.prototype.__proto__ = layout.Panel.prototype;
	
	return {
		VarViewer : VarViewer
	};
});
