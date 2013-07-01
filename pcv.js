var pc, ax, map;
var cam = new Camera({});
var isDragging = false;
var placingMarker = false;
var removingMarker = false;
var StartCoords = [0, 0];
var viewMode = 0;
var orthoZoom = false;
var viewportArray = [308, 585, 540, -540];
var results1;
var results2;
var controllable = true;
var cloudtree;
var lastTime;

function switchDiv() {
	var a = document.getElementById('markupInfo');
	if(a.style.display == "block") {
		a.style.display = "none";
	}
	else {
		a.style.display = "block";
	}
	
	a = document.getElementById('newMarkupInfo');
	if(a.style.display == "block") {
		a.style.display = "none";
	}
	else {
		a.style.display = "block";
	}
	
	controllable = !controllable;
}

function setValues() {
	var form = document.forms[0];
	pc.markers.setLatestMarkerValues(form.elements[0].value, form.elements[1].value);
	switchDiv();
}

function changePointSize(val) {
	pc.tree.pointSize(val);
}

function viewRadioButton(value) {
	if(controllable) {
		cam.setViewMode(value);
		viewMode = value;
		if(viewMode === 4) {
			pc.useOrthographic();
		}
		else {
			pc.usePerspective();
		}
	}
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
}

function mousePressed() {
	if(controllable) {
		StartCoords[0] = pc.mouseX;
		StartCoords[1] = pc.mouseY;
		isDragging = true;
	}
}

function mouseReleased() {
	if(controllable) {
		isDragging = false;
	}
}

function keyDown() {
	if(controllable) {
		switch(pc.key) {
			case 86:
			case 118:
				viewMode = (viewMode + 1) % 5;
				cam.setViewMode(viewMode);
				if(viewMode === 4) {
					pc.useOrthographic();
				}
				else {
					pc.usePerspective();
				}
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
				cam.setZoomVel(0.05);
				orthoZoom = true;
				break;
			case 90:
			case 122:
				cam.setZoomVel(-0.05);
				orthoZoom = true;
				break;
			case 49:
				if(!placingMarker) {
					StartCoords[0] = pc.mouseX;
					StartCoords[1] = pc.mouseY;
					pc.markers.markerBegin = V3.$(StartCoords[0], StartCoords[1], 0);
					isDragging = true;
					placingMarker = true;
				}
				break;
			case 50:
				if(placingMarker) {
					pc.markers.recordNewMarker(results1, results2);
					switchDiv();
					placingMarker = false;
					isDragging = false;
				}
				break;
			case 51:
				removingMarker = true;
				StartCoords[0] = pc.mouseX;
				StartCoords[1] = pc.mouseY;
				break;
		}
	}
}

