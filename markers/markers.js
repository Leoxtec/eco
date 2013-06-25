var Markers = (function() {

	/**
		@private
	*/
	function Markers(bctx) {
		var basicCtx = bctx;

		var markerTexCoords;
		var markerBegin;
		var markers = [];
		var cylinders = [];
		var cylinderNormals;

		var cylCapShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/cylCapVertShader.txt'), basicCtx.getShaderStr('shaders/cylCapFragShader.txt'));
		basicCtx.ctx.useProgram(cylCapShader);
		basicCtx.uniformMatrix(cylCapShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);

		var cylShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/cylVertShader.txt'), basicCtx.getShaderStr('shaders/cylFragShader.txt'));
		basicCtx.ctx.useProgram(cylShader);
		basicCtx.uniformMatrix(cylShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);

		var pickCapShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/pickCapVertShader.txt'), basicCtx.getShaderStr('shaders/pickCapFragShader.txt'));
		basicCtx.ctx.useProgram(pickCapShader);
		basicCtx.uniformMatrix(pickCapShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);

		var pickShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/pickVertShader.txt'), basicCtx.getShaderStr('shaders/basicFragShader.txt'));
		basicCtx.ctx.useProgram(pickShader);
		basicCtx.uniformMatrix(pickShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);

		this.usePerspective = function() {
			basicCtx.ctx.useProgram(cylCapShader);
			basicCtx.uniformMatrix(cylCapShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);
			basicCtx.ctx.useProgram(cylShader);
			basicCtx.uniformMatrix(cylShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);
			basicCtx.ctx.useProgram(pickCapShader);
			basicCtx.uniformMatrix(pickCapShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);
			basicCtx.ctx.useProgram(pickShader);
			basicCtx.uniformMatrix(pickShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			basicCtx.ctx.useProgram(cylCapShader);
			basicCtx.uniformMatrix(cylCapShader, "ps_ProjectionMatrix", false, projectionMatrix);
			basicCtx.ctx.useProgram(cylShader);
			basicCtx.uniformMatrix(cylShader, "ps_ProjectionMatrix", false, projectionMatrix);
			basicCtx.ctx.useProgram(pickCapShader);
			basicCtx.uniformMatrix(pickCapShader, "ps_ProjectionMatrix", false, projectionMatrix);
			basicCtx.ctx.useProgram(pickShader);
			basicCtx.uniformMatrix(pickShader, "ps_ProjectionMatrix", false, projectionMatrix);
		};

		this.renderNewMarker = function(center, edgePoint) {
			if(basicCtx.ctx) {
				center[2] = edgePoint[2] = 35.0;
				basicCtx.ctx.enable(basicCtx.ctx.BLEND);
				basicCtx.ctx.blendFunc(basicCtx.ctx.SRC_ALPHA, basicCtx.ctx.ONE);
				basicCtx.ctx.useProgram(cylCapShader);
				topMatrix = basicCtx.peekMatrix();
				basicCtx.uniformMatrix(cylCapShader, "ps_ModelViewMatrix", false, topMatrix);
				var dist = V3.length(V3.sub(center, edgePoint));			
				var vertexTemp = new Float32Array([center[0] + dist, center[1] - dist, center[2],
												   center[0] + dist, center[1] + dist, center[2],
												   center[0] - dist, center[1] - dist, center[2],
												   center[0] - dist, center[1] + dist, center[2]]);
				var vertexVBO = basicCtx.ctx.createBuffer();
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, vertexVBO);
				basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, vertexTemp, basicCtx.ctx.DYNAMIC_DRAW);
				var varLocation = basicCtx.ctx.getAttribLocation(cylCapShader, "ps_Vertex");
				if (varLocation !== -1) {
					basicCtx.ctx.vertexAttribPointer(varLocation, 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.enableVertexAttribArray(varLocation);
				}
				basicCtx.vertexAttribPointer(cylCapShader, "vTexCoord", 2, markerTexCoords.VBO);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);			
				basicCtx.disableVertexAttribPointer(cylCapShader, "ps_Vertex");
				basicCtx.disableVertexAttribPointer(cylCapShader, "vTexCoord");
				basicCtx.ctx.deleteBuffer(vertexVBO);
				basicCtx.ctx.disable(basicCtx.ctx.BLEND);
			}
		};
		
		this.recordNewMarker = function(center, edgePoint) {
			center[2] = edgePoint[2] = 35.0;
			var dist = V3.length(V3.sub(center, edgePoint));										   
			var vertexTemp = new Float32Array([center[0] + dist, center[1] - dist, center[2],
											   center[0] + dist, center[1] + dist, center[2],
											   center[0] - dist, center[1] - dist, center[2],
											   center[0] - dist, center[1] + dist, center[2]]);
			var vertexCylTemp = new Float32Array(198);
			for(var j = 0; j < 198; j += 6) {
				var rads = (j * Math.PI) / 96;
				vertexCylTemp[j] = vertexCylTemp[j + 3] = center[0] + dist * Math.cos(rads);
				vertexCylTemp[j + 1] = vertexCylTemp[j + 4] = center[1] + dist * Math.sin(rads);
				vertexCylTemp[j + 2] = center[2];
				vertexCylTemp[j + 5] = -center[2] * 0.5;
			}
			
			if(basicCtx.ctx){
				var VBO = basicCtx.ctx.createBuffer();
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, VBO);
				basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, vertexTemp, basicCtx.ctx.STATIC_DRAW);
				
				var obj = {
				  id : 0,
				  center: center,
				  radius: dist,
				  VBO: VBO,
				  height: 0,
				  species: 'tree type',
				  descr: 'short description'
				}
				markers.push(obj);
				
				var VBO2 = basicCtx.ctx.createBuffer();
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, VBO2);
				basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, vertexCylTemp, basicCtx.ctx.STATIC_DRAW);
				var obj2 = {
					VBO : VBO2
				}
				cylinders.push(obj2);
			}
		};
		
		this.setLatestMarkerValues = function(spec, descr) {
			var mark = markers[markers.length - 1];
			mark.species = spec;
			mark.descr = descr;
			
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("GET", "/BetterPointCloud/action.php?a=add&radius="+mark.radius+"&centerX="+mark.center[0]+"&centerY="+mark.center[1]+"&centerZ="+mark.center[2]+"&species="+mark.species+"&descr="+mark.descr, false);
			xmlhttp.send();
			var response = JSON.parse(xmlhttp.responseText);
			mark.id = response.id;
			mark.height = response.height;
		};
		
		this.removeMarker = function(clickPoint) {
			clickPoint[2] = 0;
			var closestDist = Number.POSITIVE_INFINITY;
			var closestIndex = -1;
			var distSqr;
			var tempVec;
			for(var i = 0; i < markers.length; i++) {
				tempVec = V3.clone(markers[i].center);
				tempVec[2] = 0;
				distSqr = V3.lengthSquared(V3.sub(tempVec, clickPoint));
				if((distSqr < markers[i].radius * markers[i].radius) && distSqr < closestDist) {
					closestDist = distSqr;
					closestIndex = i;
				}
			}
			if(closestIndex > -1) {
				var xmlhttp = new XMLHttpRequest();
				xmlhttp.open("GET", "/BetterPointCloud/action.php?a=delete&id="+markers[closestIndex].id, false);
				xmlhttp.send();
				markers.splice(closestIndex, 1);
				cylinders.splice(closestIndex, 1);
			}
		};
		
		this.displayMarkerInfoOrtho = function(point) {
			point[2] = 0;
			var closestDist = Number.POSITIVE_INFINITY;
			var closestIndex = -1;
			var distSqr;
			var tempVec;
			for(var i = 0; i < markers.length; i++) {
				tempVec = V3.clone(markers[i].center);
				tempVec[2] = 0;
				distSqr = V3.lengthSquared(V3.sub(tempVec, point));
				if((distSqr < markers[i].radius * markers[i].radius) && distSqr < closestDist) {
					closestDist = distSqr;
					closestIndex = i;
				}
			}
			if(closestIndex > -1) {
				$("#markRadius").val(markers[closestIndex].radius);
				$("#markHeight").val(markers[closestIndex].height);
				$("#markSpecies").val(markers[closestIndex].species);
				$("#markDescr").val(markers[closestIndex].descr);
			}
			else {
				$("#markRadius").val('');
				$("#markHeight").val('');
				$("#markSpecies").val('');
				$("#markDescr").val('');
			}
		};

		this.displayMarkerInfo = function(x, y) {	
			if(basicCtx.ctx && markers) {
				var pickingTransform = M4x4.mul(M4x4.makeTranslate3(2 * x - width, 2 * y - height, 0), M4x4.makeScale3(-width, -height, 1));
				basicCtx.ctx.viewport(0, 0, 1, 1);
				var color = new Float32Array([0.0, 0.0, 0.0, 0.0]);
				basicCtx.ctx.enable(basicCtx.ctx.CULL_FACE);
				for(var i = 0; i < markers.length; i++) {
					color[2] = (i + 1) / 255.0;
					basicCtx.ctx.useProgram(pickShader);
					topMatrix = basicCtx.peekMatrix();
					basicCtx.uniformf(pickShader, "ps_Color", color);
					basicCtx.uniformMatrix(pickShader, "ps_PickingMatrix", false, pickingTransform);
					basicCtx.uniformMatrix(pickShader, "ps_ModelViewMatrix", false, topMatrix);
					basicCtx.vertexAttribPointer(pickShader, "ps_Vertex", 3, cylinders[i].VBO);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 66);
					basicCtx.disableVertexAttribPointer(pickShader, "ps_Vertex");
					basicCtx.ctx.useProgram(pickCapShader);
					basicCtx.uniformf(pickCapShader, "ps_Color", color);
					basicCtx.pushMatrix();
					basicCtx.translate(markers[i].center[0], markers[i].center[1], markers[i].center[2] - 52.5);
					basicCtx.rotateX(Math.PI);
					basicCtx.translate(-markers[i].center[0], -markers[i].center[1], -markers[i].center[2]);
					topMatrix = basicCtx.peekMatrix();
					basicCtx.uniformMatrix(pickCapShader, "ps_PickingMatrix", false, pickingTransform);
					basicCtx.uniformMatrix(pickCapShader, "ps_ModelViewMatrix", false, topMatrix);
					basicCtx.vertexAttribPointer(pickCapShader, "vTexCoord", 2, markerTexCoords.VBO);
					basicCtx.vertexAttribPointer(pickCapShader, "ps_Vertex", 3, markers[i].VBO);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
					basicCtx.disableVertexAttribPointer(pickCapShader, "ps_Vertex");
					basicCtx.popMatrix();
					topMatrix = basicCtx.peekMatrix();
					basicCtx.uniformMatrix(pickCapShader, "ps_ModelViewMatrix", false, topMatrix);
					basicCtx.vertexAttribPointer(pickCapShader, "ps_Vertex", 3, markers[i].VBO);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
					basicCtx.disableVertexAttribPointer(pickCapShader, "ps_Vertex");					
					basicCtx.disableVertexAttribPointer(pickCapShader, "vTexCoord");
				}

				basicCtx.ctx.disable(basicCtx.ctx.CULL_FACE);

				var arr = new Uint8Array(4);
				basicCtx.ctx.readPixels(0, 0, 1, 1, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, arr);
				var closestIndex = arr[2] - 1;
				if(closestIndex > -1) {
					$("#markRadius").val(markers[closestIndex].radius);
					$("#markHeight").val(markers[closestIndex].height);
					$("#markSpecies").val(markers[closestIndex].species);
					$("#markDescr").val(markers[closestIndex].descr);
				}
				else {
					$("#markRadius").val('');
					$("#markHeight").val('');
					$("#markSpecies").val('');
					$("#markDescr").val('');
				}
				basicCtx.ctx.viewport(0, 0, basicCtx.canvas.width, basicCtx.canvas.height);
			}
		};

		this.renderOrthoMarkers = function() {
			if(basicCtx.ctx && markers) {		
				basicCtx.ctx.enable(basicCtx.ctx.CULL_FACE);
				basicCtx.ctx.depthMask(false);
				basicCtx.ctx.enable(basicCtx.ctx.BLEND);
				basicCtx.ctx.blendFunc(basicCtx.ctx.SRC_ALPHA, basicCtx.ctx.ONE);
				
				for(var i = 0; i < markers.length; i++) {
					basicCtx.ctx.useProgram(cylShader);
					topMatrix = basicCtx.peekMatrix();
					basicCtx.uniformMatrix(cylShader, "ps_ModelViewMatrix", false, topMatrix);
					normalMatrix = M4x4.inverseOrthonormal(topMatrix);
					basicCtx.uniformMatrix(cylShader, "ps_NormalMatrix", false, M4x4.topLeft3x3(M4x4.transpose(normalMatrix)));
					basicCtx.vertexAttribPointer(cylShader, "ps_Normal", 3, cylinderNormals.VBO);
					basicCtx.vertexAttribPointer(cylShader, "ps_Vertex", 3, cylinders[i].VBO);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 66);
					basicCtx.disableVertexAttribPointer(cylShader, "ps_Vertex");
					basicCtx.disableVertexAttribPointer(cylShader, "ps_Normal");
					basicCtx.ctx.useProgram(cylCapShader);
					basicCtx.pushMatrix();
					basicCtx.translate(markers[i].center[0], markers[i].center[1], markers[i].center[2] - 52.5);
					basicCtx.rotateX(Math.PI);
					basicCtx.translate(-markers[i].center[0], -markers[i].center[1], -markers[i].center[2]);
					topMatrix = basicCtx.peekMatrix();
					basicCtx.uniformMatrix(cylCapShader, "ps_ModelViewMatrix", false, topMatrix);
					basicCtx.vertexAttribPointer(cylCapShader, "vTexCoord", 2, markerTexCoords.VBO);
					basicCtx.vertexAttribPointer(cylCapShader, "ps_Vertex", 3, markers[i].VBO);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
					basicCtx.disableVertexAttribPointer(cylCapShader, "ps_Vertex");
					basicCtx.popMatrix();
					topMatrix = basicCtx.peekMatrix();
					basicCtx.uniformMatrix(cylCapShader, "ps_ModelViewMatrix", false, topMatrix);
					basicCtx.vertexAttribPointer(cylCapShader, "ps_Vertex", 3, markers[i].VBO);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
					basicCtx.disableVertexAttribPointer(cylCapShader, "ps_Vertex");					
					basicCtx.disableVertexAttribPointer(cylCapShader, "vTexCoord");
				}
				
				basicCtx.ctx.disable(basicCtx.ctx.CULL_FACE);
				basicCtx.ctx.depthMask(true);
				basicCtx.ctx.disable(basicCtx.ctx.BLEND);
			}
		};

		this.initializeMarkers = function() {
			var texCoords = new Float32Array([1.0, 0.0,
											  1.0, 1.0,
											  0.0, 0.0,
											  0.0, 1.0]);
			markerTexCoords = basicCtx.createBufferObject(texCoords);
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("GET", "/BetterPointCloud/action.php?a=start", false);
			xmlhttp.send();
			var init = xmlhttp.responseText;
			var temp = JSON.parse(init);
			if(temp) {
				temp = temp.markers;
				for(var i = 0; i < temp.length; i++) {
					var center = V3.$(temp[i].centerX, temp[i].centerY, temp[i].centerZ);
					var dist = temp[i].radius;
					var vertexTemp = new Float32Array([center[0] + dist, center[1] - dist, center[2],
													   center[0] + dist, center[1] + dist, center[2],
													   center[0] - dist, center[1] - dist, center[2],
													   center[0] - dist, center[1] + dist, center[2]]);
					var vertexCylTemp = new Float32Array(198);
					for(var j = 0; j < 198; j += 6) {
						var rads = (j * Math.PI) / 96;
						vertexCylTemp[j] 	 = vertexCylTemp[j + 3] = center[0] + dist * Math.cos(rads);
						vertexCylTemp[j + 1] = vertexCylTemp[j + 4] = center[1] + dist * Math.sin(rads);
						vertexCylTemp[j + 2] = center[2];
						vertexCylTemp[j + 5] = -center[2] * 0.5;
					}
					if(basicCtx.ctx){
						var VBO = basicCtx.ctx.createBuffer();
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, VBO);
						basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, vertexTemp, basicCtx.ctx.STATIC_DRAW);
						var obj = {
						  id : temp[i].id,
						  center: center,
						  radius: dist,
						  VBO: VBO,
						  height: temp[i].height,
						  species: temp[i].species,
						  descr: temp[i].descr
						}
						markers.push(obj);
						
						var VBO2 = basicCtx.ctx.createBuffer();
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, VBO2);
						basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, vertexCylTemp, basicCtx.ctx.STATIC_DRAW);
						var obj2 = {
							VBO : VBO2
						}
						cylinders.push(obj2);
					}
				}
			}
			var tempNorms = new Float32Array(198);
			for(var k = 0; k < 198; k += 6) {
				var rads = (k * Math.PI) / 96;
				tempNorms[k] 	 = tempNorms[k + 3] = Math.cos(rads);
				tempNorms[k + 1] = tempNorms[k + 4] = Math.sin(rads);
				tempNorms[k + 2] = tempNorms[k + 5] = 0;
			}
			cylinderNormals = basicCtx.createBufferObject(tempNorms);
		};

	}// constructor

	return Markers;
} ());