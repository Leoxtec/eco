//This class handles generating and rendering the grid at various heights and spacings

var Grid = (function() {
	function Grid(bctx, BB) {
		var basicCtx = bctx;
		var gl = basicCtx.ctx;

		//used to hold how many vertices to draw at each power of 10 level
		var gridCount = [];
		var grid = 0;
		var gridZPos;
		var gridZOffset = 0.0;
		var gridZinc;		

		var center;
		var radius;

		//create shader for grid, cache the attribute and uniform variable locations
		var gridShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/noColor.vert'), basicCtx.getShaderStr('shaders/magenta.frag'));
		gl.useProgram(gridShader);
		var gridVarLocs = [];
		gridVarLocs.push(gl.getAttribLocation(gridShader, "aVertexPosition"));
		gridVarLocs.push(gl.getUniformLocation(gridShader, "uModelViewMatrix"));
		gridVarLocs.push(gl.getUniformLocation(gridShader, "uProjectionMatrix"));

		//calculate center and extents
		tempSpan = [BB[3] - BB[0], BB[4] - BB[1], BB[5] - BB[2]];
		center = [];
		center[0] = tempSpan[0] * 0.5 + BB[0];
		center[1] = tempSpan[1] * 0.5 + BB[1];
		center[2] = tempSpan[2] * 0.5 + BB[2];

		//set grid's z increment amount to a hundreth of the z extent and set it's
		//default z position the center of the point cloud
		gridZinc = tempSpan[2] / 100.0;
		gridZPos = center[2];
		$("#gPos").val(gridZPos.toFixed(3));

		//set radius to the larger of the x and y extents
		if(tempSpan[0] > tempSpan[1]) {
			tempRadius = tempSpan[0] * 0.5;
		}
		else {
			tempRadius = tempSpan[1] * 0.5;
		}

		//determine largest power of 10 for the radius
		tempExponent = 1;
		while(Math.floor(tempRadius / Math.pow(10.0, tempExponent)) > 0) {
			tempExponent++;
		}
		tempExponent--;

		//expand radius to boundary that is a multiple of the largest power of 10
		tempFactor = Math.pow(10.0, tempExponent);
		tempRadius = Math.ceil(tempRadius / tempFactor) * tempFactor;

		//calculate proper radius that takes into account the z extent
		radius = Math.sqrt(2 * tempRadius * tempRadius + 0.25 * tempSpan[2] * tempSpan[2]);

		//calculate grid lines at largest power of 10 and store the vertex count
		tempArray = new Float32Array((tempRadius * 8 + 4) * 3);
		for(i = 0; i < (tempRadius / tempFactor * 8 + 4) * 3; i += 12) {
			tempArray[i] = center[0] - tempRadius;
			tempArray[i + 3] = center[0] + tempRadius;
			tempArray[i + 1] = tempArray[i + 4] = center[1] + i / 12.0 * tempFactor - tempRadius;
			tempArray[i + 6] = tempArray[i + 9] = center[0] + i / 12.0 * tempFactor - tempRadius;
			tempArray[i + 7] = center[1] - tempRadius;
			tempArray[i + 10] = center[1] + tempRadius;
			tempArray[i + 2] = tempArray[i + 5] = tempArray[i + 8] = tempArray[i + 11] = center[2];
		}
		gridCount.push(i / 3);

		//set current and max value allowed on the slider
		$("#gridSizeSlider").slider("option", "max", tempExponent);
		$("#gridSizeSlider").slider("option", "value", tempExponent);
		$("#gSize").val(tempFactor + " meter(s)");

		//for each power of 10 level between 1 and tempExponent, calculate intermediate grid lines
		//and store vertex count (which includes the counts from previous levels)
		while(tempExponent >= 1) {
			for(var j = 0; j < 2 * tempRadius / tempFactor; j++) {
				for(var k = 1; k < 10; i += 12, k++) {
					tempArray[i] = center[0] - tempRadius;
					tempArray[i + 3] = center[0] + tempRadius;
					tempArray[i + 1] = tempArray[i + 4] = center[1] + (k * 0.1 + j) * tempFactor - tempRadius;
					tempArray[i + 6] = tempArray[i + 9] = center[0] + (k * 0.1 + j) * tempFactor - tempRadius;
					tempArray[i + 7] = center[1] - tempRadius;
					tempArray[i + 10] = center[1] + tempRadius;
					tempArray[i + 2] = tempArray[i + 5] = tempArray[i + 8] = tempArray[i + 11] = center[2];
				}
			}
			gridCount.push(i / 3);
			tempExponent--;
			tempFactor *= 0.1;
		}

		//buffer grid vertices
		var gridVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, gridVBO);
		gl.bufferData(gl.ARRAY_BUFFER, tempArray, gl.STATIC_DRAW);

		//delete temp variables
		delete tempSpan;
		delete tempExponent;
		delete tempFactor;
		delete tempRadius;
		delete tempArray;
		delete i;

		this.getCenter = function() {
			return center;
		}

		this.getRadius = function() {
			return radius;
		}

		this.usePerspective = function() {
			gl.useProgram(gridShader);
			gl.uniformMatrix4fv(gridVarLocs[2], false, basicCtx.perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			gl.useProgram(gridShader);
			gl.uniformMatrix4fv(gridVarLocs[2], false, projectionMatrix);
		};

		this.gridSize = function(g) {
			grid = g;
		}

		this.gridPos = function(p) {
			gridZOffset = p * gridZinc;
			return gridZPos + gridZOffset;
		}

		this.render = function() {
			//draw grid with variable z offset
			gl.useProgram(gridShader);

			//even though junk buffer trick helps avoid disabling and enabling vertex attribute arrays
			//we still need to turn off unused ones
			gl.disableVertexAttribArray(1);
			basicCtx.pushMatrix();
			basicCtx.translate(0.0, 0.0, gridZOffset);
			gl.uniformMatrix4fv(gridVarLocs[1], false, basicCtx.peekMatrix());
			gl.bindBuffer(gl.ARRAY_BUFFER, gridVBO);
			gl.vertexAttribPointer(gridVarLocs[0], 3, gl.FLOAT, false, 0, 0);

			//determine spacing displayed by using precalculated grid counts
			gl.drawArrays(gl.LINES, 0, gridCount[grid]);
			basicCtx.popMatrix();
			gl.enableVertexAttribArray(1);
		};
	}// constructor

	return Grid;
} ());