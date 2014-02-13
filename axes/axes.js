var Axes = (function() {
	function Axes(bctx) {
		var basicCtx = bctx;

		var axesVBO;
		var axesColorsVBO;
		var letterPositionVBO;
		var letterIndexVBO;

		var axesShader;
		var letterShader;

		var axesVarLocs = [];
		var letterVarLocs = [];

		axesShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/basic.vert'), basicCtx.getShaderStr('shaders/basic.frag'));
		basicCtx.ctx.useProgram(axesShader);
		axesVarLocs.push(basicCtx.ctx.getAttribLocation(axesShader, "aVertexPosition"));
		axesVarLocs.push(basicCtx.ctx.getAttribLocation(axesShader, "aVertexColor"));
		axesVarLocs.push(basicCtx.ctx.getUniformLocation(axesShader, "uModelViewMatrix"));
		axesVarLocs.push(basicCtx.ctx.getUniformLocation(axesShader, "uProjectionMatrix"));
		basicCtx.ctx.uniformMatrix4fv(axesVarLocs[3], false, basicCtx.perspectiveMatrix);
		axesVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, axesVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([0.0,0.0,0.0,
																			 1.0,0.0,0.0,
																			 0.0,0.0,0.0,
																			 0.0,1.0,0.0,
																			 0.0,0.0,0.0,
																			 0.0,0.0,1.0]), basicCtx.ctx.STATIC_DRAW);

		axesColorsVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, axesColorsVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([1.0,0.0,0.0,
																			 1.0,0.0,0.0,
																			 0.0,1.0,0.0, 
																			 0.0,1.0,0.0, 
																			 0.0,0.0,1.0,
																			 0.0,0.0,1.0]), basicCtx.ctx.STATIC_DRAW);

		letterShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/letter.vert'), basicCtx.getShaderStr('shaders/map.frag'));
		basicCtx.ctx.useProgram(letterShader);
		letterVarLocs.push(basicCtx.ctx.getAttribLocation(letterShader, "aVertexPosition"));
		letterVarLocs.push(basicCtx.ctx.getAttribLocation(letterShader, "aLetterIndex"));
		letterVarLocs.push(basicCtx.ctx.getUniformLocation(letterShader, "uModelViewMatrix"));
		letterVarLocs.push(basicCtx.ctx.getUniformLocation(letterShader, "uProjectionMatrix"));
		letterVarLocs.push(basicCtx.ctx.getUniformLocation(letterShader, "uSampler"));
		basicCtx.ctx.uniformMatrix4fv(letterVarLocs[3], false, basicCtx.perspectiveMatrix);

		letterPositionVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, letterPositionVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([1.075, 0.0, 0.0,
																			 1.075, 0.0, 0.0,
																			 1.075, 0.0, 0.0,
																			 1.075, 0.0, 0.0,
																			 1.075, 0.0, 0.0,
																			 1.075, 0.0, 0.0,
																			 0.0, 1.075, 0.0,
																			 0.0, 1.075, 0.0,
																			 0.0, 1.075, 0.0,
																			 0.0, 1.075, 0.0,
																			 0.0, 1.075, 0.0,
																			 0.0, 1.075, 0.0,
																			 0.0, 0.0, 1.075,
																			 0.0, 0.0, 1.075,
																			 0.0, 0.0, 1.075,
																			 0.0, 0.0, 1.075,
																			 0.0, 0.0, 1.075,
																			 0.0, 0.0, 1.075]), basicCtx.ctx.STATIC_DRAW);

		letterIndexVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, letterIndexVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([0.0, 1.0, 2.0, 2.0, 1.0, 3.0,
																			 4.0, 5.0, 6.0, 6.0, 5.0, 7.0,
																			 8.0, 9.0, 10.0, 10.0, 9.0, 11.0]), basicCtx.ctx.STATIC_DRAW);
		letterTexture = basicCtx.ctx.createTexture();
		basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, letterTexture);
		basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MIN_FILTER, basicCtx.ctx.NEAREST);
		basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MAG_FILTER, basicCtx.ctx.NEAREST);
		basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, 1, 1, 0, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
		letterImage = new Image();
		letterImage.onload = function() {
			basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, letterTexture);
			basicCtx.ctx.pixelStorei(basicCtx.ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
			basicCtx.ctx.pixelStorei(basicCtx.ctx.UNPACK_FLIP_Y_WEBGL, true);
			basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, letterImage);
			basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MIN_FILTER, basicCtx.ctx.NEAREST);
			basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);
			delete this;
		}
		letterImage.src = "preprocess/letters.png";

		this.getBasicCTX = function() {
			return basicCtx;
		};

		this.render = function() {
			if(basicCtx) {
				basicCtx.ctx.enable(basicCtx.ctx.BLEND);
				basicCtx.ctx.blendFunc(basicCtx.ctx.SRC_ALPHA, basicCtx.ctx.ONE);
				basicCtx.ctx.viewport(540, 270, 270, 270);

				basicCtx.ctx.useProgram(axesShader);
				basicCtx.ctx.uniformMatrix4fv(axesVarLocs[2], false, basicCtx.peekMatrix());
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, axesVBO);
				basicCtx.ctx.vertexAttribPointer(axesVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, axesColorsVBO);
				basicCtx.ctx.vertexAttribPointer(axesVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.drawArrays(basicCtx.ctx.LINES, 0, 6);

				basicCtx.ctx.useProgram(letterShader);
				basicCtx.ctx.uniformMatrix4fv(letterVarLocs[2], false, basicCtx.peekMatrix());
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, letterPositionVBO);
				basicCtx.ctx.vertexAttribPointer(letterVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, letterIndexVBO);
				basicCtx.ctx.vertexAttribPointer(letterVarLocs[1], 1, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, letterTexture);
				basicCtx.ctx.uniform1i(letterVarLocs[4], letterTexture);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLES, 0, 18);
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);

				basicCtx.ctx.disable(basicCtx.ctx.BLEND);
			}
		};
	}

	return Axes;
} ());