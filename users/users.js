var Users = (function() {
	function Users(bctx) {
		var basicCtx = bctx;
		var gl = basicCtx.ctx;

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
		gl.useProgram(userShader);
		userVarLocs.push(gl.getAttribLocation(userShader, "aVertexPosition"));
		userVarLocs.push(gl.getUniformLocation(userShader, "uModelViewMatrix"));
		userVarLocs.push(gl.getUniformLocation(userShader, "uProjectionMatrix"));
		userVarLocs.push(gl.getUniformLocation(userShader, "uColor"));
		gl.uniformMatrix4fv(userVarLocs[2], false, perspectiveMatrix);
		userVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, userVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([   0.0,     0.0, 0.0,
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
																			  1.041,   0.601, 1.7]), gl.STATIC_DRAW);
		var red = new Float32Array([1.0, 0.0, 0.0]);
		var yellow = new Float32Array([1.0, 1.0, 0.0]);
		var black = new Float32Array([0.0, 0.0, 0.0]);

		nameShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/name.vert'), basicCtx.getShaderStr('shaders/name.frag'));
		gl.useProgram(nameShader);
		nameVarLocs.push(gl.getAttribLocation(nameShader, "aVertIndex"));
		nameVarLocs.push(gl.getUniformLocation(nameShader, "uModelViewMatrix"));
		nameVarLocs.push(gl.getUniformLocation(nameShader, "uProjectionMatrix"));
		nameVarLocs.push(gl.getUniformLocation(nameShader, "uSampler"));
		gl.uniformMatrix4fv(nameVarLocs[2], false, perspectiveMatrix);

		nameIndexVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, nameIndexVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 1.0, 2.0, 3.0]), gl.STATIC_DRAW);

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
			nameTexture.push(gl.createTexture());
			gl.bindTexture(gl.TEXTURE_2D, nameTexture[i]);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texImage2d);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
		ctx2d.restore();
		for(; i < 4; i++) {
			nameTexture.push(gl.createTexture());
			gl.bindTexture(gl.TEXTURE_2D, nameTexture[i]);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 128, 32, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
		gl.bindTexture(gl.TEXTURE_2D, null);

		delete tempBound;
		delete usersRequest; 
		delete usersResponse;

		this.getBasicCTX = function() {
			return basicCtx;
		};

		this.usePerspective = function() {
			gl.useProgram(userShader);
			gl.uniformMatrix4fv(userVarLocs[2], false, perspectiveMatrix);
			gl.useProgram(nameShader);
			gl.uniformMatrix4fv(nameVarLocs[2], false, perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			gl.useProgram(userShader);
			gl.uniformMatrix4fv(userVarLocs[2], false, perspectiveMatrix);
			gl.useProgram(nameShader);
			gl.uniformMatrix4fv(nameVarLocs[2], false, projectionMatrix);
		};

		this.updateUsers = function(pos) {
			usersRequest = new XMLHttpRequest();
			usersRequest.open("GET", "action.php?a=updateUsers&id="+pcvUsername+"&x="+pos[0]+"&y="+pos[1]+"&z="+pos[2]+"&update="+updateTimeStamp, true);
			usersRequest.onload = function() {
				if(this.readyState == 4 && this.status == 200) {
					var temp = JSON.parse(usersRequest.responseText);
					currentUsers = temp.users;
					timeStamp = temp.t;

					ctx2d.beginPath();
					var i;
					for(i = 0; i < currentUsers.length; i++) {
						ctx2d.clearRect(0, 0, 128, 32);
						ctx2d.fillText(currentUsers[i].username, 64, 28);
						gl.bindTexture(gl.TEXTURE_2D, nameTexture[i]);
						gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
						gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, texImage2d);
						gl.bindTexture(gl.TEXTURE_2D, null);
					}
					ctx2d.restore();
				}
			}
			usersRequest.send();
		};

		this.render = function() {
			var i;
			var viewMatrix = basicCtx.peekMatrix();
			gl.useProgram(userShader);
			gl.bindBuffer(gl.ARRAY_BUFFER, userVBO);
			gl.vertexAttribPointer(userVarLocs[0], 3, gl.FLOAT, false, 0, 0);
			for(i = 0; i < currentUsers.length; i++) {
				if(timeStamp - currentUsers[i].t < 1800) {
					basicCtx.pushMatrix();
					basicCtx.loadMatrix(viewMatrix);
					basicCtx.translate(currentUsers[i].x, currentUsers[i].y, currentUsers[i].z);
					gl.uniformMatrix4fv(userVarLocs[1], false, basicCtx.peekMatrix());
					if(timeStamp - currentUsers[i].t > 300) {
						gl.uniform3fv(userVarLocs[3], red);
					}
					else {
						gl.uniform3fv(userVarLocs[3], yellow);
					}
					gl.drawArrays(gl.TRIANGLES, 0, 12);
					gl.uniform3fv(userVarLocs[3], black);
					gl.drawArrays(gl.LINES, 0, 12);
				}
			}

			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.depthMask(false);

			gl.useProgram(nameShader);
			gl.bindBuffer(gl.ARRAY_BUFFER, nameIndexVBO);
			gl.vertexAttribPointer(nameVarLocs[0], 1, gl.FLOAT, false, 0, 0);
			i--;
			for(; i > -1; i--) {
				if(timeStamp - currentUsers[i].t < 1800) {
					gl.uniformMatrix4fv(nameVarLocs[1], false, basicCtx.peekMatrix());
					gl.bindTexture(gl.TEXTURE_2D, nameTexture[i]);
					gl.uniform1i(nameVarLocs[3], nameTexture[i]);
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
					basicCtx.popMatrix();
				}
			}
			gl.bindTexture(gl.TEXTURE_2D, null);

			gl.disable(gl.BLEND);
			gl.depthMask(true);
		};
	}

	return Users;
} ());