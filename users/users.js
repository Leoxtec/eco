var Users = (function() {
	function Users(bctx) {
		var basicCtx = bctx;

		var userVBO;
		var userColorsVBO;
		var namePositionVBO;
		var nameIndexVBO;

		var userShader;
		var nameShader;

		var userVarLocs = [];
		var nameVarLocs = [];

		tempBound = 0.1 * Math.tan(Math.PI / 6.0);
		projectionMatrix = M4x4.makeFrustum(-tempBound, tempBound, -tempBound, tempBound, 0.1, 5000.0);

		userShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/basicVertShader.c'), basicCtx.getShaderStr('shaders/basicFragShader.c'));
		basicCtx.ctx.useProgram(userShader);
		userVarLocs.push(basicCtx.ctx.getAttribLocation(userShader, "aVertexPosition"));
		userVarLocs.push(basicCtx.ctx.getAttribLocation(userShader, "aVertexColor"));
		userVarLocs.push(basicCtx.ctx.getUniformLocation(userShader, "uModelViewMatrix"));
		userVarLocs.push(basicCtx.ctx.getUniformLocation(userShader, "uProjectionMatrix"));
		basicCtx.ctx.uniformMatrix4fv(userVarLocs[3], false, projectionMatrix);
		userVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, userVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([    0.0, -4.0, 5.6569,
																			  3.4641,  2.0, 5.6569,
																			 -3.4641,  2.0, 5.6569,
																			     0.0,  0.0,    0.0,
																			  3.4641,  2.0, 5.6569,
																			     0.0, -4.0, 5.6569,
																			     0.0,  0.0,    0.0,
																			 -3.4641,  2.0, 5.6569,
																			  3.4641,  2.0, 5.6569,
																			     0.0,  0.0,    0.0,
																			     0.0, -4.0, 5.6569,
																			 -3.4641,  2.0, 5.6569]), basicCtx.ctx.STATIC_DRAW);

		userColorsVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, userColorsVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([1.0, 1.0, 0.0,
																			 1.0, 1.0, 0.0,
																			 1.0, 1.0, 0.0,
																			 1.0, 1.0, 0.0,
																			 1.0, 1.0, 0.0,
																			 1.0, 1.0, 0.0,
																			 1.0, 1.0, 0.0,
																			 1.0, 1.0, 0.0,
																			 1.0, 1.0, 0.0,
																			 1.0, 1.0, 0.0,
																			 1.0, 1.0, 0.0,
																			 1.0, 1.0, 0.0]), basicCtx.ctx.STATIC_DRAW);

		nameShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/nameVertShader.c'), basicCtx.getShaderStr('shaders/mapFragShader.c'));
		basicCtx.ctx.useProgram(nameShader);
		nameVarLocs.push(basicCtx.ctx.getAttribLocation(nameShader, "aVertexPosition"));
		nameVarLocs.push(basicCtx.ctx.getAttribLocation(nameShader, "aLetterIndex"));
		nameVarLocs.push(basicCtx.ctx.getUniformLocation(nameShader, "uModelViewMatrix"));
		nameVarLocs.push(basicCtx.ctx.getUniformLocation(nameShader, "uProjectionMatrix"));
		nameVarLocs.push(basicCtx.ctx.getUniformLocation(nameShader, "uSampler"));
		basicCtx.ctx.uniformMatrix4fv(nameVarLocs[3], false, projectionMatrix);

		namePositionVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, namePositionVBO);
		// basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([1.075, 0.0, 0.0,
		// 																	 0.0, 1.075, 0.0,
		// 																	 0.0, 0.0, 1.075]), basicCtx.ctx.STATIC_DRAW);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([0.0, 0.0, 7.0,
																			 0.0, 0.0, 7.0,
																			 0.0, 0.0, 7.0,
																			 0.0, 0.0, 7.0,
																			 0.0, 0.0, 7.0,
																			 0.0, 0.0, 7.0]), basicCtx.ctx.STATIC_DRAW);

		nameIndexVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, nameIndexVBO);
		// basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([0.0, 1.0, 2.0]), basicCtx.ctx.STATIC_DRAW);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([0.0, 1.0, 2.0, 2.0, 1.0, 3.0]), basicCtx.ctx.STATIC_DRAW);
		letterTexture = basicCtx.ctx.createTexture();
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

		delete projectionMatrix;
		delete tempBound;

		this.getBasicCTX = function() {
			return basicCtx;
		};

		this.render = function() {
			if(basicCtx) {
				// basicCtx.ctx.viewport(540, 270, 270, 270);

				basicCtx.ctx.useProgram(userShader);
				basicCtx.ctx.uniformMatrix4fv(userVarLocs[2], false, basicCtx.peekMatrix());
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, userVBO);
				basicCtx.ctx.vertexAttribPointer(userVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(userVarLocs[0]);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, userColorsVBO);
				basicCtx.ctx.vertexAttribPointer(userVarLocs[1], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(userVarLocs[1]);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLES, 0, 12);
				basicCtx.ctx.disableVertexAttribArray(userVarLocs[0]);
				basicCtx.ctx.disableVertexAttribArray(userVarLocs[1]);

				basicCtx.ctx.enable(basicCtx.ctx.BLEND);
				basicCtx.ctx.blendFunc(basicCtx.ctx.SRC_ALPHA, basicCtx.ctx.ONE);

				basicCtx.ctx.useProgram(nameShader);
				basicCtx.ctx.uniformMatrix4fv(nameVarLocs[2], false, basicCtx.peekMatrix());
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, namePositionVBO);
				basicCtx.ctx.vertexAttribPointer(nameVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(nameVarLocs[0]);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, nameIndexVBO);
				basicCtx.ctx.vertexAttribPointer(nameVarLocs[1], 1, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(nameVarLocs[1]);
				basicCtx.ctx.activeTexture(basicCtx.ctx.TEXTURE0);
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, letterTexture);
				basicCtx.ctx.uniform1i(nameVarLocs[4], letterTexture);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLES, 0, 6);
				basicCtx.ctx.disableVertexAttribArray(nameVarLocs[0]);
				basicCtx.ctx.disableVertexAttribArray(nameVarLocs[1]);
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);

				basicCtx.ctx.disable(basicCtx.ctx.BLEND);
			}
		};
	}

	return Users;
} ());