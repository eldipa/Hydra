define([ 'event_handler', 'layout', 'jquery' ], function(event_handler, layout, $) {

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
			
			my_self.variables[session_id] = $('<div></div>');
			my_self._$container.append(my_self.variables[session_id]);

			// Me suscribo al evento que se genera cada vez que se detiene el
			// proceso
			my_self.eventHandler.subscribe("gdb." + session_id
					+ ".type.Exec.klass.stopped", function(data) {

				my_self.eventHandler.publish(session_id
						+ ".get-variables", "");

			});

			// Me suscribo al evento que da los valores de las variables
			my_self.eventHandler.subscribe("gdb." + session_id
					+ ".type.Sync.klass.done", function(data) {
				if (data.results && data.results.variables) {
					var mostrar = JSON.stringify(data.results.variables);
					mostrar = mostrar.replace(/},/g, "} <br/>");
					my_self.variables[session_id].replaceWith('<div>'+ mostrar + '</div>');
				}

			});

		});
	}
	
	VarViewer.prototype.render = function() {
		if (this._$out_of_dom) {
			this._$out_of_dom.appendTo(this.box);
			this._$out_of_dom = null;
		}
	};

	VarViewer.prototype.unlink = function() {
		if (!this.$out_of_dom) {
			this.$out_of_dom = this._$container.detach();
		}
	};

	VarViewer.prototype.__proto__ = layout.Panel.prototype;
	
	return {
		VarViewer : VarViewer
	};
});
