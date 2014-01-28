var Users = (function() {
	function Users(bctx) {
		var basicCtx = bctx;

		var userVBO;
		var nameIndexVBO;

		var userShader;
		var nameShader;

		var userVarLocs = [];
		var nameVarLocs = [];

		var perspectiveMatrix;

		var canv2d;
		var body2d;
		var texImage2d;
		var ctx2d;
		var currentUsers;
		var timeStamp;
		var nameTexture = [];

		tempBound = 0.1 * Math.tan(Math.PI / 6.0);
		perspectiveMatrix = M4x4.makeFrustum(-tempBound, tempBound, -tempBound, tempBound, 0.1, 5000.0);

		userShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/uniformColor.vert'), basicCtx.getShaderStr('shaders/basic.frag'));
		basicCtx.ctx.useProgram(userShader);
		userVarLocs.push(basicCtx.ctx.getAttribLocation(userShader, "aVertexPosition"));
		userVarLocs.push(basicCtx.ctx.getUniformLocation(userShader, "uModelViewMatrix"));
		userVarLocs.push(basicCtx.ctx.getUniformLocation(userShader, "uProjectionMatrix"));
		userVarLocs.push(basicCtx.ctx.getUniformLocation(userShader, "uColor"));
		basicCtx.ctx.uniformMatrix4fv(userVarLocs[2], false, perspectiveMatrix);
		userVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, userVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([   0.0,     0.0, 0.0,
																			  1.041,   0.601, 1.7,
																			    0.0, -1.2021, 1.7,
																			    0.0,     0.0, 0.0,
																			    0.0, -1.2021, 1.7,
																			 -1.041,   0.601, 1.7,
																			    0.0,     0.0, 0.0,
																			 -1.041,   0.601, 1.7,
																			  1.041,   0.601, 1.7,
																			 -1.041,   0.601, 1.7,
																			 	0.0, -1.2021, 1.7,
																			  1.041,   0.601, 1.7]), basicCtx.ctx.STATIC_DRAW);
		var red = new Float32Array([1.0, 0.0, 0.0]);
		var yellow = new Float32Array([1.0, 1.0, 0.0]);
		var black = new Float32Array([0.0, 0.0, 0.0]);

		nameShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/name.vert'), basicCtx.getShaderStr('shaders/name.frag'));
		basicCtx.ctx.useProgram(nameShader);
		nameVarLocs.push(basicCtx.ctx.getAttribLocation(nameShader, "aVertIndex"));
		nameVarLocs.push(basicCtx.ctx.getUniformLocation(nameShader, "uModelViewMatrix"));
		nameVarLocs.push(basicCtx.ctx.getUniformLocation(nameShader, "uProjectionMatrix"));
		nameVarLocs.push(basicCtx.ctx.getUniformLocation(nameShader, "uSampler"));
		basicCtx.ctx.uniformMatrix4fv(nameVarLocs[2], false, perspectiveMatrix);

		nameIndexVBO = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, nameIndexVBO);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array([0.0, 1.0, 2.0, 3.0]), basicCtx.ctx.STATIC_DRAW);

		usersRequest = new XMLHttpRequest();
		usersRequest.open("GET", "action.php?a=updateUsers&id="+pcvUsername+"&x=0&y=0&z=0&update=0", false);
		usersRequest.send();
		usersResponse = JSON.parse(usersRequest.responseText);
		currentUsers = usersResponse.users;

		canv2d = document.createElement('canvas');
		canv2d.id     = "hiddenCanvas";
		canv2d.width  = 128;
		canv2d.height = 32;
		canv2d.style.display = "none";
		body2d = document.getElementsByTagName("body")[0];
		body2d.appendChild(canv2d);

		texImage2d = document.getElementById('hiddenCanvas');
		ctx2d = texImage2d.getContext('2d');
		ctx2d.beginPath();
		ctx2d.rect(0, 0, 128, 32);
		ctx2d.fillStyle = 'white';
		ctx2d.font = "30px Arial";
		ctx2d.textAlign = 'center';

		var i;
		for(i = 0; i < currentUsers.length; i++) {
			ctx2d.clearRect(0, 0, 128, 32);
			ctx2d.fillText(currentUsers[i].username, 64, 28);
			nameTexture.push(basicCtx.ctx.createTexture());
			basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, nameTexture[i]);
			basicCtx.ctx.pixelStorei(basicCtx.ctx.UNPACK_FLIP_Y_WEBGL, true);
			basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, texImage2d);
			basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MIN_FILTER, basicCtx.ctx.LINEAR);
		}
		ctx2d.restore();
		for(; i < 4; i++) {
			nameTexture.push(basicCtx.ctx.createTexture());
			basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, nameTexture[i]);
			basicCtx.ctx.pixelStorei(basicCtx.ctx.UNPACK_FLIP_Y_WEBGL, true);
			basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, 128, 32, 0, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, null);
			basicCtx.ctx.texParameteri(basicCtx.ctx.TEXTURE_2D, basicCtx.ctx.TEXTURE_MIN_FILTER, basicCtx.ctx.LINEAR);
		}
		basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);

		delete tempBound;
		delete usersRequest; 
		delete usersResponse;

		this.getBasicCTX = function() {
			return basicCtx;
		};

		this.usePerspective = function() {
			basicCtx.ctx.useProgram(userShader);
			basicCtx.ctx.uniformMatrix4fv(userVarLocs[2], false, perspectiveMatrix);
			basicCtx.ctx.useProgram(nameShader);
			basicCtx.ctx.uniformMatrix4fv(nameVarLocs[2], false, perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			basicCtx.ctx.useProgram(userShader);
			basicCtx.ctx.uniformMatrix4fv(userVarLocs[2], false, perspectiveMatrix);
			basicCtx.ctx.useProgram(nameShader);
			basicCtx.ctx.uniformMatrix4fv(nameVarLocs[2], false, projectionMatrix);
		};

		this.updateUsers = function(pos) {
			usersRequest = new XMLHttpRequest();
			usersRequest.open("GET", "action.php?a=updateUsers&id="+pcvUsername+"&x="+pos[0]+"&y="+pos[1]+"&z="+pos[2]+"&update="+updateTimeStamp, false);
			usersRequest.send();
			usersResponse = JSON.parse(usersRequest.responseText);
			currentUsers = usersResponse.users;
			timeStamp = usersResponse.t;

			ctx2d.beginPath();
			var i;
			for(i = 0; i < currentUsers.length; i++) {
				ctx2d.clearRect(0, 0, 128, 32);
				ctx2d.fillText(currentUsers[i].username, 64, 28);
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, nameTexture[i]);
				basicCtx.ctx.pixelStorei(basicCtx.ctx.UNPACK_FLIP_Y_WEBGL, true);
				basicCtx.ctx.texSubImage2D(basicCtx.ctx.TEXTURE_2D, 0, 0, 0, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, texImage2d);
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);
			}
			ctx2d.restore();
		};

		this.render = function() {
			if(basicCtx) {
				var i;
				var viewMatrix = basicCtx.peekMatrix();
				basicCtx.ctx.useProgram(userShader);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, userVBO);
				basicCtx.ctx.vertexAttribPointer(userVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				for(i = 0; i < currentUsers.length; i++) {
					if(timeStamp - currentUsers[i].t < 1800) {
						basicCtx.pushMatrix();
						basicCtx.loadMatrix(viewMatrix);
						basicCtx.translate(currentUsers[i].x, currentUsers[i].y, currentUsers[i].z);
						basicCtx.ctx.uniformMatrix4fv(userVarLocs[1], false, basicCtx.peekMatrix());
						if(timeStamp - currentUsers[i].t > 300) {
							basicCtx.ctx.uniform3fv(userVarLocs[3], red);
						}
						else {
							basicCtx.ctx.uniform3fv(userVarLocs[3], yellow);
						}
						basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLES, 0, 12);
						basicCtx.ctx.uniform3fv(userVarLocs[3], black);
						basicCtx.ctx.drawArrays(basicCtx.ctx.LINES, 0, 12);
					}
				}

				basicCtx.ctx.enable(basicCtx.ctx.BLEND);
				basicCtx.ctx.blendFunc(basicCtx.ctx.SRC_ALPHA, basicCtx.ctx.ONE_MINUS_SRC_ALPHA);
				basicCtx.ctx.depthMask(false);

				basicCtx.ctx.useProgram(nameShader);
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, nameIndexVBO);
				basicCtx.ctx.vertexAttribPointer(nameVarLocs[0], 1, basicCtx.ctx.FLOAT, false, 0, 0);
				i--;
				for(; i > -1; i--) {
					if(timeStamp - currentUsers[i].t < 1800) {
						basicCtx.ctx.uniformMatrix4fv(nameVarLocs[1], false, basicCtx.peekMatrix());
						basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, nameTexture[i]);
						basicCtx.ctx.uniform1i(nameVarLocs[3], nameTexture[i]);
						basicCtx.ctx.drawArrays(basicCtx.ctx.TRIANGLE_STRIP, 0, 4);
						basicCtx.popMatrix();
					}
				}
				basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);

				basicCtx.ctx.disable(basicCtx.ctx.BLEND);
				basicCtx.ctx.depthMask(true);
			}
		};
	}

	return Users;
} ());