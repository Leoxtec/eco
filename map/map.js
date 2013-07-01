var Map = (function() {

	function Map(cvsElement) {
		var basicCtx = new BasicCTX();
		basicCtx.setup(cvsElement);

		var arrowVBO;
		var arrowColorVBO;
		var mapTexCoords;
		var mapVBO;
		var mapTexture;
		var mapImage;
		var viewMatrix = M4x4.makeLookAt(V3.$(0, 0, 80), V3.$(0, 0, 0), V3.$(0, 1, 0));

		this.getBasicCTX = function() {
			return basicCtx;
		};

		var mapShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/cylCapVertShader.txt'), basicCtx.getShaderStr('shaders/mapFragShader.txt'));
		basicCtx.ctx.useProgram(mapShader);
		basicCtx.scaleFactor = 600;
		var projectionMatrix = M4x4.scale3(1 / 600, 1 / 600, 1, basicCtx.orthographicMatrix);
		basicCtx.uniformMatrix(mapShader, "ps_ProjectionMatrix", false, projectionMatrix);
		basicCtx.uniformMatrix(mapShader, "ps_ModelViewMatrix", false, viewMatrix);
		var arrowShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/basicVertShader.txt'), basicCtx.getShaderStr('shaders/basicFragShader.txt'));
		basicCtx.ctx.useProgram(arrowShader);
		basicCtx.uniformMatrix(arrowShader, "ps_ProjectionMatrix", false, projectionMatrix);

		this.render = function(pos, pan) {
			var arrowPos = V3.clone(pos);
			var offTheMap = false;
			if(basicCtx.ctx) {
				if(arrowPos[0] < basicCtx.xmin) {
					arrowPos[0] = basicCtx.xmin;
					offTheMap = true;
				}
				if(arrowPos[0] > basicCtx.xmax) {
					arrowPos[0] = basicCtx.xmax;
					offTheMap = true;
				}
				if(arrowPos[1] < basicCtx.ymin) {
					arrowPos[1] = basicCtx.ymin;
					offTheMap = true;
				}
				if(arrowPos[1] > basicCtx.ymax) {
					arrowPos[1] = basicCtx.ymax;
					offTheMap = true;
				}

				basicCtx.ctx.enable(basicCtx.ctx.BLEND);
				basicCtx.ctx.blendFunc(basicCtx.ctx.SRC_ALPHA, basicCtx.ctx.ONE);
				basicCtx.ctx.useProgram(mapShader);
				basicCtx.ctx.activeTexture(basicCtx.ctx.TEXTURE0);
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, mapTexture);
				basicCtx.uniformi(mapShader, "uSampler", 0);
				basicCtx.vertexAttribPointer(mapShader, "vTexCoord", 2, mapTexCoords.VBO);
				basicCtx.vertexAttribPointer(mapShader, "ps_Vertex", 3, mapVBO.VBO);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
				basicCtx.disableVertexAttribPointer(mapShader, "ps_Vertex");					
				basicCtx.disableVertexAttribPointer(mapShader, "vTexCoord");
				basicCtx.ctx.disable(basicCtx.ctx.BLEND);

				basicCtx.ctx.useProgram(arrowShader);
				basicCtx.multMatrix(viewMatrix);
				basicCtx.translate(arrowPos[0], arrowPos[1], 0.0);
				basicCtx.rotateZ(pan);
				topMatrix = basicCtx.peekMatrix();
				basicCtx.uniformMatrix(arrowShader, "ps_ModelViewMatrix", false, topMatrix);
				basicCtx.vertexAttribPointer(arrowShader, "aVertexPosition", 3, arrowVBO.VBO);
				basicCtx.vertexAttribPointer(arrowShader, "aVertexColor", 3, arrowColorVBO.VBO);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLES, 0, arrowVBO.length / 3);
				basicCtx.disableVertexAttribPointer(arrowShader, "aVertexPosition");
				basicCtx.disableVertexAttribPointer(arrowShader, "aVertexColor");
				
				if(offTheMap) {
					$("#onOffMap").val('Off the map');
				}
				else {
					$("#onOffMap").val('');
				}
			}
		};

		this.initializeMap = function() {
			basicCtx.xmin = basicCtx.xmin * basicCtx.scaleFactor + 4;
			basicCtx.xmax = basicCtx.xmax * basicCtx.scaleFactor - 4;
			basicCtx.ymin = basicCtx.ymin * basicCtx.scaleFactor + 4;
			basicCtx.ymax = basicCtx.ymax * basicCtx.scaleFactor - 4;
			var temp = new Float32Array([-0.5, -6.0, 50.0,
										 0.5, -6.0, 50.0,
										 0.5, -2.0, 50.0,
										 -0.5, -6.0, 50.0,
										 0.5, -2.0, 50.0,
										 -0.5, -2.0, 50.0,
										 0.0, 0.0, 50.0,
										 -1.5, -2.0, 50.0,
										 1.5, -2.0, 50.0]);
			arrowVBO = basicCtx.createBufferObject(temp);
			temp = new Float32Array(27);
			for(var i = 0; i < 27; i = i + 3) {
				temp[i] = temp[i + 2] = 1.0;
				temp[i + 1] = 0.0;
			}
			arrowColorVBO = basicCtx.createBufferObject(temp);

			mapTexture = basicCtx.ctx.createTexture();
			mapImage = new Image();
			mapImage.onload = function() {
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, mapTexture);
				basicCtx.ctx.pixelStorei(basicCtx.ctx.UNPACK_FLIP_Y_WEBGL, true);
				basicCtx.ctx.pixelStorei(basicCtx.ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
				basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, mapImage);
				basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MIN_FILTER, basicCtx.ctx.NEAREST);
				basicCtx.ctx.generateMipmap(basicCtx.ctx.TEXTURE_2D);
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);
			}
			mapImage.src = "http://localhost/repos/kensdevelopment/preprocess/leaf_off.png";

			var texCoords = new Float32Array([1.0, 0.0,
											  1.0, 1.0,
											  0.0, 0.0,
											  0.0, 1.0]);
			mapTexCoords = basicCtx.createBufferObject(texCoords);
			var mapTemp = new Float32Array([33.333333, -33.333333, 0.0,
											33.333333, 33.333333, 0.0,
											-33.333333, -33.333333, 0.0,
											-33.333333, 33.333333, 0.0]);
			mapVBO = basicCtx.createBufferObject(mapTemp);
		}
	}

	return Map;
} ());
