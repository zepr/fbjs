var GameState = function() {
	this.position = null;

	this.useCompressor = false;
	this.odd = false;
	this.compressorPosition = 0;
	this.chainReaction = true;

	this.keys = 3; // Player.KEYS_LEFT + Player.KEYS_RIGHT;

	this.mini = false;

	this.rebound = false;
	this.move = null;
	this.ballFixed = null;

	this.step = 1; // Player.STEP_READY
	
	this.nbBalls = 0;

	this.reactionTarget = null;
	
	this.sendOpponents = 0;
	
	this.launchBall = 0;
	this.nextBall = 0;
	this.pattern = null;
	
	this.newLine = null;
	this.upLine = null;
	
	this.endOfGame = false;

	this.life = 4;
	this.level = 0;
}


var Point = function(_x, _y) {
	this.x = _x || 0;
	this.y = _y || 0;
}

var Ball = function(_x, _y, _color, _gridCoord) {
	this.x = _x || 0;
	this.y = _y || 0;
	this.color = _color || 0;
	this.gridCoord = _gridCoord;
}




var LoaderScreen = function() {
	// Preload all images	
	this.images = ['fb_logo.png', 'game/images/backgrnd.png', 
                   'game/images/back_one_player.png', 'game/images/back_multiplayer.png', 
				   'game/images/banane-mini.png', 'game/images/banane.png',
				   'game/images/bubble_lose-mini.png', 'game/images/bubble_lose.png',
				   'game/images/bubble-1-mini.png', 'game/images/bubble-1.gif',
				   'game/images/bubble-2-mini.png', 'game/images/bubble-2.gif',
				   'game/images/bubble-3-mini.png', 'game/images/bubble-3.gif',
				   'game/images/bubble-4-mini.png', 'game/images/bubble-4.gif',
				   'game/images/bubble-5-mini.png', 'game/images/bubble-5.gif',
				   'game/images/bubble-6-mini.png', 'game/images/bubble-6.gif',
				   'game/images/bubble-7-mini.png', 'game/images/bubble-7.gif',
				   'game/images/bubble-8-mini.png', 'game/images/bubble-8.gif',
				   'game/images/compressor_ext.png', 'game/images/compressor_main.png',
				   'game/images/lose_panel.png', 'game/images/win_panel.png',
				   'game/images/hurry_p1.png', 'game/images/penguin.png',
				   'game/images/shooter-mini.png', 'game/images/shooter.png', 
				   'game/images/tomate-mini.png', 'game/images/tomate.png'];
	
	// Don't preload musics, only sounds
	this.sounds = ['game/sounds/applause.mp3', 'game/sounds/destroy_group.mp3', 
				   'game/sounds/hurry.mp3', 'game/sounds/launch.mp3', 
				   'game/sounds/lose.mp3', 'game/sounds/malus.mp3',
				   'game/sounds/rebound.mp3', 'game/sounds/stick.mp3',
				   'game/sounds/newroot.mp3', 'game/sounds/newroot_solo.mp3'];
	
	this.percent = null;
	this.percentBack = null;

	this.init = function(_zepr) {
		_zepr.setBackgroundColor('#660066');

		new ZEPR.Sprite(_zepr, 'fb_logo.png', 20, 4, 1).setZoom(0.5);
		new ZEPR.TextSprite(_zepr, 'Chargement... ', 'black', '20px Arial', 242, 202, 1);
		new ZEPR.TextSprite(_zepr, 'Chargement... ', 'white', '20px Arial', 240, 200, 2);

		this.percentBack = new ZEPR.TextSprite(_zepr, '0%', 'black', '60px Arial', 264, 264, 1);
		this.percent = new ZEPR.TextSprite(_zepr, '0%', 'white', '60px Arial', 260, 260, 2);
	}
	
	this.run = function(_zepr, _stats) {
		var value = (Math.floor(100 * _stats.loaded / _stats.total)) + '%';
		this.percent.setText(value);
		this.percentBack.setText(value);
	}
}



