var MULTI = {};

// init
MULTI.player = 'Anonymous';
MULTI.activeSlot = null;

MULTI.connect = function(_host) {
    if ('WebSocket' in window) {
    	MULTI.socket = new WebSocket(_host);
    } else if ('MozWebSocket' in window) {
    	MULTI.socket = new MozWebSocket(_host);
    } else {
        Alert('Error: WebSocket is not supported by this browser.');
        return;
    }

    MULTI.socket.onopen = function () {
    	var msg = {};
    	msg.cmd = 'connect';
    	msg.name = MULTI.player;    	
    	
    	MULTI.sendMessage(msg);
    };

    MULTI.socket.onclose = function () {            
    	// TODO : Reconnect
    	//alert('closed!');
    	console.log('<<< Arena closed <<<<<<<<<<<<<<<<<<<<<<<');
    };

    MULTI.socket.onmessage = MULTI.onMessage;
};

MULTI.sendMessage = function(_msg) {
		
	if (typeof _msg !== 'string') {
		_msg = JSON.stringify(_msg);
	}
	
	console.log('>> write: ' + _msg);
	
    if (MULTI.socket) {
    	MULTI.socket.send(_msg);
    } else {
    	alert('WebSocket is not initialized.')
    }
};

MULTI.onMessage = function(_raw) {
	var data = JSON.parse(_raw.data);

	console.log('<<  read: ' + _raw.data);
	//console.log('cmd=' + msg.cmd);
	
    switch (data.cmd) {
    	case 'connect':
    		MULTI.id = data.message;
    		var listMsg = {};
    		listMsg.cmd = 'list';
    		
    		MULTI.sendMessage(listMsg);
    		break;
    	case 'auth':
    		if (data.success) {
    			MULTI.popup.login.classList.toggle('popup-show');
				sessionStorage.player = MULTI.player;
				MULTI.showPlayer();
    		} else {
				if (sessionStorage.player) {
					MULTI.player = sessionStorage.player;
				} else {
    				MULTI.player = 'Anonymous';
				}
    			alert(data.message); // TODO
    		}
    		
    		break;
    	case 'list':
    		var slots = data.payload;
    		for (var i = 0; i < slots.length; i++) {
    			MULTI.updateSlot(MULTI.slots[slots[i].id], slots[i]);
    		}    		
    		break;
    	case 'own':
    		if (data.success) {
    			// Change state to config
    			MULTI.activeSlot.state = 'config';
    			MULTI.activeSlot.players = [ MULTI.player ];
    			MULTI.activeSlot.owner = true;
    			    			    			
    			MULTI.popup.create.classList.toggle('popup-show');
    		} else {
    			MULTI.activeSlot = null;
    			
    			// TODO : Afficher popup d'echec    			
    			alert(data.message); // Temporaire
    		}
    		break;
    	case 'update':
    		MULTI.updateSlot(MULTI.slots[data.payload.id], data.payload);
    		
    		//if (MULTI.activeSlot) alert(MULTI.activeSlot.color); // TODO : Pour test
    		
    		break;
    	case 'set':
    		if (data.success) {
    			// Update join popup
    			// TODO
    			
    			// Switch popup
    			MULTI.popup.create.classList.toggle('popup-show');
    			MULTI.popup.join.classList.toggle('popup-show');    			
    		} else {
    			// TODO
    			alert("error!!!!");
    		}
    		
    		break;
    	case 'join':
    		if (data.success) {
    			// Show popup
    			MULTI.popup.join.classList.toggle('popup-show');
    		} else {
    			MULTI.activeSlot = null;

    			// TODO
    			alert(data.message); // Temporaire
    		}
    		
    		break;
    	case 'dismiss':
    		if (data.success) {
    			// Hide popups (if any)
   				MULTI.popup.create.classList.remove('popup-show');
   				MULTI.popup.join.classList.remove('popup-show');
    			// Reset active slot
    			MULTI.activeSlot = null;    			
    		} else {
    			// TODO
    			alert(data.message); // Temporaire
    		}
    		
    		break;
    	case 'start':
    		if (data.success) {
   				MULTI.popup.join.classList.toggle('popup-show'); // Hide
   				MULTI.popup.game.classList.toggle('popup-show'); // Show
   				
   				// Start
   				addKeyListener();
   				var demo = new ZEPR.Engine(640, 480, sessionStorage.sound == 'true');
   				demo.setLoader(new LoaderScreen());
   				
   				demo.onLeave(function() {
   					MULTI.activeSlot = null;
   					MULTI.popup.game.classList.toggle('popup-show'); // Hide
   				});
   				
   				ZEPR.Events.addTouchListener(demo);
   				demo.start(new ConnectScreen(MULTI.id));
    		} else {
    			// TODO
    			alert(data.message); // Temporaire    			
    		}
    }	
}

