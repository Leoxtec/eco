var PCTree = (function() {
	function PCTree(bctx) {
		var basicCtx = bctx;

		var count = 0;    
		var request = 1;
		var c30 = Math.cos(Math.PI / 6.0);
		var s30 = Math.sin(Math.PI / 6.0);
		var t30 = Math.tan(Math.PI / 6.0);
		var znear = 0.1;
		var zfar = 1000;

		var Tree = null;
		var parsers = {};

		var inNodeShader;
		var leafShader;

		var inNodeVarLocs = [];
		var leafVarLocs = [];

		// file status of point clouds
		const FILE_NOT_FOUND = -1;
		const STARTED = 1;
		const STREAMING = 2;
		const COMPLETE = 3;

		inNodeShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/inNodeVertShader.c'), basicCtx.getShaderStr('shaders/inNodeFragShader.c'));
		basicCtx.ctx.useProgram(inNodeShader);
		inNodeVarLocs.push(basicCtx.ctx.getAttribLocation(inNodeShader, "aVertexPosition"));
		inNodeVarLocs.push(basicCtx.ctx.getAttribLocation(inNodeShader, "aVertexColor"));
		inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "ps_ModelViewMatrix"));
		inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "ps_ProjectionMatrix"));
		inNodeVarLocs.push(basicCtx.ctx.getUniformLocation(inNodeShader, "ps_size"));
		basicCtx.ctx.uniformMatrix4fv(inNodeVarLocs[3], false, basicCtx.perspectiveMatrix);

		leafShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/pointVertShader.c'), basicCtx.getShaderStr('shaders/basicFragShader.c'));
		basicCtx.ctx.useProgram(leafShader);
		leafVarLocs.push(basicCtx.ctx.getAttribLocation(leafShader, "aVertexPosition"));
		leafVarLocs.push(basicCtx.ctx.getAttribLocation(leafShader, "aVertexColor"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "ps_ModelViewMatrix"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "ps_ProjectionMatrix"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "ps_PointSize"));
		leafVarLocs.push(basicCtx.ctx.getUniformLocation(leafShader, "ps_Attenuation"));
		basicCtx.ctx.uniformMatrix4fv(leafVarLocs[3], false, basicCtx.perspectiveMatrix);
		basicCtx.ctx.uniform1f(leafVarLocs[4], 1);
		basicCtx.ctx.uniform3fv(leafVarLocs[5], [1.0, 0.0, 0.0]);

		this.usePerspective = function() {
			basicCtx.ctx.useProgram(inNodeShader);
			basicCtx.ctx.uniformMatrix4fv(inNodeVarLocs[3], false, basicCtx.perspectiveMatrix);
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniformMatrix4fv(leafVarLocs[3], false, basicCtx.perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			basicCtx.ctx.useProgram(inNodeShader);
			basicCtx.ctx.uniformMatrix4fv(inNodeVarLocs[3], false, projectionMatrix);
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniformMatrix4fv(leafVarLocs[3], false, projectionMatrix);
		};

		this.pointSize = function(size) {
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniform1f(leafVarLocs[4], size);
		};

		this.attenuation = function(constant, linear, quadratic) {
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.ctx.uniform3fv(leafVarLocs[5], [constant, linear, quadratic]);
		};

		this.resetCounters = function() {
			count = 0;
			request = 0;
		};

		/**
			@private

			@param {} parser
		*/
		function getParserKey(parser) {
			for(var key in parsers) {
				if(parsers[key] === parser) {
					break;
				}
			}
			return key;
		}

		function getNodefromTree(path) {
			var arr = path.split("/");
			var temp1, temp2;
			if(path == Tree.path) {
				return Tree;
			}
			else {
				temp1 = Tree;
				for(var i = 1; i<arr.length; i++) {
					var index = arr[i];
					if(!temp1.Children[index]) {
						return null;
					}
					temp2 = temp1.Children[index];
					temp1 = temp2;
				}
			}
			return temp1;
		}

		function startCallback(parser) {
			var path = getParserKey(parser);
			var pc = getNodefromTree(path);
			pc.status = STARTED;
		}

		function parseCallback(parser, attributes) {
			var path = getParserKey(parser);
			var pc = getNodefromTree(path);

			if(pc) {
				pc.status = STREAMING;

				pc.numChildren = attributes["ps_numchildren"];
				if(pc.numChildren !== 0) {
					pc.VertexPositionBuffer = basicCtx.ctx.createBuffer();
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, pc.VertexPositionBuffer);
					basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, attributes["ps_Vertex"], basicCtx.ctx.STATIC_DRAW);
				}
				else {
					var VBO = basicCtx.ctx.createBuffer();
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, VBO);
					basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, attributes["ps_Vertex"], basicCtx.ctx.STATIC_DRAW);
					pc.VertexPositionBuffer = {length: attributes["ps_Vertex"].length, VBO: VBO}
				}
				pc.VertexColorBuffer = basicCtx.ctx.createBuffer();
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, pc.VertexColorBuffer);
				basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, attributes["ps_Color"], basicCtx.ctx.STATIC_DRAW);

				pc.BB = attributes["ps_BBox"];       
				var arr = pc.BB;   
				pc.center = getCenter(arr);
				pc.radius = getRadius(arr);
				pc.lastRendered = (new Date()).getTime();
			}
		}

		/**
			@private

			The parser will call this when the file is done being downloaded.

			@param {Object} parser
		*/
		function loadedCallback(parser) {
			var path = getParserKey(parser);
			var pc = getNodefromTree(path);
			if(pc) {
				pc.status = COMPLETE;
			}
		}

		/**
			@private
		*/
		function getCenter(arr) {
			var objCenter = [0, 0, 0];
			objCenter[0] = (arr[0]-arr[3])/2 + arr[3];
			objCenter[1] = (arr[1]-arr[4])/2 + arr[4];
			objCenter[2] = (arr[2]-arr[5])/2 + arr[5];
			return objCenter;
		}
    
		function getRadius(arr) {
			var r = [0, 0, 0];
			r[0] = arr[0]-arr[3];
			r[1] = arr[1]-arr[4];
			r[2] = arr[2]-arr[5];
			var radius;
			radius =  Math.sqrt(r[0]*r[0]+r[1]*r[1]+r[2]*r[2])/2;
			return radius;
		}

		function render(node, size) {
			if(basicCtx) {
				if(node.numChildren !== 0) {
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
				count += 1;
			}
		}

		//Todo -- sphere check
		// compute the distance center to plane
		// 
		// OBB test //oriented boungding box test cross product of the edges
		function isvisible(radius, center) { 
			var modelViewMatrix = basicCtx.peekMatrix();
			var temp = V3.mul4x4(modelViewMatrix, center);
			//for six clipping plane
			//compute the distance between the center and each plane  
			var d = new Array(6);
			d[0] = -temp[2] * s30 - temp[0] * c30;
			d[1] = -temp[2] * s30 + temp[0] * c30;
			d[2] = -temp[2] * s30 + temp[1] * c30;
			d[3] = -temp[2] * s30 - temp[1] * c30;
			d[4] = -znear - temp[2];
			d[5] = zfar + temp[2];

			for(var i=0; i<6; i++) {
				if(d[i] < -radius) {
					return false;
				}
			}
			return true;
		}

		//cubesize: the shortest length of the cube on screen
		function cubesize(radius, center) {
			var modelViewMatrix = basicCtx.peekMatrix();
			var temp = V3.mul4x4(modelViewMatrix, center);
			return (radius * basicCtx.height) / (-temp[2] * t30);
		}

		//Create tree
		this.root = function(parserpath) {
			Tree = load( Tree, parserpath);
			return Tree;
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
		};

		this.recurseTree = function(node, viewpoint) {
			var k=0;
			if(node.status == COMPLETE) {
				var center = node.center;
				var radius = node.radius;   
				if(isvisible(radius, center)) {
					node.lastRendered = (new Date()).getTime();
					var size = cubesize(radius,center);
					if(size < 25 || node.numChildren == 0) {
						//draw a node
						render(node, size); 
					}
					else {
						var allchildrenishere = 1;   //flag
						for(k=0; k < node.numChildren; k++) {
							if(typeof node.Children[k] == "undefined" || node.Children[k].status != COMPLETE) {
								allchildrenishere = 0;
								break;
							}
						}
						if(allchildrenishere) {
							for( k=0; k < node.numChildren; k++) {
								this.recurseTree(node.Children[k], viewpoint);
							}
						}
						else {
							render(node, size);
							if(count<500 && request < 500) {
								//To do
								//request for all the children here, set a flag, only request once
								for( k=0; k < node.numChildren; k++) {
									if(typeof node.Children[k] != "undefined" && node.Children[k].status)
										continue;
									else {
										load(node, node.path + "/" + k);
										request++;
									}
								}
							}
						}
					}
				}
			}
		};

		this.pruneTree = function(node, time) {
			if(node.status == COMPLETE) {
				for(var i = 0; i < node.numChildren; i++) {
					if(typeof node.Children[i] != "undefined") {
						if(time - node.Children[i].lastRendered > 2000) {
							this.pruneBranch(node.Children[i]);
							node.Children[i] = undefined;
						}
						else {
							this.pruneTree(node.Children[i], time);
						}
					}
				}
			}
		};

		this.pruneBranch = function(node) {
			if(node.status == COMPLETE) {
				if(node.numChildren !== 0) {
					basicCtx.ctx.deleteBuffer(node.VertexPositionBuffer);
					for(var i = 0; i < node.numChildren; i++) {
						if(typeof node.Children[i] != "undefined") {
							this.pruneBranch(node.Children[i]);
						}
					}
				}
				else {
					basicCtx.ctx.deleteBuffer(node.VertexPositionBuffer.VBO);
				}
				basicCtx.ctx.deleteBuffer(node.VertexColorBuffer);
			}
		};

		/**
			Begins downloading and parsing a point cloud object.

			@param {String} path Path to the resource.

			@returns {} A point cloud object.
		*/
		function load( parentnode, path) { 
			var parser = new JSONParser({ start: startCallback,	parse: parseCallback, end: loadedCallback});
			var node = {
				VertexPositionBuffer: {},
				VertexColorBuffer: {},
				BB: [],
				status: -1,
				getStatus: function() {
					return this.status;
				},        
				center: [0, 0, 0],    
				getCenter: function() {
					return this.center;
				},
				radius: 1,      //compute radius by function getRadius(BBox);
				numChildren: 0,
				Children: {},
				path: path,
				lastRendered: 0
			};

			// map the new parser and node to the parsers and Tree.
			parsers[path] = parser;
			var n = path.split("/");
			var index = n[n.length - 1];
			index = index.toString();
			if(parentnode == null) {
				Tree = node;
			}
			else {
				parentnode.Children[index] = node;
			}    
			parser.load(path);
			return node;
		}
	}// constructor

	return PCTree;
} ());
