var View = function(_state, _zepr) {
	this.position = _state.position;
	this.mini = _state.mini;
	this.zepr = _zepr;

	this.panelIdx = 0;
	this.panel = null;
	
	this.textCanvas = document.createElement('canvas');
	this.textCanvas.width = 640;
	this.textCanvas.height = 40;
	var textCtx = this.textCanvas.getContext('2d');		
	textCtx.font = '20px arial';
	var text = 'Appuyer sur [Espace] pour continuer';
	posX = (640 - textCtx.measureText(text).width) / 2;
	textCtx.fillStyle = 'black';
	textCtx.fillText(text, posX + 2, 32);
	textCtx.fillStyle = 'white';
	textCtx.fillText(text, posX, 30);

	this.nextText = null;
	
	this.grid = new Array(18);

	var pattern = _state.pattern;
	if (_state.useCompressor) {
		pattern = pattern[_state.level];
	}

	for (var i = 0; i < 18; i++) {
		this.grid[i] = new Array(8);

		if (pattern && i < pattern.length) {
			var dec = (i % 2 == 0) ? 0 : 16;
			if (this.mini) {
				dec >>= 1;
			}
			
			for (var j = 0; j < pattern[i].length; j++) {
				if (pattern[i][j] > 0) {
					if (this.mini) {
						this.grid[i][j] = new ZEPR.Sprite(this.zepr, 'game/images/bubble-' + pattern[i][j] + '-mini.png', this.position.x + j * 16 + dec, this.position.y + i * 14, 1);
					} else {
						this.grid[i][j] = new ZEPR.Sprite(this.zepr, 'game/images/bubble-' + pattern[i][j] + '.gif', this.position.x + j * 32 + dec, this.position.y + i * 28, 1);
					}
				}
			}
		}
	}
	
	this.launchBall = null;
	if (this.mini) {
		this.launcher = new ZEPR.Sprite(this.zepr, 'game/images/shooter-mini.png', _state.position.x + 39, _state.position.y + 161, 2);
	} else {
		this.launcher = new ZEPR.Sprite(this.zepr, 'game/images/shooter.png', _state.position.x + 78, _state.position.y + 322, 2);
	}
	
	this.nextBall = null;
	this.futureBall = null;

	this.compressor = null;
	if (_state.useCompressor) {
		this.compressor = new ZEPR.Sprite(this.zepr, 'game/images/compressor_main.png', _state.position.x + 2, _state.position.y - 51, 1);
	}

	this.falling = new Array();
	this.fallingSpeed = new Array();

	this.chainSprite = null;
	this.chainSource = null;
	this.chainTarget = null;
	this.chainAngle = 0;
	
	this.upBalls = new Array();
	this.gage = new Gage(this.zepr, this.position, this.mini);
	
	this.penguin = new Penguin(this.zepr, this.position, this.mini, this.position.gage == 1);
	
	this.lost = null;
}


View.prototype.addUpBall = function(_targetX, _targetY, _sourceX, _color, _odd, _delay) {
	var upBall = {};
	
	var dec = (_targetX % 2 == 0) ? (_odd ? 16 : 0) : (_odd ? 0 : 16);
	if (this.mini) {
		dec >>= 1;
		upBall.sx = this.position.x + _sourceX * 16;
		upBall.sy = 200;
		upBall.tx = this.position.x + _targetY * 16 + dec;
		upBall.ty = this.position.y + _targetX * 14;
	} else {
		upBall.sx = this.position.x + _sourceX * 32;
		upBall.sy = 400;
		upBall.tx = this.position.x + _targetY * 32 + dec;
		upBall.ty = this.position.y + _targetX * 28;
	}
	upBall.delay = _delay;
	upBall.color = _color;
	upBall.sprite = null;
	
	upBall.x = _targetX;
	upBall.y = _targetY;
	
	this.upBalls.push(upBall);
}



View.prototype.moveUpBalls = function() {
	
	var current = null;
	for (var i = 0; i < this.upBalls.length; i++) {
		current = this.upBalls[i];
		
		if (current.sprite) {
			current.sprite.move(0, -30);
			if (current.sprite.getY() < current.ty) {
				current.sprite.moveTo(current.tx, current.ty);
				this.upBalls.splice(i, 1);
				i--;
			}
		} else {
			current.delay--;
			if (current.delay <= 0) {
				if (this.mini) {
					current.sprite = new ZEPR.Sprite(this.zepr, 'game/images/bubble-' + current.color + '-mini.png', current.sx, current.sy, 1);
				} else {
					current.sprite = new ZEPR.Sprite(this.zepr, 'game/images/bubble-' + current.color + '.gif', current.sx, current.sy, 1);
				}
				this.grid[current.x][current.y] = current.sprite;
			}
		}
	}
	
	
	return this.upBalls.length == 0;
}


