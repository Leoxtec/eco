var Axes = (function() {

	/**
		@private
	*/
	function Axes(cvsElement) {
		var basicCtx = new BasicCTX();
		basicCtx.setup(cvsElement);

		var axesVBO;
		var axesColorsVBO;
		var northLeftVBO;
		var northMiddleVBO;
		var northRightVBO;
		var northColorVBO;
		var eastBottomVBO;
		var eastMiddleVBO;
		var eastTopVBO;
		var upwardVBO;

		this.getBasicCTX = function() {
			return basicCtx;
		};

		var axesShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/basicVertShader.txt'), basicCtx.getShaderStr('shaders/basicFragShader.txt'));
		basicCtx.ctx.useProgram(axesShader);
		basicCtx.uniformMatrix(axesShader, "ps_ProjectionMatrix", false, basicCtx.perspectiveMatrix);

		this.render = function(pan, tilt) {
			// Don't bother doing any work if we don't have a context yet.
			if(basicCtx) {
				basicCtx.ctx.useProgram(axesShader);
				var topMatrix = basicCtx.peekMatrix();
				basicCtx.uniformMatrix(axesShader, "ps_ModelViewMatrix", false, topMatrix);
				basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, axesVBO.VBO);
				basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, axesColorsVBO.VBO);
				basicCtx.ctx.drawArrays(basicCtx.ctx.LINES, 0, axesVBO.length / 3);
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				basicCtx.pushMatrix();
				basicCtx.loadMatrix(M4x4.I);
				var factor = 1 / 52.5;
				basicCtx.scale(factor, factor, factor);
				basicCtx.rotateZ(pan);
				basicCtx.rotateX(tilt);
				var tempMatrix = basicCtx.peekMatrix();
				basicCtx.popMatrix();
				basicCtx.pushMatrix();		
				basicCtx.translate(0, 1.075, 0);
				basicCtx.multMatrix(tempMatrix);
				topMatrix = basicCtx.peekMatrix();		
				basicCtx.uniformMatrix(axesShader, "ps_ModelViewMatrix", false, topMatrix);	
				basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, northLeftVBO.VBO);
				basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, northLeftVBO.length / 3);
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, northMiddleVBO.VBO);
				basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, northMiddleVBO.length / 3);
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, northRightVBO.VBO);
				basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, northRightVBO.length / 3);
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				basicCtx.popMatrix();
				basicCtx.pushMatrix();
				basicCtx.translate(1.075, 0, 0);
				basicCtx.multMatrix(tempMatrix);
				topMatrix = basicCtx.peekMatrix();		
				basicCtx.uniformMatrix(axesShader, "ps_ModelViewMatrix", false, topMatrix);	
				basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, northLeftVBO.VBO);
				basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, northLeftVBO.length / 3);
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, eastBottomVBO.VBO);
				basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, eastBottomVBO.length / 3);
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, eastMiddleVBO.VBO);
				basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, eastMiddleVBO.length / 3);
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, eastTopVBO.VBO);
				basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, eastTopVBO.length / 3);
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				basicCtx.popMatrix();
				basicCtx.translate(0, 0, 1.075);
				basicCtx.multMatrix(tempMatrix);
				topMatrix = basicCtx.peekMatrix();
				basicCtx.uniformMatrix(axesShader, "ps_ModelViewMatrix", false, topMatrix);
				basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, upwardVBO.VBO);
				basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, upwardVBO.length / 3);
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");
			}
		};
	
	
		this.initializeAxes = function() {
			var axes = new Float32Array([0.0,0.0,0.0,
										 1.0,0.0,0.0,
										 0.0,0.0,0.0,
										 0.0,1.0,0.0,
										 0.0,0.0,0.0,
										 0.0,0.0,1.0]);
									 
			var axesColors = new Float32Array([1.0,0.0,0.0,
											   1.0,0.0,0.0,
											   0.0,1.0,0.0, 
											   0.0,1.0,0.0, 
											   0.0,0.0,1.0,
											   0.0,0.0,1.0]);
			axesVBO = basicCtx.createBufferObject(axes);
			axesColorsVBO = basicCtx.createBufferObject(axesColors);
			
			var northTemp = new Float32Array([-2.5, 0.0, -3.5,
											  -1.5, 0.0, -3.5,
											  -2.5, 0.0, -2.5,
											  -1.5, 0.0, -1.5,
											  -2.5, 0.0, -0.5,
											  -1.5, 0.0, 0.5,
											  -2.5, 0.0, 1.5,
											  -1.5, 0.0, 2.5,
											  -2.5, 0.0, 3.5]);
			northLeftVBO = basicCtx.createBufferObject(northTemp);
			for(var i = 0; i < northTemp.length; i++) {
				northTemp[i] *= -1;
			}
			northRightVBO = basicCtx.createBufferObject(northTemp);
			northTemp = new Float32Array([-1.5, 0.0, 3.5,
										  -2.5, 0.0, 3.5,
										  -0.5/3, 0.0, 3.5/3,
										  -0.5, 0.0, 0.0,
										  3.5/3, 0.0, -3.5/3,
										  1.5, 0.0, -3.5,
										  2.5, 0.0, -3.5]);
			northMiddleVBO = basicCtx.createBufferObject(northTemp);
			northTemp = new Float32Array(51);
			for(var i = 0; i < 51; i++) {
				northTemp[i] = 1.0;
			}
			northColorVBO = basicCtx.createBufferObject(northTemp);
			northTemp = new Float32Array([2.5, 0.0, -3.5,
										  2.5, 0.0, -2.5,
										  0.5, 0.0, -3.5,
										  -1.5, 0.0, -2.5,
										  -1.5, 0.0, -3.5]);
			eastBottomVBO = basicCtx.createBufferObject(northTemp);
			northTemp = new Float32Array([1.5, 0.0, -0.5,
										  1.5, 0.0, 0.5,
										  0.0, 0.0, -0.5,
										  -1.5, 0.0, 0.5,
										  -1.5, 0.0, -0.5]);
			eastMiddleVBO = basicCtx.createBufferObject(northTemp);
			northTemp = new Float32Array([2.5, 0.0, 2.5,
										  2.5, 0.0, 3.5,
										  0.5, 0.0, 2.5,
										  -1.5, 0.0, 3.5,
										  -1.5, 0.0, 2.5,
										  -2.5, 0.0, 3.5]);
			eastTopVBO = basicCtx.createBufferObject(northTemp);
			northTemp = new Float32Array([2.5, 0.0, 3.5,
										  1.5, 0.0, 3.5,
										  2.5, 0.0, 1.5,
										  1.5, 0.0, -0.5,
										  2.5, 0.0, -2.5,
										  1.5, 0.0, -2.2,
										  1.5, 0.0, -3.5,
										  1.2, 0.0, -2.5,
										  0.0, 0.0, -3.5,
										  -1.2, 0.0, -2.5,
										  -1.5, 0.0, -3.5,
										  -1.5, 0.0, -2.2,
										  -2.5, 0.0, -2.5,
										  -1.5, 0.0, -0.5,
										  -2.5, 0.0, 1.5,
										  -1.5, 0.0, 3.5,
										  -2.5, 0.0, 3.5]);
			upwardVBO = basicCtx.createBufferObject(northTemp);
		};
	}// constructor

	return Axes;
} ());