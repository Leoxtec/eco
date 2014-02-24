var pc, ax, map;
var cam;
var isDragging = false;
var placingMarker = false;
var removingMarker = false;
var StartCoords = [0, 0];
var viewMode = 0;
var orthoZoom = false;
var viewportArray = [233, 585, 540, -540];
var pickResults;
var controllable = true;
var lastTime;
var PIover2 = Math.PI / 2;
var markerPick = false;
var photoPick = false;
var addPoint = false;
updateTimeStamp = 0;
pcvUsername = null;
editMarker = false, markerFound = false, editVert = false, setMarker = false;
calcHeight = 0;
var workStr = [".  ", " . ", "  .", ".  "];
var markerIndex;

function loginUser(user, password) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", "action.php?a=login&username="+user+"&password="+password, false);
	xmlhttp.send();
	var response = JSON.parse(xmlhttp.responseText);
	if(response.success) {
		pcvUsername = user;
		document.getElementById('login-section').style.display = "none";
		document.getElementById('logout-section').style.display = "block";
	}
	else {
		flipControl();
		$("#falied-login").dialog({close: function() {flipControl();}});
	}
}

function logoutUser() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", "action.php?a=logout&username="+pcvUsername, true);
	xmlhttp.send();
	pcvUsername = null;
	document.getElementById('logout-section').style.display = "none";
	document.getElementById('login-section').style.display = "block";
}

function flipControl() {
	controllable = !controllable;
}

function switchDiv() {
	// var a = document.getElementById('markupInfo');
	// if(a.style.display == "block") {
	// 	a.style.display = "none";
	// }
	// else {
	// 	a.style.display = "block";
	// }
	
	// a = document.getElementById('newMarkupInfo');
	// if(a.style.display == "block") {
	// 	a.style.display = "none";
	// }
	// else {
	// 	a.style.display = "block";
	// }

	switch(calcHeight) {
	case 0:
		document.getElementById('markupInfo').style.display = "none";
		document.getElementById('newMarkupInfo').style.display = "block";
		break;
	case 1:
		document.getElementById('newMarkupInfo').style.display = "none";
		document.getElementById('CalculatingHeight').style.display = "block";
		// $('#working').progressbar( "option", "value", false );
		break;
	}
	calcHeight++;
	controllable = !controllable;
	updateTimeStamp = 1;
}

function setValues() {
	var form = document.forms[0];
	pc.markers.setMarkerValues(markerIndex, form.elements[0].value, form.elements[1].value);
	switchDiv();
}

function changePointSize(val) {
	pc.tree.pointSize(val);
	//pc.tree2.pointSize(val);
	updateTimeStamp = 1;
}

function changeGridSize(val) {
	pc.grid.gridSize(val);
	updateTimeStamp = 1;
}

function changeGridPos(val) {
	updateTimeStamp = 1;
	return pc.grid.gridPos(val);
}

// function toggleAttenuation() {
// 	if(document.getElementById('atten').checked) {
// 		pc.tree.attenuation(0.01, 0.0, 0.003);
// 		pc.tree2.attenuation(0.01, 0.0, 0.003);
// 	}
// 	else {
// 		pc.tree.attenuation(1.0, 0.0, 0.0);
// 		pc.tree2.attenuation(1.0, 0.0, 0.0);
// 	}
// 	updateTimeStamp = 1;
// }

function colorEnhance(val) {
	pc.tree.setCE(val);
}

function viewRadioButton(val) {
	if(controllable) {
		cam.setViewMode(val);
		viewMode = val;
		if(viewMode === 4) {
			pc.useOrthographic();
			pc.tree.setCheckOrtho(true);
			//pc.tree2.setCheckOrtho(true);
		}
		else {
			pc.tree.setCheckOrtho(false);
			//pc.tree2.setCheckOrtho(false);
			pc.users.usePerspective();
		}
		if(placingMarker) {
			pc.markers.cancelNewMarker();
			placingMarker = false;
		}
	}
	updateTimeStamp = 1;
}

function zoom(amt) {
	if(controllable) {
		if(viewMode === 4) {
			pc.scaleOrthographic(amt * 10);
		}
		else {
			cam.updateRadius(amt);
		}
	}
	updateTimeStamp = 1;
}

function mousePressed() {
	if(controllable) {
		StartCoords[0] = pc.mouseX;
		StartCoords[1] = pc.mouseY;
		isDragging = true;
		if(markerFound) {
			editVert = pc.markers.vertexToEdit(pickResults);
		}
	}
	updateTimeStamp = 1;
}

function mouseReleased() {
	if(controllable) {
		isDragging = false;
		if(markerFound) {
			pc.markers.checkNewVertPos();
			editVert = false;
		}
	}
	updateTimeStamp = 1;
}