View.prototype.fall = function() {
	for (var i = 0; i < this.falling.length; i++) {
		this.fallingSpeed[i].y += 0.5;
		this.falling[i].move(this.fallingSpeed[i].x, this.fallingSpeed[i].y);

		if (this.falling[i].y > 480) {
			this.falling[i].remove();
			this.falling.splice(i, 1);
			this.fallingSpeed.splice(i, 1);
			i--;
		}
	}
}

View.prototype.clear = function(_grid) {
	var idx = 2;

	for (var i = 0; i < 8; i++) {
		for(var j = 0; j < 15; j++) {
			if (this.grid[j][i] && _grid[j][i] != 1) {
				this.grid[j][i].setIndex(idx);
				idx++;

				this.falling.push(this.grid[j][i]);
				this.fallingSpeed.push(new Point((Math.random() - 0.5) * 4, -6));
				this.grid[j][i] = null;
			}
		}
	}
}

View.prototype.moveChain = function() {
	this.chainAngle += 4;

	var angle = this.chainAngle * Math.PI / 180;

	if (this.mini) {
		if (this.chainAngle < 90) {
			this.chainSprite.moveTo(
				this.position.x + ((((this.chainSource.x + this.chainTarget.x) >> 1) + ((this.chainSource.x - this.chainTarget.x) >> 1) * Math.cos(angle)) >> 1),
				this.position.y + ((this.chainSource.y + 200 * Math.sin(angle))) >> 1);
		} else {
			this.chainSprite.moveTo(
				this.position.x + ((((this.chainSource.x + this.chainTarget.x) >> 1) + ((this.chainSource.x - this.chainTarget.x) >> 1) * Math.cos(angle)) >> 1),
				this.position.y + ((this.chainTarget.y + (this.chainSource.y - this.chainTarget.y + 200) * Math.sin(angle))) >> 1);
		}
	} else {
		if (this.chainAngle < 90) {
			this.chainSprite.moveTo(
				this.position.x + ((this.chainSource.x + this.chainTarget.x) >> 1) + ((this.chainSource.x - this.chainTarget.x) >> 1) * Math.cos(angle),
				this.position.y + this.chainSource.y + 200 * Math.sin(angle));
		} else {
			this.chainSprite.moveTo(
				this.position.x + ((this.chainSource.x + this.chainTarget.x) >> 1) + ((this.chainSource.x - this.chainTarget.x) >> 1) * Math.cos(angle),
				this.position.y + this.chainTarget.y + (this.chainSource.y - this.chainTarget.y + 200) * Math.sin(angle));
		}
	}

	if (this.chainAngle == 180) {
		this.chainAngle = 0;
		this.chainSprite = null;
		this.chainSource = null;
		this.chainTarget = null;

		return true;
	}

	return false;
}


View.prototype.getGrCoords = function(_coord, _state) {
	var y = _coord.y * 28;
	var x = (_coord.x << 5);
	if ((_coord.y & 1) ? !_state.odd : _state.odd) {
		x += 16;
	}

	return new Point(x, y);
}


View.prototype.setChain = function(_coordSrc, _coordDest, _state) {
	this.chainSprite = this.grid[_coordSrc.y][_coordSrc.x];
	this.grid[_coordSrc.y][_coordSrc.x] = null;

	this.chainTarget = this.getGrCoords(_coordDest, _state);
	this.chainSource = this.getGrCoords(_coordSrc, _state);

	this.launchBall = this.chainSprite;
}

View.prototype.pinBall = function(_coord) {
	this.grid[_coord.y][_coord.x] = this.launchBall;
	this.launchBall = null;
}

// TODO : Rationaliser!!! => switch sur type de balle
View.prototype.newLaunchBall = function(_ball) {
	if (this.mini) {
		this.launchBall = new ZEPR.Sprite(this.zepr, 'game/images/bubble-' + _ball.color + '-mini.png', this.position.x + (_ball.x >> 1), this.position.y + (_ball.y >> 1), 1);
	} else {
		this.launchBall = new ZEPR.Sprite(this.zepr, 'game/images/bubble-' + _ball.color + '.gif', this.position.x + _ball.x, this.position.y + _ball.y, 1);
	}
}

