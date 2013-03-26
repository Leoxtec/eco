var ps, ps2, ps3, cloud1, cloud2, cloud3, cloud4;
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
	ps.setLatestMarkerValues(form.elements[0].value, form.elements[1].value);
	switchDiv();
}

function changePointSize(val) {
	ps.pointSize(val);
}

function viewRadioButton(value) {
	if(controllable) {
		cam.setViewMode(value);
		viewMode = value;
		if(viewMode === 4) {
			ps.useOrthographic();
		}
		else {
			ps.usePerspective();
		}
	}
}

function zoom(amt) {
	if(controllable) {
		if(viewMode === 4) {
			ps.scaleOrthographic(amt * 10);
		}
		else {
			cam.updateRadius(amt);
		}
	}
}

function mousePressed() {
	if(controllable) {
		StartCoords[0] = ps.mouseX;
		StartCoords[1] = ps.mouseY;
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
		switch(ps.key) {
			case 86:
			case 118:
				viewMode = (viewMode + 1) % 5;
				cam.setViewMode(viewMode);
				if(viewMode === 4) {
					ps.useOrthographic();
				}
				else {
					ps.usePerspective();
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
					StartCoords[0] = ps.mouseX;
					StartCoords[1] = ps.mouseY;
					ps.markerBegin = V3.$(StartCoords[0], StartCoords[1], 0);
					isDragging = true;
					placingMarker = true;
				}
				break;
			case 50:
				if(placingMarker) {
					ps.recordNewMarker(results1, results2);
					switchDiv();
					placingMarker = false;
					isDragging = false;
				}
				break;
			case 51:
				removingMarker = true;
				StartCoords[0] = ps.mouseX;
				StartCoords[1] = ps.mouseY;
				break;
		}
	}
}