var ConnectScreen = function(_token) {
	
	this.token = _token;
	this.text = null;
	this.textBack = null;
	this.config = null;
	
	this.init = function(_zepr) {
		_zepr.setBackgroundColor('#660066');

		new ZEPR.Sprite(_zepr, 'fb_logo.png', 20, 4, 1).setZoom(0.5);
		this.text = new ZEPR.TextSprite(_zepr, 'Connexion... ', 'black', '20px Arial', 264, 264, 1);
		this.textBack = new ZEPR.TextSprite(_zepr, 'Connexion... ', 'white', '20px Arial', 260, 260, 2);
		
		var network = new ZEPR.Net(this.token, this.onMessage.bind(this), _zepr);
		ZEPR.context.set('fbnet', network);
		network.connect('/fb/multi/websocket/game');
	}

	this.run = function(_zepr) {	
	}
	
	this.onMessage = function(_msg, _zepr) {
		switch (_msg.cmd) {
	    	case 'config':
	    		this.config = _msg;
	    		this.text.setText('Connexion... OK');
	    		this.textBack.setText('Connexion... OK');

				this.text = new ZEPR.TextSprite(_zepr, 'En attente des autres joueurs... ', 'black', '20px Arial', 264, 304, 1);
				this.textBack = new ZEPR.TextSprite(_zepr, 'En attente des autres joueurs... ', 'white', '20px Arial', 260, 300, 2);

	    		break;
	    	case 'start':
	    		_zepr.start(new GameScreen(this.config));	    		
	    		break;
		}
	}	
}





