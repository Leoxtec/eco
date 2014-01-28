var Markers = (function() {

	function Markers(bctx) {
		var basicCtx = bctx;

		var markers = [];
		var vertEdit;
		var vertEditIndex;
		var editMarker;
		var maxPoints = 20;

		xmlhttpForBB = new XMLHttpRequest();
		xmlhttpForBB.open("GET", "action.php?a=getnode&path=r&table=point_pick_test_sep", false);
		xmlhttpForBB.send();
		tempBB = JSON.parse(xmlhttpForBB.responseText).BB;
		var maxZ = (tempBB[5] - tempBB[2]) * 0.5;
		var minZ = -maxZ;
		delete tempBB;

		tempBound = 0.1 * Math.tan(Math.PI / 6.0);
		var perspectiveMatrix = M4x4.makeFrustum(-tempBound, tempBound, -tempBound, tempBound, 0.1, 5000.0);
		delete tempBound;

		var outlineShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/uniformColor.vert'), basicCtx.getShaderStr('shaders/basic.frag'));
		basicCtx.ctx.useProgram(outlineShader);
		var outlineVarLocs = [];
		outlineVarLocs.push(basicCtx.ctx.getAttribLocation(outlineShader, "aVertexPosition"));
		outlineVarLocs.push(basicCtx.ctx.getUniformLocation(outlineShader, "uModelViewMatrix"));
		outlineVarLocs.push(basicCtx.ctx.getUniformLocation(outlineShader, "uProjectionMatrix"));
		outlineVarLocs.push(basicCtx.ctx.getUniformLocation(outlineShader, "uColor"));
		basicCtx.ctx.uniformMatrix4fv(outlineVarLocs[2], false, perspectiveMatrix);

		var outlineBuffer = basicCtx.ctx.createBuffer();
		basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, outlineBuffer);
		basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, new Float32Array(maxPoints * 3), basicCtx.ctx.DYNAMIC_DRAW);
		var vertices = [];
		var pointCount = 0;

		xmlhttp = new XMLHttpRequest();
		xmlhttp.onload = function() {
			if(this.readyState == 4 && this.status == 200) {
				var temp = JSON.parse(xmlhttp.responseText);
				temp = temp.markers;
				for(var i = 0; i < temp.length; i++) {
					pointCount = temp[i].points.length / 2;
					vertices = [];
					for(var j = 0; j < pointCount * 2; j += 2) {
						vertices.push(V3.$(temp[i].points[j], temp[i].points[j + 1], maxZ));
					}
					pc.markers.generateMesh();
					markers[i].id = temp[i].id;
					markers[i].height = temp[i].height;
					markers[i].species = temp[i].species;
					markers[i].descr = temp[i].descr;
					markers[i].user = temp[i].user;
				}
				delete obj;
				delete xmlhttp;
			}
		}
		xmlhttp.open("GET", "action.php?a=start", true);
		xmlhttp.send();

		var cylShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/grid.vert'), basicCtx.getShaderStr('shaders/cyl.frag'));
		basicCtx.ctx.useProgram(cylShader);
		var cylVarLocs = [];
		cylVarLocs.push(basicCtx.ctx.getAttribLocation(cylShader, "aVertexPosition"));
		cylVarLocs.push(basicCtx.ctx.getUniformLocation(cylShader, "uModelViewMatrix"));
		cylVarLocs.push(basicCtx.ctx.getUniformLocation(cylShader, "uProjectionMatrix"));
		basicCtx.ctx.uniformMatrix4fv(cylVarLocs[2], false, perspectiveMatrix);

		var pickShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/pick.vert'), basicCtx.getShaderStr('shaders/basic.frag'));
		basicCtx.ctx.useProgram(pickShader);
		var pickVarLocs = [];
		pickVarLocs.push(basicCtx.ctx.getAttribLocation(pickShader, "aVertexPosition"));
		pickVarLocs.push(basicCtx.ctx.getUniformLocation(pickShader, "uModelViewMatrix"));
		pickVarLocs.push(basicCtx.ctx.getUniformLocation(pickShader, "uProjectionMatrix"));
		pickVarLocs.push(basicCtx.ctx.getUniformLocation(pickShader, "uPickingMatrix"));
		pickVarLocs.push(basicCtx.ctx.getUniformLocation(pickShader, "uColor"));
		basicCtx.ctx.uniformMatrix4fv(pickVarLocs[2], false, perspectiveMatrix);

		var piontMarkShader = basicCtx.createProgramObject(basicCtx.getShaderStr('shaders/pointMark.vert'), basicCtx.getShaderStr('shaders/pointMark.frag'));
		basicCtx.ctx.useProgram(piontMarkShader);
		var pointMarkLocs = [];
		pointMarkLocs.push(basicCtx.ctx.getAttribLocation(piontMarkShader, "aVertexPosition"));
		pointMarkLocs.push(basicCtx.ctx.getUniformLocation(piontMarkShader, "uModelViewMatrix"));
		pointMarkLocs.push(basicCtx.ctx.getUniformLocation(piontMarkShader, "uProjectionMatrix"));
		basicCtx.ctx.uniformMatrix4fv(pointMarkLocs[2], false, perspectiveMatrix);

		var pickingFBO = basicCtx.ctx.createFramebuffer();
		basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, pickingFBO);
		pickingTexture = basicCtx.ctx.createTexture();
		basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, pickingTexture);
		basicCtx.ctx.texImage2D(basicCtx.ctx.TEXTURE_2D, 0, basicCtx.ctx.RGBA, 1, 1, 0, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, null);
		renderBuffer = basicCtx.ctx.createRenderbuffer();
		basicCtx.ctx.bindRenderbuffer(basicCtx.ctx.RENDERBUFFER, renderBuffer);
		basicCtx.ctx.renderbufferStorage(basicCtx.ctx.RENDERBUFFER, basicCtx.ctx.DEPTH_COMPONENT16, 1, 1);
		basicCtx.ctx.framebufferTexture2D(basicCtx.ctx.FRAMEBUFFER, basicCtx.ctx.COLOR_ATTACHMENT0, basicCtx.ctx.TEXTURE_2D, pickingTexture, 0);
		basicCtx.ctx.framebufferRenderbuffer(basicCtx.ctx.FRAMEBUFFER, basicCtx.ctx.DEPTH_ATTACHMENT, basicCtx.ctx.RENDERBUFFER, renderBuffer);
		basicCtx.ctx.bindRenderbuffer(basicCtx.ctx.RENDERBUFFER, null);
		basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);
		basicCtx.ctx.bindTexture(basicCtx.ctx.TEXTURE_2D, null);

		delete renderBuffer;
		delete pickingTexture;

	    this.usePerspective = function() {
			// basicCtx.ctx.useProgram(cylShader);
			// basicCtx.ctx.uniformMatrix4fv(cylVarLocs[2], false, perspectiveMatrix);
			// basicCtx.ctx.useProgram(pickShader);
			// basicCtx.ctx.uniformMatrix4fv(pickVarLocs[2], false, perspectiveMatrix);
			// basicCtx.ctx.useProgram(outlineShader);
			// basicCtx.ctx.uniformMatrix4fv(outlineVarLocs[2], false, perspectiveMatrix);
			// basicCtx.ctx.useProgram(piontMarkShader);
			// basicCtx.ctx.uniformMatrix4fv(pointMarkLocs[2], false, perspectiveMatrix);

			basicCtx.ctx.useProgram(cylShader);
			basicCtx.ctx.uniformMatrix4fv(cylVarLocs[2], false, basicCtx.perspectiveMatrix);
			basicCtx.ctx.useProgram(pickShader);
			basicCtx.ctx.uniformMatrix4fv(pickVarLocs[2], false, basicCtx.perspectiveMatrix);
			basicCtx.ctx.useProgram(outlineShader);
			basicCtx.ctx.uniformMatrix4fv(outlineVarLocs[2], false, basicCtx.perspectiveMatrix);
			basicCtx.ctx.useProgram(piontMarkShader);
			basicCtx.ctx.uniformMatrix4fv(pointMarkLocs[2], false, basicCtx.perspectiveMatrix);
		};

		this.useOrthographic = function(projectionMatrix) {
			basicCtx.ctx.useProgram(cylShader);
			basicCtx.ctx.uniformMatrix4fv(cylVarLocs[2], false, projectionMatrix);
			basicCtx.ctx.useProgram(pickShader);
			basicCtx.ctx.uniformMatrix4fv(pickVarLocs[2], false, projectionMatrix);
			basicCtx.ctx.useProgram(outlineShader);
			basicCtx.ctx.uniformMatrix4fv(outlineVarLocs[2], false, projectionMatrix);
			basicCtx.ctx.useProgram(piontMarkShader);
			basicCtx.ctx.uniformMatrix4fv(pointMarkLocs[2], false, projectionMatrix);
		};

		this.renderNewMarker = function(currPos) {
			if(basicCtx.ctx) {
				currPos[2] = maxZ;
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, outlineBuffer);
				basicCtx.ctx.bufferSubData(basicCtx.ctx.ARRAY_BUFFER, pointCount * 12, currPos);
				basicCtx.ctx.useProgram(outlineShader);
				basicCtx.ctx.uniform3fv(outlineVarLocs[3], [0.0, 0.0, 1.0]);
				basicCtx.ctx.uniformMatrix4fv(outlineVarLocs[1], false, basicCtx.peekMatrix());
				basicCtx.ctx.vertexAttribPointer(outlineVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.drawArrays(basicCtx.ctx.LINE_STRIP, 0, pointCount + 1);

				basicCtx.ctx.useProgram(piontMarkShader);
				basicCtx.ctx.uniformMatrix4fv(pointMarkLocs[1], false, basicCtx.peekMatrix());
				basicCtx.ctx.vertexAttribPointer(pointMarkLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.drawArrays(basicCtx.ctx.POINTS, 0, pointCount + 1);
			}
		};

		this.markerToEdit = function(m) {
			if(m < 0) {
				return false;
			}
			else {
				vertices = markers[m].verts.slice();
				pointCount = vertices.length;
				basicCtx.ctx.deleteBuffer(markers[m].vertVBO);
				basicCtx.ctx.deleteBuffer(markers[m].triIndVBO);
				basicCtx.ctx.deleteBuffer(markers[m].lineIndVBO);
				editMarker = markers.splice(m, 1)[0];
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, outlineBuffer);
				for(var i = 0; i < vertices.length; i++) {
					basicCtx.ctx.bufferSubData(basicCtx.ctx.ARRAY_BUFFER, i * 12, vertices[i]);
				}
				return true;
			}
		};

		this.restoreMarker = function() {
			markers[markers.length - 1].id = editMarker.id;
			markers[markers.length - 1].height = 'not set';
			markers[markers.length - 1].species = editMarker.species;
			markers[markers.length - 1].descr = editMarker.descr;
			markers[markers.length - 1].user = editMarker.user;
		}

		this.renderEditMarker = function() {
			if(basicCtx.ctx) {
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, outlineBuffer);
				basicCtx.ctx.useProgram(outlineShader);
				basicCtx.ctx.uniform3fv(outlineVarLocs[3], [0.0, 0.0, 1.0]);
				basicCtx.ctx.uniformMatrix4fv(outlineVarLocs[1], false, basicCtx.peekMatrix());
				basicCtx.ctx.vertexAttribPointer(outlineVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.drawArrays(basicCtx.ctx.LINE_LOOP, 0, pointCount);

				basicCtx.ctx.useProgram(piontMarkShader);
				basicCtx.ctx.uniformMatrix4fv(pointMarkLocs[1], false, basicCtx.peekMatrix());
				basicCtx.ctx.vertexAttribPointer(pointMarkLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
				basicCtx.ctx.drawArrays(basicCtx.ctx.POINTS, 0, pointCount);
			}
		};

		this.addEditPoint = function(point) {
			if(vertices.length < maxPoints) {
				point[2] = maxZ;
				var closestDist = Number.POSITIVE_INFINITY;
				var closestIndex = -1;
				var epsilon = basicCtx.getSF() / 54.0;
				epsilon *= epsilon;
				var i;
				for(i = 0; i < vertices.length; i++) {
					var a = V3.clone(vertices[i % vertices.length]);
					var b = V3.clone(vertices[(i + 1) % vertices.length]);
					var par = V3.sub(a, b);
					var parHat = V3.normalize(par);
					var hyp = V3.sub(point, b)
					var parDist = V3.dot(parHat, hyp);
					var perpDistSqr = V3.lengthSquared(hyp) - parDist * parDist;					
					if(perpDistSqr < epsilon && perpDistSqr < closestDist && parDist > 0.0 && parDist < V3.dot(parHat, par)) {
						closestDist = perpDistSqr;
						closestIndex = i;
					}
				}

				if(closestIndex > -1) {
					i = (closestIndex + 1) % vertices.length;
					vertices.splice(i, 0, point);
					pointCount = vertices.length;
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, outlineBuffer);
					for(; i < vertices.length; i++) {
						basicCtx.ctx.bufferSubData(basicCtx.ctx.ARRAY_BUFFER, i * 12, vertices[i]);
					}
				}
			}
		};

		this.removeEditPoint = function(point) {
			if(vertices.length > 3) {
				point[2] = maxZ;
				var closestDist = Number.POSITIVE_INFINITY;
				var closestIndex = -1;
				var distSqr;
				var tempVec;
				var i;
				var radiusSqr = basicCtx.getSF() / 54.0;
				radiusSqr *= radiusSqr;
				for(i = 0; i < vertices.length; i++) {
					tempVec = V3.clone(vertices[i]);
					distSqr = V3.lengthSquared(V3.sub(tempVec, point));
					if(distSqr < radiusSqr && distSqr < closestDist) {
						closestDist = distSqr;
						closestIndex = i;
					}
				}
				if(closestIndex > -1) {
					var intersect = false;
					var a = vertices[(vertices.length + closestIndex - 1) % vertices.length];
					var b = vertices[(closestIndex + 1) % vertices.length];
					i = closestIndex + 1;
					var j = i + vertices.length - 3;
					while(!intersect && i < j) {
						intersect = lineIntersect(vertices[i % vertices.length], vertices[(i + 1) % vertices.length], a, b);
						i++;
					}
					if(!intersect) {
						intersect = lineIntersect(a, b, vertices[i % vertices.length], vertices[(i + 1) % vertices.length]);
					}
					if(!intersect) {
						vertices.splice(closestIndex, 1);
						pointCount = vertices.length;
						basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, outlineBuffer);
						for(i = closestIndex; i < vertices.length; i++) {
							basicCtx.ctx.bufferSubData(basicCtx.ctx.ARRAY_BUFFER, i * 12, vertices[i]);
						}
					}
				}
			}
		};

		this.vertexToEdit = function(point) {
			point[2] = maxZ;
			var closestDist = Number.POSITIVE_INFINITY;
			var closestIndex = -1;
			var distSqr;
			var tempVec;
			var i;
			var radiusSqr = basicCtx.getSF() / 54.0;
			radiusSqr *= radiusSqr;
			for(i = 0; i < vertices.length; i++) {
				tempVec = V3.clone(vertices[i]);
				distSqr = V3.lengthSquared(V3.sub(tempVec, point));
				if(distSqr < radiusSqr && distSqr < closestDist) {
					closestDist = distSqr;
					closestIndex = i;
				}
			}
			if(closestIndex > -1) {
				vertEditIndex = closestIndex;
				vertEdit = V3.clone(vertices[closestIndex]);
				return true;
			}
			return false;
		};

		this.moveVertex = function(point) {
			point[2] = maxZ;
			vertices[vertEditIndex] = point;
			basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, outlineBuffer);
			basicCtx.ctx.bufferSubData(basicCtx.ctx.ARRAY_BUFFER, vertEditIndex * 12, point);
		}

		this.checkNewVertPos = function() {
			var curr = vertices[vertEditIndex];
			var prev = vertices[(vertices.length + vertEditIndex - 1) % vertices.length];
			var next = vertices[(vertEditIndex + 1) % vertices.length];
			var intersect = false;
			var i = vertEditIndex + 1;
			var j = i + vertices.length - 2;
			while(!intersect && i < j) {
				var a = vertices[i % vertices.length];
				var b = vertices[(i + 1) % vertices.length];
				intersect = lineIntersect(prev, curr, a, b);
				if(!intersect) {
					intersect = lineIntersect(a, b, curr, next);
				}
				i++;
			}
			if(!intersect) {
				intersect = lineIntersect(curr, next, vertices[i % vertices.length], curr);
			}
			if(intersect) {
				vertices[vertEditIndex] = vertEdit;
				basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, outlineBuffer);
				basicCtx.ctx.bufferSubData(basicCtx.ctx.ARRAY_BUFFER, vertEditIndex * 12, vertEdit);
			}
		}

		//code adapted from http://ideone.com/PnPJgb
		function lineIntersect(a, b, c, d) {
			var CmA = [c[0] - a[0], c[1] - a[1]];
			var R = [b[0] - a[0], b[1] - a[1]];
			var S = [d[0] - c[0], d[1] - c[1]];

			var CmAxR = CmA[0] * R[1] - CmA[1] * R[0];
			if(CmAxR === 0.0) {
				return (c[0] < a[0] !== c[0] < b[0]) || (c[1] < a[1] !== c[1] < b[1]) ||
					   (d[0] < a[0] !== d[0] < b[0]) || (d[1] < a[1] !== d[1] < b[1]);
			}
			else if(a[0] === d[0] && a[1] === d[1]) {
				return false;
			}

			var RxS = R[0] * S[1] - R[1] * S[0];
			if(RxS === 0.0) {
				return false;
			}

			var CmAxS = CmA[0] * S[1] - CmA[1] * S[0];
			var t = CmAxS / RxS;
			var u = CmAxR / RxS;
			return (t >= 0.0) && (t <= 1.0) && (u >= 0.0) && (u <= 1.0);
		}

		this.addPoint = function(point) {
			if(pointCount < maxPoints - 1) {
				point[2] = maxZ;
				var prev = vertices[vertices.length - 1];
				var intersect = false;
				var i = 0;
				while(!intersect && i < vertices.length - 1) {
					intersect = lineIntersect(prev, point, vertices[i], vertices[i + 1]);
					i++;
				}
				if(!intersect) {
					vertices.push(point);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, outlineBuffer);
					basicCtx.ctx.bufferSubData(basicCtx.ctx.ARRAY_BUFFER, pointCount * 12, point);
					pointCount++;
				}
			}
		};

		this.removePoint = function() {
			pointCount--;
			vertices.splice(pointCount, 1);
			if(pointCount > 0) {
				return true;
			}
			else {
				return false;
			}
		};

		this.cancelNewMarker = function() {
			pointCount = 0;
			vertices = [];
		};

		//test if (b-a) x (c-a) is positive (convex)
		function sign(a, b, c) {
			return (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
		}

		this.generateMesh = function() {
			var i, j, k;
			var rightmostI = 0;
			var rightmostX = vertices[0][0];
			for(i = 1; i < pointCount; i++) {
				if(vertices[i][0] > rightmostX || (vertices[i][0] === rightmostX && vertices[i][1] > vertices[i - 1][1])) {
					rightmostX = vertices[i][0];
					rightmostI = i;
				}
			}
			var a = vertices[rightmostI];
			var b = vertices[(rightmostI + 1) % pointCount];
			var c = vertices[(pointCount + rightmostI - 1) % pointCount];
			if(sign(a, b, c) < 0) {
				vertices.reverse();
			}

			var tempVerts = new Float32Array(pointCount * 6);
			var triIndices = [];
			var lineIndices = new Uint8Array(pointCount * 6);
			var vertsToSubdivide = [];

			var concave = false;
			var firstEar = 0;
			for(i = 0, j = 0; i < pointCount; i++, j += 6) {
				tempVerts[j] 	 = tempVerts[j + 3] = vertices[i][0];
				tempVerts[j + 1] = tempVerts[j + 4] = vertices[i][1];
				tempVerts[j + 2] = vertices[i][2];
				tempVerts[j + 5] = minZ;
				var el = i * 2;
				lineIndices[j] = lineIndices[j + 2] = el;
				lineIndices[j + 1] = lineIndices[j + 4] = el + 1;
				lineIndices[j + 3] = (el + 2) % (pointCount * 2);
				lineIndices[j + 5] = (el + 3) % (pointCount * 2);
				triIndices.splice(triIndices.length, 0, el, el + 1, (el + 2) % (pointCount * 2), (el + 2) % (pointCount * 2), el + 1, (el + 3) % (pointCount * 2));
				var convex = true;
				var ear = true;
				a = vertices[i];
				b = vertices[(i + 1) % pointCount];
				c = vertices[(pointCount + i - 1) % pointCount];
				if(sign(a, b, c) < 0) {
					convex = false;
					concave = true;
					ear = false;
				}
				else {
					k = 0;
					while(k < pointCount - 3 && ear) {
						var pointToCheck = vertices[(i + k + 2) % pointCount];

						ear = false;
						if(sign(pointToCheck, a, b) < 0) {
							ear = true;
						}
						else if(sign(pointToCheck, b, c) < 0) {
							ear = true;
						}
						else if(sign(pointToCheck, c, a) < 0) {
							ear = true;
						}
						k++;
					}
				}
				vertsToSubdivide[i] = {point: [vertices[i][0], vertices[i][1]], index: el, convex: convex, ear: ear};
				if(ear) {
					firstEar = i;
				}
			}

			var polyIndexStart = triIndices.length;
			while(concave && vertsToSubdivide.length > 3) {
				triIndices.splice(triIndices.length, 0, 
								  vertsToSubdivide[firstEar % vertsToSubdivide.length].index, 
								  vertsToSubdivide[(firstEar + 1) % vertsToSubdivide.length].index, 
								  vertsToSubdivide[(vertsToSubdivide.length + firstEar - 1) % vertsToSubdivide.length].index);
				triIndices.splice(triIndices.length, 0, 
								  vertsToSubdivide[firstEar % vertsToSubdivide.length].index + 1,
								  vertsToSubdivide[(vertsToSubdivide.length + firstEar - 1) % vertsToSubdivide.length].index + 1,
								  vertsToSubdivide[(firstEar + 1) % vertsToSubdivide.length].index + 1);
				vertsToSubdivide.splice(firstEar, 1);
				j = (vertsToSubdivide.length + firstEar - 1) % vertsToSubdivide.length;
				for(i = 0; i < 2; i++) {
					a = vertsToSubdivide[(i + j) % vertsToSubdivide.length].point;
					b = vertsToSubdivide[(i + j + 1) % vertsToSubdivide.length].point;
					c = vertsToSubdivide[(vertsToSubdivide.length + i + j - 1) % vertsToSubdivide.length].point;
					if(!vertsToSubdivide[(i + j) % vertsToSubdivide.length].convex && sign(a, b, c) > 0) {
						vertsToSubdivide[(i + j) % vertsToSubdivide.length].convex = true;
					}
					if(vertsToSubdivide[(i + j) % vertsToSubdivide.length].convex) {
						k = 0;
						vertsToSubdivide[(i + j) % vertsToSubdivide.length].ear = true;
						while(k < vertsToSubdivide.length - 3 && vertsToSubdivide[(i + j) % vertsToSubdivide.length].ear) {
							var pointToCheck = vertsToSubdivide[(i + j + k + 2) % vertsToSubdivide.length].point;

							vertsToSubdivide[(i + j) % vertsToSubdivide.length].ear = false;
							if(sign(pointToCheck, a, b) < 0) {
								vertsToSubdivide[(i + j) % vertsToSubdivide.length].ear = true;
							}
							else if(sign(pointToCheck, b, c) < 0) {
								vertsToSubdivide[(i + j) % vertsToSubdivide.length].ear = true;
							}
							else if(sign(pointToCheck, c, a) < 0) {
								vertsToSubdivide[(i + j) % vertsToSubdivide.length].ear = true;
							}
							k++;
						}
					}
				}
				concave = false;
				for(i = 0; i < vertsToSubdivide.length; i++) {
					if(!vertsToSubdivide[i].convex) {
						concave = true;
					}
					if(vertsToSubdivide[i].ear) {
						firstEar = i;
					}
				}
			}

			while(vertsToSubdivide.length > 2) {
				triIndices.splice(triIndices.length, 0, vertsToSubdivide[0].index, vertsToSubdivide[1].index, vertsToSubdivide[2].index);
				triIndices.splice(triIndices.length, 0, vertsToSubdivide[0].index + 1, vertsToSubdivide[2].index + 1, vertsToSubdivide[1].index + 1);
				vertsToSubdivide.splice(1, 1);
			}

			polyIndices = [];
			for(i = polyIndexStart, j = 0; i < triIndices.length; i += 6, j += 3) {
				polyIndices[j] 	   = triIndices[i] / 2;
				polyIndices[j + 1] = triIndices[i + 1] / 2;
				polyIndices[j + 2] = triIndices[i + 2] / 2;
			}
			var obj = {
				id : -1,
				verts: vertices.slice(),
				indices: polyIndices,
				vertVBO : basicCtx.ctx.createBuffer(),
				triIndVBO : basicCtx.ctx.createBuffer(),
				lineIndVBO : basicCtx.ctx.createBuffer(),
				triSize: triIndices.length,
				lineSize : lineIndices.length,
				height: 'not set',
				species: 'tree type',
				descr: 'short description',
				// user: pcvUsername
				user: 'testUser'
			}
			basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, obj.vertVBO);
			basicCtx.ctx.bufferData(basicCtx.ctx.ARRAY_BUFFER, tempVerts, basicCtx.ctx.STATIC_DRAW);
			basicCtx.ctx.bindBuffer(basicCtx.ctx.ELEMENT_ARRAY_BUFFER, obj.triIndVBO);
			basicCtx.ctx.bufferData(basicCtx.ctx.ELEMENT_ARRAY_BUFFER, new Uint8Array(triIndices), basicCtx.ctx.STATIC_DRAW);
			basicCtx.ctx.bindBuffer(basicCtx.ctx.ELEMENT_ARRAY_BUFFER, obj.lineIndVBO);
			basicCtx.ctx.bufferData(basicCtx.ctx.ELEMENT_ARRAY_BUFFER, lineIndices, basicCtx.ctx.STATIC_DRAW);
			markers.push(obj);
			pointCount = 0;
			vertices = [];
		}
		
		this.recordNewMarker = function(lastPoint) {
			if(basicCtx.ctx) {
				if(vertices.length > 1) {
					lastPoint[2] = maxZ;
					var i;
					var prev = vertices[vertices.length - 1];
					var intersect = false;
					i = 0;
					while(!intersect && i < vertices.length - 1) {
						intersect = lineIntersect(prev, lastPoint, vertices[i], vertices[i + 1]);
						if(!intersect) {
							intersect = lineIntersect(vertices[i], vertices[i + 1], lastPoint, vertices[0]);
						}
						i++;
					}
					if(!intersect) {
						intersect = lineIntersect(lastPoint, vertices[0], vertices[i], lastPoint);
					}
					if(intersect) {
						return true;
					}
					vertices.push(lastPoint);
					pointCount++;
					this.generateMesh();
				}
				return false;
			}
			return false;
		};

		this.setNewInfo = function(m) {
			$("#newSpecies").val(markers[m].species);
			$("#newDescr").val(markers[m].descr);
		};
		
		this.setMarkerValues = function(index, spec, descr) {
			var mark = markers[index];
			mark.species = spec;
			mark.descr = descr;
			var points = "[";
			var i;
			for(i = 0; i < mark.verts.length - 1; i++) {
				points += mark.verts[i][0].toFixed(6) + "," + mark.verts[i][1].toFixed(6) + ",";
			}
			points += mark.verts[i][0].toFixed(6) + "," + mark.verts[i][1].toFixed(6) + "]";
			
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("GET", "action.php?a=add&id="+mark.id+"&points="+points+"&species="+mark.species+"&descr="+mark.descr+"&user="+mark.user, false);
			xmlhttp.send();
			var response = JSON.parse(xmlhttp.responseText);
			mark.id = response.id;
			mark.height = response.height;
		};
		
		this.removeMarker = function(m) {
			if(m > -1) {
				basicCtx.ctx.deleteBuffer(markers[m].vertVBO);
				basicCtx.ctx.deleteBuffer(markers[m].triIndVBO);
				basicCtx.ctx.deleteBuffer(markers[m].lineIndVBO);
				var xmlhttp = new XMLHttpRequest();
				xmlhttp.open("GET", "action.php?a=delete&id="+markers[m].id, true);
				xmlhttp.send();
				markers.splice(m, 1);
			}
		};

		this.displayMarkerInfo = function(x, y, showInfo) {
			if(basicCtx.ctx && markers) {
				var pickingTransform = new Float32Array([	 	 540,			0, 0, 0,
																   0,		  540, 0, 0,
														 		   0,			0, 1, 0,
														 540 - x * 2, 540 - y * 2, 0, 1]);
				var color = new Float32Array([0.0, 0.0, 0.0, 0.0]);
				pc.basicCtx.ctx.viewport(0, 0, 1, 1);
				basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, pickingFBO);
				basicCtx.ctx.enable(basicCtx.ctx.CULL_FACE);
				basicCtx.ctx.useProgram(pickShader);
				basicCtx.ctx.uniformMatrix4fv(pickVarLocs[3], false, pickingTransform);
				basicCtx.ctx.uniformMatrix4fv(pickVarLocs[1], false, basicCtx.peekMatrix());
				for(var i = 0; i < markers.length; i++) {
					color[2] = (i + 1) / 255.0;
					basicCtx.ctx.uniform4fv(pickVarLocs[4], color);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markers[i].vertVBO);
					basicCtx.ctx.vertexAttribPointer(pickVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ELEMENT_ARRAY_BUFFER, markers[i].triIndVBO);
					basicCtx.ctx.drawElements(basicCtx.ctx.TRIANGLES, markers[i].triSize, basicCtx.ctx.UNSIGNED_BYTE, 0);
				}
				basicCtx.ctx.disable(basicCtx.ctx.CULL_FACE);

				var arr = new Uint8Array(4);
				basicCtx.ctx.readPixels(0, 0, 1, 1, basicCtx.ctx.RGBA, basicCtx.ctx.UNSIGNED_BYTE, arr);
				var closestIndex = arr[2] - 1;
				if(showInfo && closestIndex > -1) {
					$("#createdBy").val(markers[closestIndex].user);
					if(typeof markers[closestIndex].height == "number") {
						$("#markHeight").val(markers[closestIndex].height.toFixed(3));
					}
					else {
						$("#markHeight").val(markers[closestIndex].height);
					}
					$("#markSpecies").val(markers[closestIndex].species);
					$("#markDescr").val(markers[closestIndex].descr);
				}
				else {
					$("#createdBy").val('');
					$("#markHeight").val('');
					$("#markSpecies").val('');
					$("#markDescr").val('');
				}
				basicCtx.clear();
				pc.basicCtx.ctx.viewport(0, 0, 540, 540);
				basicCtx.ctx.bindFramebuffer(basicCtx.ctx.FRAMEBUFFER, null);
				return closestIndex;
			}
			return -1;
		};

		this.renderMarkers = function() {
			if(basicCtx.ctx && markers) {
				basicCtx.ctx.enable(basicCtx.ctx.CULL_FACE);
				basicCtx.ctx.depthMask(false);
				for(var i = 0; i < markers.length; i++) {
					basicCtx.ctx.enable(basicCtx.ctx.BLEND);
					basicCtx.ctx.blendFunc(basicCtx.ctx.SRC_ALPHA, basicCtx.ctx.ONE);
					basicCtx.ctx.useProgram(cylShader);
					basicCtx.ctx.uniformMatrix4fv(cylVarLocs[1], false, basicCtx.peekMatrix());
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markers[i].vertVBO);
					basicCtx.ctx.vertexAttribPointer(cylVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ELEMENT_ARRAY_BUFFER, markers[i].triIndVBO);
					basicCtx.ctx.drawElements(basicCtx.ctx.TRIANGLES, markers[i].triSize, basicCtx.ctx.UNSIGNED_BYTE, 0);

					basicCtx.ctx.disable(basicCtx.ctx.BLEND);
					basicCtx.ctx.useProgram(outlineShader);
					basicCtx.ctx.uniform3fv(outlineVarLocs[3], [0.0, 0.0, 0.0]);
					basicCtx.ctx.uniformMatrix4fv(outlineVarLocs[1], false, basicCtx.peekMatrix());
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ARRAY_BUFFER, markers[i].vertVBO);
					basicCtx.ctx.vertexAttribPointer(outlineVarLocs[0], 3, basicCtx.ctx.FLOAT, false, 0, 0);
					basicCtx.ctx.bindBuffer(basicCtx.ctx.ELEMENT_ARRAY_BUFFER, markers[i].lineIndVBO);
					basicCtx.ctx.drawElements(basicCtx.ctx.LINES, markers[i].lineSize, basicCtx.ctx.UNSIGNED_BYTE, 0)
				}				
				basicCtx.ctx.disable(basicCtx.ctx.BLEND);
				basicCtx.ctx.disable(basicCtx.ctx.CULL_FACE);
				basicCtx.ctx.depthMask(true);
			}
		};
	}

	return Markers;
} ());