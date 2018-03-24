var LOCAL = {};

LOCAL.robots = [		
	'Bender', 'KITT', 'ED-209', 'T-800', 'Gort', 
	'Johnny 5', 'Robby', 'Astro', 'Bishop 341-B', 'T-1000', 
	'HAL 9000', 'Data', 'Optimus Prime', 'Megatron', 'Gigolo Joe', 
	'Wall-E', 'R2-D2', 'C-3PO', 'Mega Man', 'Clank',
	'Marvin', 'Maria', 'GLaDOS', 'Skynet', 'SHODAN', 'WOPR'
];

LOCAL.players = [
	{ name1: null, type1: 'cpu', name2: 'Freile', type2: 'cpu' }, 
	{ name1: 'Joueur 1', type1: 'player', name2: null, type2: 'cpu'},
	{ name1: 'Joueur 1', type1: 'player', name2: 'Joueur 2', type2: 'player'},
];


LOCAL.init = function() {
	document.getElementById('slot0').onclick = function() {
		LOCAL.start(2);
	}
	document.getElementById('slot1').onclick = function() {
		LOCAL.start(1);
	}
	document.getElementById('slot2').onclick = function() {
		LOCAL.start(0);
	}
}


LOCAL.start = function(_nbJoueurs) {
	document.getElementById('popup-game').classList.toggle('popup-show'); // Show

	addKeyListener();
	var demo = new ZEPR.Engine(640, 480, sessionStorage.sound == 'true');
	demo.setLoader(new LoaderScreen());
	
	demo.onLeave(function() {
		document.getElementById('popup-game').classList.toggle('popup-show'); // Hide
	});
	
	ZEPR.Events.addTouchListener(demo);
	ZEPR.context.set('fbnet', new LOCAL.Net(demo));

	// Define pattern
	var pattern = [];
	for (var i = 0; i < 5; i++) {
		var line = '';
		for (var j = 0; j < 7; j++) {
			line += Math.floor(Math.random() * 8) + 1;
		}
		if (i % 2 == 0) {
			line += Math.floor(Math.random() * 8) + 1;
		}

		pattern.push(line);
	}

	// Define players
	var players = LOCAL.players[_nbJoueurs];
	var name1 = players.name1;
	if (name1 == null) {
		name1 = LOCAL.robots[Math.floor(Math.random() * LOCAL.robots.length)];
	}
	var name2 = players.name2;
	if (name2 == null) {
		name2 = LOCAL.robots[Math.floor(Math.random() * LOCAL.robots.length)];
	}

	demo.start(new GameScreen({
		players: [{ token: '1', type: players.type1, name: name1}, { token: '2', type: players.type2, name: name2}],
		currentBall: Math.floor(Math.random() * 8) + 1,
		nextBall: Math.floor(Math.random() * 8) + 1,
		pattern: pattern,
		chain: false
	}));    
}


LOCAL.Net = function(_zepr) {
   	this.token = null;
	this.callback = null;
	this.zepr = _zepr;
}

LOCAL.Net.prototype = {
   	setCallback: function(_callback) {
		this.callback = _callback;
	},
	
	sendMessage : function(_msg) {
		if (_msg.hasOwnProperty('cmd') && _msg.cmd == 'lost') {
			if (this.callback) {
				var winner = _msg.token == 1 ? '2' : '1';
				this.callback({
					cmd: 'victory', 
					token: winner
				});
			}
		}
	}
}

window.addEventListener('load', LOCAL.init, false);