function GameScreen(_config) {
	
	this.CONFIG = {
			solo : {
				background: 'game/images/back_one_player.png',
				player: { x: 190, y: 40 }
			},
			versus : {
				background: 'game/images/backgrnd.png',
				player: { x: 30, y: 40, gage: 1 },
				opp: [ { x: 354, y: 40, gage: 0 } ],
				mini: false
			},
			multi : {
				background: 'game/images/back_multiplayer.png',
				player: { x: 192, y: 40, gage: 2 },
				opp: [ { x: 20, y: 18, gage: 0, top: true }, { x: 492, y: 18, gage: 1, top: true }, 
				       { x: 20, y: 246, gage: 0 }, { x: 492, y: 246, gage: 1 } ],
				mini: true
			}
	};
	
	
	var players = new Map();
	var gameRunning = true;
	
	this.config = _config;
	this.network = null;
	
	this.init = function(_zepr) {
		
		this.network = ZEPR.context.get('fbnet');
		this.network.setCallback(this.onMessage.bind(this));
		
		var configSet;
		var hotSeat = false;
		switch (this.config.players.length) {
			case 1:
				configSet = this.CONFIG.solo;
			break;
			case 2:
				configSet = this.CONFIG.versus;
				hotSeat = this.config.players[0].type == this.config.players[1].type;
			break;
			default:
				configSet = this.CONFIG.multi;
		}

		// Missing images (Transformation)
		// TODO : Seulement si les images ne sont pas déjà en cache
		ZEPR.cache.set('game/images/penguin_rev.png', ZEPR.Tools.hflip(_zepr.getImage('game/images/penguin.png')));
		ZEPR.cache.set('game/images/penguin_mini.png', ZEPR.Tools.scale(_zepr.getImage('game/images/penguin.png'), 0.5));
		
		// Background to add names
		var backCanvas = document.createElement('canvas');
		backCanvas.width = 640;
		backCanvas.height = 480;
		var backCtx = backCanvas.getContext('2d');		
		backCtx.drawImage(_zepr.getImage(configSet.background), 0, 0);
		
		var oppIndex = 0;
		var posX = -1;
		var posY = -1;
		
		for (var i = 0; i < this.config.players.length; i++) {
			var gameState = new GameState();
			gameState.launchBall = this.config.currentBall;
			gameState.nextBall = this.config.nextBall;
			gameState.chainReaction = this.config.chain;
			gameState.level = this.config.level | 0;
			gameState.pattern = this.config.pattern;

			// Solo
			gameState.useCompressor = this.config.players.length == 1;

			var currentPlayer = this.config.players[i];
			
			switch (currentPlayer.type) {
				case 'player':
					gameState.position = configSet.player;
					if (hotSeat) {
						if (i == 1) {
							gameState.position = configSet.opp[0];
							gameState.keys = 2;
						} else {
							gameState.keys = 1;
						}
					}

					players.set(currentPlayer.token, new LocalPlayer(currentPlayer.name, currentPlayer.token, gameState, _zepr, players));
					
					if (gameState.useCompressor) {
						var level = 'Niveau ' + (gameState.level + 1);
						backCtx.font = '20px arial';
						posX = 5 + (144 - backCtx.measureText(level).width) / 2;
						backCtx.fillStyle = 'black';
						backCtx.fillText(level, posX + 2, 120);
						backCtx.fillStyle = 'white';
						backCtx.fillText(level, posX, 118);
					} else {
						backCtx.font = '20px arial';
						posX = gameState.position.x + 15 + (224 - backCtx.measureText(currentPlayer.name).width) / 2;
						backCtx.fillStyle = 'black';
						backCtx.fillText(currentPlayer.name, posX + 2, configSet.player.y - 10);
						backCtx.fillStyle = 'white';
						backCtx.fillText(currentPlayer.name, posX, configSet.player.y - 12);
					}
				break;
				// TODO : Refactor!!!
				case 'opponent':
					gameState.position = configSet.opp[oppIndex];
					gameState.mini = configSet.mini;
					
					players.set(currentPlayer.token, new NetPlayer(currentPlayer.name, currentPlayer.token, gameState, _zepr, players));
					
					if (configSet.mini) {
						backCtx.font = '10px arial';
						posX = gameState.position.x + 8 + (112 - backCtx.measureText(currentPlayer.name).width) / 2;
						if (gameState.position.top) { // Top line
							posY = gameState.position.y - 6; 
						} else { // Bottom line
							posY = gameState.position.y + 230;
						}
						backCtx.fillStyle = 'black';
						backCtx.fillText(currentPlayer.name, posX + 1, posY + 1);
						backCtx.fillStyle = 'white';
						backCtx.fillText(currentPlayer.name, posX, posY);						
					} else {
						backCtx.font = '20px arial';
						posX = gameState.position.x + 15 + (224 - backCtx.measureText(currentPlayer.name).width) / 2;
						backCtx.fillStyle = 'black';
						backCtx.fillText(currentPlayer.name, posX + 2, gameState.position.y - 10);
						backCtx.fillStyle = 'white';
						backCtx.fillText(currentPlayer.name, posX, gameState.position.y - 12);						
					}
					
					oppIndex++;
				break;
				case 'cpu':
					gameState.position = configSet.opp[oppIndex];
					if (hotSeat) {
						if (i == 1) {
							gameState.position = configSet.opp[0];
						} else {
							gameState.position = configSet.player;
						}
					}

					gameState.mini = configSet.mini;
					
					players.set(currentPlayer.token, new CpuPlayer(currentPlayer.name, currentPlayer.token, gameState, _zepr, players));
					
					if (configSet.mini) {
						backCtx.font = '10px arial';
						posX = gameState.position.x + 8 + (112 - backCtx.measureText(currentPlayer.name).width) / 2;
						if (configSet.opp[oppIndex].top) { // Top line
							posY = gameState.position.y - 6;
						} else { // Bottom line
							posY = gameState.position.y + 230; 
						}
						backCtx.fillStyle = 'black';
						backCtx.fillText(currentPlayer.name, posX + 1, posY + 1);
						backCtx.fillStyle = 'white';
						backCtx.fillText(currentPlayer.name, posX, posY);						
					} else {
						backCtx.font = '20px arial';
						posX = gameState.position.x + 15 + (224 - backCtx.measureText(currentPlayer.name).width) / 2;
						backCtx.fillStyle = 'black';
						backCtx.fillText(currentPlayer.name, posX + 2, gameState.position.y - 10);
						backCtx.fillStyle = 'white';
						backCtx.fillText(currentPlayer.name, posX, gameState.position.y - 12);						
					}
					
					oppIndex++;
				break;
			}
		}
		
		//_zepr.setBackground(configSet.background);
		_zepr.setBackground(backCanvas);
	}
	
	this.run = function(_zepr) {
		var keys = currentKeys;
		
		var iter = players.values();
		var current = iter.next();
		while (!current.done) {
			current.value.run(keys);
			current = iter.next();
		}
	}
	
	this.onMessage = function(_msg, _zepr) {
		
		switch(_msg.cmd) {
			case 'close':
				_zepr.finish();
				
				if (gameRunning) {
					// Disconnected from server
					alert('Déconnecté');
				} /*else {
					alert('Fin de partie');
				}*/
			break;
			case 'victory':
				gameRunning = false;
				players.get(_msg.token).winner = true;
			break;
			case 'defeat':
				gameRunning = false;
			break;
			default:
				players.get(_msg.token).addMessage(_msg);	
		}		
	} 
}