View.prototype.newNextBall = function(_ball) {
	if (this.mini) {
		this.nextBall = new ZEPR.Sprite(this.zepr, 'game/images/bubble-' + _ball.color + '-mini.png', this.position.x + (_ball.x >> 1), this.position.y + (_ball.y >> 1), 1);
	} else {
		this.nextBall = new ZEPR.Sprite(this.zepr, 'game/images/bubble-' + _ball.color + '.gif', this.position.x + _ball.x, this.position.y + _ball.y, 1);
	}
}


View.prototype.newFutureBall = function(_ball) {
	if (this.mini) {
		this.futureBall = new ZEPR.Sprite(this.zepr, 'game/images/bubble-' + _ball.color + '-mini.png', this.position.x + (_ball.x >> 1), this.position.y + (_ball.y >> 1), 1);
	} else {
		this.futureBall = new ZEPR.Sprite(this.zepr, 'game/images/bubble-' + _ball.color + '.gif', this.position.x + _ball.x, this.position.y + _ball.y, 1);
	}
}

//TODO : Rationaliser!!! => switch sur type de balle
View.prototype.moveLaunchBall = function(_ball) {
	if (this.mini) {
		this.launchBall.moveTo(this.position.x + (_ball.x >> 1), this.position.y + (_ball.y >> 1));
	} else {
		this.launchBall.moveTo(this.position.x + _ball.x, this.position.y + _ball.y);
	}
}

View.prototype.moveNextBall = function(_ball) {
	if (this.mini) {
		this.nextBall.moveTo(this.position.x + (_ball.x >> 1), this.position.y + (_ball.y >> 1));
	} else {
		this.nextBall.moveTo(this.position.x + _ball.x, this.position.y + _ball.y);
	}
}

View.prototype.moveFutureBall = function(_ball) {
	if (this.mini) {
		this.futureBall.moveTo(this.position.x + (_ball.x >> 1), this.position.y + (_ball.y >> 1));
	} else {
		this.futureBall.moveTo(this.position.x + _ball.x, this.position.y + _ball.y);
	}
}


View.prototype.switchBalls = function() {
	// TODO : Verifier que le sprite est bien transfere dans la grid (= pas de fuite!!!)
	this.launchBall = this.nextBall;
	this.nextBall = this.futureBall;
	this.futureBall = null;
}


View.prototype.turnLauncher = function(_deg) {
	this.launcher.rotate(_deg * Math.PI / 180.);
}

View.prototype.moveDown = function(_line) {
	for (var i = 0; i < 8; i++) {
		for(var j = 0; j < 15; j++) {
			if (this.grid[j][i]) {
				this.grid[j][i].move(0, this.mini ? 14 : 28);
			}
		}
	}

	this.grid.unshift(this.grid.pop());

	if (_line) {
		var newLine = _line.split('');
		
		if (this.mini) {
			var dec = (newLine.length == 8) ? 0 : 8;
			for (var i = 0; i < newLine.length; i++) {
				this.grid[0][i] = new ZEPR.Sprite(this.zepr, 'game/images/bubble-' + newLine[i] + '-mini.png', this.position.x + i * 16 + dec, this.position.y, 1);
			}
		} else {
			var dec = (newLine.length == 8) ? 0 : 16;
			for (var i = 0; i < newLine.length; i++) {
				this.grid[0][i] = new ZEPR.Sprite(this.zepr, 'game/images/bubble-' + newLine[i] + '.gif', this.position.x + i * 32 + dec, this.position.y, 1);
			}
		}
	} else {
		new ZEPR.Sprite(this.zepr, 'game/images/compressor_ext.png', this.compressor.x + 32, this.compressor.y + 2, 1);
		this.compressor.move(0, 28);
	}
}

