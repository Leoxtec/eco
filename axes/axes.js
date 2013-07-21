var Axes = (function() {

	function Axes(cvsElement) {
		var basicCtx = new BasicCTX();
		basicCtx.setup(cvsElement);

		var axesVBO;
		var axesColorsVBO;
		var letterPositionVBO;
		var letterIndexVBO;

		var axesShader;
		var letterShader;

		var axesVarLocs = [];
		var letterVarLocs = [];

		axesShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/basicVertShader.c'), basicCtx.getShaderStr('shaders/basicFragShader.c'));
		basicCtx.ctx.useProgram(axesShader);
		axesVarLocs.push(basicCtx.ctx.getAttribLocation(axesShader, "aVertexPosition"));
		axesVarLocs.push(basicCtx.ctx.getAttribLocation(axesShader, "aVertexColor"));
		axesVarLocs.push(basicCtx.ctx.getUniformLocation(axesShader, "uModelViewMatrix"));
		axesVarLocs.push(basicCtx.ctx.getUniformLocation(axesShader, "uProjectionMatrix"));
		basicCtx.ctx.uniformMatrix4fv(axesVarLocs[3], false, basicCtx.perspectiveMatrix);
		basicCtx.ctx.enableVertexAttribArray(axesVarLocs[0]);
		basicCtx.ctx.enableVertexAttribArray(axesVarLocs[1]);
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

		letterShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/axesLetterVertShader.c'), basicCtx.getShaderStr('shaders/axesLetterFragShader.c'));
		basicCtx.ctx.useProgram(letterShader);
		letterVarLocs.push(basicCtx.ctx.getAttribLocation(letterShader, "aVertexPosition"));
		letterVarLocs.push(basicCtx.ctx.getAttribLocation(letterShader, "aLetterIndex"));
		letterVarLocs.push(basicCtx.ctx.getUniformLocation(letterShader, "uModelViewMatrix"));
		letterVarLocs.push(basicCtx.ctx.getUniformLocation(letterShader, "uProjectionMatrix"));
		letterVarLocs.push(basicCtx.ctx.getUniformLocation(letterShader, "uSizeFactor"));
		letterVarLocs.push(basicCtx.ctx.getUniformLocation(letterShader, "uSampler"));
		basicCtx.ctx.uniformMatrix4fv(letterVarLocs[3], false, basicCtx.perspectiveMatrix);
		basicCtx.ctx.uniform1f(letterVarLocs[4], (basicCtx.height * (7.0 / 105.0)) / Math.tan(Math.PI / 6.0));
		basicCtx.ctx.enableVertexAttribArray(letterVarLocs[0]);
		basicCtx.ctx.enableVertexAttribArray(letterVarLocs[1]);
		letterPositionVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, letterPositionVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([1.075, 0.0, 0.0,
																			 0.0, 1.075, 0.0,
																			 0.0, 0.0, 1.075]), basicCtx.ctx.STATIC_DRAW);
		letterIndexVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, letterIndexVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([0.0, 1.0, 2.0]), basicCtx.ctx.STATIC_DRAW);
		letterTexture = basicCtx.ctx.createTexture();
		letterImage = new Image();
		letterImage.onload = function() {
			basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, letterTexture);
			basicCtx.ctx.pixelStorei(basicCtx.ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
			basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, letterImage);
			basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MIN_FILTER, basicCtx.ctx.NEAREST);
			basicCtx.ctx.useProgram(letterShader);
			basicCtx.ctx.activeTexture(basicCtx.ctx.TEXTURE0);
			basicCtx.ctx.uniform1i(letterVarLocs[5], letterTexture);
			delete letterTexture;
			delete this;
		}
		letterImage.src = "http://localhost/repos/kensdevelopment/preprocess/letters.png";

		basicCtx.ctx.enable(basicCtx.ctx.BLEND);
		basicCtx.ctx.blendFunc(basicCtx.ctx.SRC_ALPHA, basicCtx.ctx.ONE);

		this.getBasicCTX = function() {
			return basicCtx;
		};

		this.render = function() {
			if(basicCtx) {
				var topMatrix = basicCtx.peekMatrix();
				basicCtx.ctx.useProgram(axesShader);
				basicCtx.ctx.uniformMatrix4fv(axesVarLocs[2], false, topMatrix);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, axesVBO);
				basicCtx.ctx.vertexAttribPointer(axesVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, axesColorsVBO);
				basicCtx.ctx.vertexAttribPointer(axesVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.drawArrays(basicCtx.ctx.LINES, 0, 6);

				basicCtx.ctx.useProgram(letterShader);
				basicCtx.ctx.uniformMatrix4fv(letterVarLocs[2], false, topMatrix);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, letterPositionVBO);
				basicCtx.ctx.vertexAttribPointer(letterVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, letterIndexVBO);
				basicCtx.ctx.vertexAttribPointer(letterVarLocs[1], 1, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.drawArrays(basicCtx.ctx.POINTS, 0, 3);
			}
		};
	}

	return Axes;
} ());