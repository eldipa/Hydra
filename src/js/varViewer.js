define([ 'w2ui', 'event_handler', 'jquery' ], function(w2ui, event_handler, $) {

	function VarViewer() {
		this.ui = null;

		this.variables = {};
		this.session_id = null;

		this.event_handler = new event_handler.EventHandler();
		this.event_handler.init();

		// Espero una nueva session
		this.event_handler.subscribe('debugger.new-session', function(data) {
			this.session_id = data - 0;

			// Me suscribo al evento que se genera cada vez que se detiene el
			// proceso
			this.event_handler.subscribe("gdb." + this.session_id
					+ ".type.Exec.klass.stopped", function(data) {

				this.event_handler.publish(this.session_id + ".get-variables", "");

			});

			// Me suscribo al evento que da los valores de las variables
			this.event_handler.subscribe("gdb." + this.session_id
					+ ".type.Sync.klass.done", function(data) {
				if (data.results && data.results.variables) {
					this.variables = data.results.variables;
					this.ui.content("right", this.variables);
				}

			});

		});
	}

	VarViewer.prototype = {
		setUI : function(ui) {
			this.ui = ui;
		}
	};

	var visor = new VarViewer();

	return {visor: visor};
});
