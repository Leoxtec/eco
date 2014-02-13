var Axes = (function() {
	function Axes(bctx) {
		var basicCtx = bctx;
		var gl = basicCtx.ctx;

		var axesVBO;
		var axesColorsVBO;
		var letterPositionVBO;
		var letterIndexVBO;

		var axesShader;
		var letterShader;

		var axesVarLocs = [];
		var letterVarLocs = [];

		axesShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/basic.vert'), basicCtx.getShaderStr('shaders/basic.frag'));
		gl.useProgram(axesShader);
		axesVarLocs.push(gl.getAttribLocation(axesShader, "aVertexPosition"));
		axesVarLocs.push(gl.getAttribLocation(axesShader, "aVertexColor"));
		axesVarLocs.push(gl.getUniformLocation(axesShader, "uModelViewMatrix"));
		axesVarLocs.push(gl.getUniformLocation(axesShader, "uProjectionMatrix"));
		gl.uniformMatrix4fv(axesVarLocs[3], false, basicCtx.perspectiveMatrix);
		axesVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, axesVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0,0.0,0.0,
																			 1.0,0.0,0.0,
																			 0.0,0.0,0.0,
																			 0.0,1.0,0.0,
																			 0.0,0.0,0.0,
																			 0.0,0.0,1.0]), gl.STATIC_DRAW);

		axesColorsVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, axesColorsVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0,0.0,0.0,
																			 1.0,0.0,0.0,
																			 0.0,1.0,0.0, 
																			 0.0,1.0,0.0, 
																			 0.0,0.0,1.0,
																			 0.0,0.0,1.0]), gl.STATIC_DRAW);

		letterShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/letter.vert'), basicCtx.getShaderStr('shaders/map.frag'));
		gl.useProgram(letterShader);
		letterVarLocs.push(gl.getAttribLocation(letterShader, "aVertexPosition"));
		letterVarLocs.push(gl.getAttribLocation(letterShader, "aLetterIndex"));
		letterVarLocs.push(gl.getUniformLocation(letterShader, "uModelViewMatrix"));
		letterVarLocs.push(gl.getUniformLocation(letterShader, "uProjectionMatrix"));
		letterVarLocs.push(gl.getUniformLocation(letterShader, "uSampler"));
		gl.uniformMatrix4fv(letterVarLocs[3], false, basicCtx.perspectiveMatrix);

		letterPositionVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, letterPositionVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.075, 0.0, 0.0,
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
																			 0.0, 0.0, 1.075]), gl.STATIC_DRAW);

		letterIndexVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, letterIndexVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 1.0, 2.0, 2.0, 1.0, 3.0,
																			 4.0, 5.0, 6.0, 6.0, 5.0, 7.0,
																			 8.0, 9.0, 10.0, 10.0, 9.0, 11.0]), gl.STATIC_DRAW);
		letterTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, letterTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
		letterImage = new Image();
		letterImage.onload = function() {
			gl.bindTexture(gl.TEXTURE_2D, letterTexture);
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, letterImage);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.bindTexture(gl.TEXTURE_2D, null);
			delete this;
		}
		letterImage.src = "preprocess/letters.png";

		this.getBasicCTX = function() {
			return basicCtx;
		};

		this.render = function() {
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
			gl.viewport(540, 270, 270, 270);

			gl.useProgram(axesShader);
			gl.uniformMatrix4fv(axesVarLocs[2], false, basicCtx.peekMatrix());
			gl.bindBuffer(gl.ARRAY_BUFFER, axesVBO);
			gl.vertexAttribPointer(axesVarLocs[0], 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, axesColorsVBO);
			gl.vertexAttribPointer(axesVarLocs[1], 3, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.LINES, 0, 6);

			gl.useProgram(letterShader);
			gl.uniformMatrix4fv(letterVarLocs[2], false, basicCtx.peekMatrix());
			gl.bindBuffer(gl.ARRAY_BUFFER, letterPositionVBO);
			gl.vertexAttribPointer(letterVarLocs[0], 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, letterIndexVBO);
			gl.vertexAttribPointer(letterVarLocs[1], 1, gl.FLOAT, false, 0, 0);
			gl.bindTexture(gl.TEXTURE_2D, letterTexture);
			gl.uniform1i(letterVarLocs[4], letterTexture);
			gl.drawArrays(gl.TRIANGLES, 0, 18);
			gl.bindTexture(gl.TEXTURE_2D, null);

			gl.disable(gl.BLEND);
		};
	}

	return Axes;
} ());