function keyUp() {
	if(controllable) {
		switch(ps.key) {
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

function render() {
	if(isDragging) {	  
		// how much was the cursor moved compared to last time
		// this function was called?
		var deltaX = ps.mouseX - StartCoords[0];
		var deltaY = ps.mouseY - StartCoords[1];
		
		// now that the camera was updated, reset where the
		// rotation will start for the next time this function is called.
		StartCoords = [ps.mouseX, ps.mouseY];
		
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

    var c = cloud1.getCenter();
	ps.multMatrix(M4x4.makeLookAt(cam.pos(), cam.at(), cam.up()));
	ps.pushMatrix();
	
	ps.translate(-c[0], -c[1], -c[2]);
	
	if(viewMode === 4 && orthoZoom) {
		ps.scaleOrthographic(cam.timeElapsed() * cam.zoomVelocity() * 5);
	}
	
	if(document.getElementById('atten').checked) {
		ps.attenuation(0.01, 0.0, 0.003);
	}
	else {
		ps.attenuation(1.0, 0.0, 0.0);
	}
  
	ps.clear();
	if(document.getElementById('pc1').checked) {
		ps.render(cloud1);
	}
	if(document.getElementById('pc2').checked) {
		ps.render(cloud2);
	}
	ps.popMatrix();
	if(document.getElementById('scale').checked) {
		if(document.getElementById('overlay').checked) {
			ps.renderScaleBar(true);
		}
		else {
			ps.renderScaleBar(false);
		}
	}
	
	if(viewMode === 4) {
		results1 = [];
		var sf = 1 / ps.getSF();
		var omm = ps.getOM();
		GLU.unProject(ps.mouseX, ps.mouseY, 0, ps.peekMatrix(),
					  M4x4.scale3(sf, sf, 1, omm), viewportArray, results1);
		ps.displayMarkerInfoOrtho(results1);
	}
	else {
		results1 = [];
		GLU.unProject(ps.mouseX, ps.mouseY, 0, ps.peekMatrix(),
					  ps.getPM(), viewportArray, results1);
		results2 = [];
		GLU.unProject(ps.mouseX, ps.mouseY, 0.1, ps.peekMatrix(),
					  ps.getPM(), viewportArray, results2);
		ps.displayMarkerInfo(results1, results2, cam.pos());
	}
	
	if(viewMode === 4 && placingMarker) {
		results1 = [];
		var sf = 1 / ps.getSF();
		var omm = ps.getOM();
		GLU.unProject(ps.markerBegin[0], ps.markerBegin[1], ps.markerBegin[2], ps.peekMatrix(),
					  M4x4.scale3(sf, sf, 1, omm), viewportArray, results1);
		results2 = [];
		GLU.unProject(StartCoords[0], StartCoords[1], 0, ps.peekMatrix(),
					  M4x4.scale3(sf, sf, 1, omm), viewportArray, results2);
		ps.renderNewMarker(results1, results2);
	}
	
	if(viewMode === 4 && removingMarker) {
		results1 = [];
		var sf = 1 / ps.getSF();
		var omm = ps.getOM();
		GLU.unProject(StartCoords[0], StartCoords[1], 0, ps.peekMatrix(),
					  M4x4.scale3(sf, sf, 1, omm), viewportArray, results1);
		ps.removeMarker(results1);
		removingMarker = false;
	}
	
	ps.renderOrthoMarkers(cam.pos());
}

function renderAxes() {
	ps2.clear();
	switch(viewMode) {
		case 0:
			ps2.multMatrix(M4x4.makeLookAt(V3.scale(cam.getTemp(), 3), V3.$(0, 0, 0), cam.up()));
			ps2.render2(cam.getPan() + Math.PI / 2, cam.getTilt() - Math.PI / 2);
			break;
		case 1:
		case 2:
			ps2.multMatrix(M4x4.makeLookAt(V3.scale(cam.getDir(), -3), V3.$(0, 0, 0), cam.up()));
			ps2.render2(cam.getPan() - Math.PI / 2, -cam.getTilt() + Math.PI / 2);
			break;
		case 3:
		case 4:
			ps2.multMatrix(M4x4.makeLookAt(V3.$(0, 0, 3), V3.$(0, 0, 0), cam.up()));
			ps2.render2(0, -Math.PI / 2);
			break;
	}	
}

function renderMap() {
	ps3.clear();
	ps3.multMatrix(M4x4.makeLookAt(V3.$(0, 0, 80), V3.$(0, 0, 0), V3.$(0, 1, 0)));
	ps3.pushMatrix();
	var c = cloud3.getCenter();
	ps3.translate(-c[0], -c[1], -c[2]);
	if(document.getElementById('pc1').checked) {
		ps3.render(cloud3);
	}
	if(document.getElementById('pc2').checked) {
		ps3.render(cloud4);
	}
	ps3.popMatrix();
	switch(viewMode) {
		case 0:
			ps3.render3(V3.scale(cam.getTemp(), cam.getRadius()), cam.getPan() + Math.PI / 2);
			break;
		case 1:
		case 2:
			ps3.render3(cam.getPoint(), cam.getPan() - Math.PI / 2);
			break;
		case 3:
		case 4:
			ps3.render3(cam.getPoint(), 0.0);
			break;
	}
}

function start() {
	ps3 = new PointStream();
	ps3.setup(document.getElementById('canvas3'));
	ps3.initializeMap();
	ps3.background([0, 0, 0, 0.5]);
	ps3.onRender = renderMap;
	
	cloud3 = ps3.load("clouds/leaf_off.ply");
	cloud4 = ps3.load("clouds/leaf_on.ply");

	ps2 = new PointStream();
  
	ps2.setup(document.getElementById('canvas2'));
	ps2.initializeAxes();
	ps2.background([0, 0, 0, 0.5]);
	ps2.onRender = renderAxes;

	ps = new PointStream();
	
	ps.setup(document.getElementById('canvas'));
	ps.background([0, 0, 0, 0.5]);
	ps.initializeMarkers();
	ps.onRender = render;
	ps.attenuation(1.0, 0.0, 0.0);
	ps.initializeScaleBar();
	
	ps.onMouseScroll = zoom;
	ps.onMousePressed = mousePressed;
	ps.onMouseReleased = mouseReleased;
	ps.onKeyDown = keyDown;
	ps.onKeyUp = keyUp;
  
	cloud1 = ps.load("clouds/leaf_off.ply");
	cloud2 = ps.load("clouds/leaf_on.ply");
}
