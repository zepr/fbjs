
var POINTS_SAME_COLOR = 4;
var POINTS_DETACHED = 6;

var GRID_POINTS_EVEN = [
	[3, 2, 3, 4, 4, 3, 2, 3],
	 [5, 5, 4, 5, 4, 5, 5],
	[5, 4, 4, 5, 5, 4, 4, 5],
	 [5, 4, 4, 3, 4, 4, 5],
	[5, 4, 3, 2, 2, 3, 4, 5],
	 [4, 3, 2, 2, 2, 3, 4],
	[4, 3, 2, 2, 2, 2, 3, 4],
	 [3, 2, 1, 2, 1, 2, 3],
	[3, 2, 1, 1, 1, 1, 2, 3],
	 [2, 1, 1, 1, 1, 1, 2],
	[1, 1, 1, 1, 1, 1, 1, 1]];

var GRID_POINTS_ODD = [
	 [3, 2, 3, 4, 3, 2, 3],
	[5, 5, 4, 5, 5, 4, 5, 5],
	 [5, 4, 4, 5, 4, 4, 5],
	[5, 4, 4, 3, 3, 4, 4, 5],
	 [5, 4, 3, 2, 3, 4, 5],
	[4, 3, 2, 2, 2, 2, 3, 4],
	 [4, 3, 2, 2, 2, 3, 4],
	[3, 2, 1, 2, 2, 1, 2, 3],
	 [3, 2, 1, 1, 1, 2, 3],
	[2, 1, 1, 1, 1, 1, 1, 2],
	 [1, 1, 1, 1, 1, 1, 1]];


var Compute = function(_msgEvt) {

	var data = _msgEvt.data;

	var ball = data.ball;
	var gridIn = data.grid;
	var state = data.state;

	var gridOut = new Array();
	for (var i = 0; i < 18; i++) {
		gridOut[i] = new  Array();
	}

	// Get position
	var pin = null;

	var rightDir = false;
	var dir = -87;

	for (var i = 0; i < 59; i++) {
		pin = moveBall(ball, state, dir, gridIn);
		gridOut[pin[1]][pin[0]] = dir;

		dir = -dir;
		if (rightDir) {
			dir += 3;
		}
		rightDir = !rightDir;
	}

	var bestDir = -1;
	var bestVal = 0;

	var odd = state.odd;
	var staticGrid = state.odd ? GRID_POINTS_ODD : GRID_POINTS_EVEN;

	for (var j = 0; j < gridOut.length; j++) {
		for (var i = 0; i < gridOut[j].length; i++) {
			if (gridOut[j][i]) {
				// Static
				var val = 0;
				if (staticGrid[j] && staticGrid[j][i]) {
					val += staticGrid[j][i];
				}

				// Dynamic
				var mark = new Array();
				for (var k = 0; k < 18; k++) {
					mark[k] = new Array();
				}

				gridIn[j][i] = ball.color;

				var dyn = countColor(i, j, odd, ball.color, gridIn, mark);
				if (dyn < 3) {
					val += dyn * POINTS_SAME_COLOR;
				} else {
					for (var k = 0; k < 8; k++) {
						if (gridIn[0][k]) {
							countColor(k, 0, state.odd, -1, gridIn, mark);
						}
					}
					val += countPoints(gridIn, mark);
				}

				gridIn[j][i] = null;

				if (val >= bestVal) {
					bestVal = val;
					bestDir = gridOut[j][i];
				}

			}

		}

		odd = !odd;
	}

	self.postMessage({'username' : data.username, 'direction' : bestDir});
}

self.addEventListener('message', Compute, false);


// Derived from action

var collide = function(_x1, _y1, _x2, _y2) {

	var dx = _x1 - _x2;
	var dy = _y1 - _y2;

	if (Math.abs(dx) > 32 || Math.abs(dy) > 32) {
		return false;
	}

	return dx * dx + dy * dy < 784;
}

var pinBall = function(_x, _y, _state) {
	var top = Math.floor(_y / 28);
	if (_y - 28 * top > 16) {
		top++;
	}

	var dec = 0;
	if ((top & 1) ? !_state.odd : _state.odd) {
		dec = 16;
	}
	var left = Math.max(0, _x - dec) >> 5;
	if (_x - (left << 5) - dec > 16) {
		left++;
	}

	return [left, top];
}


var moveBall = function(_ball, _state, _dir, _grid) {

	var bx = _ball.x;
	var by = _ball.y;

	var rad = (_dir - 90) * Math.PI / 180;
	var mx = 5 * Math.cos(rad);
	var my = 5 * Math.sin(rad);

	while(true) {

		bx += mx;
		by += my;

		if (bx < 0) { // Left border
			bx = -bx
			mx = -mx;
		} else if (bx > 224) { // Right border
			bx = 448 - bx;
			mx = -mx;
		}

		// Top border
		if (by < 28 * _state.compressorPosition) {
			return pinBall(bx, by, _state);
		}

		// Collisions
		var row = Math.floor(by / 28);
		var dec = 0;
		if ((row & 1) ? !_state.odd : _state.odd) {
			dec = 16;
		}

		for (var i = 0; i < 2; i++) {
			for (var col = 0; col < 8; col++) {
				if (_grid[row] && _grid[row][col] > 0 && collide(bx, by, col * 32 + dec, row * 28)) {
					return pinBall(bx, by, _state);
				}
			}

			row++;
			dec = 16 - dec;
		}
	}
}

var countColor = function(_x, _y, _odd, _color, _gridIn, _gridMark) {

	if (_x < 0 || _x >= 8 || _y < 0 || _y >= 15) return 0;

	var count = 0;

	if (!_gridMark[_y][_x]
		&& (_gridIn[_y][_x] == _color
			|| (_color == -1 && _gridIn[_y][_x]))) {
		count++;
		_gridMark[_y][_x] = _color == -1 ? 1 : 2;

		count += countColor(_x - 1, _y, _odd, _color, _gridIn, _gridMark);
		count += countColor(_x + 1, _y, _odd, _color, _gridIn, _gridMark);

		count += countColor(_x, _y - 1, !_odd, _color, _gridIn, _gridMark);
		count += countColor(_x, _y + 1, !_odd, _color, _gridIn, _gridMark);

		if (_odd) {
			count += countColor(_x + 1, _y - 1, !_odd, _color, _gridIn, _gridMark);
			count += countColor(_x + 1, _y + 1, !_odd, _color, _gridIn, _gridMark);
		} else {
			count += countColor(_x - 1, _y - 1, !_odd, _color, _gridIn, _gridMark);
			count += countColor(_x - 1, _y + 1, !_odd, _color, _gridIn, _gridMark);
		}
	}

	return count;
}

var countPoints = function(_gridIn, _gridMark) {
	var count = 0;

	for(var j = 0; j < 15; j++) {
		for (var i = 0; i < _gridIn[j].length; i++) {
			if (_gridIn[j][i]) {
				switch(_gridMark[j][i]) {
					case 0:
						count += POINTS_DETACHED;
					break;
					case 2:
						count += POINTS_SAME_COLOR;
					break;
					default:
				}
			}
		}
	}

	return count;
}
