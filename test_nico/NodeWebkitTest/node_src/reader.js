/**
 * New node file
 */

var s = require('net').Socket();
s.connect(5555, 'localhost');

var pid = 0;
var nextTab = 0

addTab = function(pid){
	nextTab = $('#tabs li').size();
	
	// create the tab
  	$('<li><a href="#proceso'+nextTab+'" data-toggle="tab">Proceso '+ nextTab+'</a></li>').appendTo('#tabs');
  	
  	// create the tab content
  	$('<div class="tab-pane" id="proceso'+nextTab+'"></div>').appendTo('#contenidos');
    
};

s.on('data', function(d){
	var patt1=new RegExp("@pid@");
	if (patt1.test(d.toString())){
		var pid = d.toString().substr(5);	
		addTab(pid);
	}
	else{
	    var p = document.createElement("p");
	    p.innerHTML = d;
	    document.getElementById('proceso'+nextTab).appendChild(p);
    }
});
