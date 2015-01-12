define([ 'event_handler', 'layout', 'jquery' ], function(event_handler, layout,
		$) {

	function StandarInput() {
		this.super("STDIN");

		this.eventHandler = new event_handler.EventHandler();
		this.eventHandler.init();

		this.input = $('<input type="text" value=""/>');
		this.stdin = $('<div> pid@text: </div>');
		this.stdin.append(this.input);
		this.record = $('<div></div>');

		this._$container = $('<div></div>');
		this._$container.append(this.record);
		this._$container.append(this.stdin);

		this._$out_of_dom = this._$container;

		var my_self = this;

		$(document).ready(
				function() {
					my_self.input.change(function() {
						var text = $(this).val();
						$(this).val('');
						console.log(text);
						var separado = text.split('@');
						if (separado.length == 2) {
							my_self.record.append(text + '</br>');
							if (separado[1] == "EOF") {
								my_self.eventHandler.publish(separado[0]
								+ ".stdin.eof", "");
							} else {
								my_self.eventHandler.publish(separado[0]
										+ ".stdin", separado[1]);
							}
						}
					});
				});
	}
	;

	StandarInput.prototype.render = function() {
		if (this._$out_of_dom) {
			this._$out_of_dom.appendTo(this.box);
			this._$out_of_dom = null;
		}
	};

	StandarInput.prototype.unlink = function() {
		if (!this.$out_of_dom) {
			this.$out_of_dom = this._$container.detach();
		}
	};

	StandarInput.prototype.__proto__ = layout.Panel.prototype;

	return {
		StandarInput : StandarInput
	};
});