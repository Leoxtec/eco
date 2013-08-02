var Markers = (function() {

	function Markers(bctx) {
		var basicCtx = bctx;

		var markerTexCoords;
		var markerBegin;
		var markers = [];
		var cylinderNormals;
		var pickingFBO;

		var cylCapShader;
		var cylShader;
		var pickCapShader;
		var pickShader;

		var cylCapVarLocs = [];
		var cylVarLocs = [];
		var pickCapVarLocs = [];
		var pickVarLocs = [];

		cylCapShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/cylCapVertShader.c'), basicCtx.getShaderStr('shaders/cylCapFragShader.c'));
		basicCtx.ctx.useProgram(cylCapShader);
		cylCapVarLocs.push(basicCtx.ctx.getAttribLocation(cylCapShader, "aVertexPosition"));
		cylCapVarLocs.push(basicCtx.ctx.getAttribLocation(cylCapShader, "aTexCoord"));
		cylCapVarLocs.push(basicCtx.ctx.getUniformLocation(cylCapShader, "uModelViewMatrix"));
		cylCapVarLocs.push(basicCtx.ctx.getUniformLocation(cylCapShader, "uProjectionMatrix"));
		basicCtx.ctx.uniformMatrix4fv(cylCapVarLocs[3], false, basicCtx.perspectiveMatrix);

		cylShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/cylVertShader.c'), basicCtx.getShaderStr('shaders/cylFragShader.c'));
		basicCtx.ctx.useProgram(cylShader);
		cylVarLocs.push(basicCtx.ctx.getAttribLocation(cylShader, "aVertexPosition"));
		cylVarLocs.push(basicCtx.ctx.getAttribLocation(cylShader, "aNormal"));
		cylVarLocs.push(basicCtx.ctx.getUniformLocation(cylShader, "uModelViewMatrix"));
		cylVarLocs.push(basicCtx.ctx.getUniformLocation(cylShader, "uProjectionMatrix"));
		basicCtx.ctx.uniformMatrix4fv(cylVarLocs[3], false, basicCtx.perspectiveMatrix);

		pickCapShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/pickCapVertShader.c'), basicCtx.getShaderStr('shaders/pickCapFragShader.c'));
		basicCtx.ctx.useProgram(pickCapShader);
		pickCapVarLocs.push(basicCtx.ctx.getAttribLocation(pickCapShader, "aVertexPosition"));
		pickCapVarLocs.push(basicCtx.ctx.getAttribLocation(pickCapShader, "aTexCoord"));
		pickCapVarLocs.push(basicCtx.ctx.getUniformLocation(pickCapShader, "uModelViewMatrix"));
		pickCapVarLocs.push(basicCtx.ctx.getUniformLocation(pickCapShader, "uProjectionMatrix"));
		pickCapVarLocs.push(basicCtx.ctx.getUniformLocation(pickCapShader, "uPickingMatrix"));
		pickCapVarLocs.push(basicCtx.ctx.getUniformLocation(pickCapShader, "uColor"));
		basicCtx.ctx.uniformMatrix4fv(pickCapVarLocs[3], false, basicCtx.perspectiveMatrix);

		pickShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/pickVertShader.c'), basicCtx.getShaderStr('shaders/basicFragShader.c'));
		basicCtx.ctx.useProgram(pickShader);
		pickVarLocs.push(basicCtx.ctx.getAttribLocation(pickShader, "aVertexPosition"));
		pickVarLocs.push(basicCtx.ctx.getUniformLocation(pickShader, "uModelViewMatrix"));
		pickVarLocs.push(basicCtx.ctx.getUniformLocation(pickShader, "uProjectionMatrix"));
		pickVarLocs.push(basicCtx.ctx.getUniformLocation(pickShader, "uPickingMatrix"));
		pickVarLocs.push(basicCtx.ctx.getUniformLocation(pickShader, "uColor"));
		basicCtx.ctx.uniformMatrix4fv(pickVarLocs[2], false, basicCtx.perspectiveMatrix);

		markerTexCoords = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markerTexCoords);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([1.0, 0.0,
																			 1.0, 1.0,
																			 0.0, 0.0,
																			 0.0, 1.0]), basicCtx.ctx.STATIC_DRAW);
		xmlhttp = new XMLHttpRequest();
		xmlhttp.onload = function() {
			if(this.readyState == 4 && this.status == 200) {
				var temp = JSON.parse(xmlhttp.responseText);
				temp = temp.markers;
				for(i = 0; i < temp.length; i++) {
					obj = {
						id : temp[i].id,
						center: V3.$(temp[i].centerX, temp[i].centerY, temp[i].centerZ),
						radius: temp[i].radius,
						height: temp[i].height,
						species: temp[i].species,
						descr: temp[i].descr
					}
					markers.push(obj);
				}
				delete obj;
				delete xmlhttp;
			}
		}
		xmlhttp.open("GET", "action.php?a=start", true);
		xmlhttp.send();

		var topCapVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, topCapVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([1.0, -1.0, 35.0,
																			 1.0, 1.0, 35.0,
																			 -1.0, -1.0, 35.0,
																			 -1.0, 1.0, 35.0]), basicCtx.ctx.STATIC_DRAW);
		var bottomCapVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, bottomCapVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([1.0, 1.0, -17.5,
																			 1.0, -1.0, -17.5,
																			 -1.0, 1.0, -17.5,
																			 -1.0, -1.0, -17.5]), basicCtx.ctx.STATIC_DRAW);
		vertexCylTemp = new Float32Array(126);
		for(i = 0; i < 126; i += 6) {
			rads = (i * Math.PI) / 60;
			vertexCylTemp[i] 	 = vertexCylTemp[i + 3] = Math.cos(rads);
			vertexCylTemp[i + 1] = vertexCylTemp[i + 4] = Math.sin(rads);
			vertexCylTemp[i + 2] = 35.0;
			vertexCylTemp[i + 5] = -17.5;
		}
		var cylVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, cylVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, vertexCylTemp, basicCtx.ctx.STATIC_DRAW);
		tempNorms = new Float32Array(126);
		for(i = 0; i < 126; i += 6) {
			rads = (i * Math.PI) / 60;
			tempNorms[i] 	 = tempNorms[i + 3] = Math.cos(rads);
			tempNorms[i + 1] = tempNorms[i + 4] = Math.sin(rads);
			tempNorms[i + 2] = tempNorms[i + 5] = 0;
		}
		cylinderNormals = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, cylinderNormals);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, tempNorms, basicCtx.ctx.STATIC_DRAW);

		pickingFBO = basicCtx.ctx.createFramebuffer();
		basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, pickingFBO);
		pickingTexture = basicCtx.ctx.createTexture();
		basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, pickingTexture);
		basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, 1, 1, 0, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, null);
		renderBuffer = basicCtx.ctx.createRenderbuffer();
		basicCtx.ctx.bindRenderbuffer(basicCtx.ctx.RENDERBUFFER, renderBuffer);
		basicCtx.ctx.renderbufferStorage(basicCtx.ctx.RENDERBUFFER, basicCtx.ctx.DEPTH_COMPONENT16, 1, 1);
		basicCtx.ctx.framebufferTexture2D(basicCtx.ctx.FRAMEBUFFER, basicCtx.ctx.COLOR_ATTACHMENT0, basicCtx.ctx.TEXTURE_2D, pickingTexture, 0);
		basicCtx.ctx.framebufferRenderbuffer(basicCtx.ctx.FRAMEBUFFER, basicCtx.ctx.DEPTH_ATTACHMENT, basicCtx.ctx.RENDERBUFFER, renderBuffer);
		basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);
		basicCtx.ctx.bindRenderbuffer(basicCtx.ctx.RENDERBUFFER, null);
		basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);
		basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);

		delete vertexCylTemp;
		delete rads;
		delete i;
		delete tempNorms;
		delete renderBuffer;
		delete pickingTexture;

	    this.usePerspective = function() {
			basicCtx.ctx.useProgram(cylCapShader);
			basicCtx.ctx.uniformMatrix4fv(cylCapVarLocs[3], false, basicCtx.perspectiveMatrix);
			basicCtx.ctx.useProgram(cylShader);
			basicCtx.ctx.uniformMatrix4fv(cylVarLocs[3], false, basicCtx.perspectiveMatrix);
			basicCtx.ctx.useProgram(pickCapShader);
			basicCtx.ctx.uniformMatrix4fv(pickCapVarLocs[3], false, basicCtx.perspectiveMatrix);
			basicCtx.ctx.useProgram(pickShader);
			basicCtx.ctx.uniformMatrix4fv(pickVarLocs[3], false, basicCtx.perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			basicCtx.ctx.useProgram(cylCapShader);
			basicCtx.ctx.uniformMatrix4fv(cylCapVarLocs[3], false, projectionMatrix);
			basicCtx.ctx.useProgram(cylShader);
			basicCtx.ctx.uniformMatrix4fv(cylVarLocs[3], false, projectionMatrix);
			basicCtx.ctx.useProgram(pickCapShader);
			basicCtx.ctx.uniformMatrix4fv(pickCapVarLocs[3], false, projectionMatrix);
			basicCtx.ctx.useProgram(pickShader);
			basicCtx.ctx.uniformMatrix4fv(pickVarLocs[3], false, projectionMatrix);
		};

		this.renderNewMarker = function(center, edgePoint) {
			if(basicCtx.ctx) {
				center[2] = edgePoint[2] = 35.0;
				var dist = V3.length(V3.sub(center, edgePoint));
				basicCtx.ctx.enable(basicCtx.ctx.BLEND);
				basicCtx.ctx.blendFunc(basicCtx.ctx.SRC_ALPHA, basicCtx.ctx.ONE);
				basicCtx.ctx.useProgram(cylCapShader);
				basicCtx.pushMatrix();
				basicCtx.translate(center[0], center[1], 0.0);
				basicCtx.scale(dist, dist, 1.0);
				basicCtx.ctx.uniformMatrix4fv(cylCapVarLocs[2], false, basicCtx.peekMatrix());
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, topCapVBO);
				basicCtx.ctx.vertexAttribPointer(cylCapVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(cylCapVarLocs[0]);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markerTexCoords);
				basicCtx.ctx.vertexAttribPointer(cylCapVarLocs[1], 2, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(cylCapVarLocs[1]);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
				basicCtx.popMatrix();
				basicCtx.ctx.disableVertexAttribArray(cylCapVarLocs[0]);
				basicCtx.ctx.disableVertexAttribArray(cylCapVarLocs[1]);
				basicCtx.ctx.disable(basicCtx.ctx.BLEND);
			}
		};
		
		this.recordNewMarker = function(center, edgePoint) {
			if(basicCtx.ctx) {
				center[2] = edgePoint[2] = 35.0;
				var obj = {
					id : 0,
					center: center,
					radius: V3.length(V3.sub(center, edgePoint)),
					height: 0,
					species: 'tree type',
					descr: 'short description'
				}
				markers.push(obj);
			}
		};
		
		this.setLatestMarkerValues = function(spec, descr) {
			var mark = markers[markers.length - 1];
			mark.species = spec;
			mark.descr = descr;
			
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("GET", "action.php?a=add&radius="+mark.radius+"&centerX="+mark.center[0]+"&centerY="+mark.center[1]+"&centerZ="+mark.center[2]+"&species="+mark.species+"&descr="+mark.descr, false);
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
				xmlhttp.open("GET", "action.php?a=delete&id="+markers[closestIndex].id, false);
				xmlhttp.send();
				markers.splice(closestIndex, 1);
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
				var pickingTransform = new Float32Array([		-540, 			 0, 0, 0,
														 			 0, 	   -540, 0, 0,
														 			 0, 			 0, 1, 0,
														 2 * x - 540, 2 * y - 540, 0, 1]);
				var color = new Float32Array([0.0, 0.0, 0.0, 0.0]);
				basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, pickingFBO);
				basicCtx.ctx.enable(basicCtx.ctx.CULL_FACE);


				basicCtx.ctx.useProgram(pickShader);
				basicCtx.ctx.uniformMatrix4fv(pickVarLocs[3], false, pickingTransform);
				basicCtx.ctx.useProgram(pickCapShader);
				basicCtx.ctx.uniformMatrix4fv(pickCapVarLocs[4], false, pickingTransform);
				for(var i = 0; i < markers.length; i++) {
					color[2] = (i + 1) / 255.0;
					basicCtx.pushMatrix();
					basicCtx.ctx.useProgram(pickShader);
					basicCtx.ctx.uniform4fv(pickVarLocs[4], color);
					basicCtx.translate(markers[i].center[0], markers[i].center[1], 0.0);
					basicCtx.scale(markers[i].radius, markers[i].radius, 1.0);
					basicCtx.ctx.uniformMatrix4fv(pickVarLocs[1], false, basicCtx.peekMatrix());
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, cylVBO);
					basicCtx.ctx.vertexAttribPointer(pickVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.enableVertexAttribArray(pickVarLocs[0]);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 42);
					basicCtx.ctx.disableVertexAttribArray(pickVarLocs[0]);
					basicCtx.ctx.useProgram(pickCapShader);
					basicCtx.ctx.uniform4fv(pickCapVarLocs[5], color);
					basicCtx.ctx.uniformMatrix4fv(pickCapVarLocs[2], false, basicCtx.peekMatrix());
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, topCapVBO);
					basicCtx.ctx.vertexAttribPointer(pickCapVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.enableVertexAttribArray(pickCapVarLocs[0]);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markerTexCoords);
					basicCtx.ctx.vertexAttribPointer(pickCapVarLocs[1], 2, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.enableVertexAttribArray(pickCapVarLocs[1]);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, bottomCapVBO);
					basicCtx.ctx.vertexAttribPointer(pickCapVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
					basicCtx.ctx.disableVertexAttribArray(pickCapVarLocs[0]);
					basicCtx.ctx.disableVertexAttribArray(pickCapVarLocs[1]);
					basicCtx.popMatrix();
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
				basicCtx.clear();
				basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);
			}
		};

		this.renderOrthoMarkers = function() {
			if(basicCtx.ctx && markers) {
				basicCtx.ctx.enable(basicCtx.ctx.CULL_FACE);
				basicCtx.ctx.depthMask(false);
				basicCtx.ctx.enable(basicCtx.ctx.BLEND);
				basicCtx.ctx.blendFunc(basicCtx.ctx.SRC_ALPHA, basicCtx.ctx.ONE);
				basicCtx.ctx.enableVertexAttribArray(cylVarLocs[1]);
				basicCtx.ctx.enableVertexAttribArray(cylVarLocs[0]);
				basicCtx.ctx.enableVertexAttribArray(cylCapVarLocs[0]);
				basicCtx.ctx.enableVertexAttribArray(cylCapVarLocs[1]);
				for(var i = 0; i < markers.length; i++) {
					basicCtx.ctx.useProgram(cylShader);
					basicCtx.pushMatrix();
					basicCtx.translate(markers[i].center[0], markers[i].center[1], 0.0);
					basicCtx.scale(markers[i].radius, markers[i].radius, 1.0);
					basicCtx.ctx.uniformMatrix4fv(cylVarLocs[2], false, basicCtx.peekMatrix());
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, cylVBO);
					basicCtx.ctx.vertexAttribPointer(cylVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, cylinderNormals);
					basicCtx.ctx.vertexAttribPointer(cylVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 42);
					basicCtx.ctx.useProgram(cylCapShader);
					basicCtx.ctx.uniformMatrix4fv(cylCapVarLocs[2], false, basicCtx.peekMatrix());
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, topCapVBO);
					basicCtx.ctx.vertexAttribPointer(cylCapVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markerTexCoords);
					basicCtx.ctx.vertexAttribPointer(cylCapVarLocs[1], 2, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, bottomCapVBO);
					basicCtx.ctx.vertexAttribPointer(cylCapVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
					basicCtx.popMatrix();
				}
				basicCtx.ctx.disableVertexAttribArray(cylVarLocs[0]);
				basicCtx.ctx.disableVertexAttribArray(cylVarLocs[1]);
				basicCtx.ctx.disableVertexAttribArray(cylCapVarLocs[0]);
				basicCtx.ctx.disableVertexAttribArray(cylCapVarLocs[1]);

				basicCtx.ctx.disable(basicCtx.ctx.CULL_FACE);
				basicCtx.ctx.depthMask(true);
				basicCtx.ctx.disable(basicCtx.ctx.BLEND);
			}
		};
	}

	return Markers;
} ());