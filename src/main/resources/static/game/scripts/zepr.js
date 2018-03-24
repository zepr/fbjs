var ZEPR = {};

// Key management

ZEPR.Events = {};

ZEPR.context = new Map();

// Image cache
ZEPR.cache = new Map();

ZEPR.Tools = {};


// TODO : Intégrer à ZEPR
var currentKeys = {};

function addKeyListener() {
	document.onkeyup = document.onkeydown = function(_evt) {

		currentKeys[_evt.which] = _evt.type == 'keydown';

		_evt = _evt || window.event;
		if (typeof _evt.stopPropagation != "undefined") {
			_evt.stopPropagation();
		} else {
			_evt.cancelBubble = true;
		}
	}
}


// Class extension

ZEPR.extendClass = function(_parent, _child) {
    var Surrogate = function() {};
    Surrogate.prototype = _parent.prototype;
    _child.prototype = new Surrogate();
    _child.prototype.constructor = _child;
}



// Touch management
ZEPR.Events.addTouchListener = function(_zepr) {

	ZEPR.Events.tx = [];
	ZEPR.Events.ty = [];

	_zepr.canvas.addEventListener("touchstart", ZEPR.Events.touchStart.bind(_zepr), false);
	_zepr.canvas.addEventListener("touchmove", ZEPR.Events.touchMove.bind(_zepr), false);
	_zepr.canvas.addEventListener("touchend", ZEPR.Events.touchEnd.bind(_zepr), false);
}

ZEPR.Events.updateTouches = function(_zepr, _touch) {
	ZEPR.Events.tx.splice(0, ZEPR.Events.tx.length);
	ZEPR.Events.ty.splice(0, ZEPR.Events.ty.length);

	for (var i = 0; i < _touch.length; i++) {
		ZEPR.Events.tx[i] = Math.min(_zepr.width, Math.max(0, (_touch[i].pageX - _zepr.x) / _zepr.scale));
		ZEPR.Events.ty[i] = Math.min(_zepr.height, Math.max(0, (_touch[i].pageY - _zepr.y) / _zepr.scale));
	}
}


ZEPR.Events.touchStart = function(_evt) {
	_evt.preventDefault();
	ZEPR.Events.updateTouches(this, _evt.touches);
}

ZEPR.Events.touchMove = function(_evt) {
	_evt.preventDefault();
	ZEPR.Events.updateTouches(this, _evt.touches);
}

ZEPR.Events.touchEnd = function(_evt) {
	_evt.preventDefault();
	ZEPR.Events.updateTouches(this, _evt.touches);
}




ZEPR.Loader = function() {
	this.loading = [];
	this.images = null;
	this.sounds = null;
	
	this.stats = {
		loaded: 0,
		total : 1, // Avoid division by zero in custom code
	};
}

ZEPR.Loader.prototype = {
	
	init: function(_zepr) {		
		if (_zepr.loader.init) {
			_zepr.loader.init(_zepr);
		}
		
		// Images
		if (_zepr.loader.images) {
			this.images = _zepr.loader.images; // Array is consumed 
			this.stats.total = this.images.length;
		} else {
			this.images = [];
		}
		// Sounds
		if (_zepr.loader.sounds) {
			this.sounds = _zepr.loader.sounds;
			this.stats.total += this.sounds.length;
		} else {
			this.sounds = [];
		}
	},
	
	run: function(_zepr) {
		
		for (var i = 0; i < this.loading.length; i++) {
			if (this.loading[i].complete) {
				//console.log('Chargement de ' + this.loading[i].src + ' OK [1]');
				this.loading.splice(i, 1);
				i--;
				this.stats.loaded++;
			}
		}
		
		// Load images
		while (this.loading.length < 4 && this.images.length > 0) {
			var imgSrc = this.images.splice(0, 1)[0];
			var img = _zepr.addImage(imgSrc);
			
			if (img.complete) {
				//console.log('Chargement de ' + img.src + ' OK [2]');
				this.stats.loaded++;
			} else {
				this.loading.push(img);
			}
		}

		// Load sounds (after images)
		while (this.loading.length < 4 && this.sounds.length > 0) {
			var sndSrc = this.sounds.splice(0, 1)[0];
			var snd = _zepr.addSound(sndSrc);
			
			if (snd.complete) {
				//console.log('Chargement de ' + snd.src + ' OK [3]');
				this.stats.loaded++;
			} else {
				this.loading.push(snd);
			}
		}
		
		if (_zepr.loader.run) {
			_zepr.loader.run(_zepr, this.stats);
		}
		
		if (this.loading.length == 0 && this.images.length == 0 && this.sounds.length == 0) {
			_zepr.loader = null;
			var delegate = _zepr.delegate;
			_zepr.delegate = null;
			_zepr.start(delegate);
		}
	}
	
}