function keyDown() {
	if(controllable) {
		switch(pc.key) {
			case 78:
			case 110:
				// if(pcvUsername && viewMode === 4 && !placingMarker && !setMarker) {
				if(viewMode === 4 && !placingMarker && !setMarker) {
					editMarker = !editMarker;
					if(editMarker) {
						//not sure what goes here yet...
					}
					else {
						pc.markers.generateMesh();
						pc.markers.restoreMarker();
						markerFound = false;
					}
				}
				break;
			case 86:
			case 118:
				markerPick = true;
				break;
			case 87:
			case 119:
				cam.setStraightVel(0.05);
				break;
			case 83:
			case 115:
				cam.setStraightVel(-0.05);
				break;
			case 65:
			case 97:
				cam.setSideVel(-0.05);
				break;
			case 68:
			case 100:
				cam.setSideVel(0.05);
				break;
			case 88:
			case 120:
				cam.setZoomVel(0.1);
				orthoZoom = true;
				break;
			case 90:
			case 122:
				cam.setZoomVel(-0.1);
				orthoZoom = true;
				break;
			case 49:
				//add pont
				// if(pcvUsername && viewMode === 4) {
				if(viewMode === 4) {
					if(!editMarker) {
						addPoint = isDragging = placingMarker = true;
					}
					if(markerFound) {
						pc.markers.addEditPoint(pickResults);
					}
				}
				break;
			case 50:
				//remove point
				// if(pcvUsername && viewMode === 4) {
				if(viewMode === 4) {
					if(placingMarker) {
						isDragging = placingMarker = pc.markers.removePoint();
					}
					if(markerFound) {
						pc.markers.removeEditPoint(pickResults);
					}
				}
				break;
			case 51:
				//cancel polygon
				// if(pcvUsername && viewMode === 4) {
				if(viewMode === 4) {
					if(placingMarker) {
						pc.markers.cancelNewMarker();
						isDragging = placingMarker = false;
					}
				}
				break;
			case 52:
				//accept and close polygon
				// if(pcvUsername && viewMode === 4) {
				if(viewMode === 4) {
					if(placingMarker) {
						placingMarker = isDragging = pc.markers.recordNewMarker(pickResults);
						//switchDiv();
					}
				}
				break;
			case 53:
				//remove marker
				// if(pcvUsername && viewMode === 4) {
				if(viewMode === 4) {
					if(!editMarker) {
						removingMarker = true;
						StartCoords[0] = pc.mouseX;
						StartCoords[1] = pc.mouseY;
					}
				}
				break;
			case 54:
				// if(pcvUsername && viewMode === 4) {
				if(viewMode === 4) {
					if(!editMarker && !setMarker && calcHeight == 0) {
						setMarker = true;
					}
				}
				break;
			case 66:
			case 98:
				photoPick = true;
				break;
			case 85:
			case 117:
				pc.tree.toggleLeafDisplayType();
				break;
		}
	}
	updateTimeStamp = 1;
}

function keyUp() {
	if(controllable) {
		switch(pc.key) {
			case 86:
			case 118:
				markerPick = false;
				$("#createdBy").val('');
				$("#markHeight").val('');
				$("#markSpecies").val('');
				$("#markDescr").val('');
				break;
			case 87:
			case 119:
			case 83:
			case 115:
				cam.setStraightVel(0);
				break;
			case 65:
			case 97:
			case 68:
			case 100:
				cam.setSideVel(0);
				break;
			case 88:
			case 120:
			case 90:
			case 122:
				cam.setZoomVel(0);
				orthoZoom = false;
				break;
			case 66:
			case 98:
				photoPick = false;
				break;
		}
	}
}

