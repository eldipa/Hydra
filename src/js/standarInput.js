define([ 'event_handler', 'layout', 'jquery' ], function(event_handler, layout,
		$) {

	function StandarInput() {
		this.super("STDIN");

		this.eventHandler = new event_handler.EventHandler();
		this.eventHandler.init();

		this.input = $('<input type="text" value=""/>');
		this.stdin = $('<div> pid@text: </div>');
		this.stdin.append(this.input);
		this.fileStdin = $('<div> pid@file: </div>');
		this.fileInput = $('<input type="text" value=""/>');
		this.fileStdin.append(this.fileInput);
		this.record = $('<div></div>');

		this._$container = $('<div></div>');
		this._$container.append(this.record);
		this._$container.append(this.fileStdin);
		this._$container.append(this.stdin);

		this._$out_of_dom = this._$container;

		var my_self = this;

		$(document).ready(
				function() {
					my_self.input.change(function() {
						var text = $(this).val();
						$(this).val('');
//						console.log(text);
						var separado = text.split('@');
						if (separado.length == 2) {
							my_self.record.append(text + '</br>');
							if (separado[1] == "EOF") {
								my_self.eventHandler.publish(separado[0]
										+ ".stdin.eof", "");
							} else {
								my_self.eventHandler.publish(separado[0]
										+ ".stdin.txt", separado[1]);
							}
						}
					});

					my_self.fileInput.change(function() {
						var text = $(this).val();
						$(this).val('');
//						console.log(text);
						var separado = text.split('@');
						if (separado.length == 2) {
							my_self.record.append('file:' + text + '</br>');
							my_self.eventHandler.publish(separado[0]
									+ ".stdin.file", separado[1]);
						}
					});
				});
	};


	StandarInput.prototype.__proto__ = layout.Panel.prototype;
        layout.implement_render_and_unlink_methods(StandarInput.prototype);

	return {
		StandarInput : StandarInput
	};
});
