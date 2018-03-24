var Action = function(_pattern) {
	this.grid = new Array(18);
	for (var i = 0; i < 18; i++) {
		this.grid[i] = new Array(8);
		
		if (_pattern && i < _pattern.length) {
			for (var j = 0; j < _pattern[i].length; j++) {
				this.grid[i][j] = _pattern[i][j];
			}
		}
	}
}


Action.prototype.clear = function(_grid) {
	var count = 0;
	
	for (var i = 0; i < 8; i++) {
		for(var j = 0; j < 15; j++) {
			if (this.grid[j][i] && _grid[j][i] != 1) {
				this.grid[j][i] = 0;
				count++;
			}
		}
	}
	
	return count;
}

Action.prototype.collide = function(_x1, _y1, _x2, _y2) {

	var dx = _x1 - _x2;
	var dy = _y1 - _y2;

	if (Math.abs(dx) > 32 || Math.abs(dy) > 32) {
		return false;
	}

	return dx * dx + dy * dy < 784;
}


Action.prototype.countRemovable = function(_grid, _state) {
	var count = 0;

	for (var i = 0; i < 8; i++) {
		for(var j = _state.compressorPosition; j < 15; j++) {
			if (this.grid[j][i] && _grid[j][i] != 1) {
				count++;
			}
		}
	}

	return count;
}


Action.prototype.countColor = function(_x, _y, _odd, _color, _grid) {
	
	if (_x < 0 || _x >= 8 || _y < 0 || _y > 15) return 0;

	var count = 0;

	if (!_grid[_y][_x] 
		&& (this.grid[_y][_x] == _color 
			|| (_color == -1 && this.grid[_y][_x] > 0))) {
		count++;
		_grid[_y][_x] = _color == -1 ? 1 : 2;

		count += this.countColor(_x - 1, _y, _odd, _color, _grid);
		count += this.countColor(_x + 1, _y, _odd, _color, _grid);

		count += this.countColor(_x, _y - 1, !_odd, _color, _grid);
		count += this.countColor(_x, _y + 1, !_odd, _color, _grid);

		if (_odd) {
			count += this.countColor(_x + 1, _y - 1, !_odd, _color, _grid);
			count += this.countColor(_x + 1, _y + 1, !_odd, _color, _grid);				
		} else {
			count += this.countColor(_x - 1, _y - 1, !_odd, _color, _grid);
			count += this.countColor(_x - 1, _y + 1, !_odd, _color, _grid);				
		}
	}

	return count;
}

Action.prototype.getDetached = function(_grid) {
	var detached = null;
	
	for (var i = 0; i < 8; i++) {
		for(var j = 0; j < 15; j++) {
			if (this.grid[j][i] && !_grid[j][i]) {
				if (detached == null) {
					detached = new Array();
				}

				detached[this.grid[j][i]] = new Point(i, j);
			}
		}
	}

	return detached;
}


Action.prototype.getNextColor = function(_state) {

	var value = -1;

	if (_state.useCompressor) {
		// Only visible color
		var colors = [0, 0, 0, 0, 0, 0, 0, 0, 0];
		var hasBubble = false;

		for (var i = 0; i < 8; i++) {
			for(var j = 0; j < 15; j++) {
				if (this.grid[j][i]	> 0) {
					colors[this.grid[j][i]]++;
					hasBubble = true;
				}
			}
		}

		if (hasBubble) {
			do {
				value = Math.floor((Math.random() * 8) + 1);
			} while (colors[value] == 0);
		}

		
		console.log('-> ' + value);
	} else {
		// Any color
		value = Math.floor((Math.random() * 8) + 1);
	}

	return value;
}


Action.prototype.getBestChain = function(_detached, _state) {

	var testPosition = new Point(0, 0);

	var bestCount = 3;
	var bestBall = null;

	var odd = _state.odd;
	for (var j = _state.compressorPosition; j < 15; j++) {
		testPosition.y = j;
		for (var i = 0; i < (odd ? 7 : 8); i++) {
			if (!this.grid[j][i]) {
				testPosition.x = i;
				for (var k = 1; k <= 8; k++) {
					if (_detached[k]) {
						this.grid[j][i] = k;

						var markGrid = this.mark(testPosition, k, _state);
						if (markGrid) {
							var newCount = this.countRemovable(markGrid, _state);
							if (newCount >= bestCount) {
								bestCount = newCount;
								bestBall = new Ball(i, j, k, true);
							}
						}
					}
				}

				this.grid[j][i] = 0;
			}
		}

		odd = !odd;
	}
	
	return bestBall;
}