MULTI.updateSlot = function(_slot, _slotConfig) {
	
	// Update join popup
	if (MULTI.popup.join.classList.contains('popup-show') && _slot.id.substring(4) == MULTI.activeSlot.id) {
		
		//console.log('>>> own=' + MULTI.activeSlot.owner + ' - length=' + _slotConfig.players.length);
		
		if (MULTI.activeSlot.owner && _slotConfig.players.length >= 2) {
			document.getElementById('action-start').style.visibility = 'visible';
			document.getElementById('wait_players').style.visibility = 'hidden';
		} else {
			document.getElementById('action-start').style.visibility = 'hidden';
			document.getElementById('wait_players').style.visibility = 'visible';
		}
		
		MULTI.setTitle(MULTI.popup.join, _slotConfig.title);
		MULTI.setPlayers(MULTI.popup.join, _slotConfig.players);
				
		var colorDiv = MULTI.popup.join.getElementsByTagName('div')[0];
		if (!colorDiv.classList.contains(_slotConfig.color)) {
			colorDiv.className = 'popup-content ' + _slotConfig.color;
		}
		
		if (_slotConfig.state == 'empty') {
			// Owner dismissed game
			MULTI.popup.join.classList.toggle('popup-show');
			MULTI.activeSlot = null;
		}

		if (_slotConfig.state == 'full') {
			document.getElementById('wait_players').style.visibility = 'hidden';
		}
	}
	
	// State
	if (!_slot.classList.contains('state-' + _slotConfig.state)) {
		_slot.className = 'state-' + _slotConfig.state;
	}
	
	// Color
	if (_slotConfig.state == 'join' && !_slot.classList.contains(_slotConfig.color)) {		
		_slot.classList.toggle(_slotConfig.color);
	}
	
	switch(_slotConfig.state) {
		case 'empty':
			MULTI.setTitle(_slot, 'Emplacement libre');
			MULTI.setPlayers(_slot, []);
			break;
		case 'config':
			MULTI.setTitle(_slot, 'Configuration');
			MULTI.setPlayers(_slot, _slotConfig.players);
			break;
		case 'join':
		case 'full':
		case 'run':
			MULTI.setTitle(_slot, _slotConfig.title);
			MULTI.setPlayers(_slot, _slotConfig.players);
			break;
	}
}


MULTI.setTitle = function(_slot, _title) {
	var titleTag = _slot.getElementsByTagName('h1')[0];
	titleTag.innerHTML = _title;
}

MULTI.setPlayers = function(_slot, _players) {
	var playersTag = _slot.getElementsByTagName('li');
	for (var i = 0; i < playersTag.length; i++) {
		if (_players.length > i) {
			playersTag[i].innerHTML = _players[i];
		} else {
			playersTag[i].innerHTML = '&nbsp;';
		}
	}
}



MULTI.selectSlot = function() {
	
	if (MULTI.activeSlot) {
		alert('Erreur de config!!!!'); // TODO : Modifier
		return;
	}
	
	MULTI.activeSlot = {};
	MULTI.activeSlot.id = this.id.substring(4);
	
	if (this.classList.contains('state-empty')) {
		// Own
		var msgOwn = {};
		msgOwn.cmd = 'own';
		msgOwn.idx = MULTI.activeSlot.id;
		msgOwn.name = MULTI.player; // TODO : Inutile
		
		MULTI.sendMessage(msgOwn);
	} else if (this.classList.contains('state-join')) {
		
		var msgJoin = {};
		msgJoin.cmd = 'join';
		msgJoin.idx = MULTI.activeSlot.id;
		
		MULTI.sendMessage(msgJoin);
	} else {
		// Pas accessible
		
		// TODO
		alert('Non accessible !!!!!!!!!!');
		
		MULTI.activeSlot = null;
	}
}

