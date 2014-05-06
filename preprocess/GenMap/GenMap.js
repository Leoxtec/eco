var GenMap = (function() {
	function GenMap(ctx, can, t) {
		var gl = ctx;
		var canvas = can;

		//junkbuffer trick used to avoid having to always enable and disable vertex attribute arrays
		//for every single draw command
		//need to enable enough for the maximum that any shader would need
		var junkBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, junkBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.enableVertexAttribArray(1);
		gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
		gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);

		//since this app is not interactive, requests are made synchronously using a queue
		var requestQueue = [];

		var Tree = null;

		var table = t;

		//request the root node to get the global bounding box
		xmlhttpForBB = new XMLHttpRequest();
		xmlhttpForBB.open("GET", "action.php?a=getnode&path=r&table=" + table, false);
		xmlhttpForBB.send();
		BB = JSON.parse(xmlhttpForBB.responseText).BB;

		//use the BB to determine the ortho projection
		//and makeit large enough so there is some empty space around the edges
		span = [BB[3] - BB[0], BB[4] - BB[1], BB[5] - BB[2]];
		center = [span[0] * 0.5 + BB[0], span[1] * 0.5 + BB[1], span[2] * 0.5 + BB[2]];
		if(span[0] > span[1]) {
			radius = span[0] * 0.5;
		}
		else {
			radius = span[1] * 0.5;
		}
		orthoSize = radius + radius * 0.25;
		var orthoMVP = mat4.mul([], mat4.ortho([], -orthoSize, orthoSize, orthoSize, -orthoSize, 1, 1 + span[2]), 
									mat4.lookAt([], vec3.add([], center, [0, 0, 1 + span[2] * 0.5]), center, [0, 1, 0]));

		//delete variables no longer needed
		delete BB;
		delete xmlhttpForBB;
		delete span;
		delete center;
		delete radius;
		delete orthoSize;

		//function to load shader file
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

		//function to create a shader object
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

		//create the basic shader for the point cloud and cache the attribute and uniform locations
		var leafVarLocs = [];
		var leafShader = this.createProgramObject(this.getShaderStr('point.vert'), this.getShaderStr('basic.frag'));
		gl.useProgram(leafShader);
		leafVarLocs.push(gl.getAttribLocation(leafShader, "aVertexPosition"));
		leafVarLocs.push(gl.getAttribLocation(leafShader, "aVertexColor"));
		leafVarLocs.push(gl.getUniformLocation(leafShader, "uMVP"));

		//since this app is not interactive, this function runs only once and only after all the 
		//nodes are loaded
		this.renderTree = function() {
			gl.useProgram(leafShader);
			gl.uniformMatrix4fv(leafVarLocs[2], false, orthoMVP);

			this.recurseTree(Tree);

			sendStringRepresentation("map");
		};

		//draw a node and recurse through the children
		this.recurseTree = function(node) {
			if(node.VertexPositionBuffer.length) {
				gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexPositionBuffer.VBO);
				gl.vertexAttribPointer(leafVarLocs[0], 3, gl.FLOAT, false, 0, 0);
				gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexColorBuffer);
				gl.vertexAttribPointer(leafVarLocs[1], 3, gl.FLOAT, false, 0, 0);
				gl.drawArrays(gl.POINTS, 0, node.VertexPositionBuffer.length / 3);

				if(!node.Isleaf) {
					for(var k = 0; k < 8; k++) {
						if(node.Children[k] != null) {
							this.recurseTree(node.Children[k]);
						}
					}
				}
			}
		};

		//create default node object and push into the queue
		function load(parentnode, index) {
			var node = {
				VertexPositionBuffer: {},
				VertexColorBuffer: {},
				Isleaf: 0,
				Children: [null, null, null, null, null, null, null, null],
				path: null
			};

			if(parentnode == null) {
				node.path = index;
				Tree = node;
			}
			else {
				node.path = parentnode.path + index;
				parentnode.Children[index] = node;
			}
			requestQueue.push({path: node.path, node: node});
		}

		//start loading nodes beginning with the root
		this.root = function(path) {
			load(null, path);
		}

		//synchronously build the oct tree
		this.buildTree = function() {
			while(requestQueue.length > 0) {
				var currentRequest = requestQueue.splice(0, 1);
				var request = new XMLHttpRequest();
				request.open("GET", "action.php?a=getnode&path=" + currentRequest[0].path + "&table=" + table, false);
				request.send();

				//if empty response then the node doesn't exist (i.e., it's parent was a leaf node)
				if(request.responseText != "") {
					var obj = JSON.parse(request.responseText);
					var node = currentRequest[0].node;

					node.Isleaf = obj.Isleaf;

					//extract data from response, build GPU buffers and load children into the request queue
					var verts = new Float32Array(obj.Point.length / 4);
					var cols = new Float32Array(verts.length);

					for(var i = 0, j = 0; i < obj.Point.length; i += 12, j += 3) {
						verts[j] 	 = obj.Point[i];
						verts[j + 1] = obj.Point[i + 1];
						verts[j + 2] = obj.Point[i + 2];
						cols[j] 	= obj.Point[i + 3] / 255;
						cols[j + 1] = obj.Point[i + 4] / 255;
						cols[j + 2] = obj.Point[i + 5] / 255;
					}

					var VBO = gl.createBuffer();
					gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
					gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
					node.VertexPositionBuffer = {length: verts.length, VBO: VBO};

					node.VertexColorBuffer = gl.createBuffer();
					gl.bindBuffer(gl.ARRAY_BUFFER, node.VertexColorBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, cols, gl.STATIC_DRAW);

					if(!node.Isleaf) {
						for(var i = 0; i < 8; i++) {
							load(node, i);
						}
					}
				}
			}
		}

		//code adapted from http://stackoverflow.com/questions/9771986/fabric-js-canvas-todataurl-sent-to-php-by-ajax
		//send the generated png to the server
		function sendStringRepresentation(path) {
			gl.finish();
			var strDataURI = canvas.toDataURL();
			strDataURI = strDataURI.substr(22, strDataURI.length);

			$.post("img.php",
			{ 
				str: strDataURI,
				file: table + "/" + path
			},
			function(data) {
				if(data == "OK") {
					texUploaded = true;
					console.log("Image created.");
				}
				else{
					console.log("Image not created.");
				}
			});
		}
	}

	return GenMap;
} ());