var Player = function(_name, _token, _gameState, _zepr, _netSend, _players) {

	this.username = _name;
	this.token = _token;
	this.gameState = _gameState;
	this.zepr = _zepr;
	
	this.netSend = _netSend;
	this.network = ZEPR.context.get('fbnet'); // TODO : Voir pour recuperer de game
	
	this.players = _players; 
	this.winner = false;
	
	this.touchMove = false;

	//this.action = new Action(false);
	
	if (this.gameState.useCompressor) {
		this.action = new Action(this.gameState.pattern[this.gameState.level]);
	} else {
		this.action = new Action(this.gameState.pattern);
	}
	if (this.gameState.useCompressor) {
		this.gameState.launchBall = this.action.getNextColor(this.gameState);
		this.gameState.nextBall = this.action.getNextColor(this.gameState);		
	}

	// 1P view = new View(new Point(190, 40));
	this.view = new View(_gameState, _zepr);

	this.launchBall = new Ball(112, 356, this.gameState.launchBall);
	this.nextBall = new Ball(112, 406, this.gameState.nextBall);
	this.futureBall = null;
	
	this.launcherAngle = 0;

	this.potentialBalls = 0;
	this.validBalls = 0;
	
	this.view.newLaunchBall(this.launchBall);
	this.view.newNextBall(this.nextBall);
	
	this.actions = new Array();
}

Player.prototype.SPEED = 5;

Player.prototype.CONTROL_NONE = 0;
Player.prototype.CONTROL_LEFT = 1;
Player.prototype.CONTROL_RIGHT = 2;
Player.prototype.CONTROL_FIRE = 4;
Player.prototype.CONTROL_QUIT = 8;

Player.prototype.KEYS_LEFT = 1;
Player.prototype.KEYS_RIGHT = 2;

Player.prototype.STEP_READY = 1;
Player.prototype.STEP_MOVE = 2;
Player.prototype.STEP_MOVE_FIXED = 3;
Player.prototype.STEP_CHAIN = 4;
Player.prototype.STEP_CHAIN_FIXED = 5;
Player.prototype.STEP_BALLS_UP = 6;
Player.prototype.STEP_MOVING_UP = 7;
Player.prototype.STEP_BALLS_DOWN = 8;
Player.prototype.STEP_STATUS = 9;
Player.prototype.STEP_LOST = 10;
Player.prototype.STEP_WON = 11;

Player.prototype.move = function(_key) {
	alert('Not implemented');
}

Player.prototype.addMessage = function(_msg) {	
	this.actions.push(_msg);
}

Player.prototype.addBalls = function(_count, _confirm) {
	this.potentialBalls += _count;
	if (_confirm) {
		this.validBalls += _count;
		this.view.gage.addBalls(_count);
		
		var confirmMsg = {};
		confirmMsg.action = 'confirm';
		confirmMsg.token = this.token;
		confirmMsg.count = _count;
		
		this.network.sendMessage(confirmMsg);
	}
}

Player.prototype.confirmBalls = function(_count) {
	this.validBalls += _count;
	this.view.gage.addBalls(_count);
}

Player.prototype.setWinner = function(_winnerToken) {
	this.winner = _winnerToken;
} 