Action.prototype.mark = function(_fixed, _color, _state) {
	var mark = new Array();
	for (var i = 0; i < 18; i++) {
		mark[i] = new Array();
	}

	// Count color group
	var odd = (_fixed.y & 1) ? !_state.odd : _state.odd;
	var count = this.countColor(_fixed.x, _fixed.y, odd, _color, mark);

	if (count < 3) {
		return null;
	}

	// Mark balls
	odd = (_state.compressorPosition & 1) ? !_state.odd : _state.odd;
	for (var i = 0; i < 8; i++) {
		if (this.grid[_state.compressorPosition][i] > 0) {
			this.countColor(i, _state.compressorPosition, odd, -1, mark);
		}
	}

	return mark;
}



Action.prototype.pinBall = function(_ball, _state) {
	var top = Math.floor(_ball.y / 28);
	if (_ball.y - 28 * top > 16) {
		top++;
	}

	var dec = 0;
	if ((top & 1) ? !_state.odd : _state.odd) {
		dec = 16;
	}
	var left = Math.max(0, _ball.x - dec) >> 5;
	if (_ball.x - (left << 5) - dec > 16) {
		left++;
	}
	
	//console.log('left=' + left + ', top=' + top);
	
	this.grid[top][left] = _ball.color;
	_state.ballFixed = new Point(left, top);
	_ball.x = (left << 5) + dec;
	_ball.y = 28 * top;
	_state.move = null;
}

Action.prototype.moveBall = function(_ball, _state) {
	_ball.x += _state.move.x;
	_ball.y += _state.move.y;

	if (_ball.x < 0) { // Left border
		_ball.x = -_ball.x
		_state.move.x = -_state.move.x;
		_state.rebound = true;
	} else if (_ball.x > 224) { // Right border
		_ball.x = 448 - _ball.x;
		_state.move.x = -_state.move.x;
		_state.rebound = true;
	}

	// Top border
	if (_ball.y < 28 * _state.compressorPosition) {
		this.pinBall(_ball, _state);
		return;
	}

	// Collisions
	var row = Math.floor(_ball.y / 28);
	var dec = 0;
	if ((row & 1) ? !_state.odd : _state.odd) {
		dec = 16;
	}
	for (var i = 0; i < 2; i++) {
		for (var col = 0; col < 8; col++) {
			if (this.grid[row][col] > 0 && this.collide(_ball.x, _ball.y, col * 32 + dec, row * 28)) {
				this.pinBall(_ball, _state);
				return;
			}
		}

		row++;
		dec = 16 - dec;
	}
}

Action.prototype.moveDown = function(_line) {
	if (_line) {		
		this.grid.unshift(_line.split(''));
		this.grid.pop();
	} else {
		this.grid.unshift(this.grid.pop());
	}
}


Action.prototype.moveUp = function(_line, _odd) {
	
	var positions = new Array();
	
	for (var i = 7; i >= 0; i--) {
				
		if (_line[i] != '0') {
			var newBall = this.subUp(i, _line[i], _odd);
			
			positions.push(newBall);
			this.grid[newBall.x][newBall.y] = _line[i];
		}
	}
	
	return positions;
}


Action.prototype.subUp = function(_pos, _color, _odd) {
	
	var pos = {};
	pos.index = _pos;
	pos.color = _color;
	
	var oddVal = _odd ? 1 : 0;
	for (var i = 14; i >= 0; i--) {
		if (i % 2 == oddVal) {
			// even line
			if (this.grid[i][_pos]) {				
				pos.x = i + 1;
				pos.y = Math.min(_pos, 6);
								
				return pos;
			}
		} else {
			// odd line
			if (this.grid[i][Math.max(0, _pos - 1)] || this.grid[i][Math.max(0, _pos)]) {
				pos.x = i + 1;
				pos.y = _pos;
				
				return pos;
			}
		}
	}
	
	pos.x = 0;
	if (_odd) {
		pos.y = Math.min(_pos, 6);
	} else {
		pos.y = _pos;
	}
	
	return pos;
}

Action.prototype.isLost = function() {
	for (var i = 0; i < 8; i++) {
		if (this.grid[12][i]) {
			return true;
		}
	}
	
	return false;
}

