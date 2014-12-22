define([ 'event_handler', 'layout', 'jquery' ], function(event_handler, layout, $) {
	
	function StandarInput(){
		this.super("STDIN");
		
		this.eventHandler = new event_handler.EventHandler();
		this.eventHandler.init();

		this._$container = $('<div id = recordSTDIN "></div><div id ="STDIN";"> pid@text:<input id="stdinText" type="text" value=""/> </div>');
		
	};
	
	
	StandarInput.prototype.render = function () {
		this._$rendered_in = $(this.box);
		this._$rendered_in.html(this._$container);
		
		$('#stdinText').data("eventHandler", this.eventHandler);
		
		$('#stdinText').change(function(){//TODO SACAR ESTO DE ACA!!!!
			var text = $(this).val();
			$(this).val('');
			console.log(text);
			var separado = text.split('@');
			$('#recordSTDIN').append(text + '</br>');
			$(this).data("eventHandler").publish(separado[0] + ".stdin", separado[1]);
		});
	};

	StandarInput.prototype.unlink = function () {
		if (this._$rendered_in) {
			this._$rendered_in.empty();
			this._$rendered_in = null;
		}
	};

	StandarInput.prototype.__proto__ = layout.Panel.prototype;
	
	
	return {
		StandarInput : StandarInput
	};
});