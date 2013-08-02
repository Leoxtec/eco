var Map = (function() {
	function Map(bctx) {
		var basicCtx = bctx;

		var arrowVBO;
		var arrowColorVBO;
		var mapTexCoords;
		var mapVBO;
		var viewMatrix = M4x4.makeLookAt(V3.$(0, 0, 80), V3.$(0, 0, 0), V3.$(0, 1, 0));

		var mapShader;
		var arrowShader;

		var mapVarLocs = [];
		var arrowVarLocs = [];

		xmlhttpForOrthoSize = new XMLHttpRequest();
		xmlhttpForOrthoSize.open("GET", "action.php?a=getMapSize&name=2_LocalFilter_10m_Grid_3_STDCutoff_SE_F1_2011_v084_Lirio_redo_POINTS_ASCII", false);
		// xmlhttpForOrthoSize.open("GET", "action.php?a=getMapSize&name=both_leaves", false);
		xmlhttpForOrthoSize.send();
		orthoSize = JSON.parse(xmlhttpForOrthoSize.responseText);
		arrowAspect = orthoSize / 31.25;

		var ymax = orthoSize - 4 * arrowAspect;
		var ymin = -ymax;
		var xmin = ymin;
		var xmax = ymax;
		orthographicMatrix = M4x4.makeOrtho(-orthoSize, orthoSize, -orthoSize, orthoSize, 0.1, 1000);

		arrowShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/basicVertShader.c'), basicCtx.getShaderStr('shaders/basicFragShader.c'));
		basicCtx.ctx.useProgram(arrowShader);
		arrowVarLocs.push(basicCtx.ctx.getAttribLocation(arrowShader, "aVertexPosition"));
		arrowVarLocs.push(basicCtx.ctx.getAttribLocation(arrowShader, "aVertexColor"));
		arrowVarLocs.push(basicCtx.ctx.getUniformLocation(arrowShader, "uModelViewMatrix"));
		arrowVarLocs.push(basicCtx.ctx.getUniformLocation(arrowShader, "uProjectionMatrix"));
		basicCtx.ctx.uniformMatrix4fv(arrowVarLocs[3], false, orthographicMatrix);
		arrowVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, arrowVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([-0.5 * arrowAspect, -6.0 * arrowAspect, 50.0,
																			  0.5 * arrowAspect, -6.0 * arrowAspect, 50.0,
																			  0.5 * arrowAspect, -2.0 * arrowAspect, 50.0,
																			 -0.5 * arrowAspect, -6.0 * arrowAspect, 50.0,
																			  0.5 * arrowAspect, -2.0 * arrowAspect, 50.0,
																			 -0.5 * arrowAspect, -2.0 * arrowAspect, 50.0,
																			  0.0 * arrowAspect,  0.0 * arrowAspect, 50.0,
																			 -1.5 * arrowAspect, -2.0 * arrowAspect, 50.0,
																			  1.5 * arrowAspect, -2.0 * arrowAspect, 50.0]), basicCtx.ctx.STATIC_DRAW);
		temp = new Float32Array(27);
		for(var i = 0; i < 27; i = i + 3) {
			temp[i] = temp[i + 2] = 1.0;
			temp[i + 1] = 0.0;
		}
		arrowColorVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, arrowColorVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, temp, basicCtx.ctx.STATIC_DRAW);

		mapShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/cylCapVertShader.c'), basicCtx.getShaderStr('shaders/mapFragShader.c'));
		basicCtx.ctx.useProgram(mapShader);
		mapVarLocs.push(basicCtx.ctx.getAttribLocation(mapShader, "aVertexPosition"));
		mapVarLocs.push(basicCtx.ctx.getAttribLocation(mapShader, "aTexCoord"));
		mapVarLocs.push(basicCtx.ctx.getUniformLocation(mapShader, "uModelViewMatrix"));
		mapVarLocs.push(basicCtx.ctx.getUniformLocation(mapShader, "uProjectionMatrix"));
		mapVarLocs.push(basicCtx.ctx.getUniformLocation(mapShader, "uSampler"));
		basicCtx.ctx.uniformMatrix4fv(mapVarLocs[2], false, viewMatrix);
		basicCtx.ctx.uniformMatrix4fv(mapVarLocs[3], false, orthographicMatrix);

		mapTexCoords = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, mapTexCoords);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([1.0, 0.0,
																			 1.0, 1.0,
																			 0.0, 0.0,
																			 0.0, 1.0]), basicCtx.ctx.STATIC_DRAW);
		mapVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, mapVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([ orthoSize, -orthoSize, 0.0,
																			  orthoSize,  orthoSize, 0.0,
																			 -orthoSize, -orthoSize, 0.0,
																			 -orthoSize,  orthoSize, 0.0]), basicCtx.ctx.STATIC_DRAW);
		mapTexture = basicCtx.ctx.createTexture();
		mapImage = new Image();
		mapImage.onload = function() {
			basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, mapTexture);
			basicCtx.ctx.pixelStorei(basicCtx.ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
			basicCtx.ctx.pixelStorei(basicCtx.ctx.UNPACK_FLIP_Y_WEBGL, false);
			basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, mapImage);
			basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MIN_FILTER, basicCtx.ctx.NEAREST);
			basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);
			delete this;
		}
		mapImage.src = "preprocess/2_LocalFilter_10m_Grid_3_STDCutoff_SE_F1_2011_v084_Lirio_redo_POINTS_ASCII.png";
		// mapImage.src = "preprocess/both_leaves.png";

		delete orthographicMatrix;
		delete orthoSize;
		delete xmlhttpForOrthoSize;
		delete arrowAspect;
		delete temp;

		this.getBasicCTX = function() {
			return basicCtx;
		};

		this.render = function(pos, pan) {
			if(basicCtx.ctx) {
				var arrowPos = V3.clone(pos);
				var offTheMap = false;
				if(arrowPos[0] < xmin) {
					arrowPos[0] = xmin;
					offTheMap = true;
				}
				else if(arrowPos[0] > xmax) {
					arrowPos[0] = xmax;
					offTheMap = true;
				}
				if(arrowPos[1] < ymin) {
					arrowPos[1] = ymin;
					offTheMap = true;
				}
				else if(arrowPos[1] > ymax) {
					arrowPos[1] = ymax;
					offTheMap = true;
				}
				basicCtx.ctx.viewport(540, 0, 270, 270);

				basicCtx.ctx.useProgram(mapShader);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, mapVBO);
				basicCtx.ctx.vertexAttribPointer(mapVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(mapVarLocs[0]);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, mapTexCoords);
				basicCtx.ctx.vertexAttribPointer(mapVarLocs[1], 2, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(mapVarLocs[1]);
				basicCtx.ctx.activeTexture(basicCtx.ctx.TEXTURE0);
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, mapTexture);
				basicCtx.ctx.uniform1i(mapVarLocs[4], mapTexture);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);
				basicCtx.ctx.disableVertexAttribArray(mapVarLocs[0]);
				basicCtx.ctx.disableVertexAttribArray(mapVarLocs[1]);

				basicCtx.ctx.useProgram(arrowShader);
				basicCtx.pushMatrix();
				basicCtx.multMatrix(viewMatrix);
				basicCtx.translate(arrowPos[0], arrowPos[1], 0.0);
				basicCtx.rotateZ(pan);
				basicCtx.ctx.uniformMatrix4fv(arrowVarLocs[2], false, basicCtx.peekMatrix());
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, arrowVBO);
				basicCtx.ctx.vertexAttribPointer(arrowVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(arrowVarLocs[0]);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, arrowColorVBO);
				basicCtx.ctx.vertexAttribPointer(arrowVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(arrowVarLocs[1]);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLES, 0, 9);
				basicCtx.ctx.disableVertexAttribArray(arrowVarLocs[0]);
				basicCtx.ctx.disableVertexAttribArray(arrowVarLocs[1]);
				basicCtx.popMatrix();
				if(offTheMap) {
					$("#onOffMap").val('Off the map');
				}
				else {
					$("#onOffMap").val('');
				}
			}
		};
	}

	return Map;
} ());