ZEPR.Sound = function(_src) {
	this.src = _src;

	this.ctx = null;
	if (ZEPR.context.has('audio')) {
		this.ctx = ZEPR.context.get('audio');
	} else {
		this.ctx = new (window.AudioContext || window.webkitAudioContext)();
		ZEPR.context.set('audio', this.ctx);
	}

	this.data = null;
	this.complete = false;

	this.source = null;

	this.load();
}

ZEPR.Sound.prototype = {
	load: function() {
		var request = new XMLHttpRequest();
		request.open('GET', this.src, true);
  		request.responseType = 'arraybuffer';
		request.onload = function() {
			try {
				this.ctx.decodeAudioData(request.response, 
					function(_buf) {
						this.data = _buf;
						this.complete = true;
					}.bind(this),
					function(_e) {
						console.log('Impossible de decoder le fichier [' + this.src + ']');
						this.complete = true; 
					}.bind(this)
				);
			} catch (_e) {
				console.log('Impossible de decoder le fichier [' + this.src + ']');
				this.complete = true; 				
			}
		}.bind(this);

		request.onerror = function(_e) {
			console.log('Impossible de charger le fichier [' + this.src + ']');
			this.complete = true;
		}

  		request.send();
	}, 
	play: function(_loop) {
		if (this.data) {
			this.source = this.ctx.createBufferSource();
			this.source.buffer = this.data;
			this.source.connect(this.ctx.destination);
			this.source.loop = _loop;

			this.source.start(0);
			return true;
		} else {
			return false;
		}
	},
	stop: function() {
		if (this.source) {
			this.source.stop(0);
			this.source = null;
		}
	}
}




ZEPR.Engine = function(_width, _height, _sound) {
	
	this.sound = _sound; // Sound enabled

	this.loader = null; // Resources loader
	this.delegate = null; // screen waiting for loader
	
	this.finishFct = null; // Function called when game is over
	this.leaveFct = null; // Function called when user is leaving
	
	this.offCanvas = document.createElement('canvas');
	this.offCanvas.width = _width;
	this.offCanvas.height = _height;
	this.offCtx = this.offCanvas.getContext('2d');

	this.bgColor = '#000000';

	// Search for canvas
	// 1st => Canvas named gameCanvas
	this.canvas = document.getElementById('gameCanvas');
	if (this.canvas == null) {
		// 2nd => First canvas in page
		var cvList = document.getElementsByTagName('canvas');
		if (cvList.length > 0) {
			this.canvas = cvList[0];
		} else {
			// 3rd => Create a canvas
			this.canvas = document.createElement('canvas');
			document.body.appendChild(this.canvas);
		}
	}
	
	this.ctx = this.canvas.getContext('2d');

	this.width = _width;
	this.height = _height;
	this.ratio = _width / _height;

	this.sprites = new Array();
	this.images = new Object();
	this.background = null;

	window.addEventListener('resize', this.resize.bind(this), false);
	window.addEventListener('orientationchange', this.resize.bind(this), false);

	this.resize();
}


