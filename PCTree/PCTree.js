var PCTree = (function() {
	function PCTree(bctx) {
		var basicCtx = bctx;

		var requestQueue = [];
		var currentRequest;
		var requestFinish = true;
		var request;

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

		xmlhttpForBiasAndScale = new XMLHttpRequest();
		xmlhttpForBiasAndScale.open("GET", "action.php?a=getBS&name=point_pick_test", false);
		xmlhttpForBiasAndScale.send();
		biasAndScale = JSON.parse(xmlhttpForBiasAndScale.responseText);

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
		basicCtx.ctx.uniform3fv(quadVarLocs[4], biasAndScale.b);
		basicCtx.ctx.uniform3fv(quadVarLocs[5], biasAndScale.s);
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
		basicCtx.ctx.uniform3fv(leafVarLocs[4], biasAndScale.b);
		basicCtx.ctx.uniform3fv(leafVarLocs[5], biasAndScale.s);
		basicCtx.ctx.uniform1i(leafVarLocs[6], 0);

		delete xmlhttpForBiasAndScale;
		delete biasAndScale;

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
			basicCtx.ctx.useProgram(quadShader);
			basicCtx.ctx.uniform1i(quadVarLocs[6], val);
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniform1i(leafVarLocs[6], val);
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

		var currPointSize;
		this.pointSize = function(size) {
			basicCtx.ctx.useProgram(leafShader);
			// basicCtx.ctx.uniform1f(leafVarLocs[4], size);
			basicCtx.ctx.uniform1f(leafVarLocs[3], size);
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
		}

		var quadsOnly = false;
		this.toggleLeafDisplayType = function() {
			quadsOnly = !quadsOnly;
		}


		function render(node, size) {
			if(basicCtx) {
				if(quadsOnly || !node.Isleaf || size < 25) {
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

		this.renderTree = function(viewpoint) {
			if(checkOrtho) {
				var MVP = M4x4.mul(orthoProjection, basicCtx.peekMatrix());
			}
			else {
				var MVP = M4x4.mul(basicCtx.perspectiveMatrix, basicCtx.peekMatrix());
			}
			basicCtx.ctx.useProgram(quadShader);
			basicCtx.ctx.uniformMatrix4fv(quadVarLocs[2], false, MVP);
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniformMatrix4fv(leafVarLocs[2], false, MVP);

			this.recurseTree(Tree, viewpoint);

			if(requestQueue.length > 0 && requestFinish) {
				sendRequest();
			}
		};

		this.recurseTree = function(node, viewpoint) {
			if(node.status == COMPLETE) {
				var centerVS = V3.mul4x4(basicCtx.peekMatrix(), node.center);
				if(isvisible(node.radius, centerVS)) {
					var size = Math.abs((node.radius * basicCtx.height) / (centerVS[2] * t30));
					if(size < 25 || node.Isleaf) {
						render(node, size); 
					}
					else {
						for(var k = 0; k < 8; k++) {
							if(typeof node.Children[k] == "undefined") {
								load(node, k);
							}
							else if(node.Children[k].status == COMPLETE){
								this.recurseTree(node.Children[k], viewpoint);
							}
						}
					}
				}
			}
		};

		this.pointPicking = function(viewpoint, x, y) {
			var pickingTransform = new Float32Array([	 	 54,			0, 0, 0,
																   0,		  54, 0, 0,
														 		   0,			0, 1, 0,
														 54 - x * 0.2, 54 - y * 0.2, 0, 1]);
			pc.basicCtx.ctx.viewport(0, 0, 10, 10);
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

			pc.basicCtx.ctx.viewport(0, 0, 540, 540);
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
					var size = (node.radius * basicCtx.height) / (-centerVS[2] * t30);
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
		basicCtx.ctx.renderbufferStorage(basicCtx.ctx.RENDERBUFFER, basicCtx.ctx.DEPTH_COMPONENT16, 32, 32);
		basicCtx.ctx.framebufferRenderbuffer(basicCtx.ctx.FRAMEBUFFER, basicCtx.ctx.DEPTH_ATTACHMENT, basicCtx.ctx.RENDERBUFFER, depthBuffer);
		basicCtx.ctx.bindRenderbuffer(basicCtx.ctx.RENDERBUFFER, null);
		basicCtx.ctx.deleteRenderbuffer(depthBuffer);
		basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);
		delete depthBuffer;


		function parseCallback() {
			if(this.readyState == 4 && this.status == 200) {
				var obj = JSON.parse(this.responseText);
				if(obj[0] === undefined) {
					obj[0] = obj;
				}

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

					var size;
					var quad = new Float32Array(28);
					quad[0]  = obj[h].BB[3]; quad[1]  = obj[h].BB[1]; quad[2]  = currentRequest[h].node.center[2];
					quad[7]  = obj[h].BB[3]; quad[8]  = obj[h].BB[4]; quad[9]  = currentRequest[h].node.center[2];
					quad[14] = obj[h].BB[0]; quad[15] = obj[h].BB[1]; quad[16] = currentRequest[h].node.center[2];
					quad[21] = obj[h].BB[0]; quad[22] = obj[h].BB[4]; quad[23] = currentRequest[h].node.center[2];
					if(temp[0] > temp[1]) {
						size = temp[0] * 0.5;
						var texOffset = 0.5 * temp[1] / temp[0];
						quad[3]  = 0.5; quad[4]  = 0.5 - texOffset;
						quad[10] = 0.5; quad[11] = 0.5 + texOffset;
						quad[17] = 0.0; quad[18] = 0.5 - texOffset;
						quad[24] = 0.0; quad[25] = 0.5 + texOffset;
						quad[5]  = 1.0; quad[6]  = 0.5 - texOffset;
						quad[12] = 1.0; quad[13] = 0.5 + texOffset;
						quad[19] = 0.5; quad[20] = 0.5 - texOffset;
						quad[26] = 0.5; quad[27] = 0.5 + texOffset;
					}
					else {
						size = temp[1] * 0.5;
						var texOffset = 0.5 * temp[0] / temp[1];
						quad[3]  = 0.25 + texOffset * 0.5; quad[4]  = 0;
						quad[10] = 0.25 + texOffset * 0.5; quad[11] = 1;
						quad[17] = 0.25 - texOffset * 0.5; quad[18] = 0;
						quad[24] = 0.25 - texOffset * 0.5; quad[25] = 1;
						quad[5]  = 0.75 + texOffset * 0.5; quad[6]  = 0;
						quad[12] = 0.75 + texOffset * 0.5; quad[13] = 1;
						quad[19] = 0.75 - texOffset * 0.5; quad[20] = 0;
						quad[26] = 0.75 - texOffset * 0.5; quad[27] = 1;
					}
					currentRequest[h].node.quadVBO = basicCtx.ctx.createBuffer();
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, currentRequest[h].node.quadVBO);
					basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, quad, basicCtx.ctx.STATIC_DRAW);

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
						basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, currentRequest[h].node.texture);
						basicCtx.ctx.framebufferTexture2D(basicCtx.ctx.FRAMEBUFFER, basicCtx.ctx.COLOR_ATTACHMENT0, basicCtx.ctx.TEXTURE_2D, currentRequest[h].node.texture, 0);
						basicCtx.clear();

						var texMVP = M4x4.mul(M4x4.makeOrtho(-size, size, -size, size, temp[2] * 0.25, temp[2] * 1.75), 
										   	  M4x4.makeLookAt(V3.add(currentRequest[h].node.center, V3.$(0, 0, temp[2])), 
										   				   	  currentRequest[h].node.center, V3.$(0, 1, 0)));

						basicCtx.ctx.useProgram(leafShader);
						basicCtx.ctx.uniform1f(leafVarLocs[3], 1.0);
						basicCtx.ctx.uniform1i(leafVarLocs[6], 0);
						basicCtx.ctx.uniformMatrix4fv(leafVarLocs[2], false, texMVP);
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, currentRequest[h].node.VertexPositionBuffer.VBO);
						basicCtx.ctx.vertexAttribPointer(leafVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, currentRequest[h].node.VertexColorBuffer);
						
						for (var x = 0; x < 2; x++) {
							pc.basicCtx.ctx.viewport(x * 32, 0, 32, 32);
							basicCtx.ctx.vertexAttribPointer(leafVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 24, x * 12);
							basicCtx.ctx.drawArrays(basicCtx.ctx.POINTS, 0, currentRequest[h].node.VertexPositionBuffer.length / 3);
						}

						basicCtx.ctx.uniform1f(leafVarLocs[3], currPointSize);
						basicCtx.ctx.uniform1i(leafVarLocs[6], currCE);
						pc.basicCtx.ctx.viewport(0, 0, 540, 540);

						basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);
						basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);

						currentRequest[h].node.inTex = true;
						checkParent(currentRequest[h].node);
					}
					currentRequest[h].node.status = COMPLETE;
				}
				requestFinish = true;
			}
		}

		function checkParent(node) {
			parentNode = node.parent;
			if(parentNode != null) {
				var go = true;
				for(var i = 0; i < 8; i++) {
					if(typeof parentNode.Children[i] == "undefined" || !parentNode.Children[i].inTex) {
						go = false;
					}
				}
				if(go) {
					var temp = [parentNode.BB[3] - parentNode.BB[0], parentNode.BB[4] - parentNode.BB[1], parentNode.BB[5] - parentNode.BB[2]];
					var size;
					if(temp[0] > temp[1]) {
						size = temp[0] * 0.5;
					}
					else {
						size = temp[1] * 0.5;
					}

					basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, FBO);
					basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, parentNode.texture);
					basicCtx.ctx.framebufferTexture2D(basicCtx.ctx.FRAMEBUFFER, basicCtx.ctx.COLOR_ATTACHMENT0, basicCtx.ctx.TEXTURE_2D, parentNode.texture, 0);
					basicCtx.clear();

					var texMVP = M4x4.mul(M4x4.makeOrtho(-size, size, -size, size, temp[2] * 0.25, temp[2] * 1.75), 
									   	  M4x4.makeLookAt(V3.add(parentNode.center, V3.$(0, 0, temp[2])), 
							   				   			  parentNode.center, V3.$(0, 1, 0)));

					basicCtx.ctx.useProgram(quadShader);
					basicCtx.ctx.uniformMatrix4fv(quadVarLocs[2], false, texMVP);
					basicCtx.ctx.uniform1i(quadVarLocs[6], 0);

					for(var j = 0; j < 8; j++) {
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, parentNode.Children[j].quadVBO);
						basicCtx.ctx.vertexAttribPointer(quadVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 28, 0);
						basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, parentNode.Children[j].texture);
						basicCtx.ctx.uniform1i(quadVarLocs[3], parentNode.Children[j].texture);

						for(var x = 0; x < 2; x++) {
							pc.basicCtx.ctx.viewport(x * 32, 0, 32, 32);
							basicCtx.ctx.vertexAttribPointer(quadVarLocs[1], 2, basicCtx.ctx.FLOAT, false, 28, 12 + x * 8);
							basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
						}

						basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);
					}

					basicCtx.ctx.uniform1i(quadVarLocs[6], currCE);
					pc.basicCtx.ctx.viewport(0, 0, 540, 540);

					basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);
					basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);

					parentNode.inTex = true;
					checkParent(parentNode);
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
				path: null
				// lastRendered: 0,
			};

			node.texture = basicCtx.ctx.createTexture();
			basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, node.texture);
			basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, 64, 32, 0, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, null);
			basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MIN_FILTER, basicCtx.ctx.NEAREST);
			basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MAG_FILTER, basicCtx.ctx.NEAREST);
			basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);

			if(parentnode == null) {
				node.path = index;
				Tree = node;
			}
			else {
				node.path = parentnode.path + "/" + index;
				parentnode.Children[index] = node;
				node.parent = parentnode;
			}
			requestQueue.push({path: node.path, node: node});
		}

		function sendRequest() {
			currentRequest = requestQueue.splice(0, Math.min(5, requestQueue.length));
			var requestString = '';
			var i;
			for(i = 0; i < currentRequest.length - 1; i++) {
				requestString += currentRequest[i].path + ';';
			}
			requestString += currentRequest[i].path;
			requestFinish = false;
			request = new XMLHttpRequest();
			request.onload = parseCallback;
			request.open("GET", "action.php?a=getnode&path="+requestString+"&table="+table, true);
			request.send();
		}

		this.root = function(path, t) {
			table = t;
			load(null, path);
			return Tree;
		}
	}// constructor

	return PCTree;
} ());