Player.prototype.run = function(_keys) {
	
	var control = this.move(_keys);
	switch (control) {
		case this.CONTROL_LEFT:
			if (this.launcherAngle > -87) {
				this.launcherAngle -= 3;
				this.view.turnLauncher(this.launcherAngle);
			}
		break;
		case this.CONTROL_RIGHT:
			if (this.launcherAngle < 87) {
				this.launcherAngle += 3;
				this.view.turnLauncher(this.launcherAngle);
			}
		break;
		case this.CONTROL_FIRE:
						
			if (this.gameState.step == this.STEP_READY) {
				var rad = (this.launcherAngle - 90) * Math.PI / 180;
				this.gameState.move = new Point(this.SPEED * Math.cos(rad), this.SPEED * Math.sin(rad));
				
				this.zepr.playSound('game/sounds/launch.mp3');

				if (this.netSend) {
					this.gameState.launchBall = this.gameState.nextBall;
					this.gameState.nextBall = this.action.getNextColor(this.gameState);

					// newLine
					if (this.gameState.nbBalls == 8) {
						this.gameState.newLine = '';
						for (var i = 0; i < (this.gameState.odd ? 8 : 7); i++) {
							this.gameState.newLine += Math.floor((Math.random() * 8) + 1);
						}						
					}
					
					// upLine
					if (this.validBalls > 0) {
						var up = Math.min(this.validBalls, 8);
						var values = new Array(8);
						
						for (var i = 0; i < up; i++) {
							var pos = Math.floor(Math.random() * 8);
							while (values[pos]) {
								pos = Math.floor(Math.random() * 8);
							}
							values[pos] = Math.floor((Math.random() * 8) + 1);
						}						

						this.gameState.upLine = '';
						for (var i = 0; i < 8; i++) {
							if (values[i]) {
								this.gameState.upLine += values[i];
							} else {
								this.gameState.upLine += '0';
							}
						}												
					}
					
					
					var fireMsg = {
						'action': 'fire',
						'token': this.token,
						'direction': this.launcherAngle,
						'nextBall': this.gameState.nextBall,
						'newLine': this.gameState.newLine,
						'upLine': this.gameState.upLine
					};
					
					this.network.sendMessage(fireMsg);
				}
				
				// Move nextBall to launcher
				this.nextBall.y = 356;
				this.view.moveNextBall(this.nextBall);
				// Create futureBall
				this.futureBall = new Ball(112, 406, this.gameState.nextBall);
				this.view.newFutureBall(this.futureBall);
				
				this.gameState.step = this.STEP_MOVE;
			} 
		break;
		case this.CONTROL_QUIT:
			
			if (this.gameState.useCompressor) {
				if (this.winner) {
					this.gameState.level++;
				}

				if (this.gameState.level == 100) {
					// TODO : Gestion fin de partie
					this.zepr.leave();
				} else {
					this.zepr.start(new GameScreen({
						players: [{ token: '1', type: 'player', name: this.username }],
						pattern: this.gameState.pattern,
						level: this.gameState.level
					}));
				}
			} else {
				this.zepr.leave();
			}
		break;
	}
	
	// Animate Penguin
	this.view.penguin.animate(control);	
			
	switch (this.gameState.step) {
		case this.STEP_MOVE: 	
			for (var i = 0; i < 3 && this.gameState.step == this.STEP_MOVE; i++) {
				if (this.gameState.move) {
					this.action.moveBall(this.launchBall, this.gameState);

					// Rebound sound
					if (this.gameState.rebound) {
						this.zepr.playSound('game/sounds/rebound.mp3');
						this.gameState.rebound = false;
					}					
				} else {
					this.gameState.step = this.STEP_MOVE_FIXED;
				}
			}
			this.view.moveLaunchBall(this.launchBall);
		break;
		case this.STEP_MOVE_FIXED:
		case this.STEP_CHAIN_FIXED:
			// TODO : Fixe la balle coté graphique			
			this.view.pinBall(this.gameState.ballFixed);

			// TODO : Détacher
			var downGrid = this.action.mark(this.gameState.ballFixed, this.launchBall.color, this.gameState);
			if (downGrid) {	// At least 3 balls => falling
				this.zepr.playSound('game/sounds/destroy_group.mp3');

				if (this.gameState.chainReaction) {					
					var detached = this.action.getDetached(downGrid);
					
					if (this.gameState.sendOpponents == 0) {
						this.gameState.sendOpponents = 1;
					}
					this.gameState.sendOpponents += this.action.clear(downGrid) - 1;
					
					if (detached) {
						this.gameState.reactionTarget = this.action.getBestChain(detached, this.gameState);
						if (this.gameState.reactionTarget) {
							var source = detached[this.gameState.reactionTarget.color];
							// TODO : Remplacer gameState.ratioTarget (Ball) par un Point (ou faire de l'héritage) dans setChain
							this.view.setChain(source, this.gameState.reactionTarget, this.gameState);
							this.launchBall = this.gameState.reactionTarget;							
							// Chain reaction
							this.gameState.step = this.STEP_CHAIN;
						} else {
							// No useful detached ball
							this.gameState.step = this.STEP_BALLS_UP;
						}
					} else {
						// No detached ball at all
						this.gameState.step = this.STEP_BALLS_UP;
					}
				} else {
					this.gameState.sendOpponents += this.action.clear(downGrid);
					
					// No chain reaction
					this.gameState.step = this.STEP_BALLS_UP;
				}
				
				this.view.clear(downGrid);
			} else {
				// No group at all (ball is simply sticked)
				this.gameState.step = this.STEP_BALLS_UP;

				this.zepr.playSound('game/sounds/stick.mp3');
			}
			this.gameState.ballFixed = null;			
		break;
		case this.STEP_CHAIN:
			if (this.view.moveChain()) {
				this.action.grid[this.gameState.reactionTarget.y][this.gameState.reactionTarget.x] = this.gameState.reactionTarget.color;
				this.gameState.ballFixed = this.gameState.reactionTarget;
				this.gameState.reactionTarget = null;
				this.gameState.step = this.STEP_CHAIN_FIXED;
			}			
		break;
		case this.STEP_BALLS_UP:
			// Send balls
			if (this.gameState.sendOpponents > 3 && this.players.size > 1 && this.netSend) {
				this.gameState.sendOpponents -= 3;
				
				// Dispatch balls
				var sendBalls = new Array(this.players.size - 1);
				for (var i = 0; i < this.gameState.sendOpponents; i++) {
					var pos = Math.floor(Math.random() * sendBalls.length);
					if (sendBalls[pos] === undefined) {
						sendBalls[pos] = 1;
					} else {
						sendBalls[pos]++;
					}
				}

				// Send 'send' message
				var sendMsg = {
					'action': 'send',
					'token': this.token,
					'dispatch': {}
				};
				
				var index = 0;	
				
				var iter = this.players.keys();
				var current = iter.next();
				while (!current.done) {
					if (current.value != this.token) {
						if (sendBalls[index] > 0) {
							sendMsg.dispatch[current.value] = sendBalls[index];
						}
						index++;
					}	
					current = iter.next();
				}
				
				this.network.sendMessage(sendMsg);
				
				// update local values				
				for (var playToken in sendMsg.dispatch) {
					var targetPlayer = this.players.get(playToken);
					targetPlayer.addBalls(sendMsg.dispatch[playToken], targetPlayer.netSend);
				}
				
			}
			this.gameState.sendOpponents = 0;
			
			// Receive balls
			if (this.gameState.upLine) {
				this.zepr.playSound('game/sounds/malus.mp3');

				var upBalls = this.action.moveUp(this.gameState.upLine, this.gameState.odd);
				for (var i = 0; i < upBalls.length; i++) {
					this.view.addUpBall(upBalls[i].x, upBalls[i].y, upBalls[i].index, upBalls[i].color, this.gameState.odd, 7 - upBalls[i].index);
				}
				
				this.gameState.upLine = null;
				this.validBalls -= upBalls.length;
				this.view.gage.addBalls(-upBalls.length);
				this.potentialBalls -= upBalls.length;
				this.gameState.step = this.STEP_MOVING_UP;
			} else {
				this.gameState.step = this.STEP_BALLS_DOWN;
			}
			
		break;
		case this.STEP_MOVING_UP:
			if (this.view.moveUpBalls()) {
				this.gameState.step = this.STEP_BALLS_DOWN;
			}
		break;
		case this.STEP_BALLS_DOWN:
			
			this.gameState.nbBalls++;
			if (this.gameState.nbBalls == 9) {
				this.gameState.nbBalls = 0;
				this.gameState.odd = !this.gameState.odd;

				if (this.gameState.useCompressor) {
					this.zepr.playSound('game/sounds/newroot_solo.mp3');
					this.gameState.compressorPosition++;
					this.gameState.newLine = null;
				} else {
					this.zepr.playSound('game/sounds/newroot.mp3');
				}

				this.action.moveDown(this.gameState.newLine);
				this.view.moveDown(this.gameState.newLine, this.zepr);
			}			

			// Switch balls
			this.launchBall = this.nextBall;
			this.nextBall = this.futureBall;
			this.futureball = null;
				
			this.view.switchBalls();

			this.gameState.step = this.STEP_STATUS;
		break;
		case this.STEP_STATUS:
			// Solo 
			if (this.gameState.useCompressor && this.action.getNextColor(this.gameState) == -1) {
				this.winner = true;
			}

			if (this.winner) {
				this.zepr.playSound('game/sounds/applause.mp3');
				this.gameState.step = this.STEP_WON;
			} else if (this.action.isLost()) {
				this.zepr.playSound('game/sounds/lose.mp3');
				this.gameState.step = this.STEP_LOST;
				this.network.sendMessage({type: 'srv::', cmd: 'lost', token: this.token});
			} else {
				this.gameState.step = this.STEP_READY;
			}
		break;
		case this.STEP_LOST:
			this.view.penguin.end(false);
			this.view.showLost(this.gameState.useCompressor);
			if (this.gameState.useCompressor && this.view.isGameOver()) {
				this.gameState.endOfGame = true;
			}
		break;
		case this.STEP_WON:
			this.view.penguin.end(true);
			this.view.showWon(this.username);
			
			if (this.view.isGameOver()) {				
				this.players.forEach(function(_player, _token) {
					_player.gameState.endOfGame = true;
				});
			}
		break;
		default: // STEP_READY
			if (this.winner) {
				this.gameState.step = this.STEP_WON;
			} // TODO : Cas disconnected 
	}

	// Manage falling bubbles
	this.view.fall();
}





