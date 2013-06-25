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


		// file status of point clouds
		const FILE_NOT_FOUND = -1;
		const STARTED = 1;
		const STREAMING = 2;
		const COMPLETE = 3;

		var inNodeShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/inNodeVertShader.txt'), basicCtx.getShaderStr('shaders/inNodeFragShader.txt'));
		basicCtx.ctx.useProgram(inNodeShader);
		basicCtx.uniformMatrix(inNodeShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);
		var projectionMatrixInverse = [];
		M4x4.inverseOrthonormal(basicCtx.perspectiveMatrix, projectionMatrixInverse);
		basicCtx.uniformMatrix(inNodeShader, "ps_ProjectionMatrixInverse", false, projectionMatrixInverse);
		basicCtx.uniformf(inNodeShader, "ps_DepthRange", [zfar-znear, znear, zfar]);

		var leafShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/basicVertShader.txt'), basicCtx.getShaderStr('shaders/basicFragShader.txt'));
		basicCtx.ctx.useProgram(leafShader);
		basicCtx.uniformMatrix(leafShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);
		basicCtx.uniformf(leafShader, "ps_PointSize", 1);
		basicCtx.uniformf(leafShader, "ps_Attenuation", [1.0, 0.0, 0.0]);

		this.usePerspective = function() {
			basicCtx.ctx.useProgram(inNodeShader);
			basicCtx.uniformMatrix(inNodeShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);
			var projectionMatrixInverse = [];
			M4x4.inverseOrthonormal(basicCtx.perspectiveMatrix, projectionMatrixInverse);
			basicCtx.uniformMatrix(inNodeShader, "ps_ProjectionMatrixInverse", false, projectionMatrixInverse);
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.uniformMatrix(leafShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			basicCtx.ctx.useProgram(inNodeShader);
			basicCtx.uniformMatrix(inNodeShader, "ps_ProjectionMatrix", false, projectionMatrix);
			var projectionMatrixInverse = [];
			M4x4.inverseOrthonormal(projectionMatrix, projectionMatrixInverse);
			basicCtx.uniformMatrix(inNodeShader, "ps_ProjectionMatrixInverse", false, projectionMatrixInverse);
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.uniformMatrix(leafShader, "ps_ProjectionMatrix", false, projectionMatrix);
		};

		this.pointSize = function(size) {
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.uniformf(leafShader, "ps_PointSize", size);
		};

		this.attenuation = function(constant, linear, quadratic) {
			basicCtx.ctx.useProgram(leafShader);
			basicCtx.uniformf(leafShader, "ps_Attenuation", [constant, linear, quadratic]);
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

			pc.status = STREAMING;

			pc.VertexPositionBuffer = basicCtx.createBufferObject(attributes["ps_Vertex"]);
			pc.VertexColorBuffer = basicCtx.createBufferObject(attributes["ps_Color"]);
			pc.BB = attributes["ps_BBox"];       
			pc.numChildren = attributes["ps_numchildren"];       
			var arr = pc.BB;   
			pc.center = getCenter(arr);
			pc.radius = getRadius(arr);
		}

		/**
			@private

			The parser will call this when the file is done being downloaded.

			@param {Object} parser
		*/
		function loadedCallback(parser) {
			var path = getParserKey(parser);
			var pc = getNodefromTree(path);
			pc.status = COMPLETE;
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

		function render(node) {
			if(basicCtx) {
				if(node.numChildren !== 0) {
					basicCtx.ctx.useProgram(inNodeShader);
					count += 1;
					var topMatrix = basicCtx.peekMatrix();

					normalMatrix = M4x4.inverseOrthonormal(topMatrix);

					basicCtx.uniformMatrix(inNodeShader, "ps_ModelViewMatrix", false, topMatrix);
					var modelViewMatrixInverse = [];
					M4x4.inverseOrthonormal(topMatrix, modelViewMatrixInverse);
					basicCtx.uniformMatrix(inNodeShader, "ps_ModelViewMatrixInverse", false, modelViewMatrixInverse);

					var modelViewProjectionMatrix = [];
					M4x4.mul(basicCtx.perspectiveMatrix, topMatrix, modelViewProjectionMatrix);
					basicCtx.uniformMatrix(inNodeShader, "ps_ModelViewProjectionMatrix", false, modelViewProjectionMatrix);

					var modelViewProjectionMatrixTran = M4x4.transpose(modelViewProjectionMatrix);
					basicCtx.uniformMatrix(inNodeShader, "ps_ModelViewProjectionMatrix_transpose", false, modelViewProjectionMatrixTran);

					basicCtx.uniformMatrix(inNodeShader, "ps_NormalMatrix", false, normalMatrix);
					basicCtx.uniformf(inNodeShader, "aRadius", node.radius);

					basicCtx.vertexAttribPointer(inNodeShader, "aVertexPosition", 3, node.VertexPositionBuffer.VBO);
					basicCtx.vertexAttribPointer(inNodeShader, "aVertexColor", 3, node.VertexColorBuffer.VBO);  

					basicCtx.ctx.drawArrays(basicCtx.ctx.POINTS, 0, node.VertexPositionBuffer.length/3);

					basicCtx.disableVertexAttribPointer(inNodeShader, "aVertexPosition");
					basicCtx.disableVertexAttribPointer(inNodeShader, "aVertexColor");
				}
				else {    //ISLEAF   
					basicCtx.ctx.useProgram(leafShader);
					count += 1;
					var topMatrix = basicCtx.peekMatrix();
					basicCtx.normalMatrix = M4x4.inverseOrthonormal(topMatrix);
					basicCtx.uniformMatrix(leafShader, "ps_ModelViewMatrix", false, topMatrix);

					basicCtx.vertexAttribPointer(leafShader, "aVertexPosition", 3, node.VertexPositionBuffer.VBO);
					basicCtx.vertexAttribPointer(leafShader, "aVertexColor", 3, node.VertexColorBuffer.VBO); 

					basicCtx.ctx.drawArrays(basicCtx.ctx.POINTS, 0, node.VertexPositionBuffer.length/3);

					basicCtx.disableVertexAttribPointer(leafShader, "aVertexPosition");
					basicCtx.disableVertexAttribPointer(leafShader, "aVertexColor");
				}
			}
		}

		//Todo -- sphere check
		// compute the distance center to plane
		// 
		// OBB test //oriented boungding box test cross product of the edges
		function isvisible(radius, center, viewpoint) { 
			var pos = [center[0],center[1],center[2],1.0];
			var modelViewMatrix = basicCtx.peekMatrix();
			var temp = V3.mul4x4(modelViewMatrix, pos);
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
		function cubesize(radius, center, viewpoint) {
			// translate into viewport coordinate
			var pos = [center[0],center[1],center[2],1.0];
			var modelViewMatrix = basicCtx.peekMatrix();
			var temp = V3.mul4x4(modelViewMatrix, pos);

			var x = temp[0];
			var y = temp[1];
			var z = temp[2];
			var distance = Math.sqrt(x*x + y*y + z*z);

			var h = 540;
			var objsize = radius/distance;   //resolution canvas.style.hight, projective degree.
			var pixelsize = t30*(2/h);   
			var size = objsize/pixelsize;
			return size;
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
		this.recurseTree = function(node, viewpoint) {
			var k=0;
			if(node.status == COMPLETE) {
				var center = node.center;
				var radius = node.radius;   
				if(isvisible(radius, center, viewpoint)) {
					if(cubesize(radius,center,viewpoint) < 25 || node.numChildren == 0) {
						//draw a node
						render(node); 
					}
					else {
						var allchildrenishere = 1;   //flag
						for(k=0; k < node.numChildren; k++) {
							if(typeof node.Children[k] == "undefined" || node.Children[k].status != 3) {
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
							render(node);
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
			path: path
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