function renderPC() {
	if(isDragging) {	  
		// how much was the cursor moved compared to last time
		// this function was called?
		var deltaX = pc.mouseX - StartCoords[0];
		var deltaY = pc.mouseY - StartCoords[1];
		
		// now that the camera was updated, reset where the
		// rotation will start for the next time this function is called.
		StartCoords = [pc.mouseX, pc.mouseY];
		
		if(!placingMarker && !editMarker) {
			if(viewMode === 3 || viewMode === 4) {
				cam.mapScrollX(-deltaX * 0.25);
				cam.mapScrollY(deltaY * 0.25);
			}
			else {
				cam.updatePan(-deltaX * 0.015);
				cam.updateTilt(-deltaY * 0.015);
			}
		}
	}

	pc.basicCtx.ctx.viewport(0, 0, 540, 540);
	var c = pc.grid.getCenter();
	var camPos = cam.pos();
	pc.basicCtx.pushMatrix();
	pc.basicCtx.multMatrix(M4x4.makeLookAt(camPos, cam.at(), cam.up()));
	pc.basicCtx.pushMatrix();
	pc.basicCtx.translate(-c[0], -c[1], -c[2]);
	
	if(viewMode !== 4) {
		pc.usePerspective();
	}
	else if(orthoZoom) {
		pc.scaleOrthographic(cam.timeElapsed() * cam.zoomVelocity() * 0.26);
	}

	pc.basicCtx.clear();
	if(document.getElementById('pc1').checked) {
		if(photoPick) {
			pc.tree.pointPicking(camPos, pc.mouseX - viewportArray[0], viewportArray[1] - pc.mouseY);
		}
		pc.tree.renderTree(camPos, c);
	}
	if(document.getElementById('pc2').checked) {
		//pc.tree2.renderTree(camPos);
	}
	if(document.getElementById('grid').checked) {
		pc.grid.render();
	}
	pc.basicCtx.popMatrix();
	
	if(document.getElementById('markers').checked) {
		if(viewMode === 4) {
			pickResults = V3.$();
			var sf = pc.basicCtx.getSF();
			pickResults[0] = (((pc.mouseX - viewportArray[0]) / viewportArray[2]) * 2 - 1) * sf + camPos[0];
			pickResults[1] = (((pc.mouseY - viewportArray[1]) / viewportArray[3]) * 2 - 1) * sf + camPos[1];
			if(addPoint) {
				pc.markers.addPoint(pickResults);
				addPoint = false;
			}
			if(placingMarker) {
				pc.markers.renderNewMarker(pickResults);
			}
			if(removingMarker) {
				pc.markers.removeMarker(pc.markers.displayMarkerInfo(pc.mouseX - viewportArray[0] + 0.5, viewportArray[1] - pc.mouseY + 0.5, false));
				removingMarker = false;
			}
			if(editMarker) {
				if(!markerFound) {
					markerFound = pc.markers.markerToEdit(pc.markers.displayMarkerInfo(pc.mouseX - viewportArray[0] + 0.5, viewportArray[1] - pc.mouseY + 0.5, false));
				}
				if(!markerFound) {
					editMarker = false;
				}
				else {
					if(editVert) {
						pc.markers.moveVertex(pickResults);
					}
					pc.markers.renderEditMarker();
				}
			}
			if(setMarker) {
				markerIndex = pc.markers.displayMarkerInfo(pc.mouseX - viewportArray[0] + 0.5, viewportArray[1] - pc.mouseY + 0.5, false);
				if(markerIndex > -1) {
					switchDiv();
					pc.markers.setNewInfo(markerIndex);
				}
				setMarker = false;
			}
		}
		if(markerPick) {
			pc.markers.displayMarkerInfo(pc.mouseX - viewportArray[0] + 0.5, viewportArray[1] - pc.mouseY + 0.5, true);
		}
		pc.markers.renderMarkers();
	}


	var now = (new Date()).getTime();
	if(now - lastTime > 1000) {
		pc.users.updateUsers(camPos);
		updateTimeStamp = 0;
		lastTime = now;
	}
	// if(calcHeight == 2) {
	// 	var inc = (now - lastTime) % 333;
	// 	$("#working").val(workStr[inc]);
	// }
	pc.users.render();
	pc.basicCtx.popMatrix();

	switch(viewMode) {
		case 0:
			pc.map.render(V3.scale(cam.getTemp(), cam.getRadius()), cam.getPan() + PIover2);
			pc.basicCtx.multMatrix(M4x4.makeLookAt(V3.scale(cam.getTemp(), 3), V3.$(0, 0, 0), cam.up()));
			pc.axes.render();
			break;
		case 1:
		case 2:
			pc.map.render(cam.getPoint(), cam.getPan() - PIover2);
			pc.basicCtx.multMatrix(M4x4.makeLookAt(V3.scale(cam.getDir(), -3), V3.$(0, 0, 0), cam.up()));
			pc.axes.render();
			break;
		case 3:
		case 4:
			pc.map.render(cam.getPoint(), 0.0);
			pc.basicCtx.multMatrix(M4x4.makeLookAt(V3.$(0, 0, 3), V3.$(0, 0, 0), cam.up()));
			pc.axes.render();
			break;
	}
}

function start(table) {
	pc = new PointCloud(document.getElementById('canvas'), table);
	cam = new Camera({radius: pc.grid.getRadius() / Math.tan(Math.PI / 6.0)});
	pc.tree.root(table);
	//pc.tree2.root('r', 'reduced_leaf_on');
	pc.basicCtx.onRender = renderPC;
	pc.onMouseScroll = zoom;
	pc.onMousePressed = mousePressed;
	pc.onMouseReleased = mouseReleased;
	pc.onKeyDown = keyDown;
	pc.onKeyUp = keyUp;
	lastTime = (new Date()).getTime();
}