ZEPR.Engine.prototype = {

	/** 
	 * Adds loader before next screen
	 */
	setLoader: function(_loader) {
		this.loader = _loader;
	},
	
	/**
	 * Defines function called when game is over
	 */
	onFinish: function(_fct) {
		this.finishFct = _fct;
	},
	
	/**
	 * Defines function called when user leaves game
	 */
	onLeave: function(_fct) {
		this.leaveFct = _fct;
	},
		
	
	finish: function() {
		if (this.finishFct) {
			this.finishFct(this);
		}
	},
	
	leave: function() {
		// TODO arret des timers, workers
		// TODO Suppression des events
		
		if (this.timer) {
			clearInterval(this.timer);	
		}
		
		if (this.leaveFct) {
			this.leaveFct(this);
			this.leaveFct = null;
		}

		this.stopMusic();
	},
	
	
		
	// TODO : Debut de zone contexte
	addSprite: function(_sprite) {
		this.sprites.push(_sprite);
	},

	addImage: function(_src) {
		var img = ZEPR.cache.get(_src);
		if (!img) {
			img = new Image();
			img.src = _src;
			
			ZEPR.cache.set(_src, img);
		}

		return img;
	},

	addSound: function(_src) {
		var snd = ZEPR.cache.get(_src);
		if (!snd) {
			snd = new ZEPR.Sound(_src);

			ZEPR.cache.set(_src, snd);
		}

		return snd;
	},

	getImage: function(_src) {
		return this.addImage(_src);
	},

	playSound: function(_src) {
		if (!this.sound) return;

		var snd = this.addSound(_src);
		if (snd && snd.play) {
			snd.play(false);
		}
	},

	playMusic: function(_src) {
		if (!this.sound) return;

		var oldMsc = ZEPR.context.music;

		// Don't reset music if already playing
		// Dev should do stopMusic/playMusic to reset track instead
		if (oldMsc && oldMsc.src == _src) return; 

		var msc = this.addSound(_src);
		if (msc && msc.play) {
			this.stopMusic();
			if (msc.play(true)) {
				// Store only if played
				ZEPR.context.music = msc;
			}
		}
	},

	stopMusic: function() {
		var oldMsc = ZEPR.context.music;
		if (oldMsc) {
			oldMsc.stop();
			ZEPR.context.music = null;
		}
	},

	setSound: function(_sound) {
		this.sound = _sound;
		if (!this.sound) {
			stopMusic();
		}
	},

	setBackground: function(_src) {
		if (_src instanceof HTMLImageElement || _src instanceof HTMLCanvasElement) {
			this.background = _src;
		} else {
			this.background = this.getImage(_src);
		}
	},

	// Only effective if no background is set
	setBackgroundColor: function(_color) {
		this.bgColor = _color;
	},


	// TODO : Fin de zone contexte

	resize: function() {
		var newWidth = window.innerWidth;
		var newHeight = window.innerHeight;

		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		var newRatio = newWidth / newHeight;
		var scale;
		
		if (newRatio > this.ratio) {
			var realWidth = newHeight * this.ratio;
			this.x = (newWidth - realWidth) / 2;
			this.y = 0;
			scale = newHeight / this.height;
		} else {
			var realHeight = newWidth / this.ratio;
			this.x = 0;
			this.y = (newHeight - realHeight) / 2;
			scale = newWidth / this.width;
		}

		//this.x = Math.floor(this.x);
		//this.y = Math.floor(this.y);
		
		//this.wScale = Math.floor(this.width * this.scale);
		//this.hScale = Math.floor(this.height * this.scale);
		this.wScale = this.width * scale;
		this.hScale = this.height * scale;
		
		this.repaint();
	},

	repaint: function() {
		// Background
		if (this.background) {
			this.offCtx.drawImage(this.background, 0, 0);
		} else {
			this.offCtx.fillStyle = this.bgColor;
			this.offCtx.fillRect(0, 0, this.width, this.height);
		}

		// Sprites
		this.sprites.sort(function(_s1, _s2) {
			return _s1.getIndex() - _s2.getIndex();
		});

		for (var i = 0; i < this.sprites.length; i++) {
			if (this.sprites[i].destroy) {
				this.sprites.splice(i, 1);
				i--;
			} else {
				this.sprites[i].render(this.offCtx);
			}
		}

		this.ctx.drawImage(this.offCanvas, this.x, this.y, this.wScale, this.hScale);
	},

	start: function(_screen) {
		// Reset
		if (this.timer) {
			clearInterval(this.timer);	
		}
		this.background = null;
		this.bgColor = '#000000';
		this.sprites.splice(0, this.sprites.length);

		// Stop music when -actually- changing screen
		if (this.screen && this.screen.constructor.name != _screen.constructor.name) {
			this.stopMusic();
		}

		if (this.loader) {
			this.delegate = _screen;
			this.screen = new ZEPR.Loader();
		} else {		
			this.screen = _screen;
		}

		if (this.screen.init) {
			this.screen.init(this);
		}
		
		this.timer = setInterval(this.run.bind(this), 25);
	},

	run: function() {
		if (this.screen && this.screen.run) {
			this.screen.run(this);
		}

		this.repaint();
	}
}


