//This class handles displaying the map as well as an arrow to indicate the user's currennt
//position and (top down) orientation

var Map = (function() {
	function Map(bctx, orthoSize) {
		var basicCtx = bctx;
		var gl = basicCtx.ctx;

		//view never changes for the map display
		var viewMatrix = M4x4.makeLookAt(V3.$(0, 0, 80), V3.$(0, 0, 0), V3.$(0, 1, 0));
		
		//used to ensure that the arrow size doesn't change for different sized maps
		arrowAspect = orthoSize / 31.25;

		//build ortho projection
		var ymax = orthoSize - 4 * arrowAspect;
		var ymin = -ymax;
		var xmin = ymin;
		var xmax = ymax;
		orthographicMatrix = M4x4.makeOrtho(-orthoSize, orthoSize, -orthoSize, orthoSize, 0.1, 1000);

		//create shader for arrow, cache the attribute and uniform variable locations
		//and initialize projection matrix
		var arrowShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/noColor.vert'), basicCtx.getShaderStr('shaders/magenta.frag'));
		gl.useProgram(arrowShader);
		var arrowVarLocs = [];
		arrowVarLocs.push(gl.getAttribLocation(arrowShader, "aVertexPosition"));
		arrowVarLocs.push(gl.getUniformLocation(arrowShader, "uModelViewMatrix"));
		arrowVarLocs.push(gl.getUniformLocation(arrowShader, "uProjectionMatrix"));
		gl.uniformMatrix4fv(arrowVarLocs[2], false, orthographicMatrix);

		//arrow vertices
		var arrowVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, arrowVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5 * arrowAspect, -6.0 * arrowAspect, 50.0,
														  0.5 * arrowAspect, -6.0 * arrowAspect, 50.0,
														  0.5 * arrowAspect, -2.0 * arrowAspect, 50.0,
														 -0.5 * arrowAspect, -6.0 * arrowAspect, 50.0,
														  0.5 * arrowAspect, -2.0 * arrowAspect, 50.0,
														 -0.5 * arrowAspect, -2.0 * arrowAspect, 50.0,
														  0.0 * arrowAspect,  0.0 * arrowAspect, 50.0,
														 -1.5 * arrowAspect, -2.0 * arrowAspect, 50.0,
														  1.5 * arrowAspect, -2.0 * arrowAspect, 50.0]), gl.STATIC_DRAW);

		//create shader for map texture, cache the attribute and uniform variable locations
		//and initialize view and projection matrices
		var mapShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/map.vert'), basicCtx.getShaderStr('shaders/basicTexture.frag'));
		gl.useProgram(mapShader);
		var mapVarLocs = [];
		mapVarLocs.push(gl.getAttribLocation(mapShader, "aVertexPosition"));
		mapVarLocs.push(gl.getAttribLocation(mapShader, "aTexCoord"));
		mapVarLocs.push(gl.getUniformLocation(mapShader, "uModelViewMatrix"));
		mapVarLocs.push(gl.getUniformLocation(mapShader, "uProjectionMatrix"));
		mapVarLocs.push(gl.getUniformLocation(mapShader, "uSampler"));
		gl.uniformMatrix4fv(mapVarLocs[2], false, viewMatrix);
		gl.uniformMatrix4fv(mapVarLocs[3], false, orthographicMatrix);

		//these two VBO should really be combined into one
		var mapTexCoords = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, mapTexCoords);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0, 0.0,
														 1.0, 1.0,
														 0.0, 0.0,
														 0.0, 1.0]), gl.STATIC_DRAW);
		var mapVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, mapVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ orthoSize, -orthoSize, 0.0,
														  orthoSize,  orthoSize, 0.0,
														 -orthoSize, -orthoSize, 0.0,
														 -orthoSize,  orthoSize, 0.0]), gl.STATIC_DRAW);

		//set texture parameters and load texture image
		mapTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, mapTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
		mapImage = new Image();
		mapImage.onload = function() {
			gl.bindTexture(gl.TEXTURE_2D, mapTexture);
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mapImage);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.bindTexture(gl.TEXTURE_2D, null);
			delete this;
		}
		mapImage.src = "StartupTextures/map.png";

		//delete temp variables
		delete orthographicMatrix;
		delete arrowAspect;

		this.render = function(pos, pan) {
			var arrowPos = V3.clone(pos);
			var offTheMap = false;

			//clamp arrow to map boundaries
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

			//BROWSER_RESIZE
			gl.viewport(540, 0, 270, 270);

			//draw map
			gl.useProgram(mapShader);
			gl.bindBuffer(gl.ARRAY_BUFFER, mapVBO);
			gl.vertexAttribPointer(mapVarLocs[0], 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, mapTexCoords);
			gl.vertexAttribPointer(mapVarLocs[1], 2, gl.FLOAT, false, 0, 0);
			gl.bindTexture(gl.TEXTURE_2D, mapTexture);
			gl.uniform1i(mapVarLocs[4], mapTexture);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			gl.bindTexture(gl.TEXTURE_2D, null);

			//draw arrow
			gl.useProgram(arrowShader);
			basicCtx.pushMatrix();
			basicCtx.multMatrix(viewMatrix);
			basicCtx.translate(arrowPos[0], arrowPos[1], 0.0);
			basicCtx.rotateZ(pan);
			gl.uniformMatrix4fv(arrowVarLocs[1], false, basicCtx.peekMatrix());
			gl.bindBuffer(gl.ARRAY_BUFFER, arrowVBO);
			gl.vertexAttribPointer(arrowVarLocs[0], 3, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.TRIANGLES, 0, 9);
			basicCtx.popMatrix();

			//display an indicator if the arrow is off the map
			if(offTheMap) {
				$("#onOffMap").val('Off the map');
			}
			else {
				$("#onOffMap").val('');
			}
		};
	}

	return Map;
} ());