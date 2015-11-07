define([ 'jquery', 'layout', 'shortcuts', 'springy', 'springyui' ], function($, layout,
		shortcuts, Springy, springyui) {

	function FD_Redirector() {
		this.super("FD Redirector")

		this._$container = $('<canvas width="400" height="200"> Error al cargar Springy </canvas>');

		this._$out_of_dom = this._$container;
		
		
		// make a new graph
		this.graph = new Springy.Graph();

		// make some nodes
		var spruce = this.graph.newNode({label: 'Norway Spruce'});
		var fir = this.graph.newNode({label: 'Sicilian Fir'});

		// connect them with an edge
		this.graph.newEdge(spruce, fir);
		this.graph.newEdge(fir, spruce);
		
//		this._$container.springy({ graph: graph });

	}
	;

	FD_Redirector.prototype.render = function() {
		if (this._$out_of_dom) {

			this._$out_of_dom.appendTo(this.box);
			this._$out_of_dom = null;
			
			this._$container.springy({ graph: this.graph });
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