//This class handles queueing, rendering, and deleting a point cloud octree
//it also handles point picking to show a thumbnail of where a particular point
//was found

var PCTree = (function() {
	function PCTree(bctx, metaObj, t) {
		var Tree = metaObj;

		const STARTED = 1;
		const COMPLETE = 2;
		const NODATA = 3;

		//add subnodes to the metadata that include buffers, path name, load status
		//and "pointers" to other subnodes for use in a least-recently-used queue (LRU)
		tempQueue = [];
		tempQueue.push(Tree);
		while(tempQueue.length > 0) {
			var n = tempQueue.pop();
			n.node = {
				VertexPositionBuffer: {},
				VertexColorBuffer: {},
				PickingColorBuffer: {},
				path: n.p,
				status: NODATA,
				prev: null,
				next: null
			};
			for(var i in n.ch) {
				tempQueue.push(n.ch[i]);
			}
		}
		delete tempQueue;

		//the next few functions are related to the LRU queue and were adapted from the Potree
		//viewer at http://potree.org
		var LRU = new Object();
		var LRUcount = 0;
		//max number of nodes to hold at any given time
		const LRUMax = 1000;
		var head = null;
		var tail = null;

		//moves a node to the back of the queue (most recently used) or adds the node to the back
		//if it is not in the queue
		function DLLTouch(node) {
			if(LRU[node.path] == null) {
				node.prev = tail;
				tail = node;
				if(node.prev != null) {
					node.prev.next = node;
				}

				LRU[node.path] = node;
				LRUcount++;

				if(head == null) {
					head = node;
				}
			}
			else {
				var item = LRU[node.path];
				if(node.prev == null) {
					if(node.next != null) {
						head = node.next;
						head.prev = null;
						node.prev = tail;
						node.next = null;
						tail = node;
						node.prev.next = node;
					}
					else if(node.next == null) {}
					else {
						node.prev.next = node.next;
						node.next.prev = node.prev;
						node.prev = tail;
						node.next = null;
						tail = node;
						node.prev.next = node;
					}
				}
			}
		}

		//remove a node from the front of the queue (least recently used)
		function DLLRemove() {
			if(head == null) {
				return null;
			}

			var node = head;
			if(node.next != null) {
				head = node.next;
				head.prev = null;
			}
			else {
				head = null;
				tail = null;
			}

			delete LRU[node.path];
			LRUcount--;

			node.prev = null;
			node.next = null;

			return node;
		}

		//get the least recently used node
		function DLLHead() {
			if(head == null) {
				return null;
			}
			var node = head;
			return node;
		}

		var basicCtx = bctx;
		var gl = basicCtx.ctx;

		//used to compare a node's projection size to determine if we render it's children 
		var qSize = 50;

		//used to determine if a node is within the view frustum
		var c30 = Math.cos(Math.PI / 6.0);
		var s30 = Math.sin(Math.PI / 6.0);
		var t30 = Math.tan(Math.PI / 6.0);
		var znear = 0.1;
		var zfar = -1000.0;

		var checkOrtho = false;
		var orthoProjection;

		var table = t;

		//natural color and histogram equalization colors are stored in the same atrribute array
		var colorOffset = 0;

		var thumbCtx = document.getElementById("thumbnail").getContext('2d');
		var thumbImg = new Image();

		//dsiplay a thumbnail with a box surrounding the pixels where a point/feature was found
		function drawThumbNail() {
			thumbCtx.drawImage(thumbImg, 0, 0);
			thumbCtx.strokeStyle = "#FF00FF";
			thumbCtx.beginPath();
			thumbCtx.moveTo(this.tempX - 5, this.tempY - 5);
			thumbCtx.lineTo(this.tempX - 5, this.tempY + 5);
			thumbCtx.lineTo(this.tempX + 5, this.tempY + 5);
			thumbCtx.lineTo(this.tempX + 5, this.tempY - 5);
			thumbCtx.closePath();
			thumbCtx.stroke();
		};

		//create shader for points, cache the attribute and uniform variable locations
		//and initialize point size, bias and scale for min max color enhancement, and color enhancement mode
		var pointShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/point.vert'), basicCtx.getShaderStr('shaders/basic.frag'));
		gl.useProgram(pointShader);
		var pointVarLocs = [];
		pointVarLocs.push(gl.getAttribLocation(pointShader, "aVertexPosition"));
		pointVarLocs.push(gl.getAttribLocation(pointShader, "aVertexColor"));
		pointVarLocs.push(gl.getUniformLocation(pointShader, "uModelViewMatrix"));
		pointVarLocs.push(gl.getUniformLocation(pointShader, "uPointSize"));
		//for undetermined point attenuation feature
		// pointVarLocs.push(gl.getUniformLocation(pointShader, "uAttenuation"));
		pointVarLocs.push(gl.getUniformLocation(pointShader, "uBias"));
		pointVarLocs.push(gl.getUniformLocation(pointShader, "uScale"));
		pointVarLocs.push(gl.getUniformLocation(pointShader, "uCEMode"));
		pointVarLocs.push(gl.getUniformLocation(pointShader, "uProjectionMatrix"));
		gl.uniform1f(pointVarLocs[3], 1);
		gl.uniform3fv(pointVarLocs[4], Tree.b);
		gl.uniform3fv(pointVarLocs[5], Tree.s);
		gl.uniform1i(pointVarLocs[6], 0);

		//create shader for point picking, cache the attribute and uniform variable locations
		var pointPickShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/pointPick.vert'), basicCtx.getShaderStr('shaders/basic.frag'));
		gl.useProgram(pointPickShader);
		var pointPickVarLocs = [];
		pointPickVarLocs.push(gl.getAttribLocation(pointPickShader, "aVertexPosition"));
		pointPickVarLocs.push(gl.getAttribLocation(pointPickShader, "aPickColor"));
		pointPickVarLocs.push(gl.getUniformLocation(pointPickShader, "uPPMV"));

		//create the Frame Buffer Object used for point picking
		var pointPickingFBO = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, pointPickingFBO);
		pointPickingTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, pointPickingTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 16, 16, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		pointRenderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, pointRenderBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 16, 16);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pointPickingTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, pointRenderBuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.deleteRenderbuffer(pointRenderBuffer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.deleteTexture(pointPickingTexture);

		//delete temp variables
		delete pointPickingTexture;
		delete pointRenderBuffer;

		//create shader for cross that shows which point is selected, cache the attribute and uniform variable locations
		var crossShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/cross.vert'), basicCtx.getShaderStr('shaders/magenta.frag'));
		gl.useProgram(crossShader);
		var crossVarLocs = [];
		crossVarLocs.push(gl.getAttribLocation(crossShader, "aVertexPosition"));
		crossVarLocs.push(gl.getUniformLocation(crossShader, "uOffset"));

		//cross vertices
		var crossVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, crossVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0.0074, 	  0.0,
														  0.0814, 	  0.0,
														 -0.0074, 	  0.0,
														 -0.0814, 	  0.0,
														 	 0.0,  0.0074,
														 	 0.0,  0.0814,
														 	 0.0, -0.0074,
														 	 0.0, -0.0814]), gl.STATIC_DRAW);

		//set color enhancement mode
		var currCE;
		this.setCE = function(val) {
			currCE = val;
			if(val === 2) {
				colorOffset = 12;
			}
			else {
				colorOffset = 0;
			}
		};

		this.usePerspective = function(n, f) {
			znear = n;
			zfar = -f;
			// gl.useProgram(pointShader);
			// gl.uniformMatrix4fv(pointVarLocs[3], false, basicCtx.perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			orthoProjection = projectionMatrix;
			// gl.useProgram(pointShader);
			// gl.uniformMatrix4fv(pointVarLocs[2], false, projectionMatrix);
		};

		var currPointSize = 1;
		this.pointSize = function(size) {
			currPointSize = size;
		};

		//for undetermined point attenuation feature
		// this.attenuation = function(constant, linear, quadratic) {
		// 	gl.useProgram(pointShader);
		// 	gl.uniform3fv(pointVarLocs[5], [constant, linear, quadratic]);
		// };

		this.setCheckOrtho = function(val) {
			checkOrtho = val;
		}

		const loadingMax = 10;
		var currentLoad = 0;
		var deleteQueue = [];
		var renderQueue = [];

		//top level octree render function
		this.renderTree = function(c) {
			//set up shader parameters
			gl.useProgram(pointShader);
			gl.uniformMatrix4fv(pointVarLocs[2], false, basicCtx.peekMatrix());
			if(checkOrtho) {
				gl.uniformMatrix4fv(pointVarLocs[7], false, orthoProjection);
			}
			else {
				gl.uniformMatrix4fv(pointVarLocs[7], false, basicCtx.perspectiveMatrix);
			}
			//this value is used in the shader to make points far away appear bigger
			//which helps make the cloud look less sparse when far enough away to only see
			//the first few levels of the octree
			gl.uniform1f(pointVarLocs[3], -zfar);
			gl.uniform1i(pointVarLocs[6], currCE);
			gl.viewport(0, 0, 540, 540);

			renderQueue = [];
			this.buildRenderQ(Tree);

			render();

			//properly delete any nodes that have been thrown away
			var dql = deleteQueue.length;
			for(var i = 0; i < dql; i++) {
				if(deleteQueue[i].status == COMPLETE) {
					gl.deleteBuffer(deleteQueue[i].VertexPositionBuffer.VBO);
					gl.deleteBuffer(deleteQueue[i].VertexColorBuffer);
					gl.deleteBuffer(deleteQueue[i].PickingColorBuffer);
					deleteQueue[i].status = NODATA;
				}
				else {
					deleteQueue.push(deleteQueue[i]);
				}
			}
			deleteQueue.splice(0, dql);

			//throw away least recently used nodes that are above the threshold
			if(LRUcount > LRUMax) {
				while(LRUcount > LRUMax) {
					var item = DLLHead();
					if(item != null) {
						deleteQueue.push(item);
					}
					DLLRemove(item);
				}
			}
		};

		this.buildRenderQ = function(n) {
			var tempQueue = [];

			//always render the top 2 levels of the octree
			//leave out of the LRU queue
			renderQueue.push(n);
			if(n.node.status == NODATA) {
				if(currentLoad < loadingMax) {
					load(n);
					currentLoad++;
				}
			}
			for(var h in n.ch) {
				var child = n.ch[h];
				if(child.node.status == NODATA) {
					if(currentLoad < loadingMax) {
						load(child);
						currentLoad++;
					}
				}
				renderQueue.push(child);
				//push level 2 (zero indexed) of the octree into the tempQueue
				for(var j in child.ch) {
					tempQueue.push(child.ch[j]);
				}
			}

			while(tempQueue.length > 0 && renderQueue.length < LRUMax) {
				var node = tempQueue.splice(0, 1)[0];

				//calculate node center in view space
				var centerVS = V3.mul4x4(basicCtx.peekMatrix(), node.c);

				if(isvisible(node.r, centerVS)) {
					if(checkOrtho) {
						var size = node.r * basicCtx.height / basicCtx.scaleFactor;
					}
					else {
						//determine size in pixels that the node projects to
						//use absolute value to keep recursing if the node is close but behind the viewer
						var size = Math.abs((node.r * basicCtx.height) / (centerVS[2] * t30));
					}
					if(size > qSize) {
						//add node to the render queue, load data if it doesn't exist, put it at the 
						//back of the LRU (most recently used), and check children
						renderQueue.push(node);
						if(node.node.status == NODATA) {
							if(currentLoad < loadingMax) {
								load(node);
								currentLoad++;
							}
						}
						DLLTouch(node.node);
						for(var i = 0; i < node.ch.length; i++) {
							tempQueue.push(node.ch[i]);
						}
					}
				}
			}
		};

		function isvisible(radius, center) {
			var d = new Array(6);

			//calculate the view frustum plane equations
			if(checkOrtho) {
				d[0] = center[0] - basicCtx.scaleFactor;
				d[1] = -center[0] - basicCtx.scaleFactor;
				d[2] = center[1] - basicCtx.scaleFactor;
				d[3] = -center[1] - basicCtx.scaleFactor;
				d[4] = 0.1 + center[2];
				d[5] = -1000.0 - center[2];
			}
			else {
				var a = center[0] * c30;
				var b = center[1] * c30;
				var c = center[2] * s30;
				d[0] = c + a;
				d[1] = c - a;
				d[2] = c - b;
				d[3] = c + b;
				d[4] = -znear + center[2];
				d[5] = zfar - center[2];
			}

			//check the bounding sphere against the view frustum planes
			for(var i = 0; i < 6; i++) {
				if(d[i] > radius) {
					return false;
				}
			}
			return true;
		}

		function render() {
			for(var i in renderQueue) {
				if(renderQueue[i].node.status == COMPLETE) {
					gl.useProgram(pointShader);
					gl.bindBuffer(gl.ARRAY_BUFFER, renderQueue[i].node.VertexPositionBuffer.VBO);
					gl.vertexAttribPointer(pointVarLocs[0], 3, gl.FLOAT, false, 0, 0);
					gl.bindBuffer(gl.ARRAY_BUFFER, renderQueue[i].node.VertexColorBuffer);
					gl.vertexAttribPointer(pointVarLocs[1], 3, gl.FLOAT, false, 24, colorOffset);
					gl.drawArrays(gl.POINTS, 0, renderQueue[i].node.VertexPositionBuffer.length / 3);
				}
			}
		}

		this.pointPicking = function(x, y) {
			//hack to fix mozilla's cursor positioning which is incorrect for some reason (?!)
			if(navigator.vendor == "") {
				y += 15;
			}

			//BROWSER_RESIZE
			//this matrix transforms the view volume to the 10x10 pixel region centered at the cursor 
			var pickingTransform = new Float32Array([		   54,			  0, 0, 0,
																0,		     54, 0, 0,
																0,			  0, 1, 0,
													 54 - x * 0.2, 54 - y * 0.2, 0, 1]);

			gl.viewport(0, 0, 10, 10);
			gl.bindFramebuffer(gl.FRAMEBUFFER, pointPickingFBO);
			basicCtx.clear();
			gl.useProgram(pointPickShader);
			if(checkOrtho) {
				var proj = orthoProjection;
			}
			else {
				var proj = basicCtx.perspectiveMatrix;
			}
			var PPVM = M4x4.mul(pickingTransform, M4x4.mul(proj, basicCtx.peekMatrix()));
			gl.uniformMatrix4fv(pointPickVarLocs[2], false, PPVM);

			//blending enabled and set up in such a way as to allow the alpha channel to be used to hold
			//relevant photo data
			gl.enable(gl.BLEND);
			gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ONE, gl.ZERO);

			this.recursePP(Tree);

			gl.disable(gl.BLEND);

			//read pixels and determine the closest non empty (black) color to the center
			var arr = new Uint8Array(400);
			gl.readPixels(0, 0, 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, arr);
			var closest = [-5, -5];
			var distance = Number.POSITIVE_INFINITY;
			var rgba = [0, 0, 0, 0];
			var hit = false;
			var index;
			for(var i = 0; i < 10; i++) {
				for(var j = 0; j < 10; j++) {
					index = i * 40 + j * 4;
					if(arr[index] != 0 && (arr[index + 1] & 127) != 0) {
						var temp = (i - 4.5) * (i - 4.5) + (j - 4.5) * (j - 4.5);
						if(temp < distance) {
							distance = temp;
							closest[0] = j - 4.5;
							closest[1] = i - 4.5;
							rgba[0] = arr[index];
							rgba[1] = arr[index + 1];
							rgba[2] = arr[index + 2];
							rgba[3] = arr[index + 3];
							hit = true;
						}
					}
				}
			}

			//BROWSER_RESIZE
			gl.viewport(0, 0, 540, 540);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

			if(hit) {
				//bit twiddling to retrieve pic id and xy image coordinates from the color
				//see parseCallback() function for convention used
				thumbImg.tempX = rgba[2] | ((rgba[1] & 128) << 1);
				thumbImg.tempY = rgba[3];
				thumbImg.onload = drawThumbNail;
				var pic = (rgba[0] | ((rgba[1] & 127) << 8)) - 1;

				//get thumbnail
				//this can be made simpler by eliminating the need for leading zeros
				//thumbnail preprocessing needs to be updated to not include leading zeros
				if(pic < 10) {
					thumbImg.src = table + "_thumbnails/0000000" + pic + ".jpg";
				}
				else if(pic < 100) {
					thumbImg.src = table + "_thumbnails/000000" + pic + ".jpg";
				}
				else if(pic < 1000) {
					thumbImg.src = table + "_thumbnails/00000" + pic + ".jpg";
				}
				else {
					thumbImg.src = table + "_thumbnails/0000" + pic + ".jpg";
				}

				//draw cross at point found in the main window
				gl.useProgram(crossShader);
				gl.uniform2fv(crossVarLocs[1], new Float32Array([(x + closest[0] - 270) / 270, (y + closest[1] - 270) / 270]));
				gl.bindBuffer(gl.ARRAY_BUFFER, crossVBO);
				gl.vertexAttribPointer(crossVarLocs[0], 2, gl.FLOAT, false, 0, 0);
				gl.drawArrays(gl.LINES, 0, 8);
			}
			else {
				thumbCtx.clearRect(0, 0, 300, 225);
			}
		};

		this.recursePP = function(node) {
			for(var i in renderQueue) {
				if(renderQueue[i].node.status == COMPLETE) {
					gl.bindBuffer(gl.ARRAY_BUFFER, renderQueue[i].node.VertexPositionBuffer.VBO);
					gl.vertexAttribPointer(pointPickVarLocs[0], 3, gl.FLOAT, false, 0, 0);
					gl.bindBuffer(gl.ARRAY_BUFFER, renderQueue[i].node.PickingColorBuffer);
					gl.vertexAttribPointer(pointPickVarLocs[1], 4, gl.FLOAT, false, 0, 0);
					gl.drawArrays(gl.POINTS, 0, renderQueue[i].node.VertexPositionBuffer.length / 3);
				}
			}
		};

		function parseCallback() {
			if(this.readyState == 4 && this.status == 200) {
				var obj = JSON.parse(this.responseText);
				var node = this.node;

				var verts = new Float32Array(obj.length / 4);
				var cols = new Float32Array(verts.length * 2);
				//include alpha channel to hold extra photo data
				var pickCols = new Float32Array(verts.length / 3 * 4);

				//response is an array of points where each point is x, y, z, r, g, b, r2, g2, b2, i, ix, iy
				//r2, g2, b2 are histogram equalized colors
				//i, ix, iy are photo index and xy image coordinates
				for(var i = 0, j = 0, k = 0, m = 0; i < obj.length; i += 12, j += 3, k += 6, m += 4) {
					verts[j] 	 = obj[i];
					verts[j + 1] = obj[i + 1];
					verts[j + 2] = obj[i + 2];
					cols[k] 	 = obj[i + 3] / 255;
					cols[k + 1]  = obj[i + 4] / 255;
					cols[k + 2]  = obj[i + 5] / 255;
					cols[k + 3]  = obj[i + 6] / 255;
					cols[k + 4]  = obj[i + 7] / 255;
					cols[k + 5]  = obj[i + 8] / 255;

					//bit twiddling
					//thumbnail is 300x225 pixels, so need need 9 bits for x coord and 8 bits for y coord
					//remaining 15 bits are used for photo id
					//red is the lower 8 bits of photo id
					//the low 7 bits of green are used for the high 7 bits of photo id
					//the high bit of green is the 9th bit of x while all of blue is used for the lower 8 bits of x
					//alpha is used for y
					pickCols[m] 	= ((obj[i + 9] + 1) & 255) / 255;
					pickCols[m + 1] = ((((obj[i + 9] + 1) >> 8) & 127) | (((obj[i + 10] * 300) >> 1) & 128)) / 255;
					pickCols[m + 2] = ((obj[i + 10] * 300) & 255) / 255;
					pickCols[m + 3] = (obj[i + 11] * 225) / 255;
				}

				//buffer vertices and colors for this node
				var VBO = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
				gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
				node.VertexPositionBuffer = {length: verts.length, VBO: VBO};
				
				node.PickingColorBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, node.PickingColorBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, pickCols, gl.STATIC_DRAW);

				node.VertexColorBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexColorBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, cols, gl.STATIC_DRAW);

				node.status = COMPLETE;
				currentLoad--;
				delete this;
			}
		}

		function load(node) {
			var request = new XMLHttpRequest();
			request.onload = parseCallback;
			node.status = STARTED;
			request.node = node.node;
			request.open("GET", "action.php?a=getnode&path="+node.p+"&table="+table, true);
			request.send();
		}
	}// constructor

	return PCTree;
} ());