function keyUp() {
	if(controllable) {
		switch(pc.key) {
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
			case 49:
				isDragging = false;
				placingMarker = false;
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
		
		if(!placingMarker) {
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

    var c = cloudtree.getCenter();
	pc.basicCtx.multMatrix(M4x4.makeLookAt(cam.pos(), cam.at(), cam.up()));
	
	if(document.getElementById('markers').checked) {
		if(viewMode === 4) {
			results1 = [];
			var sf = 1 / pc.basicCtx.getSF();
			var omm = pc.basicCtx.getOM();
			GLU.unProject(pc.mouseX, pc.mouseY, 0, pc.basicCtx.peekMatrix(),
						  M4x4.scale3(sf, sf, 1, omm), viewportArray, results1);
			pc.markers.displayMarkerInfoOrtho(results1);
		}
		else {
			pc.basicCtx.clear();
			pc.markers.displayMarkerInfo(pc.mouseX - 308, 585 - pc.mouseY);
		}
	}

	pc.basicCtx.pushMatrix();
	
	pc.basicCtx.translate(-c[0], -c[1], -c[2]);
	
	if(viewMode === 4 && orthoZoom) {
		pc.scaleOrthographic(cam.timeElapsed() * cam.zoomVelocity() * 5);
	}

	if(document.getElementById('atten').checked) {
		pc.tree.attenuation(0.01, 0.0, 0.003);
	}
	else {
		pc.tree.attenuation(1.0, 0.0, 0.0);
	}

	pc.basicCtx.clear();
	pc.tree.resetCounters();
	pc.tree.recurseTree(cloudtree, cam.pos());
	pc.basicCtx.popMatrix();
	// if(document.getElementById('scale').checked) {
		// if(document.getElementById('overlay').checked) {
			// pc.renderScaleBar(true);
		// }
		// else {
			// pc.renderScaleBar(false);
		// }
	// }
	
	if(document.getElementById('markers').checked) {
		if(viewMode === 4 && placingMarker) {
			results1 = [];
			var sf = 1 / pc.basicCtx.getSF();
			var omm = pc.basicCtx.getOM();
			GLU.unProject(pc.markers.markerBegin[0], pc.markers.markerBegin[1], pc.markers.markerBegin[2], pc.basicCtx.peekMatrix(),
						  M4x4.scale3(sf, sf, 1, omm), viewportArray, results1);
			results2 = [];
			GLU.unProject(StartCoords[0], StartCoords[1], 0, pc.basicCtx.peekMatrix(),
						  M4x4.scale3(sf, sf, 1, omm), viewportArray, results2);
			pc.markers.renderNewMarker(results1, results2);
		}		
		if(viewMode === 4 && removingMarker) {
			results1 = [];
			var sf = 1 / pc.basicCtx.getSF();
			var omm = pc.basicCtx.getOM();
			GLU.unProject(StartCoords[0], StartCoords[1], 0, pc.basicCtx.peekMatrix(),
						  M4x4.scale3(sf, sf, 1, omm), viewportArray, results1);
			pc.markers.removeMarker(results1);
			removingMarker = false;
		}		
		pc.markers.renderOrthoMarkers();
	}

	var now = (new Date()).getTime();
	if(now - lastTime > 2000) {
		pc.tree.pruneTree(cloudtree, now);
		lastTime = now;
	}
}

function renderAxes() {
	ax.getBasicCTX().clear();
	switch(viewMode) {
		case 0:
			ax.getBasicCTX().multMatrix(M4x4.makeLookAt(V3.scale(cam.getTemp(), 3), V3.$(0, 0, 0), cam.up()));
			ax.render(cam.getPan() + Math.PI / 2, cam.getTilt() - Math.PI / 2);
			break;
		case 1:
		case 2:
			ax.getBasicCTX().multMatrix(M4x4.makeLookAt(V3.scale(cam.getDir(), -3), V3.$(0, 0, 0), cam.up()));
			ax.render(cam.getPan() - Math.PI / 2, -cam.getTilt() + Math.PI / 2);
			break;
		case 3:
		case 4:
			ax.getBasicCTX().multMatrix(M4x4.makeLookAt(V3.$(0, 0, 3), V3.$(0, 0, 0), cam.up()));
			ax.render(0, -Math.PI / 2);
			break;
	}	
}

function renderMap() {
	map.getBasicCTX().clear();
	switch(viewMode) {
		case 0:
			map.render(V3.scale(cam.getTemp(), cam.getRadius()), cam.getPan() + Math.PI / 2);
			break;
		case 1:
		case 2:
			map.render(cam.getPoint(), cam.getPan() - Math.PI / 2);
			break;
		case 3:
		case 4:
			map.render(cam.getPoint(), 0.0);
			break;
	}
}

function start() {
	map = new Map(document.getElementById('canvas3'));
	map.initializeMap();
	map.getBasicCTX().onRender = renderMap;

	ax = new Axes(document.getElementById('canvas2'));
	ax.initializeAxes();
	ax.getBasicCTX().onRender = renderAxes;

	pc = new PointCloud(document.getElementById('canvas'));
	pc.markers.initializeMarkers();
	pc.basicCtx.onRender = renderPC;
	//pc.initializeScaleBar();
	pc.onMouseScroll = zoom;
	pc.onMousePressed = mousePressed;
	pc.onMouseReleased = mouseReleased;
	pc.onKeyDown = keyDown;
	pc.onKeyUp = keyUp;

	cloudtree = pc.tree.root('r');
	lastTime = (new Date()).getTime();
}
