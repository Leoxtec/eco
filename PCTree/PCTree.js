var PCTree = (function() {
	function PCTree(bctx) {
		var basicCtx = bctx;

		var c30 = Math.cos(Math.PI / 6.0);
		var s30 = Math.sin(Math.PI / 6.0);
		var t30 = Math.tan(Math.PI / 6.0);
		var znear = 0.1;
		var zfar = -1000.0;

		var Tree = null;

		var gridVBO;
		var gridCount = [];
		var grid = 0;
		var gridZPos;
		var gridZOffset = 0.0;
		var gridZinc;

		var inNodeShader;
		var leafShader;
		var gridShader;

		var inNodeVarLocs = [];
		var leafVarLocs = [];
		var gridVarLocs = [];

		var checkOrtho = false;

		const STARTED = 1;
		const COMPLETE = 2;

		inNodeShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/inNodeVertShader.c'), basicCtx.getShaderStr('shaders/inNodeFragShader.c'));
		basicCtx.ctx.useProgram(inNodeShader);
		inNodeVarLocs.push(basicCtx.ctx.getAttribLocation(inNodeShader, "aVertexPosition"));
		inNodeVarLocs.push(basicCtx.ctx.getAttribLocation(inNodeShader, "aVertexColor"));
		inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "uModelViewMatrix"));
		inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "uProjectionMatrix"));
		inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "uSize"));

		leafShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/pointVertShader.c'), basicCtx.getShaderStr('shaders/basicFragShader.c'));
		basicCtx.ctx.useProgram(leafShader);
		leafVarLocs.push(basicCtx.ctx.getAttribLocation(leafShader, "aVertexPosition"));
		leafVarLocs.push(basicCtx.ctx.getAttribLocation(leafShader, "aVertexColor"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "uModelViewMatrix"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "uProjectionMatrix"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "uPointSize"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "uAttenuation"));
		basicCtx.ctx.uniform1f(leafVarLocs[4], 1);
		basicCtx.ctx.uniform3fv(leafVarLocs[5], [1.0, 0.0, 0.0]);

		gridShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/gridVertShader.c'), basicCtx.getShaderStr('shaders/gridFragShader.c'));
		basicCtx.ctx.useProgram(gridShader);
		gridVarLocs.push(basicCtx.ctx.getAttribLocation(gridShader, "aVertexPosition"));
		gridVarLocs.push(basicCtx.ctx.getUniformLocation(gridShader, "uModelViewMatrix"));
		gridVarLocs.push(basicCtx.ctx.getUniformLocation(gridShader, "uProjectionMatrix"));

		this.usePerspective = function(n, f) {
			znear = n;
			zfar = -f;
			basicCtx.ctx.useProgram(inNodeShader);
			basicCtx.ctx.uniformMatrix4fv(inNodeVarLocs[3], false, basicCtx.perspectiveMatrix);
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniformMatrix4fv(leafVarLocs[3], false, basicCtx.perspectiveMatrix);
			basicCtx.ctx.useProgram(gridShader);
			basicCtx.ctx.uniformMatrix4fv(gridVarLocs[2], false, basicCtx.perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			basicCtx.ctx.useProgram(inNodeShader);
			basicCtx.ctx.uniformMatrix4fv(inNodeVarLocs[3], false, projectionMatrix);
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniformMatrix4fv(leafVarLocs[3], false, projectionMatrix);
			basicCtx.ctx.useProgram(gridShader);
			basicCtx.ctx.uniformMatrix4fv(gridVarLocs[2], false, projectionMatrix);
		};

		this.pointSize = function(size) {
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniform1f(leafVarLocs[4], size);
		};

		this.attenuation = function(constant, linear, quadratic) {
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniform3fv(leafVarLocs[5], [constant, linear, quadratic]);
		};

		this.getCenter = function() {
			return Tree.center;
		}

		this.getRadius = function() {
			return Tree.radius;
		}

		this.setCheckOrtho = function(t) {
			checkOrtho = t;
		}

		this.gridSize = function(g) {
			grid = g;
		}

		this.gridPos = function(p) {
			gridZOffset = p * gridZinc;
			return gridZPos + gridZOffset;
		}

		function render(node, size) {
			if(basicCtx) {
				if(node.numChildren !== 0) {
				// if(!node.Isleaf) {
					basicCtx.ctx.useProgram(inNodeShader);
					basicCtx.ctx.uniform1f(inNodeVarLocs[4], size);
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
					basicCtx.ctx.vertexAttribPointer(leafVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 0, 0);
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
			}
			else {
				var a = center[0] * c30;
				var b = center[1] * c30;
				var c = center[2] * s30;
				d[0] = c + a;
				d[1] = c - a;
				d[2] = c - b;
				d[3] = c + b;
			}
			d[4] = znear + center[2];
			d[5] = zfar - center[2];
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

		//Todo
		//Edit: start with level 3 and set a limit number of nodes rendering per frame

		this.renderTree = function(viewpoint) {
			basicCtx.ctx.useProgram(inNodeShader);
			basicCtx.ctx.uniformMatrix4fv(inNodeVarLocs[2], false, basicCtx.peekMatrix());
			basicCtx.ctx.enableVertexAttribArray(inNodeVarLocs[0]);
			basicCtx.ctx.enableVertexAttribArray(inNodeVarLocs[1]);
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniformMatrix4fv(leafVarLocs[2], false, basicCtx.peekMatrix());
			basicCtx.ctx.enableVertexAttribArray(leafVarLocs[0]);
			basicCtx.ctx.enableVertexAttribArray(leafVarLocs[1]);
			this.recurseTree(Tree, viewpoint);
			basicCtx.ctx.disableVertexAttribArray(inNodeVarLocs[0]);
			basicCtx.ctx.disableVertexAttribArray(inNodeVarLocs[1]);
			basicCtx.ctx.disableVertexAttribArray(leafVarLocs[0]);
			basicCtx.ctx.disableVertexAttribArray(leafVarLocs[1]);

			basicCtx.ctx.useProgram(gridShader);
			basicCtx.pushMatrix();
			basicCtx.translate(0.0, 0.0, gridZOffset);
			basicCtx.ctx.uniformMatrix4fv(gridVarLocs[1], false, basicCtx.peekMatrix());
			basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, gridVBO);
			basicCtx.ctx.vertexAttribPointer(gridVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
			basicCtx.ctx.enableVertexAttribArray(gridVarLocs[0]);
			basicCtx.ctx.drawArrays(basicCtx.ctx.LINES, 0, gridCount[grid]);
			basicCtx.ctx.disableVertexAttribArray(gridVarLocs[0]);
			basicCtx.popMatrix();
		};

		this.recurseTree = function(node, viewpoint) {
			if(node.status == COMPLETE) {
				var centerVS = V3.mul4x4(basicCtx.peekMatrix(), node.center);
				if(isvisible(node.radius, centerVS)) {
					// node.lastRendered = (new Date()).getTime();
					var size = (node.radius * basicCtx.height) / (-centerVS[2] * t30);
					// if(size < 25 || node.Isleaf) {
					if(size < 25 || node.numChildren === 0) {
						render(node, size); 
					}
					else {
						for(var k = 0; k < node.numChildren; k++) {
						// for(var k = 0; k < 8; k++) {
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

		function generateGrid(center, radius) {
			var exponent = 1;
			while(Math.floor(radius / Math.pow(10.0, exponent)) > 0) {
				exponent++;
			}
			exponent--;
			var factor = Math.pow(10.0, exponent);
			var tempRadius = Math.ceil(radius / factor) * factor;
			var tempArray = new Float32Array((tempRadius * 8 + 4) * 3);
			var i;
			for(i = 0; i < (tempRadius / factor * 8 + 4) * 3; i += 12) {
				tempArray[i] = center[0] - tempRadius;
				tempArray[i + 3] = center[0] + tempRadius;
				tempArray[i + 1] = tempArray[i + 4] = center[1] + i / 12.0 * factor - tempRadius;
				tempArray[i + 6] = tempArray[i + 9] = center[0] + i / 12.0 * factor - tempRadius;
				tempArray[i + 7] = center[1] - tempRadius;
				tempArray[i + 10] = center[1] + tempRadius;
				tempArray[i + 2] = tempArray[i + 5] = tempArray[i + 8] = tempArray[i + 11] = center[2];
			}
			gridCount.push(i / 3);
			$("#gridSizeSlider").slider("option", "max", exponent);
			$("#gridSizeSlider").slider("option", "value", exponent);
			$("#gSize").val(factor + " meter(s)");
			while(exponent >= 1) {
				for(var j = 0; j < 2 * tempRadius / factor; j++) {
					for(var k = 1; k < 10; i += 12, k++) {
						tempArray[i] = center[0] - tempRadius;
						tempArray[i + 3] = center[0] + tempRadius;
						tempArray[i + 1] = tempArray[i + 4] = center[1] + (k * 0.1 + j) * factor - tempRadius;
						tempArray[i + 6] = tempArray[i + 9] = center[0] + (k * 0.1 + j) * factor - tempRadius;
						tempArray[i + 7] = center[1] - tempRadius;
						tempArray[i + 10] = center[1] + tempRadius;
						tempArray[i + 2] = tempArray[i + 5] = tempArray[i + 8] = tempArray[i + 11] = center[2];
					}
				}
				gridCount.push(i / 3);
				exponent--;
				factor *= 0.1;
			}
			gridVBO = basicCtx.ctx.createBuffer();
			basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, gridVBO);
			basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, tempArray, basicCtx.ctx.STATIC_DRAW);
		}

		function parseCallback() {
			if(this.readyState == 4 && this.status == 200) {
				var obj = JSON.parse(this.responseText);
				var verts = new Float32Array(obj.Point.length / 2);
				var cols = new Float32Array(verts.length);

				for(var i = 0, j = 0; i < obj.Point.length; i += 6, j += 3) {
					verts[j] 	 = obj.Point[i];
					verts[j + 1] = obj.Point[i + 1];
					verts[j + 2] = obj.Point[i + 2];
					cols[j] 	= obj.Point[i + 3] / 255;
					cols[j + 1] = obj.Point[i + 4] / 255;
					cols[j + 2] = obj.Point[i + 5] / 255;
				}

				// if(!obj.Isleaf) {
				if(obj.numChildren !== 0) {
					this.node.VertexPositionBuffer = basicCtx.ctx.createBuffer();
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, this.node.VertexPositionBuffer);
					basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, verts, basicCtx.ctx.STATIC_DRAW);
				}
				else {
					var VBO = basicCtx.ctx.createBuffer();
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, VBO);
					basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, verts, basicCtx.ctx.STATIC_DRAW);
					this.node.VertexPositionBuffer = {length: verts.length, VBO: VBO}
				}
				this.node.VertexColorBuffer = basicCtx.ctx.createBuffer();
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, this.node.VertexColorBuffer);
				basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, cols, basicCtx.ctx.STATIC_DRAW);

				// this.node.Isleaf = obj.Isleaf;
				this.node.numChildren = obj.numChildren;
				this.node.BB = obj.BB;

				var temp = [this.node.BB[0] - this.node.BB[3], this.node.BB[1] - this.node.BB[4], this.node.BB[2] - this.node.BB[5]];
				this.node.center[0] = temp[0] * 0.5 + this.node.BB[3];
				this.node.center[1] = temp[1] * 0.5 + this.node.BB[4];
				this.node.center[2] = temp[2] * 0.5 + this.node.BB[5];
				// var temp = [this.node.BB[3] - this.node.BB[0], this.node.BB[4] - this.node.BB[1], this.node.BB[5] - this.node.BB[2]];
				// this.node.center[0] = temp[0] * 0.5 + this.node.BB[0];
				// this.node.center[1] = temp[1] * 0.5 + this.node.BB[1];
				// this.node.center[2] = temp[2] * 0.5 + this.node.BB[2];
				this.node.radius =  Math.sqrt(temp[0] * temp[0] + temp[1] * temp[1] + temp[2] * temp[2]) * 0.5;

				if(this.node.path === 'r') {
					gridZinc = temp[2] / 100.0;
					gridZPos = this.node.center[2];
					$("#gPos").val(gridZPos);
					if(temp[0] > temp[1]) {
						generateGrid(this.node.center, temp[0] * 0.5);
					}
					else {
						generateGrid(this.node.center, temp[1] * 0.5);
					}
				}

				// this.node.lastRendered = (new Date()).getTime();
				this.node.status = COMPLETE;
				this.node.xmlhttp = null;
			}
		}

		function load(parentnode, index) {
			var node = {
				VertexPositionBuffer: {},
				VertexColorBuffer: {},
				BB: [],
				status: STARTED, 
				center: [0, 0, 0],
				radius: 1,
				// Isleaf: 0,
				numChildren: 0,
				Children: {},
				path: null,
				// lastRendered: 0,
				xmlhttp: new XMLHttpRequest()
			};

			if(parentnode == null) {
				node.path = index;
				Tree = node;
			}
			else {
				node.path = parentnode.path + "/" + index;
				parentnode.Children[index] = node;
			}

			node.xmlhttp.node = node;
			node.xmlhttp.onload = parseCallback;
			node.xmlhttp.open("GET", "action.php?a=getnode&path="+node.path, true);
			node.xmlhttp.send();
		}

		this.root = function(path) {
			load(null, path);
			return Tree;
		}
	}// constructor

	return PCTree;
} ());