var LocalPlayer = function(_name, _token, _gameState, _zepr, _players) {
	Player.call(this, _name, _token, _gameState, _zepr, true, _players);

	this.hurryUp = 0;
}

ZEPR.extendClass(Player, LocalPlayer);

LocalPlayer.prototype.move = function(_keys) {

	var control = this.CONTROL_NONE;

	// Keyboard
	if (_keys[27] && this.gameState.useCompressor) {
		this.zepr.leave();
		return;
	}


	if (this.gameState.keys & this.KEYS_LEFT) {
		if (_keys[87] || _keys[90]) { // w, z
			control = this.CONTROL_LEFT;
		}

		if (_keys[67]) { // c
			control = this.CONTROL_RIGHT;
		}

		if (_keys[83]) { // s
			control = this.CONTROL_FIRE;
		}
	}

	if (this.gameState.keys & this.KEYS_RIGHT) {
		if (_keys[37]) { // left arrow
			control = this.CONTROL_LEFT;
		}

		if (_keys[39]) { // right arrow
			control = this.CONTROL_RIGHT;
		}

		if (_keys[38]) { // up arrow
			control = this.CONTROL_FIRE;
		}
	}

	if (this.gameState.endOfGame && (_keys[32] || _keys[38] || _keys[83])) {
		control = this.CONTROL_QUIT;
	}

	// Touch
	if (ZEPR.Events.tx.length == 1) {
		this.touchMove = true;

		var localDir = ZEPR.Events.tx[0] - 140;
		if (localDir < 0) {
			control = this.CONTROL_LEFT;
		} else if (localDir > 360) {
			control = this.CONTROL_RIGHT;
		} else {
			localDir = (localDir - 180) / 2;
			if (localDir + 3 < this.launcherAngle) {
				control = this.CONTROL_LEFT;
			} else if (localDir - 3 > this.launcherAngle) {
				control = this.CONTROL_RIGHT;
			} else {
				control = this.CONTROL_NONE;
			}
		}
	} else {
		if (this.touchMove) {
			this.touchMove = false;
			control = this.CONTROL_FIRE;
		}
	}

	// Hurry up
	if (this.gameState.step == this.STEP_READY) {
		this.hurryUp++;
		if (this.hurryUp >= 160) {
			if (this.hurryUp % 18 == 0) {
				this.view.blinkHurry();
				if (this.view.hurry) {
					this.zepr.playSound('game/sounds/hurry.mp3');
				}
			}
				
			if (this.hurryUp >= 360) {
				control = this.CONTROL_FIRE;
			}
		}
		
		if (control == this.CONTROL_FIRE) {
			this.hurryUp = 0;
			this.view.removeHurry();
		}
	} 
	
	return control;
}