View.prototype.showLost = function(_solo) {
	if (this.lost) {
		var found = this.lost.y > 14;
		while (!found) {
			this.lost.x++;
			if (this.lost.x == 8) {
				this.lost.y++;
				this.lost.x = 0;
				if (this.lost.y > 14) {
					break;
				}
			}
			
			if (this.grid[this.lost.y][this.lost.x]) {
				found = true;
				if (this.mini) {
					new ZEPR.Sprite(this.zepr, 'game/images/bubble_lose-mini.png', this.grid[this.lost.y][this.lost.x].x - 1, this.grid[this.lost.y][this.lost.x].y - 1, 2 + this.lost.y * 8 + this.lost.x);
				} else {
					new ZEPR.Sprite(this.zepr, 'game/images/bubble_lose.png', this.grid[this.lost.y][this.lost.x].x - 1, this.grid[this.lost.y][this.lost.x].y - 1, 2 + this.lost.y * 8 + this.lost.x);
				}
			}
		}
	} else {
		this.lost = {};
		this.lost.x = -1;
		this.lost.y = 0;
	}

	if (_solo) {
		if (this.panelIdx <= 100) {
			if (!this.panel) {
				this.panel = new ZEPR.Sprite(this.zepr, 'game/images/lose_panel.png', 160, 160, 100);
			}

			var val = (this.panelIdx / 200) * Math.PI;
			var zoom = 1 - (Math.cos(val + Math.PI / 2) + 1) * Math.sin(12 * val + Math.PI / 2);
		
			if (this.panelIdx == 100) {
				this.panel.resetZoom(); // Clean end
				
			} else {
				this.panel.setZoom(zoom);
			}
		} 

		if (this.panelIdx >= 60) {
			if ((this.panelIdx + 20) % 40 == 0) {
				this.nextText = new ZEPR.Sprite(this.zepr, this.textCanvas, 0, 320, 110);
			} else if (this.panelIdx % 40 == 0) {
				this.nextText.remove();
				this.nextText = null;
			}			
		}

		this.panelIdx++;
	}
}


View.prototype.isGameOver = function() {	
	return this.panelIdx > 60;
}


View.prototype.showWon = function(_name) {
	
	// Show winner 
	if (!this.panel) {

		// Hide hurry (if any)
		this.removeHurry();
		
		var panelCanvas = document.createElement('canvas');
		panelCanvas.width = 329;
		panelCanvas.height = 159;
		var panelCtx = panelCanvas.getContext('2d');

		panelCtx.drawImage(this.zepr.getImage('game/images/win_panel.png'), 0, 0);
		
		panelCtx.font = '20px arial';
		posX = 111 + (196 - panelCtx.measureText(_name).width) / 2;
		panelCtx.fillStyle = 'black';
		panelCtx.fillText(_name, posX + 2, 130);
		panelCtx.fillStyle = 'white';
		panelCtx.fillText(_name, posX, 128);
		
		this.panel = new ZEPR.Sprite(this.zepr, panelCanvas, 160, 160, 100);
	}
	
	if (this.panelIdx <= 100) {
		var val = (this.panelIdx / 200) * Math.PI;
		//var zoom = 0.5 + (1 - Math.cos(val) * Math.sin(12 * val + Math.PI / 2)) /2;
		var zoom = 1 - (Math.cos(val + Math.PI / 2) + 1) * Math.sin(12 * val + Math.PI / 2);
		
		if (this.panelIdx == 100) {
			this.panel.resetZoom(); // Clean end
		} else {
			this.panel.setZoom(zoom);
		}
	} 
	if (this.panelIdx >= 60) {	
		if ((this.panelIdx + 20) % 40 == 0) {
			this.nextText = new ZEPR.Sprite(this.zepr, this.textCanvas, 0, 320, 110);
		} else if (this.panelIdx % 40 == 0) {
			this.nextText.remove();
			this.nextText = null;
		}			
	}

	this.panelIdx++;
}

View.prototype.blinkHurry = function() {
	if (this.hurry) {
		// Hide
		this.hurry.remove();
		this.hurry = null;
	} else {
		// Show
		this.hurry = new ZEPR.Sprite(this.zepr, 'game/images/hurry_p1.png', this.position.x + 5, this.position.y + 126, 8);
	}
}

View.prototype.removeHurry = function() {
	if (this.hurry) {
		this.hurry.remove();
		this.hurry = null;
	}
}



