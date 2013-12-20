var Grid = (function() {
	function Grid(bctx) {
		var basicCtx = bctx;

		var gridVBO;
		var gridCount = [];
		var grid = 0;
		var gridZPos;
		var gridZOffset = 0.0;
		var gridZinc;

		var gridShader;

		var gridVarLocs = [];

		var tempCenter;
		var tempRadius;

		gridShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/gridVertShader.c'), basicCtx.getShaderStr('shaders/gridFragShader.c'));
		basicCtx.ctx.useProgram(gridShader);
		gridVarLocs.push(basicCtx.ctx.getAttribLocation(gridShader, "aVertexPosition"));
		gridVarLocs.push(basicCtx.ctx.getUniformLocation(gridShader, "uModelViewMatrix"));
		gridVarLocs.push(basicCtx.ctx.getUniformLocation(gridShader, "uProjectionMatrix"));

		xmlhttpForBB = new XMLHttpRequest();
		xmlhttpForBB.open("GET", "action.php?a=getnode&path=r&table=point_pick_test_sep", false);
		xmlhttpForBB.send();
		BB = JSON.parse(xmlhttpForBB.responseText).BB;

		tempSpan = [BB[3] - BB[0], BB[4] - BB[1], BB[5] - BB[2]];
		tempCenter = [];
		tempCenter[0] = tempSpan[0] * 0.5 + BB[0];
		tempCenter[1] = tempSpan[1] * 0.5 + BB[1];
		tempCenter[2] = tempSpan[2] * 0.5 + BB[2];

		gridZinc = tempSpan[2] / 100.0;
		gridZPos = tempCenter[2];
		$("#gPos").val(gridZPos.toFixed(3));
		if(tempSpan[0] > tempSpan[1]) {
			tempRadius1 = tempSpan[0] * 0.5;
		}
		else {
			tempRadius1 = tempSpan[1] * 0.5;
		}

		tempExponent = 1;
		while(Math.floor(tempRadius1 / Math.pow(10.0, tempExponent)) > 0) {
			tempExponent++;
		}
		tempExponent--;
		tempFactor = Math.pow(10.0, tempExponent);
		tempRadius2 = Math.ceil(tempRadius1 / tempFactor) * tempFactor;
		tempRadius = Math.sqrt(2 * tempRadius2 * tempRadius2 + 0.25 * tempSpan[2] * tempSpan[2]);

		tempArray = new Float32Array((tempRadius2 * 8 + 4) * 3);
		for(i = 0; i < (tempRadius2 / tempFactor * 8 + 4) * 3; i += 12) {
			tempArray[i] = tempCenter[0] - tempRadius2;
			tempArray[i + 3] = tempCenter[0] + tempRadius2;
			tempArray[i + 1] = tempArray[i + 4] = tempCenter[1] + i / 12.0 * tempFactor - tempRadius2;
			tempArray[i + 6] = tempArray[i + 9] = tempCenter[0] + i / 12.0 * tempFactor - tempRadius2;
			tempArray[i + 7] = tempCenter[1] - tempRadius2;
			tempArray[i + 10] = tempCenter[1] + tempRadius2;
			tempArray[i + 2] = tempArray[i + 5] = tempArray[i + 8] = tempArray[i + 11] = tempCenter[2];
		}
		gridCount.push(i / 3);
		$("#gridSizeSlider").slider("option", "max", tempExponent);
		$("#gridSizeSlider").slider("option", "value", tempExponent);
		$("#gSize").val(tempFactor + " meter(s)");
		while(tempExponent >= 1) {
			for(var j = 0; j < 2 * tempRadius2 / tempFactor; j++) {
				for(var k = 1; k < 10; i += 12, k++) {
					tempArray[i] = tempCenter[0] - tempRadius2;
					tempArray[i + 3] = tempCenter[0] + tempRadius2;
					tempArray[i + 1] = tempArray[i + 4] = tempCenter[1] + (k * 0.1 + j) * tempFactor - tempRadius2;
					tempArray[i + 6] = tempArray[i + 9] = tempCenter[0] + (k * 0.1 + j) * tempFactor - tempRadius2;
					tempArray[i + 7] = tempCenter[1] - tempRadius2;
					tempArray[i + 10] = tempCenter[1] + tempRadius2;
					tempArray[i + 2] = tempArray[i + 5] = tempArray[i + 8] = tempArray[i + 11] = tempCenter[2];
				}
			}
			gridCount.push(i / 3);
			tempExponent--;
			tempFactor *= 0.1;
		}
		gridVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, gridVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, tempArray, basicCtx.ctx.STATIC_DRAW);

		delete xmlhttpForBB;
		delete BB;
		delete tempSpan;
		delete tempExponent;
		delete tempFactor;
		delete tempRadius1;
		delete tempRadius2;
		delete tempArray;
		delete i;


		this.getCenter = function() {
			return tempCenter;
		}

		this.getRadius = function() {
			return tempRadius;
		}


		this.usePerspective = function() {
			basicCtx.ctx.useProgram(gridShader);
			basicCtx.ctx.uniformMatrix4fv(gridVarLocs[2], false, basicCtx.perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			basicCtx.ctx.useProgram(gridShader);
			basicCtx.ctx.uniformMatrix4fv(gridVarLocs[2], false, projectionMatrix);
		};

		this.gridSize = function(g) {
			grid = g;
		}

		this.gridPos = function(p) {
			gridZOffset = p * gridZinc;
			return gridZPos + gridZOffset;
		}

		this.render = function() {
			if(basicCtx) {
				basicCtx.ctx.useProgram(gridShader);
				basicCtx.pushMatrix();
				basicCtx.translate(0.0, 0.0, gridZOffset);
				basicCtx.ctx.uniformMatrix4fv(gridVarLocs[1], false, basicCtx.peekMatrix());
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, gridVBO);
				basicCtx.ctx.vertexAttribPointer(gridVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.enableVertexAttribArray(gridVarLocs[0]);
				basicCtx.ctx.drawArrays(basicCtx.ctx.LINES, 0, gridCount[grid]);
				basicCtx.ctx.disableVertexAttribArray(gridVarLocs[0]);
				basicCtx.popMatrix();
			}
		};
	}// constructor

	return Grid;
} ());
