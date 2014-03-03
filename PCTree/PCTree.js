var PCTree = (function() {
	function PCTree(bctx, b, s) {
		var basicCtx = bctx;
		var gl = basicCtx.ctx;

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
		gl.useProgram(quadShader);
		quadVarLocs.push(gl.getAttribLocation(quadShader, "aVertexPosition"));
		quadVarLocs.push(gl.getAttribLocation(quadShader, "aTexCoord"));
		quadVarLocs.push(gl.getUniformLocation(quadShader, "uMVP"));
		// quadVarLocs.push(gl.getUniformLocation(quadShader, "uModelViewMatrix"));
		// quadVarLocs.push(gl.getUniformLocation(quadShader, "uProjectionMatrix"));
		quadVarLocs.push(gl.getUniformLocation(quadShader, "uSampler"));
		quadVarLocs.push(gl.getUniformLocation(quadShader, "uBias"));
		quadVarLocs.push(gl.getUniformLocation(quadShader, "uScale"));
		quadVarLocs.push(gl.getUniformLocation(quadShader, "uCEMode"));
		gl.uniform3fv(quadVarLocs[4], b);
		gl.uniform3fv(quadVarLocs[5], s);
		gl.uniform1i(quadVarLocs[6], 0);

		leafShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/point.vert'), basicCtx.getShaderStr('shaders/basic.frag'));
		gl.useProgram(leafShader);
		leafVarLocs.push(gl.getAttribLocation(leafShader, "aVertexPosition"));
		leafVarLocs.push(gl.getAttribLocation(leafShader, "aVertexColor"));
		leafVarLocs.push(gl.getUniformLocation(leafShader, "uMVP"));
		// leafVarLocs.push(gl.getUniformLocation(leafShader, "uModelViewMatrix"));
		// leafVarLocs.push(gl.getUniformLocation(leafShader, "uProjectionMatrix"));
		leafVarLocs.push(gl.getUniformLocation(leafShader, "uPointSize"));
		// leafVarLocs.push(gl.getUniformLocation(leafShader, "uAttenuation"));
		leafVarLocs.push(gl.getUniformLocation(leafShader, "uBias"));
		leafVarLocs.push(gl.getUniformLocation(leafShader, "uScale"));
		leafVarLocs.push(gl.getUniformLocation(leafShader, "uCEMode"));
		gl.uniform1f(leafVarLocs[3], 1);
		gl.uniform3fv(leafVarLocs[4], b);
		gl.uniform3fv(leafVarLocs[5], s);
		gl.uniform1i(leafVarLocs[6], 0);

		var pointPickShader;
		var pointPickVarLocs = [];
		pointPickShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/test.vert'), basicCtx.getShaderStr('shaders/basic.frag'));
		gl.useProgram(pointPickShader);
		pointPickVarLocs.push(gl.getAttribLocation(pointPickShader, "aVertexPosition"));
		pointPickVarLocs.push(gl.getAttribLocation(pointPickShader, "aPickColor"));
		pointPickVarLocs.push(gl.getUniformLocation(pointPickShader, "uPPMV"));

		var pointPickingFBO;
		pointPickingFBO = gl.createFramebuffer();
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
		delete pointPickingTexture;
		delete pointRenderBuffer;

		var crossShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/cross.vert'), basicCtx.getShaderStr('shaders/grid.frag'));
		var crossVarLocs = [];
		gl.useProgram(crossShader);
		crossVarLocs.push(gl.getAttribLocation(crossShader, "aVertexPosition"));
		crossVarLocs.push(gl.getUniformLocation(crossShader, "uOffset"));

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
			// gl.useProgram(quadShader);
			// gl.uniformMatrix4fv(quadVarLocs[3], false, basicCtx.perspectiveMatrix);
			// gl.useProgram(leafShader);
			// gl.uniformMatrix4fv(leafVarLocs[3], false, basicCtx.perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			orthoProjection = projectionMatrix;
			// gl.useProgram(quadShader);
			// gl.uniformMatrix4fv(quadVarLocs[3], false, projectionMatrix);
			// gl.useProgram(leafShader);
			// gl.uniformMatrix4fv(leafVarLocs[2], false, projectionMatrix);
		};

		var currPointSize = 1;
		this.pointSize = function(size) {
			currPointSize = size;
		};

		// this.attenuation = function(constant, linear, quadratic) {
		// 	gl.useProgram(leafShader);
		// 	gl.uniform3fv(leafVarLocs[5], [constant, linear, quadratic]);
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
			if(quadsOnly || !node.Isleaf || size < qSize) {
				gl.useProgram(quadShader);
				gl.bindBuffer(gl.ARRAY_BUFFER, node.quadVBO);
				gl.vertexAttribPointer(quadVarLocs[0], 3, gl.FLOAT, false, 28, 0);
				gl.vertexAttribPointer(quadVarLocs[1], 2, gl.FLOAT, false, 28, 12 + colorOffset * 2 / 3);
				gl.bindTexture(gl.TEXTURE_2D, node.texture);
				gl.uniform1i(quadVarLocs[3], node.texture);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				gl.bindTexture(gl.TEXTURE_2D, null);
			}
			else {    //ISLEAF   
				gl.useProgram(leafShader);
				gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexPositionBuffer.VBO);
				gl.vertexAttribPointer(leafVarLocs[0], 3, gl.FLOAT, false, 0, 0);
				gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexColorBuffer);
				gl.vertexAttribPointer(leafVarLocs[1], 3, gl.FLOAT, false, 24, colorOffset);
				gl.drawArrays(gl.POINTS, 0, node.VertexPositionBuffer.length / 3);
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
				gl.useProgram(quadShader);
				gl.uniformMatrix4fv(quadVarLocs[2], false, MVP);
				gl.uniform1i(quadVarLocs[6], currCE);
				gl.useProgram(leafShader);
				gl.uniformMatrix4fv(leafVarLocs[2], false, MVP);
				gl.uniform1f(leafVarLocs[3], currPointSize);
				gl.uniform1i(leafVarLocs[6], currCE);
				gl.viewport(0, 0, 540, 540);

				this.recurseTree(Tree);
			}
			sendRequest();
		};

		function processQueue() {
			gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
			gl.useProgram(leafShader);
			gl.uniform1f(leafVarLocs[3], 1.0);
			gl.uniform1i(leafVarLocs[6], 0);
			gl.useProgram(quadShader);
			gl.uniform1i(quadVarLocs[6], 0);

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

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
			if(navigator.vendor == "") {
				y += 15;
			}
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

			this.recursePP(Tree, viewpoint);

			var arr = new Uint8Array(400);
			gl.readPixels(0, 0, 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, arr);
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

			gl.viewport(0, 0, 540, 540);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

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

		this.recursePP = function(node, viewpoint) {
			if(node.status == COMPLETE) {
				var centerVS = V3.mul4x4(basicCtx.peekMatrix(), node.center);
				if(isvisible(node.radius, centerVS)) {
					if(node.Isleaf) {
						gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexPositionBuffer.VBO);
						gl.vertexAttribPointer(pointPickVarLocs[0], 3, gl.FLOAT, false, 0, 0);
						gl.bindBuffer(gl.ARRAY_BUFFER, node.PickingColorBuffer);
						gl.vertexAttribPointer(pointPickVarLocs[1], 3, gl.FLOAT, false, 0, 0);
						gl.drawArrays(gl.POINTS, 0, node.VertexPositionBuffer.length / 3);
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

		var FBO = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
		depthBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, qSize, qSize);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.deleteRenderbuffer(depthBuffer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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

				gl.bindBuffer(gl.ARRAY_BUFFER, node.quadVBO);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, quad);

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

				gl.bindBuffer(gl.ARRAY_BUFFER, node.quadVBO);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, quad);

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

				// gl.bindBuffer(gl.ARRAY_BUFFER, node.quadVBO);
				// gl.bufferSubData(gl.ARRAY_BUFFER, 0, quad);

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

					currentRequest[h].node.quadVBO = gl.createBuffer();
					gl.bindBuffer(gl.ARRAY_BUFFER, currentRequest[h].node.quadVBO);
					gl.bufferData(gl.ARRAY_BUFFER, 112, gl.DYNAMIC_DRAW);
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

						var VBO = gl.createBuffer();
						gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
						gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
						currentRequest[h].node.VertexPositionBuffer = {length: verts.length, VBO: VBO};
						
						currentRequest[h].node.PickingColorBuffer = gl.createBuffer();
						gl.bindBuffer(gl.ARRAY_BUFFER, currentRequest[h].node.PickingColorBuffer);
						gl.bufferData(gl.ARRAY_BUFFER, pickCols, gl.STATIC_DRAW);

						currentRequest[h].node.VertexColorBuffer = gl.createBuffer();
						gl.bindBuffer(gl.ARRAY_BUFFER, currentRequest[h].node.VertexColorBuffer);
						gl.bufferData(gl.ARRAY_BUFFER, cols, gl.STATIC_DRAW);

						gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
						gl.useProgram(leafShader);
						gl.uniform1f(leafVarLocs[3], 1.0);
						gl.uniform1i(leafVarLocs[6], 0);
						gl.useProgram(quadShader);
						gl.uniform1i(quadVarLocs[6], 0);

						rendTexImp(currentRequest[h].node, true);

						gl.useProgram(leafShader);
						gl.uniform1f(leafVarLocs[3], currPointSize);
						gl.uniform1i(leafVarLocs[6], currCE);
						gl.useProgram(quadShader);
						gl.uniform1i(quadVarLocs[6], currCE);
						gl.viewport(0, 0, 540, 540);
						gl.bindFramebuffer(gl.FRAMEBUFFER, null);
					}
					currentRequest[h].node.status = COMPLETE;
				}
				requestCount--;
				delete this;
			}
		}

		function rendTexImp(node, first) {
			gl.bindTexture(gl.TEXTURE_2D, node.texture);
			if(!node.inTex) {
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, qSize * 2, qSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
				node.inTex = true;
			}
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, node.texture, 0);
			basicCtx.clear();

			gl.useProgram(leafShader);
			gl.uniformMatrix4fv(leafVarLocs[2], false, node.mvpMat);
			gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexPositionBuffer.VBO);
			gl.vertexAttribPointer(leafVarLocs[0], 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexColorBuffer);
			
			for (var x = 0; x < 2; x++) {
				gl.viewport(x * qSize, 0, qSize, qSize);
				gl.vertexAttribPointer(leafVarLocs[1], 3, gl.FLOAT, false, 24, x * 12);
				gl.drawArrays(gl.POINTS, 0, node.VertexPositionBuffer.length / 3);
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
					gl.bindTexture(gl.TEXTURE_2D, parentNode.texture);
					if(!parentNode.inTex) {
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, qSize * 2, qSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
						parentNode.inTex = true;
					}
					gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, parentNode.texture, 0);
					basicCtx.clear();

					gl.useProgram(quadShader);
					gl.uniformMatrix4fv(quadVarLocs[2], false, parentNode.mvpMat);

					for(var j = 0; j < 8; j++) {
						gl.bindBuffer(gl.ARRAY_BUFFER, parentNode.Children[j].quadVBO);
						gl.vertexAttribPointer(quadVarLocs[0], 3, gl.FLOAT, false, 28, 0);
						gl.bindTexture(gl.TEXTURE_2D, parentNode.Children[j].texture);
						gl.uniform1i(quadVarLocs[3], parentNode.Children[j].texture);

						for(var x = 0; x < 2; x++) {
							gl.viewport(x * qSize, 0, qSize, qSize);
							gl.vertexAttribPointer(quadVarLocs[1], 2, gl.FLOAT, false, 28, 12 + x * 8);
							gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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

			node.texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, node.texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

			node.image = new Image();
			node.image.onload = function() {
				gl.bindTexture(gl.TEXTURE_2D, node.texture);
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, node.image);
				gl.bindTexture(gl.TEXTURE_2D, null);
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