var messageListeners = new Object();

// TODO : Username => Token (Utilisé par CpuPlayer)
var MessageListener = function(_msg) {
	
	var data = _msg.data;
	if (data.username) {
		if (messageListeners[data.username]) {
			messageListeners[data.username].onMessage(data);
		} else {
			alert('User ' + data.username + ' not found');
		}
	} else {
		alert('No user defined');
	}
}

var CpuPlayer = function(_name, _token, _gameState, _zepr, _players) {
	Player.call(this, _name, _token, _gameState, _zepr, true, _players);

	this.cpuMsg = null;
	this.cpuState = 0;

	this.worker = new Worker('game/scripts/cpu.js');
	this.worker.addEventListener('message', MessageListener, false);

	messageListeners[_name] = this;
}

ZEPR.extendClass(Player, CpuPlayer);

CpuPlayer.prototype.STATE_READY = 0;
CpuPlayer.prototype.STATE_COMPUTE = 1;
CpuPlayer.prototype.STATE_MOVING = 2;
CpuPlayer.prototype.STATE_WAITING = 4;

CpuPlayer.prototype.onMessage = function(_data) {
	this.cpuMsg = _data;

	//console.log(_data);
	//console.log('RECU=' + this.cpuMsg.direction);
}

CpuPlayer.prototype.move = function(_keys) {

	var control = this.CONTROL_NONE;

	switch (this.cpuState) {
		case this.STATE_READY:
			this.worker.postMessage(
				{
					'username' : this.username,
					'ball' : this.launchBall,
					'state' : this.gameState,
					'grid' : this.action.grid
				});
			this.cpuState = this.STATE_COMPUTE;
		break;
		case this.STATE_COMPUTE:
			if (this.cpuMsg) {
				this.cpuState = this.STATE_MOVING;
			}
		break;
		case this.STATE_MOVING:
			if (this.cpuMsg.direction < this.launcherAngle) {
				control = this.CONTROL_LEFT;
			} else if (this.cpuMsg.direction > this.launcherAngle) {
				control = this.CONTROL_RIGHT;
			} else {
				control = this.CONTROL_FIRE;
				this.cpuState = this.STATE_WAITING;
				this.cpuMsg = null;
			}
		break;
		case this.STATE_WAITING:
			if (this.gameState.step == this.STEP_READY) {
				this.cpuState = this.STATE_READY;
			}
		break;
		default:
	}

	if (this.gameState.endOfGame && (_keys[32] || _keys[38] || _keys[83])) {
		control = this.CONTROL_QUIT;
	}

	return control;
}





