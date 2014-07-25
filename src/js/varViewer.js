define([ 'event_handler' ], function(event_handler) {

	function VarViewer() {
		this.ui = null;

		this.variables = {};
		this.session_id = null;

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
					my_self.ui.content("right", mostrar);
				}

			});

		});
	}

	VarViewer.prototype = {
		setUI : function(ui) {
			this.ui = ui;
		}
	};

	return {
		VarViewer : VarViewer
	};
});
