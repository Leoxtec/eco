var ps, ps2, cloud1, cloud2;
var cam = new Camera({});
var isDragging = false;
var StartCoords = [0, 0];
var viewMode = 0;
var orthoZoom = false;

function viewRadioButton(value) {
	cam.setViewMode(value);
	viewMode = value;
	if(viewMode === 4) {
		ps.useOrthographic();
	}
	else {
		ps.usePerspective();
	}
}

function zoom(amt) {
	if(viewMode === 4) {
		ps.scaleOrthographic(amt * 10);
	}
	else {
		cam.updateRadius(amt);
	}

}

function mousePressed() {
	StartCoords[0] = ps.mouseX;
	StartCoords[1] = ps.mouseY;
  
	isDragging = true;
}

function mouseReleased() {
	isDragging = false;
}

function keyDown() {
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
	}
}

function keyUp() {
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

		if(viewMode === 3 || viewMode === 4) {
			cam.mapScrollX(-deltaX * 0.25);
			cam.mapScrollY(deltaY * 0.25);
		}
		else {
			cam.updatePan(-deltaX * 0.015);
			cam.updateTilt(-deltaY * 0.015);
		}
	}

    var c = cloud1.getCenter();
	ps.multMatrix(M4x4.makeLookAt(cam.pos(), cam.at(), cam.up()));
	ps.translate(-c[0], -c[1], -c[2]);
	
	if(viewMode === 4 && orthoZoom) {
		ps.scaleOrthographic(cam.timeElapsed() * cam.zoomVelocity() * 5);
	}
  
	ps.clear();
	if(document.getElementById('pc1').checked) {
		ps.render(cloud1);
	}
	if(document.getElementById('pc2').checked) {
		ps.render(cloud2);
	}
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

function start() {
	ps2 = new PointStream();
  
	ps2.setup(document.getElementById('canvas2'));
	ps2.initializeAxes();
	ps2.background([0, 0, 0, 0.5]);
	ps2.onRender = renderAxes;

	ps = new PointStream();
	
	ps.setup(document.getElementById('canvas'));  
	ps.background([0, 0, 0, 0.5]);
	ps.onRender = render;
	
	ps.onMouseScroll = zoom;
	ps.onMousePressed = mousePressed;
	ps.onMouseReleased = mouseReleased;
	ps.onKeyDown = keyDown;
	ps.onKeyUp = keyUp;
  
	cloud1 = ps.load("clouds/leaf_off.ply");
	cloud2 = ps.load("clouds/leaf_on.ply");
}
