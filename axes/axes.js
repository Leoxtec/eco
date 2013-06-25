var Axes = (function() {

	/**
		@private
	*/
	function Axes(cvsElement) {
		this.basicCtx = new BasicCTX();
		this.basicCtx.setup(cvsElement);

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

		var axesShader = this.basicCtx.createProgramObject(this.basicCtx.getShaderStr('shaders/basicVertShader.txt'), this.basicCtx.getShaderStr('shaders/basicFragShader.txt'));
		this.basicCtx.ctx.useProgram(axesShader);
		this.basicCtx.uniformMatrix(axesShader, "ps_ProjectionMatrix", false, this.basicCtx.perspectiveMatrix);

		this.render2 = function(pan, tilt) {
			// Don't bother doing any work if we don't have a context yet.
			if(this.basicCtx) {
				this.basicCtx.ctx.useProgram(axesShader);
				var topMatrix = this.basicCtx.peekMatrix();
				this.basicCtx.uniformMatrix(axesShader, "ps_ModelViewMatrix", false, topMatrix);
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, axesVBO.VBO);
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, axesColorsVBO.VBO);
				this.basicCtx.ctx.drawArrays(this.basicCtx.ctx.LINES, 0, axesVBO.length / 3);
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				this.basicCtx.pushMatrix();
				this.basicCtx.loadMatrix(M4x4.I);
				var factor = 1 / 52.5;
				this.basicCtx.scale(factor, factor, factor);
				this.basicCtx.rotateZ(pan);
				this.basicCtx.rotateX(tilt);
				var tempMatrix = this.basicCtx.peekMatrix();
				this.basicCtx.popMatrix();
				this.basicCtx.pushMatrix();		
				this.basicCtx.translate(0, 1.075, 0);
				this.basicCtx.multMatrix(tempMatrix);
				topMatrix = this.basicCtx.peekMatrix();		
				this.basicCtx.uniformMatrix(axesShader, "ps_ModelViewMatrix", false, topMatrix);	
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, northLeftVBO.VBO);
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				this.basicCtx.ctx.drawArrays(this.basicCtx.ctx.TRIANGLE_STRIP, 0, northLeftVBO.length / 3);
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				this.basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, northMiddleVBO.VBO);
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				this.basicCtx.ctx.drawArrays(this.basicCtx.ctx.TRIANGLE_STRIP, 0, northMiddleVBO.length / 3);
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				this.basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, northRightVBO.VBO);
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				this.basicCtx.ctx.drawArrays(this.basicCtx.ctx.TRIANGLE_STRIP, 0, northRightVBO.length / 3);
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				this.basicCtx.popMatrix();
				this.basicCtx.pushMatrix();
				this.basicCtx.translate(1.075, 0, 0);
				this.basicCtx.multMatrix(tempMatrix);
				topMatrix = this.basicCtx.peekMatrix();		
				this.basicCtx.uniformMatrix(axesShader, "ps_ModelViewMatrix", false, topMatrix);	
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, northLeftVBO.VBO);
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				this.basicCtx.ctx.drawArrays(this.basicCtx.ctx.TRIANGLE_STRIP, 0, northLeftVBO.length / 3);
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				this.basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, eastBottomVBO.VBO);
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				this.basicCtx.ctx.drawArrays(this.basicCtx.ctx.TRIANGLE_STRIP, 0, eastBottomVBO.length / 3);
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				this.basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, eastMiddleVBO.VBO);
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				this.basicCtx.ctx.drawArrays(this.basicCtx.ctx.TRIANGLE_STRIP, 0, eastMiddleVBO.length / 3);
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				this.basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, eastTopVBO.VBO);
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				this.basicCtx.ctx.drawArrays(this.basicCtx.ctx.TRIANGLE_STRIP, 0, eastTopVBO.length / 3);
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");

				this.basicCtx.popMatrix();
				this.basicCtx.translate(0, 0, 1.075);
				this.basicCtx.multMatrix(tempMatrix);
				topMatrix = this.basicCtx.peekMatrix();
				this.basicCtx.uniformMatrix(axesShader, "ps_ModelViewMatrix", false, topMatrix);
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexPosition", 3, upwardVBO.VBO);
				this.basicCtx.vertexAttribPointer(axesShader, "aVertexColor", 3, northColorVBO.VBO);
				this.basicCtx.ctx.drawArrays(this.basicCtx.ctx.TRIANGLE_STRIP, 0, upwardVBO.length / 3);
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexPosition");
				this.basicCtx.disableVertexAttribPointer(axesShader, "aVertexColor");
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
			axesVBO = this.basicCtx.createBufferObject(axes);
			axesColorsVBO = this.basicCtx.createBufferObject(axesColors);
			
			var northTemp = new Float32Array([-2.5, 0.0, -3.5,
											  -1.5, 0.0, -3.5,
											  -2.5, 0.0, -2.5,
											  -1.5, 0.0, -1.5,
											  -2.5, 0.0, -0.5,
											  -1.5, 0.0, 0.5,
											  -2.5, 0.0, 1.5,
											  -1.5, 0.0, 2.5,
											  -2.5, 0.0, 3.5]);
			northLeftVBO = this.basicCtx.createBufferObject(northTemp);
			for(var i = 0; i < northTemp.length; i++) {
				northTemp[i] *= -1;
			}
			northRightVBO = this.basicCtx.createBufferObject(northTemp);
			northTemp = new Float32Array([-1.5, 0.0, 3.5,
										  -2.5, 0.0, 3.5,
										  -0.5/3, 0.0, 3.5/3,
										  -0.5, 0.0, 0.0,
										  3.5/3, 0.0, -3.5/3,
										  1.5, 0.0, -3.5,
										  2.5, 0.0, -3.5]);
			northMiddleVBO = this.basicCtx.createBufferObject(northTemp);
			northTemp = new Float32Array(51);
			for(var i = 0; i < 51; i++) {
				northTemp[i] = 1.0;
			}
			northColorVBO = this.basicCtx.createBufferObject(northTemp);
			northTemp = new Float32Array([2.5, 0.0, -3.5,
										  2.5, 0.0, -2.5,
										  0.5, 0.0, -3.5,
										  -1.5, 0.0, -2.5,
										  -1.5, 0.0, -3.5]);
			eastBottomVBO = this.basicCtx.createBufferObject(northTemp);
			northTemp = new Float32Array([1.5, 0.0, -0.5,
										  1.5, 0.0, 0.5,
										  0.0, 0.0, -0.5,
										  -1.5, 0.0, 0.5,
										  -1.5, 0.0, -0.5]);
			eastMiddleVBO = this.basicCtx.createBufferObject(northTemp);
			northTemp = new Float32Array([2.5, 0.0, 2.5,
										  2.5, 0.0, 3.5,
										  0.5, 0.0, 2.5,
										  -1.5, 0.0, 3.5,
										  -1.5, 0.0, 2.5,
										  -2.5, 0.0, 3.5]);
			eastTopVBO = this.basicCtx.createBufferObject(northTemp);
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
			upwardVBO = this.basicCtx.createBufferObject(northTemp);
		};
	}// constructor

	return Axes;
} ());