/*
	Copyright (c) 2010  Seneca College
	MIT LICENSE
*/
/**
	@class XB PointStream is a WebGL library designed to efficiently stream and
	render point cloud data in a canvas element.

	@version 0.75
*/
var BasicCTX = (function() {

	/**
		@private
	*/
	function BasicCTX() {    
		// Chrome still does not have subarray, so we add it here.
		if(!Float32Array.prototype.subarray) {
			Float32Array.prototype.subarray = function(s,e) {
				return !e ? this.slice(0) : this.slice(s,e);
			};
		}

		this.t30 = Math.tan(Math.PI / 6.0);
		this.znear = 0.1;
		this.zfar = 5000;

		var usersRender = function() {};

		const VERSION  = "0.75";

		// default rendering states
		this.bk = [0, 0, 0, 0];

		// browser detection to handle differences such as mouse scrolling
		var browser     = -1;
		const MINEFIELD = 0;
		const CHROME    = 1;
		const CHROMIUM  = 2;
		const WEBKIT    = 3;

		// not used yet
		const FIREFOX   = 4;
		const OPERA     = 5;
		const SAFARI    = 6;
		const IE        = 7;

		this.canvas = null;
		this.ctx = null;

		var matrixStack = [];
		this.perspectiveMatrix = null;
		this.orthographicMatrix = null;
		this.normalMatrix = null;
		this.scaleFactor = null;
		this.ymax = null;
		this.ymin = null;
		this.xmin = null;
		this.xmax = null;
		this.width = null;
		this.height = null;

		/**
			Reads the file at path and returns the contents as a string

			This function is synchronous
		*/
		this.getShaderStr = function(path) {
			var XHR = new XMLHttpRequest();
			XHR.open("GET", path, false);
			if(XHR.overrideMimeType) {
				XHR.overrideMimeType("text/plain");
			}
			try {
				XHR.send(null);
			}catch(e) {
				window.console.log('XHR error');
			}
			return XHR.responseText;
		};

		/**
			@private

			@param {} ctx
			@param {String} vetexShaderSource
			@param {String} fragmentShaderSource
		*/
		this.createProgramObject = function(vetexShaderSource, fragmentShaderSource) {
			var vertexShaderObject = this.ctx.createShader(this.ctx.VERTEX_SHADER);
			this.ctx.shaderSource(vertexShaderObject, vetexShaderSource);
			this.ctx.compileShader(vertexShaderObject);
			if (!this.ctx.getShaderParameter(vertexShaderObject, this.ctx.COMPILE_STATUS)) {
				throw this.ctx.getShaderInfoLog(vertexShaderObject);
			}
			var fragmentShaderObject = this.ctx.createShader(this.ctx.FRAGMENT_SHADER);
			this.ctx.shaderSource(fragmentShaderObject, fragmentShaderSource);
			this.ctx.compileShader(fragmentShaderObject);
			if (!this.ctx.getShaderParameter(fragmentShaderObject, this.ctx.COMPILE_STATUS)) {
				throw this.ctx.getShaderInfoLog(fragmentShaderObject);
			}
			var programObject = this.ctx.createProgram();
			this.ctx.attachShader(programObject, vertexShaderObject);
			this.ctx.attachShader(programObject, fragmentShaderObject);
			this.ctx.linkProgram(programObject);
			if (!this.ctx.getProgramParameter(programObject, this.ctx.LINK_STATUS)) {
				throw "Error linking shaders.";
			}
			return programObject;
		};

		/**
			@private
		*/
		function renderLoop() {
			matrixStack.push(M4x4.I);
			usersRender();
			matrixStack.pop();
		}

		/**
			@private

			Sets variables to default values.
		*/
		this.runDefault = function() {
			var aspect = this.width / this.height;
			this.ymax = this.znear * this.t30;
			this.ymin = -this.ymax;
			this.xmin = this.ymin * aspect;
			this.xmax = this.ymax * aspect;
			this.perspectiveMatrix = M4x4.makeFrustum(this.xmin, this.xmax, this.ymin, this.ymax, this.znear, this.zfar);
			this.orthographicMatrix = M4x4.makeOrtho(this.xmin, this.xmax, this.ymin, this.ymax, this.znear, this.zfar);
			this.normalMatrix = M4x4.I;
		};

		this.setDefaults = function(w, h) {
			var aspect = w / h;
			this.ymax = this.znear * this.t30;
			this.ymin = -this.ymax;
			this.xmin = this.ymin * aspect;
			this.xmax = this.ymax * aspect;
			this.perspectiveMatrix = M4x4.makeFrustum(this.xmin, this.xmax, this.ymin, this.ymax, this.znear, this.zfar);
			this.orthographicMatrix = M4x4.makeOrtho(this.xmin, this.xmax, this.ymin, this.ymax, this.znear, this.zfar);
			this.normalMatrix = M4x4.I;
		};

		/**
			@name PointStream#onRender
			@event

			Set a function to run when a frame is to be rendered.

			@param {Function} func

			@example
			psInstance.onRender = function() {
				psInstance.translate(0, 0, -25);
				psInstance.clear();
				psInstance.render(pointCloudObj);
			};
		*/
		this.__defineSetter__("onRender", function(func) {
			usersRender = func;
		});

		/**
			Get the width of the canvas.
			@name PointStream#width
			@returns {Number}
		*/
		this.__defineGetter__("width", function() {
			return width;
		});

		/**
			Get the height of the canvas.
			@name PointStream#height
			@returns {Number}
		*/
		this.__defineGetter__("height", function() {
			return height;
		});

		/**
			Get the version of the library.
			@name PointStream#version
			@returns {String}
		*/
		this.__defineGetter__("version", function() {
			return VERSION;
		});

		/**
			Sets the background color.

			@param {Array} color Array of 4 values ranging from 0 to 1.
		*/
		this.background = function(color) {
			this.ctx.clearColor(color[0], color[1], color[2], color[3]);
		};  

		/**
			Clears the color and depth buffers.
		*/
		this.clear = function() {
			this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT);
		};

		/**
			Resize the viewport.
			This can be called after setup.

			@example
			window.onresize = function() {
				ps.resize(window.innerWidth, window.innerHeight);
			};

			@param {Number} pWidth
			@param {Number} pHeight
		*/
		this.resize = function(pWidth, pHeight, ctxAttribs) {
			// override the canvas attributes
			this.canvas.setAttribute("width", pWidth);
			this.canvas.setAttribute("height", pHeight);
			// check if style exists? how? can't just query it...
			this.canvas.style.width = width = pWidth;
			this.canvas.style.height = height = pHeight;
			var contextNames = ["webgl","experimental-webgl", "moz-webgl","webkit-3d"];
			for(var i = 0; i < contextNames.length; i++) {
				try {
					this.ctx = this.canvas.getContext(contextNames[i], ctxAttribs);
					if(this.ctx) {
						break;
					}
				} catch(e) {}
			}
			if(!this.ctx) {
				window.console.log("Your browser does not support WebGL.");
			}
			// parseInt hack used for Chrome/Chromium
			this.ctx.viewport(0, 0, parseInt(pWidth), parseInt(pHeight));
			this.runDefault();
		};

		/*************************************/
		/********** Transformations **********/
		/*************************************/

		/**
			@name PointStream#scale^2
			@function

			Multiplies the top of the matrix stack with a scaled matrix.

			@param {Number} sx
			@param {Number} sy
			@param {Number} sz
		*/
		this.scale = function(sx, sy, sz) {
			matrixStack[matrixStack.length - 1] = M4x4.scale3(sx, sy, sz, matrixStack[matrixStack.length - 1]);
		};

		/**
			Multiplies the top of the matrix stack with a translation matrix.

			@param {Number} tx
			@param {Number} ty
			@param {Number} tz
		*/
		this.translate = function(tx, ty, tz) {
			matrixStack[matrixStack.length - 1] = M4x4.translate3(tx, ty, tz, matrixStack[matrixStack.length - 1]);
		};

		/**
			Multiply the matrix at the top of the model view matrix
			stack with a rotation matrix about the x axis.

			@param {Number} radians
		*/
		this.rotateX = function(radians) {
			matrixStack[matrixStack.length - 1] = M4x4.rotate(radians, V3.$(1,0,0), matrixStack[matrixStack.length - 1]);
		};

		/**
			Multiply the matrix at the top of the model view matrix
			stack with a rotation matrix about the y axis.

			@param {Number} radians
		*/
		this.rotateY = function(radians) {
			matrixStack[matrixStack.length - 1] = M4x4.rotate(radians, V3.$(0,1,0), matrixStack[matrixStack.length - 1]);
		};

		/**
			Multiply the matrix at the top of the model view matrix
			stack with a rotation matrix about the z axis.

			@param {Number} radians
		*/
		this.rotateZ = function(radians) {
			matrixStack[matrixStack.length - 1] = M4x4.rotate(radians, V3.$(0,0,1), matrixStack[matrixStack.length - 1]);
		};

		/**
		*/
		this.rotate = function(radians, a) {
			matrixStack[matrixStack.length - 1] = M4x4.rotate(radians, a, matrixStack[matrixStack.length - 1]);
		};

		/*********************************************/
		/********** Matrix Stack Operations **********/
		/*********************************************/

		/**
			Pushes on a copy of the matrix at the top of the matrix stack.
		*/
		this.pushMatrix = function() {
			matrixStack.push(M4x4.clone(this.peekMatrix()));
		};

		/**
			Pops off the matrix on top of the matrix stack.
		*/
		this.popMatrix = function() {
			matrixStack.pop();
		};

		/**
			Get a copy of the matrix at the top of the matrix stack.

			@returns {Float32Array}
		*/
		this.peekMatrix = function() {
			return matrixStack[matrixStack.length - 1];
		};

		/**
			Set the matrix at the top of the matrix stack.

			@param {Float32Array} mat
		*/
		this.loadMatrix = function(mat) {
			matrixStack[matrixStack.length - 1] = mat;
		};

		/**
		*/
		this.multMatrix = function(mat) {
			matrixStack[matrixStack.length - 1] = M4x4.mul(matrixStack[matrixStack.length - 1], mat);
		};

		this.getSF = function() {
			return this.scaleFactor;
		};

		this.getOM = function() {
			return this.orthographicMatrix;
		};

		this.getPM = function() {
			return this.perspectiveMatrix;
		};

		/**
			Must be called after the library has been instantiated.

			@example
			var ps = new PointStream();
			ps.setup(document.getElementById('canvas'));

			@param {canvas} cvs
		*/
		this.setup = function(cvs, ctxAttribs) {
			this.canvas = cvs;
			// if the canvas does not have dimension attributes,
			// use the default canvas dimensions.      
			var cvsWidth = this.canvas.getAttribute("width");
			var cvsHeight = this.canvas.getAttribute("height");

			if(cvsWidth == null) {
				cvsWidth = 300;
			}
			if(cvsHeight == null) {
				cvsHeight = 150;
			}

			// This will create our graphics context.
			this.resize(cvsWidth, cvsHeight, ctxAttribs);
			this.ctx.enable(this.ctx.DEPTH_TEST);
			this.background(this.bk);

			/**
				@private
			*/
			window.PSrequestAnimationFrame = (function() {
				return window.requestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame ||
					window.oRequestAnimationFrame ||
					window.msRequestAnimationFrame ||
					function(callback, cvs) {
						window.setTimeout(callback, 1000.0/60.0);
					};
			}) ();

			// call the user's render function
			(function animationLoop(){
				renderLoop();
				PSrequestAnimationFrame(animationLoop, canvas);
			})();
		};

	}// constructor

	return BasicCTX;
} ());
