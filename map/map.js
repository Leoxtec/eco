var Map = (function() {

	function Map(cvsElement) {
		var basicCtx = new BasicCTX();
		basicCtx.setup(cvsElement);

		var arrowVBO;
		var arrowColorVBO;
		var mapTexCoords;
		var mapVBO;
		var viewMatrix = M4x4.makeLookAt(V3.$(0, 0, 80), V3.$(0, 0, 0), V3.$(0, 1, 0));

		var mapShader;
		var arrowShader;

		var mapVarLocs = [];
		var arrowVarLocs = [];

		basicCtx.scaleFactor = 600;
		basicCtx.xmin = basicCtx.xmin * basicCtx.scaleFactor + 4;
		basicCtx.xmax = basicCtx.xmax * basicCtx.scaleFactor - 4;
		basicCtx.ymin = basicCtx.ymin * basicCtx.scaleFactor + 4;
		basicCtx.ymax = basicCtx.ymax * basicCtx.scaleFactor - 4;

		arrowShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/basicVertShader.c'), basicCtx.getShaderStr('shaders/basicFragShader.c'));
		basicCtx.ctx.useProgram(arrowShader);
		arrowVarLocs.push(basicCtx.ctx.getAttribLocation(arrowShader, "aVertexPosition"));
		arrowVarLocs.push(basicCtx.ctx.getAttribLocation(arrowShader, "aVertexColor"));
		arrowVarLocs.push(basicCtx.ctx.getUniformLocation(arrowShader, "uModelViewMatrix"));
		arrowVarLocs.push(basicCtx.ctx.getUniformLocation(arrowShader, "uProjectionMatrix"));
		basicCtx.ctx.uniformMatrix4fv(arrowVarLocs[3], false, M4x4.scale3(1 / 600, 1 / 600, 1, basicCtx.orthographicMatrix));
		basicCtx.ctx.enableVertexAttribArray(arrowVarLocs[0]);
		basicCtx.ctx.enableVertexAttribArray(arrowVarLocs[1]);
		arrowVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, arrowVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([-0.5, -6.0, 50.0,
																			  0.5, -6.0, 50.0,
																			  0.5, -2.0, 50.0,
																			 -0.5, -6.0, 50.0,
																			  0.5, -2.0, 50.0,
																			 -0.5, -2.0, 50.0,
																			  0.0,  0.0, 50.0,
																			 -1.5, -2.0, 50.0,
																			  1.5, -2.0, 50.0]), basicCtx.ctx.STATIC_DRAW);
		temp = new Float32Array(27);
		for(var i = 0; i < 27; i = i + 3) {
			temp[i] = temp[i + 2] = 1.0;
			temp[i + 1] = 0.0;
		}
		arrowColorVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, arrowColorVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, temp, basicCtx.ctx.STATIC_DRAW);
		delete temp;

		mapShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/cylCapVertShader.c'), basicCtx.getShaderStr('shaders/mapFragShader.c'));
		basicCtx.ctx.useProgram(mapShader);
		mapVarLocs.push(basicCtx.ctx.getAttribLocation(mapShader, "aVertexPosition"));
		mapVarLocs.push(basicCtx.ctx.getAttribLocation(mapShader, "aTexCoord"));
		mapVarLocs.push(basicCtx.ctx.getUniformLocation(mapShader, "uModelViewMatrix"));
		mapVarLocs.push(basicCtx.ctx.getUniformLocation(mapShader, "uProjectionMatrix"));
		mapVarLocs.push(basicCtx.ctx.getUniformLocation(mapShader, "uSampler"));
		basicCtx.ctx.uniformMatrix4fv(mapVarLocs[2], false, viewMatrix);
		basicCtx.ctx.uniformMatrix4fv(mapVarLocs[3], false, M4x4.scale3(1 / 600, 1 / 600, 1, basicCtx.orthographicMatrix));


		mapTexCoords = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, mapTexCoords);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([1.0, 0.0,
																			 1.0, 1.0,
																			 0.0, 0.0,
																			 0.0, 1.0]), basicCtx.ctx.STATIC_DRAW);
		mapVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, mapVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([ 33.333333, -33.333333, 0.0,
																			  33.333333,  33.333333, 0.0,
																			 -33.333333, -33.333333, 0.0,
																			 -33.333333,  33.333333, 0.0]), basicCtx.ctx.STATIC_DRAW);
		mapTexture = basicCtx.ctx.createTexture();
		mapImage = new Image();
		mapImage.onload = function() {
			basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, mapTexture);
			basicCtx.ctx.pixelStorei(basicCtx.ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
			basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, mapImage);
			basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MIN_FILTER, basicCtx.ctx.NEAREST);
			basicCtx.ctx.useProgram(mapShader);
			basicCtx.ctx.activeTexture(basicCtx.ctx.TEXTURE0);
			basicCtx.ctx.uniform1i(mapVarLocs[4], mapTexture);
			delete mapTexture;
			delete this;
		}
		mapImage.src = "http://localhost/repos/kensdevelopment/preprocess/both_leaves.png";

		this.getBasicCTX = function() {
			return basicCtx;
		};

		this.render = function(pos, pan) {
			if(basicCtx.ctx) {
				var arrowPos = V3.clone(pos);
				var offTheMap = false;
				if(arrowPos[0] < basicCtx.xmin) {
					arrowPos[0] = basicCtx.xmin;
					offTheMap = true;
				}
				else if(arrowPos[0] > basicCtx.xmax) {
					arrowPos[0] = basicCtx.xmax;
					offTheMap = true;
				}
				if(arrowPos[1] < basicCtx.ymin) {
					arrowPos[1] = basicCtx.ymin;
					offTheMap = true;
				}
				else if(arrowPos[1] > basicCtx.ymax) {
					arrowPos[1] = basicCtx.ymax;
					offTheMap = true;
				}

				basicCtx.ctx.useProgram(mapShader);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, mapVBO);
				basicCtx.ctx.vertexAttribPointer(mapVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, mapTexCoords);
				basicCtx.ctx.vertexAttribPointer(mapVarLocs[1], 2, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);

				basicCtx.ctx.useProgram(arrowShader);
				basicCtx.multMatrix(viewMatrix);
				basicCtx.translate(arrowPos[0], arrowPos[1], 0.0);
				basicCtx.rotateZ(pan);
				basicCtx.ctx.uniformMatrix4fv(arrowVarLocs[2], false, basicCtx.peekMatrix());
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, arrowVBO);
				basicCtx.ctx.vertexAttribPointer(arrowVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, arrowColorVBO);
				basicCtx.ctx.vertexAttribPointer(arrowVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLES, 0, 9);
				
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