ZEPR.TextSprite = function(_ctx, _txt, _color, _font, _x, _y, _index) {
	this.txt = _txt;
	this.color = _color;
	this.font = _font;

	this.x = _x || 0;
	this.y = _y || 0;
	this.index = _index || 1;

	_ctx.addSprite(this);
}

ZEPR.TextSprite.prototype = {
	move: function(_x, _y) {
		this.x += _x;
		this.y += _y;
	},

	moveTo: function(_x, _y) {
		this.x = _x;
		this.y = _y;
	},

	getX: function() {
		return this.x;
	},

	getY: function() {
		return this.y;
	},

	getIndex: function() {
		return this.index;
	},

	setIndex: function(_index) {
		this.index = _index;
	},
	
	getText: function() {
		return this.txt;
	},
	
	setText: function(_txt) {
		this.txt = _txt;
	},

	remove: function() {
		this.destroy = true;
	},

	render: function(_ctx) {
		_ctx.font = this.font;
		_ctx.fillStyle = this.color;
		_ctx.fillText(this.txt, this.x, this.y);
	}
}



ZEPR.Sprite = function(_ctx, _img, _x, _y, _index) {
	if (_img instanceof HTMLImageElement) {
		this.img = _img;
		this.src = _img.src
	} else if (_img instanceof HTMLCanvasElement) {
		var image = new Image();
		image.src = _img.toDataURL();
		this.img = image;
		this.src = image.src;
	} else {
		this.src = _img;
		this.img = _ctx.getImage(_img);
	}

	this.x = _x || 0;
	this.y = _y || 0;
	this.index = _index || 1;
	this.rotation = 0;
	this.zoom = 1;
	
	this.destroy = false;

	_ctx.addSprite(this);
}

ZEPR.Sprite.prototype = {
	move: function(_x, _y) {
		this.x += _x;
		this.y += _y;
	},

	moveTo: function(_x, _y) {
		this.x = _x;
		this.y = _y;
	},

	getX: function() {
		return this.x;
	},

	getY: function() {
		return this.y;
	},

	getIndex: function() {
		return this.index;
	},

	setIndex: function(_index) {
		this.index = _index;
	},

	rotate: function(_rad) {
		this.rotation = _rad;
	},

	remove: function() {
		this.destroy = true;
	},

	// TODO : Pour test => A prendre en compte : zoom + rotation
	// TODO : Pas de zoom si rotation pour le moment
	setZoom: function(_ratio) {
		this.zoom = _ratio;
	},
	
	resetZoom: function() {
		this.zoom = 1;
	},
	
	render: function(_ctx) {

		// Rotation
		if (this.rotation != 0) {
			_ctx.save();

			_ctx.translate(this.x + this.img.width / 2, this.y + this.img.height / 2);
			_ctx.rotate(this.rotation);
			_ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);

			_ctx.restore();
		} else {
			// No rotation => Same canvas context
			if (this.zoom == 1) {
				_ctx.drawImage(this.img, this.x, this.y);
			} else if (this.zoom > 0) {
				var w = this.img.width * this.zoom;
				var h = this.img.height * this.zoom;
				
				var nx = this.x + (this.img.width - w) / 2;
				var ny = this.y + (this.img.height - h) / 2;
				
				_ctx.drawImage(this.img, nx, ny, w, h);
			}
		}
	}
}


