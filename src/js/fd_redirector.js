define([ 'jquery', 'layout', 'shortcuts', 'sigma' ], function($, layout,
		shortcuts, sigma) {

	function FD_Redirector() {
		this.super("FD Redirector")

		this._$container = $('<style>#graph-container {top: 0;bottom: 0;left: 0;right: 0;position: absolute;}</style><div id="graph-container"></div>');

		this._$out_of_dom = this._$container;

		var i, s, N = 100, E = 500, g = {
			nodes : [],
			edges : []
		};

		// Generate a random graph:
		for (i = 0; i < N; i++)
			g.nodes.push({
				id : 'n' + i,
				label : 'Node ' + i,
				x : Math.random(),
				y : Math.random(),
				size : Math.random(),
				color : '#666'
			});

		for (i = 0; i < E; i++)
			g.edges.push({
				id : 'e' + i,
				source : 'n' + (Math.random() * N | 0),
				target : 'n' + (Math.random() * N | 0),
				size : Math.random(),
				color : '#ccc'
			});

		// Instantiate sigma:
		s = new sigma({
			graph : g,
			container : this._$container
		});
	};

	FD_Redirector.prototype.__proto__ = layout.Panel.prototype;

	FD_Redirector.prototype.render = function() {
		if (this._$out_of_dom) {
			if ($(this.box).css('position') === 'relative') {
				this._$out_of_dom.css('position', 'absolute');
			} else {
				this._$out_of_dom.css('position', '');
			}

			this._$out_of_dom.appendTo(this.box);
			this._$out_of_dom = null;
		}

	};

	FD_Redirector.prototype.unlink = function() {
		if (!this._$out_of_dom) {
			this._$out_of_dom = this._$container.detach();
		}
	};

	return {
		FD_Redirector : FD_Redirector
	};

});