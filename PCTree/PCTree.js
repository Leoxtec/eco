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

		var inNodeShader;
		var leafShader;

		var inNodeVarLocs = [];
		var leafVarLocs = [];

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

		inNodeShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/inNodeVertShader.c'), basicCtx.getShaderStr('shaders/inNodeFragShader.c'));
		basicCtx.ctx.useProgram(inNodeShader);
		inNodeVarLocs.push(basicCtx.ctx.getAttribLocation(inNodeShader, "aVertexPosition"));
		inNodeVarLocs.push(basicCtx.ctx.getAttribLocation(inNodeShader, "aVertexColor"));
		inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "uMVP"));
		// inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "uModelViewMatrix"));
		// inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "uProjectionMatrix"));
		inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "uSize"));
		inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "uBias"));
		inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "uScale"));
		inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "uCEMode"));
		basicCtx.ctx.uniform3fv(inNodeVarLocs[4], biasAndScale.b);
		basicCtx.ctx.uniform3fv(inNodeVarLocs[5], biasAndScale.s);
		basicCtx.ctx.uniform1i(inNodeVarLocs[6], 0);

		leafShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/pointVertShader.c'), basicCtx.getShaderStr('shaders/basicFragShader.c'));
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
		pointPickShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/testVertShader.c'), basicCtx.getShaderStr('shaders/basicFragShader.c'));
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
		basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);
		basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);
		delete pointRenderBuffer;

		var crossShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/crossVertShader.c'), basicCtx.getShaderStr('shaders/gridFragShader.c'));
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

		this.setCE = function(val) {
			basicCtx.ctx.useProgram(inNodeShader);
			basicCtx.ctx.uniform1i(inNodeVarLocs[6], val);
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniform1i(leafVarLocs[6], val);
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
			// basicCtx.ctx.useProgram(inNodeShader);
			// basicCtx.ctx.uniformMatrix4fv(inNodeVarLocs[3], false, basicCtx.perspectiveMatrix);
			// basicCtx.ctx.useProgram(leafShader);
			// basicCtx.ctx.uniformMatrix4fv(leafVarLocs[3], false, basicCtx.perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			orthoProjection = projectionMatrix;
			// basicCtx.ctx.useProgram(inNodeShader);
			// basicCtx.ctx.uniformMatrix4fv(inNodeVarLocs[2], false, projectionMatrix);
			// basicCtx.ctx.useProgram(leafShader);
			// basicCtx.ctx.uniformMatrix4fv(leafVarLocs[2], false, projectionMatrix);
		};

		this.pointSize = function(size) {
			basicCtx.ctx.useProgram(leafShader);
			// basicCtx.ctx.uniform1f(leafVarLocs[4], size);
			basicCtx.ctx.uniform1f(leafVarLocs[3], size);
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

		function render(node, size) {
			if(basicCtx) {
				if(!node.Isleaf) {
					basicCtx.ctx.useProgram(inNodeShader);
					// basicCtx.ctx.uniform1f(inNodeVarLocs[4], size);
					basicCtx.ctx.uniform1f(inNodeVarLocs[3], size);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, node.VertexPositionBuffer);
					basicCtx.ctx.vertexAttribPointer(inNodeVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, node.VertexColorBuffer);
					basicCtx.ctx.vertexAttribPointer(inNodeVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.drawArrays(basicCtx.ctx.POINTS, 0, 1);
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

		//Todo -- sphere check
		// compute the distance center to plane
		// 
		// OBB test //oriented boungding box test cross product of the edges
		function isvisible(radius, center) { 
			//for six clipping plane
			//compute the distance between the center and each plane
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
				d[4] = znear + center[2];
				d[5] = zfar - center[2];
			}
			for(var i = 0; i < 6; i++) {
				if(d[i] > radius) {
					return false;
				}
			}
			return true;
		}

		/////////////////////////////////////////////////////
		//  recurse the tree from given node, 
		//  viewpoint is for decided whether object is visible 
		//  and compute its size on screen.
		/////////////////////////////////////////////////////
		this.renderTree = function(viewpoint) {
			if(checkOrtho) {
				var MVP = M4x4.mul(orthoProjection, basicCtx.peekMatrix());
			}
			else {
				var MVP = M4x4.mul(basicCtx.perspectiveMatrix, basicCtx.peekMatrix());
			}
			basicCtx.ctx.useProgram(inNodeShader);
			basicCtx.ctx.uniformMatrix4fv(inNodeVarLocs[2], false, MVP);
			basicCtx.ctx.enableVertexAttribArray(inNodeVarLocs[0]);
			basicCtx.ctx.enableVertexAttribArray(inNodeVarLocs[1]);
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniformMatrix4fv(leafVarLocs[2], false, MVP);
			basicCtx.ctx.enableVertexAttribArray(leafVarLocs[0]);
			basicCtx.ctx.enableVertexAttribArray(leafVarLocs[1]);
			this.recurseTree(Tree, viewpoint);
			basicCtx.ctx.disableVertexAttribArray(inNodeVarLocs[0]);
			basicCtx.ctx.disableVertexAttribArray(inNodeVarLocs[1]);
			basicCtx.ctx.disableVertexAttribArray(leafVarLocs[0]);
			basicCtx.ctx.disableVertexAttribArray(leafVarLocs[1]);
			if(requestQueue.length > 0 && requestFinish) {
				sendRequest();
			}
		};

		this.recurseTree = function(node, viewpoint) {
			if(node.status == COMPLETE) {
				var centerVS = V3.mul4x4(basicCtx.peekMatrix(), node.center);
				if(isvisible(node.radius, centerVS)) {
					// node.lastRendered = (new Date()).getTime();
					var size = (node.radius * basicCtx.height) / (-centerVS[2] * t30);
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

		// this.pruneTree = function(node, time) {
		// 	if(node.status == COMPLETE) {
		// 		for(var i = 0; i < node.numChildren; i++) {
		// 			if(typeof node.Children[i] != "undefined") {
		// 				if(time - node.Children[i].lastRendered > 2000) {
		// 					this.pruneBranch(node.Children[i]);
		// 					node.Children[i] = undefined;
		// 				}
		// 				else {
		// 					this.pruneTree(node.Children[i], time);
		// 				}
		// 			}
		// 		}
		// 	}
		// };

		// this.pruneBranch = function(node) {
		// 	if(node.status == COMPLETE) {
		// 		if(node.numChildren !== 0) {
		// 			basicCtx.ctx.deleteBuffer(node.VertexPositionBuffer);
		// 			for(var i = 0; i < node.numChildren; i++) {
		// 				if(typeof node.Children[i] != "undefined") {
		// 					this.pruneBranch(node.Children[i]);
		// 				}
		// 			}
		// 		}
		// 		else {
		// 			basicCtx.ctx.deleteBuffer(node.VertexPositionBuffer.VBO);
		// 		}
		// 		basicCtx.ctx.deleteBuffer(node.VertexColorBuffer);
		// 	}
		// };

		this.pointPicking = function(viewpoint, x, y) {
			// var pickingTransform = new Float32Array([	 	 108,			0, 0, 0,
			// 													   0,		  108, 0, 0,
			// 											 		   0,			0, 1, 0,
			// 											 108 - x * 0.4, 108 - y * 0.4, 0, 1]);
			var pickingTransform = new Float32Array([	 	 54,			0, 0, 0,
																   0,		  54, 0, 0,
														 		   0,			0, 1, 0,
														 54 - x * 0.2, 54 - y * 0.2, 0, 1]);
			// pc.basicCtx.ctx.viewport(0, 0, 5, 5);
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
			basicCtx.ctx.enableVertexAttribArray(pointPickVarLocs[0]);
			basicCtx.ctx.enableVertexAttribArray(pointPickVarLocs[1]);

			this.recursePP(Tree, viewpoint);

			basicCtx.ctx.disableVertexAttribArray(pointPickVarLocs[0]);
			basicCtx.ctx.disableVertexAttribArray(pointPickVarLocs[1]);

			// var arr = new Uint8Array(100);
			// basicCtx.ctx.readPixels(0, 0, 5, 5, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, arr);
			// //window.console.log(arr);
			// var closest = [-3, -3];
			// var distance = Number.POSITIVE_INFINITY;
			// var id;
			// var index;
			// for(var i = 0; i < 5; i++) {
			// 	for(var j = 0; j < 5; j++) {
			// 		index = i * 20 + j * 4;
			// 		if(arr[index] != 0) {
			// 			var temp = (i - 2) * (i - 2) + (j - 2) * (j - 2);
			// 			if(temp < distance) {
			// 				distance = temp;
			// 				closest[0] = j - 2;
			// 				closest[1] = i - 2;
			// 				id = arr[index];
			// 			}
			// 		}
			// 	}
			// }
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
				basicCtx.ctx.enableVertexAttribArray(crossVarLocs[0]);
				basicCtx.ctx.drawArrays(basicCtx.ctx.LINES, 0, 8);
				basicCtx.ctx.disableVertexAttribArray(crossVarLocs[0]);
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

		function parseCallback() {
			if(this.readyState == 4 && this.status == 200) {
				var obj = JSON.parse(this.responseText);
				if(obj[0] === undefined) {
					obj[0] = obj;
				}
				for(var h = 0; h < currentRequest.length; h++) {
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
						if(obj[h].Isleaf) {
							picInfo.push({pic: obj[h].Point[i + 9], x: obj[h].Point[i + 10], y: obj[h].Point[i + 11]});
							pickCols[j]     = (pointPickIndex >> 16) / 255;
							pickCols[j + 1] = ((pointPickIndex >> 8) & 255) / 255;
							pickCols[j + 2] = (pointPickIndex & 255) / 255;
							pointPickIndex++;
						}
					}

					if(!obj[h].Isleaf) {
						currentRequest[h].node.VertexPositionBuffer = basicCtx.ctx.createBuffer();
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, currentRequest[h].node.VertexPositionBuffer);
						basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, verts, basicCtx.ctx.STATIC_DRAW);
					}
					else {
						var VBO = basicCtx.ctx.createBuffer();
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, VBO);
						basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, verts, basicCtx.ctx.STATIC_DRAW);
						currentRequest[h].node.VertexPositionBuffer = {length: verts.length, VBO: VBO};
						currentRequest[h].node.PickingColorBuffer = basicCtx.ctx.createBuffer();
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, currentRequest[h].node.PickingColorBuffer);
						basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, pickCols, basicCtx.ctx.STATIC_DRAW);
					}
					currentRequest[h].node.VertexColorBuffer = basicCtx.ctx.createBuffer();
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, currentRequest[h].node.VertexColorBuffer);
					basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, cols, basicCtx.ctx.STATIC_DRAW);

					currentRequest[h].node.Isleaf = obj[h].Isleaf;
					currentRequest[h].node.BB = obj[h].BB;

					var temp = [currentRequest[h].node.BB[3] - currentRequest[h].node.BB[0], currentRequest[h].node.BB[4] - currentRequest[h].node.BB[1], currentRequest[h].node.BB[5] - currentRequest[h].node.BB[2]];
					currentRequest[h].node.center[0] = temp[0] * 0.5 + currentRequest[h].node.BB[0];
					currentRequest[h].node.center[1] = temp[1] * 0.5 + currentRequest[h].node.BB[1];
					currentRequest[h].node.center[2] = temp[2] * 0.5 + currentRequest[h].node.BB[2];
					currentRequest[h].node.radius =  Math.sqrt(temp[0] * temp[0] + temp[1] * temp[1] + temp[2] * temp[2]) * 0.5;

					// currentRequest[h].node.lastRendered = (new Date()).getTime();
					currentRequest[h].node.status = COMPLETE;
				}
				requestFinish = true;
			}
		}

		function load(parentnode, index) {
			var node = {
				VertexPositionBuffer: {},
				VertexColorBuffer: {},
				PickingColorBuffer: {},
				BB: [],
				status: STARTED, 
				center: [0, 0, 0],
				radius: 1,
				Isleaf: 0,
				Children: {},
				path: null
				// lastRendered: 0,
			};

			if(parentnode == null) {
				node.path = index;
				Tree = node;
			}
			else {
				node.path = parentnode.path + "/" + index;
				parentnode.Children[index] = node;
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
