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
		cylCapVarLocs.push(basicCtx.ctx.getAttribLocation(cylCapShader, "vTexCoord"));
		cylCapVarLocs.push(basicCtx.ctx.getUniformLocation(cylCapShader, "ps_ModelViewMatrix"));
		cylCapVarLocs.push(basicCtx.ctx.getUniformLocation(cylCapShader, "ps_ProjectionMatrix"));
		basicCtx.ctx.uniformMatrix4fv(cylCapVarLocs[3], false, basicCtx.perspectiveMatrix);

		cylShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/cylVertShader.c'), basicCtx.getShaderStr('shaders/cylFragShader.c'));
		basicCtx.ctx.useProgram(cylShader);
		cylVarLocs.push(basicCtx.ctx.getAttribLocation(cylShader, "aVertexPosition"));
		cylVarLocs.push(basicCtx.ctx.getAttribLocation(cylShader, "aNormal"));
		cylVarLocs.push(basicCtx.ctx.getUniformLocation(cylShader, "ps_ModelViewMatrix"));
		cylVarLocs.push(basicCtx.ctx.getUniformLocation(cylShader, "ps_ProjectionMatrix"));
		basicCtx.ctx.uniformMatrix4fv(cylVarLocs[3], false, basicCtx.perspectiveMatrix);

		pickCapShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/pickCapVertShader.c'), basicCtx.getShaderStr('shaders/pickCapFragShader.c'));
		basicCtx.ctx.useProgram(pickCapShader);
		pickCapVarLocs.push(basicCtx.ctx.getAttribLocation(pickCapShader, "aVertexPosition"));
		pickCapVarLocs.push(basicCtx.ctx.getAttribLocation(pickCapShader, "vTexCoord"));
		pickCapVarLocs.push(basicCtx.ctx.getUniformLocation(pickCapShader, "ps_ModelViewMatrix"));
		pickCapVarLocs.push(basicCtx.ctx.getUniformLocation(pickCapShader, "ps_ProjectionMatrix"));
		pickCapVarLocs.push(basicCtx.ctx.getUniformLocation(pickCapShader, "ps_PickingMatrix"));
		pickCapVarLocs.push(basicCtx.ctx.getUniformLocation(pickCapShader, "ps_Color"));
		basicCtx.ctx.uniformMatrix4fv(pickCapVarLocs[3], false, basicCtx.perspectiveMatrix);

		pickShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/pickVertShader.c'), basicCtx.getShaderStr('shaders/basicFragShader.c'));
		basicCtx.ctx.useProgram(pickShader);
		pickVarLocs.push(basicCtx.ctx.getAttribLocation(pickShader, "aVertexPosition"));
		pickVarLocs.push(basicCtx.ctx.getUniformLocation(pickShader, "ps_ModelViewMatrix"));
		pickVarLocs.push(basicCtx.ctx.getUniformLocation(pickShader, "ps_ProjectionMatrix"));
		pickVarLocs.push(basicCtx.ctx.getUniformLocation(pickShader, "ps_PickingMatrix"));
		pickVarLocs.push(basicCtx.ctx.getUniformLocation(pickShader, "ps_Color"));
		basicCtx.ctx.uniformMatrix4fv(pickVarLocs[2], false, basicCtx.perspectiveMatrix);

		markerTexCoords = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markerTexCoords);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([1.0, 0.0,
																			 1.0, 1.0,
																			 0.0, 0.0,
																			 0.0, 1.0]), basicCtx.ctx.STATIC_DRAW);
		xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", "action.php?a=start", false);
		xmlhttp.send();
		temp = JSON.parse(xmlhttp.responseText);
		if(temp) {
			temp = temp.markers;
			for(i = 0; i < temp.length; i++) {
				obj = {
					id : temp[i].id,
					center: V3.$(temp[i].centerX, temp[i].centerY, temp[i].centerZ),
					radius: temp[i].radius,
					capVBO: {},
					cylVBO: {},
					height: temp[i].height,
					species: temp[i].species,
					descr: temp[i].descr
				}
				obj.capVBO = basicCtx.ctx.createBuffer();
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, obj.capVBO);
				basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([obj.center[0] + obj.radius, obj.center[1] - obj.radius, obj.center[2],
																					 obj.center[0] + obj.radius, obj.center[1] + obj.radius, obj.center[2],
																					 obj.center[0] - obj.radius, obj.center[1] - obj.radius, obj.center[2],
																					 obj.center[0] - obj.radius, obj.center[1] + obj.radius, obj.center[2]]), basicCtx.ctx.STATIC_DRAW);
				vertexCylTemp = new Float32Array(198);
				for(j = 0; j < 198; j += 6) {
					rads = (j * Math.PI) / 96;
					vertexCylTemp[j] 	 = vertexCylTemp[j + 3] = obj.center[0] + obj.radius * Math.cos(rads);
					vertexCylTemp[j + 1] = vertexCylTemp[j + 4] = obj.center[1] + obj.radius * Math.sin(rads);
					vertexCylTemp[j + 2] = obj.center[2];
					vertexCylTemp[j + 5] = -obj.center[2] * 0.5;
				}
				obj.cylVBO = basicCtx.ctx.createBuffer();
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, obj.cylVBO);
				basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, vertexCylTemp, basicCtx.ctx.STATIC_DRAW);
				markers.push(obj);
			}
		}
		tempNorms = new Float32Array(198);
		for(i = 0; i < 198; i += 6) {
			rads = (i * Math.PI) / 96;
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

	    delete xmlhttp;
	    delete temp;
	    delete obj;
	    delete vertexCylTemp;
	    delete rads;
	    delete i;
	    delete j;
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
				basicCtx.ctx.enable(basicCtx.ctx.BLEND);
				basicCtx.ctx.blendFunc(basicCtx.ctx.SRC_ALPHA, basicCtx.ctx.ONE);
				basicCtx.ctx.useProgram(cylCapShader);
				basicCtx.ctx.uniformMatrix4fv(cylCapVarLocs[2], false, basicCtx.peekMatrix());
				var dist = V3.length(V3.sub(center, edgePoint));
				var vertexVBO = basicCtx.ctx.createBuffer();
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, vertexVBO);
				basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([center[0] + dist, center[1] - dist, center[2],
																					 center[0] + dist, center[1] + dist, center[2],
																					 center[0] - dist, center[1] - dist, center[2],
																					 center[0] - dist, center[1] + dist, center[2]]), basicCtx.ctx.DYNAMIC_DRAW);
				basicCtx.ctx.vertexAttribPointer(cylCapVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(cylCapVarLocs[0]);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markerTexCoords);
				basicCtx.ctx.vertexAttribPointer(cylCapVarLocs[1], 2, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(cylCapVarLocs[1]);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
				basicCtx.ctx.disableVertexAttribArray(cylCapVarLocs[0]);
				basicCtx.ctx.disableVertexAttribArray(cylCapVarLocs[1]);
				basicCtx.ctx.deleteBuffer(vertexVBO);
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
					capVBO: {},
					cylVBO: {},
					height: 0,
					species: 'tree type',
					descr: 'short description'
				}
				obj.capVBO = basicCtx.ctx.createBuffer();
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, obj.capVBO);
				basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([center[0] + obj.radius, center[1] - obj.radius, center[2],
																					 center[0] + obj.radius, center[1] + obj.radius, center[2],
																					 center[0] - obj.radius, center[1] - obj.radius, center[2],
																					 center[0] - obj.radius, center[1] + obj.radius, center[2]]), basicCtx.ctx.STATIC_DRAW);
				var vertexCylTemp = new Float32Array(198);
				for(var j = 0; j < 198; j += 6) {
					var rads = (j * Math.PI) / 96;
					vertexCylTemp[j] 	 = vertexCylTemp[j + 3] = center[0] + obj.radius * Math.cos(rads);
					vertexCylTemp[j + 1] = vertexCylTemp[j + 4] = center[1] + obj.radius * Math.sin(rads);
					vertexCylTemp[j + 2] = center[2];
					vertexCylTemp[j + 5] = -center[2] * 0.5;
				}
				obj.cylVBO = basicCtx.ctx.createBuffer();
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, obj.cylVBO);
				basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, vertexCylTemp, basicCtx.ctx.STATIC_DRAW);
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
				basicCtx.ctx.deleteBuffer(markers[closestIndex].capVBO);
				basicCtx.ctx.deleteBuffer(markers[closestIndex].cylVBO);
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


		this.displayMarkerInfo2 = function(rayStart, rayEnd) {
			var dir = V3.sub(rayEnd, rayStart);
			var temp = new Float32Array(2);
			var tHit = Number.POSITIVE_INFINITY;
			var closestIndex = -1;
			for(var i = 0; i < markers.length; i++) {
				temp[0] = rayStart[0] - markers[i].center[0];
				temp[1] = rayStart[1] - markers[i].center[1];
				var tempDotP = temp[0] * temp[0] + temp[1] * temp[1];
				var dirDotP = dir[0] * dir[0] + dir[1] * dir[1];
				var tempDirDotP = dir[0] * temp[0] + dir[1] * temp[1];
				var discrim = tempDirDotP * tempDirDotP - (dirDotP * (tempDotP - (markers[i].radius * markers[i].radius)));
				if(discrim >= 0) {
					var t = ((-1.0 * tempDirDotP) - Math.sqrt(discrim)) / dirDotP;
					if(t > 0 && t < tHit) {
						var height = rayStart[2] + (t * dir[2]);
						if(height <= markers[i].center[2] && height >= markers[i].center[2] - 52.5) {
							closestIndex = i;
							tHit = t;
						}
					}
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
				var pickingTransform = new Float32Array([		-width, 			 0, 0, 0,
														 			  0, 	   -height, 0, 0,
														 			  0, 			 0, 1, 0,
														 2 * x - width, 2 * y - height, 0, 1]);
				var color = new Float32Array([0.0, 0.0, 0.0, 0.0]);
				basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, pickingFBO);
				basicCtx.ctx.enable(basicCtx.ctx.CULL_FACE);
				basicCtx.ctx.useProgram(pickShader);
				basicCtx.ctx.uniformMatrix4fv(pickVarLocs[3], false, pickingTransform);
				basicCtx.ctx.uniformMatrix4fv(pickVarLocs[1], false, basicCtx.peekMatrix());
				basicCtx.ctx.useProgram(pickCapShader);
				basicCtx.ctx.uniformMatrix4fv(pickCapVarLocs[4], false, pickingTransform);
				for(var i = 0; i < markers.length; i++) {
					color[2] = (i + 1) / 255.0;
					basicCtx.ctx.useProgram(pickShader);
					basicCtx.ctx.uniform4fv(pickVarLocs[4], color);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markers[i].cylVBO);
					basicCtx.ctx.vertexAttribPointer(pickVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.enableVertexAttribArray(pickVarLocs[0]);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 66);
					basicCtx.ctx.disableVertexAttribArray(pickVarLocs[0]);
					basicCtx.pushMatrix();
					basicCtx.translate(markers[i].center[0], markers[i].center[1], markers[i].center[2] - 52.5);
					basicCtx.rotateX(Math.PI);
					basicCtx.translate(-markers[i].center[0], -markers[i].center[1], -markers[i].center[2]);
					basicCtx.ctx.useProgram(pickCapShader);
					basicCtx.ctx.uniform4fv(pickCapVarLocs[5], color);
					basicCtx.ctx.uniformMatrix4fv(pickCapVarLocs[2], false, basicCtx.peekMatrix());
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markers[i].capVBO);
					basicCtx.ctx.vertexAttribPointer(pickCapVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.enableVertexAttribArray(pickCapVarLocs[0]);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markerTexCoords);
					basicCtx.ctx.vertexAttribPointer(pickCapVarLocs[1], 2, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.enableVertexAttribArray(pickCapVarLocs[1]);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
					basicCtx.popMatrix();
					basicCtx.ctx.uniformMatrix4fv(pickCapVarLocs[2], false, basicCtx.peekMatrix());
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
					basicCtx.ctx.disableVertexAttribArray(pickCapVarLocs[0]);
					basicCtx.ctx.disableVertexAttribArray(pickCapVarLocs[1]);
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
				basicCtx.ctx.useProgram(cylShader);
				basicCtx.ctx.uniformMatrix4fv(cylVarLocs[2], false, basicCtx.peekMatrix());
				basicCtx.ctx.enableVertexAttribArray(cylVarLocs[1]);
				basicCtx.ctx.enableVertexAttribArray(cylVarLocs[0]);
				basicCtx.ctx.useProgram(cylCapShader);
				basicCtx.ctx.enableVertexAttribArray(cylCapVarLocs[0]);
				basicCtx.ctx.enableVertexAttribArray(cylCapVarLocs[1]);
				for(var i = 0; i < markers.length; i++) {
					basicCtx.ctx.useProgram(cylShader);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markers[i].cylVBO);
					basicCtx.ctx.vertexAttribPointer(cylVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, cylinderNormals);
					basicCtx.ctx.vertexAttribPointer(cylVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 66);
					basicCtx.pushMatrix();
					basicCtx.translate(markers[i].center[0], markers[i].center[1], markers[i].center[2] - 52.5);
					basicCtx.rotateX(Math.PI);
					basicCtx.translate(-markers[i].center[0], -markers[i].center[1], -markers[i].center[2]);
					basicCtx.ctx.useProgram(cylCapShader);
					basicCtx.ctx.uniformMatrix4fv(cylCapVarLocs[2], false, basicCtx.peekMatrix());
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markers[i].capVBO);
					basicCtx.ctx.vertexAttribPointer(cylCapVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markerTexCoords);
					basicCtx.ctx.vertexAttribPointer(cylCapVarLocs[1], 2, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
					basicCtx.popMatrix();
					basicCtx.ctx.uniformMatrix4fv(cylCapVarLocs[2], false, basicCtx.peekMatrix());
					basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
				}
				basicCtx.ctx.useProgram(cylShader);
				basicCtx.ctx.disableVertexAttribArray(cylVarLocs[0]);
				basicCtx.ctx.disableVertexAttribArray(cylVarLocs[1]);
				basicCtx.ctx.useProgram(cylCapShader);
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