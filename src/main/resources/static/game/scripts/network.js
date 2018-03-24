//window.addEventListener("load", init, false);

ZEPR.Net = function(_token, _callback, _zepr) {
	
	this.token = _token;
	this.callback = _callback;
	this.socket = null;
	this.zepr = _zepr;
}

ZEPR.Net.prototype = {
		
	connect : function(_service) {
		
		var url = null;
		
		if (window.location.protocol == 'http:') {
			url = 'ws://';
		} else {
			url = 'wss://';
		}
		url += window.location.host + _service;
		
		if ('WebSocket' in window) {
			this.socket = new WebSocket(url);
		} else if ('MozWebSocket' in window) {
			this.socket = new MozWebSocket(url);
	    } else {
	    	alert('Error: WebSocket is not supported by this browser.');
	    	return;
	    }

		this.socket.onopen = (function () {
			this.sendMessage({
				type: 'srv::',
				cmd: 'connect',
				token: this.token
			});					
		}).bind(this);

		this.socket.onclose = (function () {			
			var msg = {};
			msg.cmd = 'close';
			
			if (this.callback) {
				this.callback(msg, this.zepr);
			}
		}).bind(this);

		this.socket.onmessage = (function (_raw) {
			if (this.callback) {
				this.callback(JSON.parse(_raw.data), this.zepr);
			}
		}).bind(this);
		
	},

	setCallback: function(_callback) {
		this.callback = _callback;
	},
	
	sendMessage : function(_msg) {
		if (this.socket.readyState == 1) {
			if (typeof _msg !== 'string') {
				_msg = JSON.stringify(_msg);
			}
			this.socket.send(_msg);
		}
	}
}