var GenTex = (function() {
	function GenTex(ctx, can, t) {
		var gl = ctx;
		var canvas = can;
		var junkBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, junkBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.enableVertexAttribArray(1);
		gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
		gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);

		var requestQueue = [];
		var currentRequest;
		var requestFinish = true;
		var request;

		var Tree = null;

		var table = t;

		const STARTED = 1;
		const COMPLETE = 2;

		xmlhttpForBB = new XMLHttpRequest();
		xmlhttpForBB.open("GET", "action.php?a=getnode&path=r&table=" + table, false);
		xmlhttpForBB.send();
		BB = JSON.parse(xmlhttpForBB.responseText).BB;

		span = [BB[3] - BB[0], BB[4] - BB[1], BB[5] - BB[2]];
		center = [span[0] * 0.5 + BB[0], span[1] * 0.5 + BB[1], span[2] * 0.5 + BB[2]];
		if(span[0] > span[1]) {
			radius = span[0] * 0.5;
		}
		else {
			radius = span[1] * 0.5;
		}
		orthoSize = radius + radius * 0.25;

		exponent = 1;
		while(Math.floor(radius / Math.pow(10.0, exponent)) > 0) {
			exponent++;
		}
		exponent--;
		factor = Math.pow(10.0, exponent);
		radius = Math.ceil(radius / factor) * factor;
		radius = Math.sqrt(2 * radius * radius + 0.25 * span[2] * span[2]);

		pan = -Math.PI / 2;
		tilt = 5 * Math.PI / 180;
		sinTilt = Math.sin(tilt);
		var pos = vec3.scale([], vec3.fromValues(Math.cos(pan) * sinTilt, Math.sin(pan) * sinTilt, Math.cos(tilt)), radius / Math.tan(Math.PI / 6.0));
		view = mat4.lookAt([], pos, [0, 0, 0], [0, 0, 1]);
		var model = mat4.translate([], mat4.identity([]), vec3.scale([], center, -1));
		var viewUp = vec3.fromValues(view[1], view[5], view[9]);

		var orthoMVP = mat4.mul([], mat4.ortho([], -orthoSize, orthoSize, orthoSize, -orthoSize, 1, 1 + span[2]), 
									mat4.lookAt([], vec3.add([], center, [0, 0, 1 + span[2] * 0.5]), center, [0, 1, 0]));

		delete BB;
		delete xmlhttpForBB;
		delete span;
		delete center;
		delete radius;
		delete exponent;
		delete factor;
		delete pan;
		delete tilt;
		delete sinTilt;
		delete view;
		delete orthoSize;

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

		this.createProgramObject = function(vetexShaderSource, fragmentShaderSource) {
			var vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
			gl.shaderSource(vertexShaderObject, vetexShaderSource);
			gl.compileShader(vertexShaderObject);
			if (!gl.getShaderParameter(vertexShaderObject, gl.COMPILE_STATUS)) {
				throw gl.getShaderInfoLog(vertexShaderObject);
			}
			var fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(fragmentShaderObject, fragmentShaderSource);
			gl.compileShader(fragmentShaderObject);
			if (!gl.getShaderParameter(fragmentShaderObject, gl.COMPILE_STATUS)) {
				throw gl.getShaderInfoLog(fragmentShaderObject);
			}
			var programObject = gl.createProgram();
			gl.attachShader(programObject, vertexShaderObject);
			gl.attachShader(programObject, fragmentShaderObject);
			gl.linkProgram(programObject);
			if (!gl.getProgramParameter(programObject, gl.LINK_STATUS)) {
				throw "Error linking shaders.";
			}
			return programObject;
		};

		var leafVarLocs = [];
		var leafShader = this.createProgramObject(this.getShaderStr('point.vert'), this.getShaderStr('basic.frag'));
		gl.useProgram(leafShader);
		leafVarLocs.push(gl.getAttribLocation(leafShader, "aVertexPosition"));
		leafVarLocs.push(gl.getAttribLocation(leafShader, "aVertexColor"));
		leafVarLocs.push(gl.getUniformLocation(leafShader, "uMVP"));

		var FSQLocs = [];
		var FSQShader = this.createProgramObject(this.getShaderStr('fullScreenQuad.vert'), this.getShaderStr('fullScreenQuad.frag'));
		gl.useProgram(FSQShader);
		FSQLocs.push(gl.getAttribLocation(FSQShader, "aIndex"));
		FSQLocs.push(gl.getUniformLocation(FSQShader, "usampler"));
		var indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 1.0, 2.0, 3.0]), gl.STATIC_DRAW);

		this.renderTree = function() {
			if(Tree.status == COMPLETE) {
				if(map) {
					gl.useProgram(leafShader);
					gl.uniformMatrix4fv(leafVarLocs[2], false, orthoMVP);
				}
				this.recurseTree(Tree);
				if(map) {
					sendStringRepresentation("map");
				}
			}

			if(requestQueue.length > 0 && requestFinish) {
				sendRequest();
			}
		};

		this.recurseTree = function(node) {
			if(!node.Isleaf) {
				for(var k = 0; k < 8; k++) {
					if(typeof node.Children[k] == "undefined") {
						load(node, k);
					}
					else if(node.Children[k].status == COMPLETE) {
						this.recurseTree(node.Children[k]);
					}
				}
			}
			else if(map) {
				gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexPositionBuffer.VBO);
				gl.vertexAttribPointer(leafVarLocs[0], 3, gl.FLOAT, false, 0, 0);
				gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexColorBuffer);
				gl.vertexAttribPointer(leafVarLocs[1], 3, gl.FLOAT, false, 24, 0);
				gl.drawArrays(gl.POINTS, 0, node.VertexPositionBuffer.length / 3);
			}
		};

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

		function parseCallback() {
			if(this.readyState == 4 && this.status == 200) {
				var obj = JSON.parse(this.responseText);
				if(obj[0] === undefined) {
					obj[0] = obj;
				}

				for(var h = 0; h < currentRequest.length; h++) {
					currentRequest[h].node.Isleaf = obj[h].Isleaf;

					var center = [(obj[h].BB[3] + obj[h].BB[0]) * 0.5, 
								  (obj[h].BB[4] + obj[h].BB[1]) * 0.5, 
								  (obj[h].BB[5] + obj[h].BB[2]) * 0.5];

					var view = mat4.lookAt([], pos, vec3.transformMat4([], center, model), viewUp);
					var viewInverse = mat4.invert([], view);

					var arr = Array(8);
					var modelView = mat4.mul([], view, model);
					var newBB = transformBB(obj[h].BB, modelView);

					var br = vec3.transformMat4([], [newBB[3], newBB[1], newBB[5]], viewInverse);
					var tr = vec3.transformMat4([], [newBB[3], newBB[4], newBB[5]], viewInverse);
					var bl = vec3.transformMat4([], [newBB[0], newBB[1], newBB[5]], viewInverse);
					var tl = vec3.transformMat4([], [newBB[0], newBB[4], newBB[5]], viewInverse);

					var newBBDiameter = vec3.length(vec3.subtract([], vec3.transformMat4([], [newBB[3], newBB[4], newBB[2]], viewInverse), bl));

					var quadCenter = vec3.scale([], vec3.add([], vec3.add([], vec3.add([], br, tr), bl), tl), 0.25);

					var halfWidth = vec3.length(vec3.subtract([], br, bl)) * 0.5;
					var halfHeight = vec3.length(vec3.subtract([], tr, br)) * 0.5;
					var nearPlane = vec3.length(vec3.subtract([], pos, quadCenter));
					currentRequest[h].node.mvpMat = mat4.mul([], mat4.frustum([], -halfWidth, halfWidth, -halfHeight, halfHeight, nearPlane, nearPlane + newBBDiameter), modelView);

					// var radius = vec3.length(vec3.sub([], center, [obj[h].BB[0], obj[h].BB[1], obj[h].BB[2]]));

					// var dist = vec3.length(vec3.subtract([], vec3.transformMat4([], center, model), pos));
					// var view = mat4.lookAt([], pos, vec3.transformMat4([], center, model), viewUp);

					// var modelView = mat4.mul([], view, model);
					// currentRequest[h].node.mvpMat = mat4.mul([], mat4.frustum([], -radius, radius, -radius, radius, dist - radius, dist + radius), modelView);

					if(obj[h].Isleaf) {
						var verts = new Float32Array(obj[h].Point.length / 4);
						var cols = new Float32Array(verts.length * 2);

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
						}

						var VBO = gl.createBuffer();
						gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
						gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
						currentRequest[h].node.VertexPositionBuffer = {length: verts.length, VBO: VBO};

						currentRequest[h].node.VertexColorBuffer = gl.createBuffer();
						gl.bindBuffer(gl.ARRAY_BUFFER, currentRequest[h].node.VertexColorBuffer);
						gl.bufferData(gl.ARRAY_BUFFER, cols, gl.STATIC_DRAW);

						currentRequest[h].node.inTex = true;
						checkParent(currentRequest[h].node);
					}
					currentRequest[h].node.status = COMPLETE;
				}
				requestFinish = true;
			}
		}

		var FBO;
		var textureBuffer;
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

					gl.useProgram(leafShader);
					gl.uniformMatrix4fv(leafVarLocs[2], false, parentNode.mvpMat);
					
					var buffSize = 512 / Math.pow(2, parentNode.level);
					if(buffSize > 128) {
						FBO = gl.createFramebuffer();
						gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
						depthBuffer = gl.createRenderbuffer();
						gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
						gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, buffSize, buffSize);
						gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
						textureBuffer = gl.createTexture();
						gl.bindTexture(gl.TEXTURE_2D, textureBuffer);
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, buffSize, buffSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
						gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureBuffer, 0);
						gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
						gl.bindRenderbuffer(gl.RENDERBUFFER, null);
						gl.deleteRenderbuffer(depthBuffer);
						gl.bindTexture(gl.TEXTURE_2D, null);
						gl.bindFramebuffer(gl.FRAMEBUFFER, null);
						delete depthBuffer;
						gl.viewport(0, 0, buffSize, buffSize);
					}

					canvas.width = buffSize * 2;
					canvas.height = buffSize;
					gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

					for(var j = 0; j < 8; j++) {
						renderChildren(parentNode.Children[j], buffSize);
					}

					if(buffSize > 128) {
						gl.bindFramebuffer(gl.FRAMEBUFFER, null);
						gl.viewport(buffSize, 0, buffSize, buffSize);

						gl.useProgram(FSQShader);
						gl.bindTexture(gl.TEXTURE_2D, textureBuffer);
						gl.uniform1i(FSQLocs[1], textureBuffer);
						gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
						gl.vertexAttribPointer(FSQLocs[0], 1, gl.FLOAT, false, 0, 0);
						gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

						gl.deleteTexture(textureBuffer);
						gl.deleteFramebuffer(FBO);						
					}
					texSentCount++;
					sendStringRepresentation(parentNode.path.replace(/\//g,"-"));

					gl.viewport(0, 0, 512, 512);
					canvas.width = 512;
					canvas.height = 512;

					parentNode.inTex = true;
					checkParent(parentNode);
				}
			}
			else {
				map = true;
			}
		}

		function renderChildren(node, buffSize) {
			if(node.Isleaf) {
				gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexPositionBuffer.VBO);
				gl.vertexAttribPointer(leafVarLocs[0], 3, gl.FLOAT, false, 0, 0);
				gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexColorBuffer);

				if(buffSize > 128) {
					gl.vertexAttribPointer(leafVarLocs[1], 3, gl.FLOAT, false, 24, 0);
					gl.drawArrays(gl.POINTS, 0, node.VertexPositionBuffer.length / 3);

					gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
					gl.vertexAttribPointer(leafVarLocs[1], 3, gl.FLOAT, false, 24, 12);
					gl.drawArrays(gl.POINTS, 0, node.VertexPositionBuffer.length / 3);
					gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				}
				else {
					for (var x = 0; x < 2; x++) {
						gl.viewport(x * buffSize, 0, buffSize, buffSize);
						gl.vertexAttribPointer(leafVarLocs[1], 3, gl.FLOAT, false, 24, x * 12);
						gl.drawArrays(gl.POINTS, 0, node.VertexPositionBuffer.length / 3);
					}
				}
			}
			else {
				for(var i = 0; i < 8; i++) {
					renderChildren(node.Children[i], buffSize);
				}
			}
		}

		function load(parentnode, index) {
			var node = {
				VertexPositionBuffer: {},
				VertexColorBuffer: {},
				mvpMat: mat4.create(),
				status: STARTED, 
				Isleaf: 0,
				Children: {},
				parent: null,
				inTex: false,
				level: 0,
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

		this.root = function(path) {
			load(null, path);
		}

		function sendStringRepresentation(path) {
			gl.finish();
			var strDataURI = canvas.toDataURL();
			strDataURI = strDataURI.substr(22, strDataURI.length);

			$.post("img.php",
			{ 
				str: strDataURI,
				file: path
			},
			function(data) {
				if(data == "OK") {
					texSavedCount++;
					console.log("Image created.");
				}
				else{
					console.log("Image not created.");
				}
			});
		}
	}

	return GenTex;
} ());