ZEPR.ClipSprite = function(_ctx, _img, _x, _y, _index, _clipWidth, _clipHeight, _flipBits) {
	ZEPR.Sprite.call(this, _ctx, _img, _x, _y, _index);
	
	this.clipWidth = _clipWidth;
	this.clipHeight = _clipHeight;

	this.flipBits = _flipBits | 0;
	
	// TODO : gestion _img.complete?
	this.clipX = this.img.width / _clipWidth;
	this.clipY = this.img.height / _clipHeight;
	
	this.clipIndex = 0;
	this.clipIndexX = 0;
	this.clipIndexY = 0;
}

ZEPR.extendClass(ZEPR.Sprite, ZEPR.ClipSprite);

ZEPR.ClipSprite.prototype.HFLIP = 1;
ZEPR.ClipSprite.prototype.VFLIP = 2;

ZEPR.ClipSprite.prototype.getClipIndex = function() {
	return this.clipIndex;
};
		
ZEPR.ClipSprite.prototype.setClipIndex = function(_idx) {
	this.clipIndex = _idx;
	this.clipIndexX = _idx % this.clipX;
	if (this.flipBits == 1 || this.flipBits == 3) {
		this.clipIndexX = this.clipX - this.clipIndexX - 1; 
	}

	this.clipIndexY = Math.floor(_idx / this.clipX) % this.clipY;
	if (this.flipBits == 2 || this.flipBits == 3) {
		this.clipIndexY = this.clipY - this.clipIndexY - 1;	
	}
};


ZEPR.ClipSprite.prototype.render = function(_ctx) {
	// TODO Gestion rotation et zoom?
	// TODO ou separation Sprite / ImageSprite avec fct avancees sur imagesprite?
			
	var sx = this.clipIndexX * this.clipWidth;
	var sy = this.clipIndexY * this.clipHeight;
	
	_ctx.drawImage(this.img,
			sx, sy,	this.clipWidth, this.clipHeight, 
			this.x, this.y, this.clipWidth, this.clipHeight);
};



// TODO : Factoriser hflip + vflip
/**
 * Horizontal flip of image
 */
ZEPR.Tools.hflip = function(_img) {
	// TODO : Verifier que l'image est chargee avant modif?
	
	var canvas = document.createElement('canvas');
	canvas.width = _img.width;
	canvas.height = _img.height;
	var ctx = canvas.getContext('2d');
	
	ctx.translate(canvas.width, 0);
	ctx.scale(-1, 1);
	ctx.drawImage(_img, 0, 0);
	
	var imgOut = new Image();
	imgOut.src = canvas.toDataURL();
		
	return imgOut;
}

/**
 * Vertical flip of image
 */
ZEPR.Tools.vflip = function(_img) {
	// TODO : Verifier que l'image est chargee avant modif?
	
	var canvas = document.createElement('canvas');
	canvas.width = _img.width;
	canvas.height = _img.height;
	var ctx = canvas.getContext('2d');
	
	ctx.translate(0, canvas.height);
	ctx.scale(1, -1);
	ctx.drawImage(_img, 0, 0);
	
	var imgOut = new Image();
	imgOut.src = canvas.toDataURL();
		
	return imgOut;
}


ZEPR.Tools.scale = function(_img, _factor) {
	// TODO : Verifier que l'image est chargee avant modif?	
	
	var canvas = document.createElement('canvas');
	canvas.width = _img.width * _factor;
	canvas.height = _img.height * _factor;
	var ctx = canvas.getContext('2d');	
	ctx.scale(_factor, _factor);
	ctx.drawImage(_img, 0, 0);
	
	var imgOut = new Image();
	imgOut.src = canvas.toDataURL();
		
	return imgOut;
}