var NetPlayer = function(_name, _token, _gameState, _zepr, _players) {
	Player.call(this, _name, _token, _gameState, _zepr, false, _players);
	
	this.netState = 0;
}

ZEPR.extendClass(Player, NetPlayer);


NetPlayer.prototype.move = function(_key) {
	
	var control = this.CONTROL_NONE;

	if (this.actions.length > 0) {
		var action = this.actions[0];
		
		switch (action.action) {
			case 'fire':
				if (action.direction < this.launcherAngle) {
					control = this.CONTROL_LEFT;
				} else if (action.direction > this.launcherAngle) {
					control = this.CONTROL_RIGHT;
				} else if (this.gameState.step == this.STEP_READY) {
					control = this.CONTROL_FIRE;				
					this.actions.splice(0, 1);
					this.gameState.launchBall = this.gameState.nextBall;
					this.gameState.nextBall = action.nextBall;
					this.gameState.newLine = action.newLine;
					this.gameState.upLine = action.upLine;
				}
			break;
			case 'send':
				// Wait for end of fire action
				if (this.gameState.step == this.STEP_READY) {
					for (var playToken in action.dispatch) {
						var localPlayer = this.players.get(playToken);
						localPlayer.addBalls(action.dispatch[playToken], localPlayer.netSend);
					}
					this.actions.splice(0, 1);
				}
			break;
			case 'confirm':
				console.log('confirm ' + action.token + ' : ' + action.count);
				this.players.get(action.token).confirmBalls(action.count);
				this.actions.splice(0, 1);
			break;
			default:
			// TODO: Autres actions?
		}
	}

	return control;
}
