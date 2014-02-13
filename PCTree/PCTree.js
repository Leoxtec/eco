var PCTree = (function() {
	function PCTree(bctx, b, s) {
		var basicCtx = bctx;

		var qSize = 128;
		var e = Math.cos(Math.PI / 180.0);
		var updateQueue = [];
		var maxProcess = 50;

		var requestQueue = [];
		var requestCount = 0;
		var maxRequest = 1;

		var c30 = Math.cos(Math.PI / 6.0);
		var s30 = Math.sin(Math.PI / 6.0);
		var t30 = Math.tan(Math.PI / 6.0);
		var znear = 0.1;
		var zfar = -1000.0;

		var Tree = null;

		var leafShader;
		var quadShader;

		var leafVarLocs = [];
		var quadVarLocs = [];

		var checkOrtho = false;
		var orthoProjection;

		var table;
		var colorOffset = 0;

		const STARTED = 1;
		const COMPLETE = 2;

		var picInfo = [];
		var pointPickIndex = 1;

		var thumbCtx = document.getElementById("thumbnail").getContext('2d');
		var thumbImg = new Image();

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

		quadShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/quad.vert'), basicCtx.getShaderStr('shaders/quad.frag'));
		basicCtx.ctx.useProgram(quadShader);
		quadVarLocs.push(basicCtx.ctx.getAttribLocation(quadShader, "aVertexPosition"));
		quadVarLocs.push(basicCtx.ctx.getAttribLocation(quadShader, "aTexCoord"));
		quadVarLocs.push(basicCtx.ctx.getUniformLocation(quadShader, "uMVP"));
		// quadVarLocs.push(basicCtx.ctx.getUniformLocation(quadShader, "uModelViewMatrix"));
		// quadVarLocs.push(basicCtx.ctx.getUniformLocation(quadShader, "uProjectionMatrix"));
		quadVarLocs.push(basicCtx.ctx.getUniformLocation(quadShader, "uSampler"));
		quadVarLocs.push(basicCtx.ctx.getUniformLocation(quadShader, "uBias"));
		quadVarLocs.push(basicCtx.ctx.getUniformLocation(quadShader, "uScale"));
		quadVarLocs.push(basicCtx.ctx.getUniformLocation(quadShader, "uCEMode"));
		basicCtx.ctx.uniform3fv(quadVarLocs[4], b);
		basicCtx.ctx.uniform3fv(quadVarLocs[5], s);
		basicCtx.ctx.uniform1i(quadVarLocs[6], 0);

		leafShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/point.vert'), basicCtx.getShaderStr('shaders/basic.frag'));
		basicCtx.ctx.useProgram(leafShader);
		leafVarLocs.push(basicCtx.ctx.getAttribLocation(leafShader, "aVertexPosition"));
		leafVarLocs.push(basicCtx.ctx.getAttribLocation(leafShader, "aVertexColor"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "uMVP"));
		// leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "uModelViewMatrix"));
		// leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "uProjectionMatrix"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "uPointSize"));
		// leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "uAttenuation"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "uBias"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "uScale"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "uCEMode"));
		basicCtx.ctx.uniform1f(leafVarLocs[3], 1);
		basicCtx.ctx.uniform3fv(leafVarLocs[4], b);
		basicCtx.ctx.uniform3fv(leafVarLocs[5], s);
		basicCtx.ctx.uniform1i(leafVarLocs[6], 0);

		var pointPickShader;
		var pointPickVarLocs = [];
		pointPickShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/test.vert'), basicCtx.getShaderStr('shaders/basic.frag'));
		basicCtx.ctx.useProgram(pointPickShader);
		pointPickVarLocs.push(basicCtx.ctx.getAttribLocation(pointPickShader, "aVertexPosition"));
		pointPickVarLocs.push(basicCtx.ctx.getAttribLocation(pointPickShader, "aPickColor"));
		pointPickVarLocs.push(basicCtx.ctx.getUniformLocation(pointPickShader, "uPPMV"));

		var pointPickingFBO;
		pointPickingFBO = basicCtx.ctx.createFramebuffer();
		basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, pointPickingFBO);
		pointPickingTexture = basicCtx.ctx.createTexture();
		basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, pointPickingTexture);
		basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, 16, 16, 0, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, null);
		basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MIN_FILTER, basicCtx.ctx.NEAREST);
		basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MAG_FILTER, basicCtx.ctx.NEAREST);
		pointRenderBuffer = basicCtx.ctx.createRenderbuffer();
		basicCtx.ctx.bindRenderbuffer(basicCtx.ctx.RENDERBUFFER, pointRenderBuffer);
		basicCtx.ctx.renderbufferStorage(basicCtx.ctx.RENDERBUFFER, basicCtx.ctx.DEPTH_COMPONENT16, 16, 16);
		basicCtx.ctx.framebufferTexture2D(basicCtx.ctx.FRAMEBUFFER, basicCtx.ctx.COLOR_ATTACHMENT0, basicCtx.ctx.TEXTURE_2D, pointPickingTexture, 0);
		basicCtx.ctx.framebufferRenderbuffer(basicCtx.ctx.FRAMEBUFFER, basicCtx.ctx.DEPTH_ATTACHMENT, basicCtx.ctx.RENDERBUFFER, pointRenderBuffer);
		basicCtx.ctx.bindRenderbuffer(basicCtx.ctx.RENDERBUFFER, null);
		basicCtx.ctx.deleteRenderbuffer(pointRenderBuffer);
		basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);
		basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);
		basicCtx.ctx.deleteTexture(pointPickingTexture);
		delete pointPickingTexture;
		delete pointRenderBuffer;

		var crossShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/cross.vert'), basicCtx.getShaderStr('shaders/grid.frag'));
		var crossVarLocs = [];
		basicCtx.ctx.useProgram(crossShader);
		crossVarLocs.push(basicCtx.ctx.getAttribLocation(crossShader, "aVertexPosition"));
		crossVarLocs.push(basicCtx.ctx.getUniformLocation(crossShader, "uOffset"));

		var crossVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, crossVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([ 0.0074, 	  0.0,
																			  0.0814, 	  0.0,
																			 -0.0074, 	  0.0,
																			 -0.0814, 	  0.0,
																			 	 0.0,  0.0074,
																			 	 0.0,  0.0814,
																			 	 0.0, -0.0074,
																			 	 0.0, -0.0814]), basicCtx.ctx.STATIC_DRAW);

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
			// basicCtx.ctx.useProgram(quadShader);
			// basicCtx.ctx.uniformMatrix4fv(quadVarLocs[3], false, basicCtx.perspectiveMatrix);
			// basicCtx.ctx.useProgram(leafShader);
			// basicCtx.ctx.uniformMatrix4fv(leafVarLocs[3], false, basicCtx.perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			orthoProjection = projectionMatrix;
			// basicCtx.ctx.useProgram(quadShader);
			// basicCtx.ctx.uniformMatrix4fv(quadVarLocs[3], false, projectionMatrix);
			// basicCtx.ctx.useProgram(leafShader);
			// basicCtx.ctx.uniformMatrix4fv(leafVarLocs[2], false, projectionMatrix);
		};

		var currPointSize = 1;
		this.pointSize = function(size) {
			currPointSize = size;
		};

		// this.attenuation = function(constant, linear, quadratic) {
		// 	basicCtx.ctx.useProgram(leafShader);
		// 	basicCtx.ctx.uniform3fv(leafVarLocs[5], [constant, linear, quadratic]);
		// };

		this.getCenter = function() {
			return Tree.center;
		}

		this.getRadius = function() {
			return Tree.radius;
		}

		this.setCheckOrtho = function(t) {
			checkOrtho = t;
			if(checkOrtho) {
				checkImps(Tree);
			}
		}

		var quadsOnly = false;
		this.toggleLeafDisplayType = function() {
			quadsOnly = !quadsOnly;
		}

		function render(node, size) {
			if(basicCtx) {
				if(quadsOnly || !node.Isleaf || size < qSize) {
					basicCtx.ctx.useProgram(quadShader);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, node.quadVBO);
					basicCtx.ctx.vertexAttribPointer(quadVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 28, 0);
					basicCtx.ctx.vertexAttribPointer(quadVarLocs[1], 2, basicCtx.ctx.FLOAT, false, 28, 12 + colorOffset * 2 / 3);
					basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, node.texture);
					basicCtx.ctx.uniform1i(quadVarLocs[3], node.texture);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
					basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);
				}
				else {    //ISLEAF   
					basicCtx.ctx.useProgram(leafShader);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, node.VertexPositionBuffer.VBO);
					basicCtx.ctx.vertexAttribPointer(leafVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, node.VertexColorBuffer);
					basicCtx.ctx.vertexAttribPointer(leafVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 24, colorOffset);
					basicCtx.ctx.drawArrays(basicCtx.ctx.POINTS, 0, node.VertexPositionBuffer.length / 3);
				}
			}
		}

		function isvisible(radius, center) {
			var d = new Array(6);
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
			for(var i = 0; i < 6; i++) {
				if(d[i] > radius) {
					return false;
				}
			}
			return true;
		}

		var stat = {viewUp: null, translate: null, camPos: null};
		var dyn = {viewUp: null, translate: null, camPos: null};
		var first = true;
		this.renderTree = function(viewpoint, c) {
			if(checkOrtho) {
				var MVP = M4x4.mul(orthoProjection, basicCtx.peekMatrix());
			}
			else {
				var MVP = M4x4.mul(basicCtx.perspectiveMatrix, basicCtx.peekMatrix());
			}

			if(first) {
				var staticMV = basicCtx.peekMatrix();
				stat.viewUp = V3.$(staticMV[1], staticMV[5], staticMV[9]);
				stat.translateVec = c;
				stat.camPos = viewpoint;
				first = false;
			}

			if(Tree.status == COMPLETE) {
				if(Tree.inTex) {
					if(updateQueue.length > 0) {
						processQueue();
					}
					else {
						var staticMV = basicCtx.peekMatrix();
						dyn.viewUp = V3.$(staticMV[1], staticMV[5], staticMV[9]);
						dyn.translateVec = c;
						dyn.camPos = viewpoint;
						if(!checkOrtho) {
							checkImps(Tree);
						}
					}
				}
				basicCtx.ctx.useProgram(quadShader);
				basicCtx.ctx.uniformMatrix4fv(quadVarLocs[2], false, MVP);
				basicCtx.ctx.uniform1i(quadVarLocs[6], currCE);
				basicCtx.ctx.useProgram(leafShader);
				basicCtx.ctx.uniformMatrix4fv(leafVarLocs[2], false, MVP);
				basicCtx.ctx.uniform1f(leafVarLocs[3], currPointSize);
				basicCtx.ctx.uniform1i(leafVarLocs[6], currCE);
				basicCtx.ctx.viewport(0, 0, 540, 540);

				this.recurseTree(Tree);
			}
			sendRequest();
		};

		function processQueue() {
			basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, FBO);
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniform1f(leafVarLocs[3], 1.0);
			basicCtx.ctx.uniform1i(leafVarLocs[6], 0);
			basicCtx.ctx.useProgram(quadShader);
			basicCtx.ctx.uniform1i(quadVarLocs[6], 0);

			var count = 0;
			while(count < maxProcess && updateQueue.length > 0) {
				var node = updateQueue.splice(0, 1)[0];
				updateBB(node, node.newDir, dyn);
				if(node.Isleaf) {
					rendTexImp(node, false);
				}
				else {
					checkParent(node.Children[0], false);
				}
				count++;
			}

			basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);
		}

		function checkImps(node) {
			var update = false;
			node.newDir = V3.normalize(V3.sub(V3.sub(node.center, dyn.translateVec), dyn.camPos));
			// var vec = V3.sub(V3.sub(node.center, dyn.translateVec), dyn.camPos)
			// node.newLen = V3.length(vec);
			// node.newDir = V3.scale(vec, 1 / node.newLen);

			// if(V3.dot(node.newDir, node.dir) < e) {
			if(checkOrtho || !V3.equals(node.newDir, node.dir)) {
				update = true;
				if(node.Isleaf) {
					updateQueue.push(node);
					return true;
				}
			}
			if(!node.Isleaf) {
				for(var i = 0; i < 8; i++) {
					if(checkImps(node.Children[i])) {
						update = true;
					}
				}
			}
			if(update) {
				updateQueue.push(node);
			}
			return update;
		}

		this.recurseTree = function(node) {
			var centerVS = V3.mul4x4(basicCtx.peekMatrix(), node.center);
			if(isvisible(node.radius, centerVS)) {
				if(checkOrtho) {
					var size = node.radius * basicCtx.height / basicCtx.scaleFactor;
				}
				else {
					var size = Math.abs((node.radius * basicCtx.height) / (centerVS[2] * t30));
				}
				if(node.inTex && (size < qSize || node.Isleaf)) {
					render(node, size);
				}
				else {
					var renderParent = false;
					for(var i = 0; i < 8; i++) {						
						if(typeof node.Children[i] == "undefined") {
							load(node, i);
							renderParent = true;
						}
						else if(node.Children[i].status != COMPLETE) {
							renderParent = true;
						}
					}
					if(renderParent) {
						render(node, 0);
					}
					else {
						for(var j = 0; j < 8; j++) {
							this.recurseTree(node.Children[j]);
						}
					}
				}
			}
		};

		this.pointPicking = function(viewpoint, x, y) {
			var pickingTransform = new Float32Array([		   54,			  0, 0, 0,
																0,		     54, 0, 0,
																0,			  0, 1, 0,
													 54 - x * 0.2, 54 - y * 0.2, 0, 1]);
			basicCtx.ctx.viewport(0, 0, 10, 10);
			basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, pointPickingFBO);
			basicCtx.clear();
			basicCtx.ctx.useProgram(pointPickShader);
			if(checkOrtho) {
				var proj = orthoProjection;
			}
			else {
				var proj = basicCtx.perspectiveMatrix;
			}
			var PPVM = M4x4.mul(pickingTransform, M4x4.mul(proj, basicCtx.peekMatrix()));
			basicCtx.ctx.uniformMatrix4fv(pointPickVarLocs[2], false, PPVM);

			this.recursePP(Tree, viewpoint);

			var arr = new Uint8Array(400);
			basicCtx.ctx.readPixels(0, 0, 10, 10, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, arr);
			var closest = [-5, -5];
			var distance = Number.POSITIVE_INFINITY;
			var id = -1;
			var index;
			for(var i = 0; i < 10; i++) {
				for(var j = 0; j < 10; j++) {
					index = i * 40 + j * 4;
					if(arr[index] != 0 && arr[index + 1] != 0 && arr[index + 2] != 0) {
						var temp = (i - 4.5) * (i - 4.5) + (j - 4.5) * (j - 4.5);
						if(temp < distance) {
							distance = temp;
							closest[0] = j - 4.5;
							closest[1] = i - 4.5;
							id = arr[index] << 16 | arr[index + 1] << 8 | arr[index + 2];
						}
					}
				}
			}

			basicCtx.ctx.viewport(0, 0, 540, 540);
			basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);

			if(id > -1) {
				var tempPic = picInfo[id - 1];
				thumbImg.tempX = tempPic.x * 300;
				thumbImg.tempY = tempPic.y * 225;
				thumbImg.onload = drawThumbNail;
				if(tempPic.pic < 10) {
					thumbImg.src = "thumbnail_pics/0000000" + tempPic.pic + ".jpg";
				}
				else if(tempPic.pic < 100) {
					thumbImg.src = "thumbnail_pics/000000" + tempPic.pic + ".jpg";
				}
				else {
					thumbImg.src = "thumbnail_pics/00000" + tempPic.pic + ".jpg";
				}

				basicCtx.ctx.useProgram(crossShader);
				basicCtx.ctx.uniform2fv(crossVarLocs[1], new Float32Array([(x + closest[0] - 270) / 270, (y + closest[1] - 270) / 270]));
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, crossVBO);
				basicCtx.ctx.vertexAttribPointer(crossVarLocs[0], 2, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.drawArrays(basicCtx.ctx.LINES, 0, 8);
			}
			else {
				thumbCtx.clearRect(0, 0, 300, 225);
			}
		};

		this.recursePP = function(node, viewpoint) {
			if(node.status == COMPLETE) {
				var centerVS = V3.mul4x4(basicCtx.peekMatrix(), node.center);
				if(isvisible(node.radius, centerVS)) {
					if(node.Isleaf) {
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, node.VertexPositionBuffer.VBO);
						basicCtx.ctx.vertexAttribPointer(pointPickVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, node.PickingColorBuffer);
						basicCtx.ctx.vertexAttribPointer(pointPickVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 0, 0);
						basicCtx.ctx.drawArrays(basicCtx.ctx.POINTS, 0, node.VertexPositionBuffer.length / 3);
					}
					else {
						for(var k = 0; k < 8; k++) {
							if(typeof node.Children[k] != "undefined" && node.Children[k].status == COMPLETE) {
								this.recursePP(node.Children[k], viewpoint);
							}
						}
					}
				}
			}
		};

		var FBO = basicCtx.ctx.createFramebuffer();
		basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, FBO);
		depthBuffer = basicCtx.ctx.createRenderbuffer();
		basicCtx.ctx.bindRenderbuffer(basicCtx.ctx.RENDERBUFFER, depthBuffer);
		basicCtx.ctx.renderbufferStorage(basicCtx.ctx.RENDERBUFFER, basicCtx.ctx.DEPTH_COMPONENT16, qSize, qSize);
		basicCtx.ctx.framebufferRenderbuffer(basicCtx.ctx.FRAMEBUFFER, basicCtx.ctx.DEPTH_ATTACHMENT, basicCtx.ctx.RENDERBUFFER, depthBuffer);
		basicCtx.ctx.bindRenderbuffer(basicCtx.ctx.RENDERBUFFER, null);
		basicCtx.ctx.deleteRenderbuffer(depthBuffer);
		basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);
		delete depthBuffer;

		function transformBB(BB, transform) {
			var newBB = [transform[12], transform[13], transform[14], transform[12], transform[13], transform[14]];

			if(transform[0] > 0) {newBB[0] += transform[0] * BB[0]; newBB[3] += transform[0] * BB[3];}
			else {newBB[3] += transform[0] * BB[0]; newBB[0] += transform[0] * BB[3];}

			if(transform[4] > 0) {newBB[0] += transform[4] * BB[1]; newBB[3] += transform[4] * BB[4];}
			else {newBB[3] += transform[4] * BB[1]; newBB[0] += transform[4] * BB[4];}

			if(transform[8] > 0) {newBB[0] += transform[8] * BB[2]; newBB[3] += transform[8] * BB[5];}
			else {newBB[3] += transform[8] * BB[2]; newBB[0] += transform[8] * BB[5];}

			if(transform[1] > 0) {newBB[1] += transform[1] * BB[0]; newBB[4] += transform[1] * BB[3];}
			else {newBB[4] += transform[1] * BB[0]; newBB[1] += transform[1] * BB[3];}

			if(transform[5] > 0) {newBB[1] += transform[5] * BB[1]; newBB[4] += transform[5] * BB[4];}
			else {newBB[4] += transform[5] * BB[1]; newBB[1] += transform[5] * BB[4];}

			if(transform[9] > 0) {newBB[1] += transform[9] * BB[2]; newBB[4] += transform[9] * BB[5];}
			else {newBB[4] += transform[9] * BB[2]; newBB[1] += transform[9] * BB[5];}

			if(transform[2] > 0) {newBB[2] += transform[2] * BB[0]; newBB[5] += transform[2] * BB[3];}
			else {newBB[5] += transform[2] * BB[0]; newBB[2] += transform[2] * BB[3];}

			if(transform[6] > 0) {newBB[2] += transform[6] * BB[1]; newBB[5] += transform[6] * BB[4];}
			else {newBB[5] += transform[6] * BB[1]; newBB[2] += transform[6] * BB[4];}

			if(transform[10] > 0) {newBB[2] += transform[10] * BB[2]; newBB[5] += transform[10] * BB[5];}
			else {newBB[5] += transform[10] * BB[2]; newBB[2] += transform[10] * BB[5];}

			return newBB;
		}

		var quad = new Float32Array(28);
		quad[3]  = 0.5; quad[4]  = 0;
		quad[10] = 0.5; quad[11] = 1;
		quad[17] = 0.0; quad[18] = 0;
		quad[24] = 0.0; quad[25] = 1;
		quad[5]  = 1.0; quad[6]  = 0;
		quad[12] = 1.0; quad[13] = 1;
		quad[19] = 0.5; quad[20] = 0;
		quad[26] = 0.5; quad[27] = 1;

		function updateBB(node, newDir, obj) {
			if(checkOrtho) {
				node.dir = [0, 0, 0];
				var pos = [(node.BB[3] + node.BB[0]) * 0.5, (node.BB[4] + node.BB[1]) * 0.5, node.BB[5] + 1];
				var viewMat = M4x4.makeLookAt(pos, V3.add(pos, [0, 0, -1]), [0, 1, 0]);

				quad[0]  = node.BB[3]; quad[1]  = node.BB[1]; quad[2]  = node.BB[5];
				quad[7]  = node.BB[3]; quad[8]  = node.BB[4]; quad[9]  = node.BB[5];
				quad[14] = node.BB[0]; quad[15] = node.BB[1]; quad[16] = node.BB[5];
				quad[21] = node.BB[0]; quad[22] = node.BB[4]; quad[23] = node.BB[5];

				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, node.quadVBO);
				basicCtx.ctx.bufferSubData(basicCtx.ctx.ARRAY_BUFFER, 0, quad);

				var halfWidth = (node.BB[3] - node.BB[0]) * 0.5;
				var halfHeight = (node.BB[4] - node.BB[1]) * 0.5;
				node.mvpMat = M4x4.mul(M4x4.makeOrtho(-halfWidth, halfWidth, -halfHeight, halfHeight, 1, 1 + node.BB[5] - node.BB[2]), viewMat);
			}
			else {
				node.dir = newDir;
				var viewMat = M4x4.makeLookAt(obj.camPos, V3.add(obj.camPos, newDir), obj.viewUp);
				viewMat = M4x4.translate(V3.scale(obj.translateVec, -1), viewMat);
				var viewMatInv = M4x4.inverse(viewMat);
				var newBB = transformBB(node.BB, viewMat);

				var point = V3.mul4x4(viewMatInv, [newBB[3], newBB[1], newBB[5]]);
				quad[0] = point[0]; quad[1] = point[1]; quad[2] = point[2];

				point = V3.mul4x4(viewMatInv, [newBB[3], newBB[4], newBB[5]]);
				quad[7] = point[0]; quad[8] = point[1]; quad[9] = point[2];

				point = V3.mul4x4(viewMatInv, [newBB[0], newBB[1], newBB[5]]);
				quad[14] = point[0]; quad[15] = point[1]; quad[16] = point[2];

				point = V3.mul4x4(viewMatInv, [newBB[0], newBB[4], newBB[5]]);
				quad[21] = point[0]; quad[22] = point[1]; quad[23] = point[2];

				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, node.quadVBO);
				basicCtx.ctx.bufferSubData(basicCtx.ctx.ARRAY_BUFFER, 0, quad);

				var newBBDiameter = V3.length(V3.sub(V3.mul4x4(viewMatInv, [newBB[3], newBB[4], newBB[2]]), [quad[14], quad[15], quad[16]]));

				var quadCenter = V3.sub([(quad[0] + quad[7] + quad[14] + quad[21]) * 0.25, 
								  		 (quad[1] + quad[8] + quad[15] + quad[22]) * 0.25, 
								  		 (quad[2] + quad[9] + quad[16] + quad[23]) * 0.25],
								  		obj.translateVec);

				var halfWidth = V3.length(V3.sub([quad[0], quad[1], quad[2]], [quad[14], quad[15], quad[16]])) * 0.5;
				var halfHeight = V3.length(V3.sub([quad[7], quad[8], quad[9]], [quad[0], quad[1], quad[2]])) * 0.5;
				var nearPlane = V3.length(V3.sub(obj.camPos, quadCenter));
				node.mvpMat = M4x4.mul(M4x4.makeFrustum(-halfWidth, halfWidth, -halfHeight, halfHeight, nearPlane, nearPlane + newBBDiameter), viewMat);

				// node.dir = newDir;
				// var viewMat = M4x4.makeLookAt(obj.camPos, V3.add(obj.camPos, newDir), obj.viewUp);
				// var right = V3.scale([viewMat[0], viewMat[4], viewMat[8]], node.radius);
				// var left = V3.scale(right, -1);
				// var up = V3.scale([viewMat[1], viewMat[5], viewMat[9]], node.radius);
				// var down = V3.scale(up, -1);
				// var back = V3.scale([viewMat[2], viewMat[6], viewMat[10]], node.radius);

				// quad[0] = right[0] + down[0] + back[0] + node.center[0];
				// quad[1] = right[1] + down[1] + back[1] + node.center[1];
				// quad[2] = right[2] + down[2] + back[2] + node.center[2];

				// quad[7] = right[0] + up[0] + back[0] + node.center[0];
				// quad[8] = right[1] + up[1] + back[1] + node.center[1];
				// quad[9] = right[2] + up[2] + back[2] + node.center[2];

				// quad[14] = left[0] + down[0] + back[0] + node.center[0];
				// quad[15] = left[1] + down[1] + back[1] + node.center[1];
				// quad[16] = left[2] + down[2] + back[2] + node.center[2];

				// quad[21] = left[0] + up[0] + back[0] + node.center[0];
				// quad[22] = left[1] + up[1] + back[1] + node.center[1];
				// quad[23] = left[2] + up[2] + back[2] + node.center[2];

				// basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, node.quadVBO);
				// basicCtx.ctx.bufferSubData(basicCtx.ctx.ARRAY_BUFFER, 0, quad);

				// viewMat = M4x4.translate(V3.scale(obj.translateVec, -1), viewMat);
				// node.mvpMat = M4x4.mul(M4x4.makeFrustum(-node.radius, node.radius, -node.radius, node.radius, node.newLen - node.radius, node.newLen + node.radius), viewMat);
			}
		}

		function parseCallback() {
			if(this.readyState == 4 && this.status == 200) {
				var obj = JSON.parse(this.responseText);
				if(obj[0] === undefined) {
					obj[0] = obj;
				}

				var currentRequest = this.currentRequest;

				for(var h = 0; h < currentRequest.length; h++) {
					currentRequest[h].node.Isleaf = obj[h].Isleaf;
					currentRequest[h].node.BB = obj[h].BB;

					var temp = [currentRequest[h].node.BB[3] - currentRequest[h].node.BB[0], 
								currentRequest[h].node.BB[4] - currentRequest[h].node.BB[1], 
								currentRequest[h].node.BB[5] - currentRequest[h].node.BB[2]];
					currentRequest[h].node.center[0] = temp[0] * 0.5 + currentRequest[h].node.BB[0];
					currentRequest[h].node.center[1] = temp[1] * 0.5 + currentRequest[h].node.BB[1];
					currentRequest[h].node.center[2] = temp[2] * 0.5 + currentRequest[h].node.BB[2];
					currentRequest[h].node.radius =  Math.sqrt(temp[0] * temp[0] + temp[1] * temp[1] + temp[2] * temp[2]) * 0.5;

					var dir = V3.normalize(V3.sub(V3.sub(currentRequest[h].node.center, stat.translateVec), stat.camPos));
					// var vec = V3.sub(V3.sub(currentRequest[h].node.center, stat.translateVec), stat.camPos);
					// currentRequest[h].node.newLen = V3.length(vec);
					// var dir = V3.scale(vec, 1 / currentRequest[h].node.newLen);

					currentRequest[h].node.quadVBO = basicCtx.ctx.createBuffer();
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, currentRequest[h].node.quadVBO);
					basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, 112, basicCtx.ctx.DYNAMIC_DRAW);
					updateBB(currentRequest[h].node, dir, stat);

					if(obj[h].Isleaf) {
						var verts = new Float32Array(obj[h].Point.length / 4);
						var cols = new Float32Array(verts.length * 2);
						var pickCols = new Float32Array(verts.length);

						for(var i = 0, j = 0, k = 0; i < obj[h].Point.length; i += 12, j += 3, k += 6) {
							verts[j] 	 = obj[h].Point[i];
							verts[j + 1] = obj[h].Point[i + 1];
							verts[j + 2] = obj[h].Point[i + 2];
							cols[k] 	= obj[h].Point[i + 3] / 255;
							cols[k + 1] = obj[h].Point[i + 4] / 255;
							cols[k + 2] = obj[h].Point[i + 5] / 255;
							cols[k + 3] = obj[h].Point[i + 6] / 255;
							cols[k + 4] = obj[h].Point[i + 7] / 255;
							cols[k + 5] = obj[h].Point[i + 8] / 255;
							picInfo.push({pic: obj[h].Point[i + 9], x: obj[h].Point[i + 10], y: obj[h].Point[i + 11]});
							pickCols[j]     = (pointPickIndex >> 16) / 255;
							pickCols[j + 1] = ((pointPickIndex >> 8) & 255) / 255;
							pickCols[j + 2] = (pointPickIndex & 255) / 255;
							pointPickIndex++;
						}

						var VBO = basicCtx.ctx.createBuffer();
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, VBO);
						basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, verts, basicCtx.ctx.STATIC_DRAW);
						currentRequest[h].node.VertexPositionBuffer = {length: verts.length, VBO: VBO};
						
						currentRequest[h].node.PickingColorBuffer = basicCtx.ctx.createBuffer();
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, currentRequest[h].node.PickingColorBuffer);
						basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, pickCols, basicCtx.ctx.STATIC_DRAW);

						currentRequest[h].node.VertexColorBuffer = basicCtx.ctx.createBuffer();
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, currentRequest[h].node.VertexColorBuffer);
						basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, cols, basicCtx.ctx.STATIC_DRAW);

						basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, FBO);
						basicCtx.ctx.useProgram(leafShader);
						basicCtx.ctx.uniform1f(leafVarLocs[3], 1.0);
						basicCtx.ctx.uniform1i(leafVarLocs[6], 0);
						basicCtx.ctx.useProgram(quadShader);
						basicCtx.ctx.uniform1i(quadVarLocs[6], 0);

						rendTexImp(currentRequest[h].node, true);

						basicCtx.ctx.useProgram(leafShader);
						basicCtx.ctx.uniform1f(leafVarLocs[3], currPointSize);
						basicCtx.ctx.uniform1i(leafVarLocs[6], currCE);
						basicCtx.ctx.useProgram(quadShader);
						basicCtx.ctx.uniform1i(quadVarLocs[6], currCE);
						basicCtx.ctx.viewport(0, 0, 540, 540);
						basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);
					}
					currentRequest[h].node.status = COMPLETE;
				}
				requestCount--;
				delete this;
			}
		}

		function rendTexImp(node, first) {
			basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, node.texture);
			if(!node.inTex) {
				basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, qSize * 2, qSize, 0, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, null);
				node.inTex = true;
			}
			basicCtx.ctx.framebufferTexture2D(basicCtx.ctx.FRAMEBUFFER, basicCtx.ctx.COLOR_ATTACHMENT0, basicCtx.ctx.TEXTURE_2D, node.texture, 0);
			basicCtx.clear();

			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniformMatrix4fv(leafVarLocs[2], false, node.mvpMat);
			basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, node.VertexPositionBuffer.VBO);
			basicCtx.ctx.vertexAttribPointer(leafVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
			basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, node.VertexColorBuffer);
			
			for (var x = 0; x < 2; x++) {
				basicCtx.ctx.viewport(x * qSize, 0, qSize, qSize);
				basicCtx.ctx.vertexAttribPointer(leafVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 24, x * 12);
				basicCtx.ctx.drawArrays(basicCtx.ctx.POINTS, 0, node.VertexPositionBuffer.length / 3);
			}

			if(first) {
				checkParent(node, true);
			}
		}

		function checkParent(node, first) {
			parentNode = node.parent;
			if(parentNode != null) {
				var go = true;
				if(first) {
					for(var i = 0; i < 8; i++) {
						if(typeof parentNode.Children[i] == "undefined" || !parentNode.Children[i].inTex) {
							go = false;
						}
					}
				}
				if(go) {
					basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, parentNode.texture);
					if(!parentNode.inTex) {
						basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, qSize * 2, qSize, 0, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, null);
						parentNode.inTex = true;
					}
					basicCtx.ctx.framebufferTexture2D(basicCtx.ctx.FRAMEBUFFER, basicCtx.ctx.COLOR_ATTACHMENT0, basicCtx.ctx.TEXTURE_2D, parentNode.texture, 0);
					basicCtx.clear();

					basicCtx.ctx.useProgram(quadShader);
					basicCtx.ctx.uniformMatrix4fv(quadVarLocs[2], false, parentNode.mvpMat);

					for(var j = 0; j < 8; j++) {
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, parentNode.Children[j].quadVBO);
						basicCtx.ctx.vertexAttribPointer(quadVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 28, 0);
						basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, parentNode.Children[j].texture);
						basicCtx.ctx.uniform1i(quadVarLocs[3], parentNode.Children[j].texture);

						for(var x = 0; x < 2; x++) {
							basicCtx.ctx.viewport(x * qSize, 0, qSize, qSize);
							basicCtx.ctx.vertexAttribPointer(quadVarLocs[1], 2, basicCtx.ctx.FLOAT, false, 28, 12 + x * 8);
							basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
						}
					}

					if(first) {
						checkParent(parentNode, true);
					}
				}
			}
		}

		function load(parentnode, index) {
			var node = {
				VertexPositionBuffer: {},
				VertexColorBuffer: {},
				PickingColorBuffer: {},
				texture: null,
				quadVBO: [],
				BB: [],
				status: STARTED, 
				center: [0, 0, 0],
				radius: 1,
				Isleaf: 0,
				Children: {},
				parent: null,
				inTex: false,
				level: 0,
				dir: [],
				newDir: [],
				// newLen: 0,
				mvpMat: [],
				path: null
			};

			if(parentnode == null) {
				node.path = index;
				Tree = node;
			}
			else {
				node.path = parentnode.path + "/" + index;
				parentnode.Children[index] = node;
				node.parent = parentnode;
				node.level = parentnode.level + 1;
			}

			node.texture = basicCtx.ctx.createTexture();
			basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, node.texture);
			basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MIN_FILTER, basicCtx.ctx.NEAREST);
			basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MAG_FILTER, basicCtx.ctx.NEAREST);
			basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, 1, 1, 0, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

			node.image = new Image();
			node.image.onload = function() {
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, node.texture);
				basicCtx.ctx.pixelStorei(basicCtx.ctx.UNPACK_FLIP_Y_WEBGL, true);
				basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, node.image);
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);
				delete this;
			}
			node.image.src = "StartupTextures/" + node.path.replace(/\//g,"-") + ".png";

			requestQueue.push({path: node.path, node: node});
		}

		function sendRequest() {
			while(requestQueue.length > 0 && requestCount < maxRequest) {
				var request = new XMLHttpRequest();
				request.onload = parseCallback;
				request.currentRequest = requestQueue.splice(0, Math.min(5, requestQueue.length));
				var requestString = '';
				var i;
				for(i = 0; i < request.currentRequest.length - 1; i++) {
					requestString += request.currentRequest[i].path + ';';
				}
				requestString += request.currentRequest[i].path;
				request.open("GET", "action.php?a=getnode&path="+requestString+"&table="+table, true);
				request.send();
				requestCount++;
			}
		}

		this.root = function(t) {
			table = t;
			load(null, 'r');
		}
	}// constructor

	return PCTree;
} ());