MULTI.configSlot = function() {
	
	MULTI.activeSlot.title = document.getElementById('game-title').value;
	
	if (!MULTI.activeSlot.color) {
	    var inputElem = MULTI.popup.create.getElementsByTagName('input');
	    for (var i = 0; i < inputElem.length; i++) {
	    	if (inputElem[i].checked) {
	    		MULTI.activeSlot.color = inputElem[i].className;
	    		break;
	    	}
	    }
	}
	
	var msg = {};
	msg.cmd = 'set';
	msg.title = MULTI.activeSlot.title;
	msg.color = MULTI.activeSlot.color;
	
	msg.chain = document.getElementById('chain').checked;
	msg.robot = document.getElementById('robot').checked;
	
	MULTI.sendMessage(msg);	
}

MULTI.connection = function() {	
	var msg = {};
	msg.cmd = 'auth';
	msg.name = document.getElementById('username').value;
	msg.anon = true;
	
	MULTI.player = msg.name;
	
	MULTI.sendMessage(msg);
}

MULTI.dismiss = function() {
	var msg = {};
	msg.cmd = 'dismiss';
	
	MULTI.sendMessage(msg);
}


MULTI.start = function() {
	var msg = {};
	msg.cmd = 'start';
	
	MULTI.sendMessage(msg);
}



MULTI.init = function() {
	
	// References on Games
	MULTI.slots = [];
	
	var idx = 0;
	var slot = null;
	while (slot = document.getElementById('slot' + idx)) {
		slot.onclick = MULTI.selectSlot;
		MULTI.slots.push(slot);
		idx++;
	}

    // Popups
    MULTI.popup = {};
	MULTI.popup.player = document.getElementById('popup-show-player');
    MULTI.popup.create = document.getElementById('popup-create');
    MULTI.popup.join = document.getElementById('popup-join');
    MULTI.popup.login = document.getElementById('popup-login');
    MULTI.popup.game = document.getElementById('popup-game');
    
	// Config action
	document.getElementById('action-create').onclick = MULTI.configSlot;
    var inputElem = MULTI.popup.create.getElementsByTagName('input');
    for (var i = 0; i < inputElem.length; i++) {
    	if (inputElem[i].type == 'radio') {
    		inputElem[i].onclick = function() {
    			var styleDiv = document.getElementById('popup-create').getElementsByTagName('div')[0];
    			styleDiv.className = 'popup-content ' + this.classList[0];
    			MULTI.activeSlot.color = this.classList[0];
    		}
    	}
	}
    
    var closeElem = MULTI.popup.create.getElementsByTagName('div')[0].getElementsByTagName('div')[0];
    closeElem.onclick = MULTI.dismiss;
    closeElem = MULTI.popup.join.getElementsByTagName('div')[0].getElementsByTagName('div')[0];
    closeElem.onclick = MULTI.dismiss;
    closeElem = MULTI.popup.login.getElementsByTagName('div')[0].getElementsByTagName('div')[0];
    closeElem.onclick = function() {
		MULTI.popup.login.classList.toggle('popup-show');
		MULTI.showPlayer();
	};


    document.getElementById('action-login').onclick = MULTI.connection;
    document.getElementById('action-start').onclick = MULTI.start;
    document.getElementById('config-player').onclick = function() {
		if (!MULTI.popup.login.classList.contains('popup-show')) {
			MULTI.popup.login.classList.add('popup-show');
		}
	}

	// Check if player name is already set
	if (sessionStorage.player) {
		MULTI.player = sessionStorage.player;
		MULTI.showPlayer();
	} else {
		MULTI.popup.login.classList.toggle('popup-show');
	}

	// Arena Connection
    if (window.location.protocol == 'http:') {
    	MULTI.connect('ws://' + window.location.host + '/fb/multi/websocket/arena');
    } else {
    	MULTI.connect('wss://' + window.location.host + '/fb/multi/websocket/arena');
    }
};


MULTI.showPlayer = function() {
	document.getElementById('show-player').innerHTML = MULTI.player;
	MULTI.popup.player.style.opacity = 1;
	setTimeout(MULTI.hidePlayer, 3000);	
}


MULTI.hidePlayer = function() {
	MULTI.popup.player.style.opacity = 0;
}



window.addEventListener('load', MULTI.init, false);