var Gage = function(_ctx, _position, _mini) {

	if (_position.gage == this.TYPE_RIGHT) {
		this.x = _position.x + (_mini ? 128 : 268);	
	} else {
		this.x = _position.x - (_mini ? 16 : 34);
	}
	
	if (_position.gage == this.TYPE_LOW_LEFT) {
		this.y = _position.y + 408; // Only for big one
	} else {
		this.y = _position.y + (_mini ? 152: 346);
	}
	this.mini = _mini;
	this.balls = 0;
	
	if (_mini) {
		this.bananeImg = _ctx.getImage('game/images/banane-mini.png');
		this.tomateImg = _ctx.getImage('game/images/tomate-mini.png');
	} else {
		this.bananeImg = _ctx.getImage('game/images/banane.png');
		this.tomateImg = _ctx.getImage('game/images/tomate.png');		
	}
	
	_ctx.addSprite(this);
}

Gage.prototype = {
		
	TYPE_LEFT: 0,
	TYPE_RIGHT: 1,
	TYPE_LOW_LEFT: 2,
		
	getIndex: function() {
		return 1;
	},

	addBalls: function(_count) {
		this.balls += _count;
	},
	
	render: function(_ctx) {

		if (this.balls < 0) return; // Avoid net problems
		
		var red = this.balls >> 3;
		var yellow = this.balls & 7;
		
		var posY = 0;
		
		for (var i = 0; i < red; i++) {
			_ctx.drawImage(this.tomateImg, this.x, this.y + posY);
			posY -= (this.mini ? 6 : 10);
		}
		for (var i = 0; i < yellow; i++) {
			_ctx.drawImage(this.bananeImg, this.x + (this.mini ? 2 : 3), this.y + posY);
			posY -= (this.mini ? 6 : 10);
		}
	}
}


var Penguin = function(_ctx, _position, _mini, _isFlip) {
		
	this.mini = _mini;
	this.flip = _isFlip && !_mini ? 1 : 0;
	
	this.width = 80;
	this.height = 60;
	
	var px = _position.x;
	var py = _position.y;
	
	this.moveImg = null;
	if (_mini) {
		this.width = 40;
		this.height = 30;

		py += 188;
		px += 94;
		this.moveImg = 'game/images/penguin_mini.png';
	} else {
		py += 380;
		if (_isFlip) {
			px -= 35;
			this.moveImg = 'game/images/penguin_rev.png';
		} else {
			px += 210;
			this.moveImg = 'game/images/penguin.png';
		}
	}
	
	this.idx = 19;
	this.sprite = new ZEPR.ClipSprite(_ctx, this.moveImg, px, py, 1, this.width, this.height, this.flip);
	this.sprite.setClipIndex(this.idx);
	
	this.wait = 0;
	this.state = 0;
}

Penguin.prototype = {
	animate: function(_action) {
		
		if (this.flip) {
			if (_action == 1) {
				_action = 2;
			} else if (_action == 2) {
				_action = 1;
			}
		}
		
		if (this.state == 0) {
			switch (_action) {
				case 0: // No action
					// wait
					this.wait++;
					if (this.wait > 50 && this.wait < 147) {
						if (this.idx >= 72) {
							this.idx++;
						} else {
							this.idx = 72;
						}
					} else if (this.wait >= 147) {
						this.idx--;
						if (this.idx == 72) {
							this.idx = 19;
							this.wait = 0;
						}
					} else { // No wait
						if (this.idx < 19) {
							this.idx++;
						} else if (this.idx > 50) {
							this.idx--;
						} else if (this.idx > 19 && this.idx < 50) {
							this.idx++;
						}
					}				
				break;
				case 1: // Left
					this.wait = 0;
					if (this.idx <= 19) {
						if (this.idx > 0) {
							this.idx--;
						}
					} else {
						this.idx = 19;
					}
				break;
				case 2: // Right
					this.wait = 0;
					if (this.idx >= 50 && this.idx < 72) {
						if (this.idx < 70) {
							this.idx++;
						}
					} else {
						this.idx = 51;
					}				
				break;
				case 4: // Fire
					this.wait = 0;
					this.idx = 20;
				break;
			}
		} else if (this.state == 1) { // Won
			if (this.idx < 169) {
				this.idx = 169;
			} else if (this.idx < 235) {
				this.idx++;
			} else {
				this.idx = 169;
			} 
		} else { // Lost
			if (this.idx < 236) {
				this.idx = 236;
			} else if (this.idx < 393) {
				this.idx++;
			}
		}
		
		this.sprite.setClipIndex(this.idx);
	},
	
	end: function(_won) {		
		if (_won) {
			this.state = 1; // Won
		} else {
			this.state = 2; // Lost
		}
	} 
}

