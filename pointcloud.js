//adapted from http://zenit.senecac.on.ca/wiki/index.php/XB_PointStream
//portion adapted sets up a point cloud with keyboard and mouse controls.
//Functionality added includes setting up a junk buffer trick,
//adding in markers, map, axes, grid and user features,
//and updating projection matrices for each of these additional features

var PointCloud = (function() {
	function PointCloud(cvsElement, table) {
		this.basicCtx = new BasicCTX();
		this.basicCtx.setup(cvsElement);

		//junkbuffer trick used to avoid having to always enable and disable vertex attribute arrays
		//for every single draw command
		//need to enable enough for the maximum that any shader would need
		this.basicCtx.setDefaults(540, 540);
		var junkBuffer = this.basicCtx.ctx.createBuffer();
		this.basicCtx.ctx.bindBuffer(this.basicCtx.ctx.ARRAY_BUFFER, junkBuffer);
		this.basicCtx.ctx.bufferData(this.basicCtx.ctx.ARRAY_BUFFER, new Float32Array([0.0]), this.basicCtx.ctx.STATIC_DRAW);
		this.basicCtx.ctx.enableVertexAttribArray(0);
		this.basicCtx.ctx.enableVertexAttribArray(1);
		this.basicCtx.ctx.vertexAttribPointer(0, 1, this.basicCtx.ctx.FLOAT, false, 0, 0);
		this.basicCtx.ctx.vertexAttribPointer(1, 1, this.basicCtx.ctx.FLOAT, false, 0, 0);

		//request metadata for values specific to the cloud
		//metadata is an octree structure that holds (per node) the path name, 
		//center and radius for the bounding box, and an array of child nodes.
		//the root node also stores addtional per cloud data including total bound box,
		//ortho size for map display, and scale and bias parameters for min max color enhancement
		request = new XMLHttpRequest();
		request.open("GET", "action.php?a=getnode&path=meta&table="+table, false);
		request.send();
		obj = JSON.parse(request.responseText);
		this.tree = new PCTree(this.basicCtx, obj, table);

		//request metadata for values specific to 2 clouds, used for leaf on and leaf off
		// request = new XMLHttpRequest();
		// request.open("GET", "action.php?a=getnode&path=meta&table="+table+"_leaf_off", false);
		// request.send();
		// obj = JSON.parse(request.responseText);
		// this.tree = new PCTree(this.basicCtx, obj, table+"_leaf_off");
		
		// request = new XMLHttpRequest();
		// request.open("GET", "action.php?a=getnode&path=meta&table="+table+"_leaf_on", false);
		// request.send();
		// obj = JSON.parse(request.responseText);
		// this.tree2 = new PCTree(this.basicCtx, obj, table+"_leaf_on");
		
		//initialize class to handle ecosynth specific features
		this.markers = new Markers(this.basicCtx, obj.BB, table);
		this.map = new Map(this.basicCtx, obj.o);
		this.axes = new Axes(this.basicCtx);
		this.grid = new Grid(this.basicCtx, obj.BB);
		this.users = new Users(this.basicCtx);

		delete request;
		delete obj;

		// enable extensions
		// var ext = (
		// 	this.basicCtx.ctx.getExtension('OES_standard_derivatives') ||
		// 	this.basicCtx.ctx.getExtension('MOZ_OES_standard_derivatives') ||
		// 	this.basicCtx.ctx.getExtension('WEBKIT_OES_standard_derivatives')
		// );
		// if(ext) {
		// 	window.console.log('we have OES_standard_derivatives');
		// }
		// else {
		// 	window.console.log('sorry, no OES_standard_derivatives');
		// }

		//set the perspective projection for each piece that displays in the main window
		//the projection changes per frame such that the near and far planes are fit to the point cloud
		//this is to avoid z-fighting
		this.usePerspective = function() {
			var centerVS = V3.mul4x4(this.basicCtx.peekMatrix(), this.grid.getCenter());
			var near = -this.grid.getRadius() - centerVS[2]; // - 5.0;
			if(near < 0.1) {
				near = 0.1;
			}
			var far = this.grid.getRadius() - centerVS[2]; // + 5.0;
			var bound = near * this.basicCtx.t30;
			this.basicCtx.perspectiveMatrix = M4x4.makeFrustum(-bound, bound, -bound, bound, near, far);

			this.tree.usePerspective(near, far);
			//this.tree2.usePerspective(near, far);			
			this.markers.usePerspective();
			this.grid.usePerspective();
		};

		//set the default ortho size based on the grid radius
		this.useOrthographic = function() {
			this.basicCtx.scaleFactor = this.grid.getRadius();
			var projectionMatrix = M4x4.scale3(1 / this.basicCtx.scaleFactor, 1 / this.basicCtx.scaleFactor, 1, this.basicCtx.orthographicMatrix);
			this.tree.useOrthographic(projectionMatrix);
			//this.tree2.useOrthographic(projectionMatrix);
			this.markers.useOrthographic(projectionMatrix);
			this.grid.useOrthographic(projectionMatrix);
			this.users.useOrthographic(projectionMatrix);
		};

		//update the ortho size for zooming in ortho mode
		this.scaleOrthographic = function(deltaS) {
			this.basicCtx.scaleFactor += deltaS;
			if(this.basicCtx.scaleFactor < 5) {
				this.basicCtx.scaleFactor = 5;
			}
			else if(this.basicCtx.scaleFactor > 600) {
				this.basicCtx.scaleFactor = 600;
			}
			var temp = 1.0 / this.basicCtx.scaleFactor;
			var projectionMatrix = M4x4.scale3(temp, temp, 1, this.basicCtx.orthographicMatrix);
			this.tree.useOrthographic(projectionMatrix);
			//this.tree2.useOrthographic(projectionMatrix);
			this.markers.useOrthographic(projectionMatrix);
			this.grid.useOrthographic(projectionMatrix);
			this.users.useOrthographic(projectionMatrix);
		};

		var __empty_func = function() {};

		// Mouse
		var userMouseReleased = __empty_func;
		var userMousePressed = __empty_func;
		var userMouseScroll = __empty_func;
		var mouseX = 0;
		var mouseY = 0;

		// Keyboard
		var userKeyUp = __empty_func;
		var userKeyDown = __empty_func;
		var userKeyPressed = __empty_func;
		var key = 0;

		var attn = [0.01, 0.0, 0.003];

		// Both key and keyCode will be equal to these values
		const _BACKSPACE = 8;
		const _TAB       = 9;
		const _ENTER     = 10;
		const _RETURN    = 13;
		const _ESC       = 27;
		const _DELETE    = 127;
		const _CODED     = 0xffff;

		// p.key will be CODED and p.keyCode will be this value
		const _SHIFT     = 16;
		const _CONTROL   = 17;
		const _ALT       = 18;
		const _UP        = 38;
		const _RIGHT     = 39;
		const _DOWN      = 40;
		const _LEFT      = 37;

		var codedKeys = [_SHIFT, _CONTROL, _ALT, _UP, _RIGHT, _DOWN, _LEFT];

		/**
			@private

			Used by keyboard event handlers

			@param {} code
			@param {} shift

			@returns
		*/
		function keyCodeMap(code, shift) {
			// Letters
			if (code >= 65 && code <= 90) { // A-Z
				// Keys return ASCII for upcased letters.
				// Convert to downcase if shiftKey is not pressed.
				if (shift) {
					return code;
				}
				else {
					return code + 32;
				}
			}
			// Numbers and their shift-symbols
			else if (code >= 48 && code <= 57) { // 0-9
				if (shift) {
					switch (code) {
						case 49:
							return 33; // !
						case 50:
							return 64; // @
						case 51:
							return 35; // #
						case 52:
							return 36; // $
						case 53:
							return 37; // %
						case 54:
							return 94; // ^
						case 55:
							return 38; // &
						case 56:
							return 42; // *
						case 57:
							return 40; // (
						case 48:
							return 41; // )
					}
				}
			}
			// Symbols and their shift-symbols
			else {
				if (shift) {
					switch (code) {
						case 107:
							return 43; // +
						case 219:
							return 123; // {
						case 221:
							return 125; // }
						case 222:
							return 34; // "
					}
				} else {
					switch (code) {
						case 188:
							return 44; // ,
						case 109:
							return 45; // -
						case 190:
							return 46; // .
						case 191:
							return 47; // /
						case 192:
							return 96; // ~
						case 219:
							return 91; // [
						case 220:
							return 92; // \
						case 221:
							return 93; // ]
						case 222:
							return 39; // '
					}
				}
			}
			return code;
		}

		/**
			@private

			@param {} evt
			@param {} type
		*/
		function keyFunc(evt, type) {
			var key;
			if (evt.charCode) {
				key = keyCodeMap(evt.charCode, evt.shiftKey);
			} else {
				key = keyCodeMap(evt.keyCode, evt.shiftKey);
			}
			return key;
		}

		/**
			@private

			@param {} evt
		*/
		function mouseScroll(evt) {
			var delta = 0;

			if(evt.detail) {
				delta = evt.detail / 3;
			}
			else if(evt.wheelDelta) {
				delta = -evt.wheelDelta / 12;
			}
			userMouseScroll(delta);
		}

		/**
			@private
		*/
		function mousePressed() {
			userMousePressed();
		}

		/**
			@private
		*/
		function mouseReleased() {
			userMouseReleased();
		}

		/**
			@private

			@param {} evt
		*/
		function mouseMoved(evt) {
			mouseX = evt.pageX;
			mouseY = evt.pageY;
		}

		/**
			@private

			@param {} evt
		*/
		function keyDown(evt) {
			key = keyFunc(evt, userKeyDown);
			userKeyDown();
		}

		/**
			@private

			@param {} evt
		*/
		function keyPressed(evt) {
			key = keyFunc(evt, userKeyPressed);
			userKeyPressed();
		}

		/**
			@private

			@param {} evt
		*/
		function keyUp(evt) {
			key = keyFunc(evt, userKeyUp);
			userKeyUp();
		}

		/*************************************/
		/**********  Public methods **********/
		/*************************************/

		/**
			@name PointStream#onMousePressed
			@event

			Set a function to run when a mouse button is pressed.

			@param {Function} func
		*/
		this.__defineSetter__("onMousePressed", function(func) {
			userMousePressed = func;
		});

		/**
			@name PointStream#onMouseReleased
			@event

			Set a function to run when a mouse button is released.

			@param {Function} func
		*/
		this.__defineSetter__("onMouseReleased", function(func) {
			userMouseReleased = func;
		});

		/**
			@name PointStream#onMouseScroll
			@event

			Set a function to run when the mouse wheel is scrolled.

			@param {Function} func
		*/
		this.__defineSetter__("onMouseScroll", function(func) {
			userMouseScroll = func;
		});

		/**
			@name PointStream#onKeyDown
			@event

			Set a function to run when a key is pressed.

			@param {Function} func
		*/
		this.__defineSetter__("onKeyDown", function(func) {
			userKeyDown = func;
		});

		/**
			@name PointStream#onKeyPressed
			@event

			Set a function to run when a key is pressed and released.

			@param {Function} func
		*/
		this.__defineSetter__("onKeyPressed", function(func) {
			userKeyPressed = func;
		});

		/**
			@name PointStream#onKeyUp
			@event

			Set a function to run when a key is released.

			@param {Function} func
		*/
		this.__defineSetter__("onKeyUp", function(func) {
			userKeyUp = func;
		});

		/**
			Get the current mouse cursor's x coordinate 
			@name PointStream#mouseX
			@returns {Number}
		*/
		this.__defineGetter__("mouseX", function() {
			return mouseX;
		});

		/**
			Get the current mouse cursor's y coordinate
			@name PointStream#mouseY
			@returns {Number}
		*/
		this.__defineGetter__("mouseY", function() {
			return mouseY;
		});

		/**
			Get the last key that was pressed by the user.
			@name PointStream#key
			@returns {Number}
		*/
		this.__defineGetter__("key", function() {
			return key;
		});

		/**
			@private

			@param {} element
			@param {} type
			@param {Function} func
		*/
		function attach(element, type, func) {
			if(element.addEventListener){
				element.addEventListener(type, func, false);
			} else {
				element.attachEvent("on" + type, fn);
			}
		}

		attach(this.basicCtx.canvas, "mouseup", mouseReleased);
		attach(this.basicCtx.canvas, "mousedown", mousePressed);
		attach(this.basicCtx.canvas, "DOMMouseScroll", mouseScroll);
		attach(this.basicCtx.canvas, "mousewheel", mouseScroll);
		attach(this.basicCtx.canvas, "mousemove", mouseMoved);

		attach(document, "keydown", keyDown);
		attach(document, "keypress", keyPressed);
		attach(document, "keyup", keyUp);

	}// constructor

	return PointCloud;
} ());