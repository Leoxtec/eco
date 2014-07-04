//This class handles rendering 3D axes to show the user his/her current 3D orientation

var Axes = (function() {
	function Axes(bctx) {
		var basicCtx = bctx;
		var gl = basicCtx.ctx;

		//create shader for axes, cache the attribute and uniform variable locations
		//and initialize projection matrix
		var axesShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/basic.vert'), basicCtx.getShaderStr('shaders/basic.frag'));
		gl.useProgram(axesShader);
		var axesVarLocs = [];
		axesVarLocs.push(gl.getAttribLocation(axesShader, "aVertexPosition"));
		axesVarLocs.push(gl.getAttribLocation(axesShader, "aVertexColor"));
		axesVarLocs.push(gl.getUniformLocation(axesShader, "uModelViewMatrix"));
		axesVarLocs.push(gl.getUniformLocation(axesShader, "uProjectionMatrix"));
		gl.uniformMatrix4fv(axesVarLocs[3], false, basicCtx.perspectiveMatrix);

		//axes lines vertices
		var axesVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, axesVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0,0.0,0.0,
														 1.0,0.0,0.0,
														 0.0,0.0,0.0,
														 0.0,1.0,0.0,
														 0.0,0.0,0.0,
														 0.0,0.0,1.0]), gl.STATIC_DRAW);

		//axes lines colors
		var axesColorsVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, axesColorsVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0,0.0,0.0,
														 1.0,0.0,0.0,
														 0.0,1.0,0.0, 
														 0.0,1.0,0.0, 
														 0.0,0.0,1.0,
														 0.0,0.0,1.0]), gl.STATIC_DRAW);

		//create shader for letters (to show East, North and Up) and cache the attribute and uniform variable locations
		//and initialize projection matrix
		var letterShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/letter.vert'), basicCtx.getShaderStr('shaders/basicTexture.frag'));
		gl.useProgram(letterShader);
		var letterVarLocs = [];
		letterVarLocs.push(gl.getAttribLocation(letterShader, "aVertexPosition"));
		letterVarLocs.push(gl.getAttribLocation(letterShader, "aLetterIndex"));
		letterVarLocs.push(gl.getUniformLocation(letterShader, "uModelViewMatrix"));
		letterVarLocs.push(gl.getUniformLocation(letterShader, "uProjectionMatrix"));
		letterVarLocs.push(gl.getUniformLocation(letterShader, "uSampler"));
		gl.uniformMatrix4fv(letterVarLocs[3], false, basicCtx.perspectiveMatrix);

		//letter texture vertices
		//sending the same vertex and using the shader to offset
		var letterPositionVBO = gl.createBuffer();
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

		//have to use our own indices as webGL does not have auto generated vertex id
		var letterIndexVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, letterIndexVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 1.0, 2.0, 2.0, 1.0, 3.0,
														 4.0, 5.0, 6.0, 6.0, 5.0, 7.0,
														 8.0, 9.0, 10.0, 10.0, 9.0, 11.0]), gl.STATIC_DRAW);

		//set texture parameters and load texture image
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

		this.render = function() {
			//use blending to void rendering the letter's background
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

			//BROWSER_RESIZE
			gl.viewport(540, 270, 270, 270);

			//draw axes
			gl.useProgram(axesShader);
			gl.uniformMatrix4fv(axesVarLocs[2], false, basicCtx.peekMatrix());
			gl.bindBuffer(gl.ARRAY_BUFFER, axesVBO);
			gl.vertexAttribPointer(axesVarLocs[0], 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, axesColorsVBO);
			gl.vertexAttribPointer(axesVarLocs[1], 3, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.LINES, 0, 6);

			//draw letters
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