//this file handles the application entry point as well as the main render function

//globals
pc = null;
cam = null;
isDragging = false;
placingMarker = false;
removingMarker = false;
StartCoords = [0, 0];
viewMode = 0;
orthoZoom = false;

//this global (along with other parts in other files) needs to be generalized
//for proper browser window resizing.  All parts related to this will be preceded with 
//a comment that says BROWSER_RESIZE
//BROWSER_RESIZE
viewportArray = [233, 585, 540, -540];
pickResults = V3.$();
controllable = true;
lastTime = null;
PIover2 = Math.PI / 2;
markerPick = false;
photoPick = false;
addPoint = false;
updateTimeStamp = 0;
pcvUsername = null;
editMarker = false, markerFound = false, editVert = false, setMarker = false;
calcHeight = 0;
markerIndex = -1;

function renderPC() {
	if(isDragging) {	  
		// how much was the cursor moved compared to last time
		// this function was called?
		var deltaX = pc.mouseX - StartCoords[0];
		var deltaY = pc.mouseY - StartCoords[1];
		
		// now that the camera was updated, reset where the
		// cursor will start for the next time this function is called.
		StartCoords = [pc.mouseX, pc.mouseY];
		
		//mouse movement scrolls in top down modes and rotates the camera in other modes
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

	//BROWSER_RESIZE
	pc.basicCtx.ctx.viewport(0, 0, 540, 540);

	//translate the center of the point cloud to be at the origin
	var c = pc.grid.getCenter();
	var camPos = cam.pos();
	pc.basicCtx.pushMatrix();
	pc.basicCtx.multMatrix(M4x4.makeLookAt(camPos, cam.at(), cam.up()));
	pc.basicCtx.pushMatrix();
	pc.basicCtx.translate(-c[0], -c[1], -c[2]);
	
	//set projection matrices
	if(viewMode !== 4) {
		pc.usePerspective();
	}
	else if(orthoZoom) {
		pc.scaleOrthographic(cam.timeElapsed() * cam.zoomVelocity() * 0.26);
	}

	pc.basicCtx.clear();

	//draw the point cloud and do point picking
	if(document.getElementById('pc1').checked) {
		if(photoPick) {
			pc.tree.pointPicking(pc.mouseX - viewportArray[0], viewportArray[1] - pc.mouseY);
		}
		pc.tree.renderTree(c);
	}
	//this section is used for displaying both leaf off and leaf on point clouds at the same time
	// if(document.getElementById('pc2').checked) {
	// 	if(photoPick) {
	// 		pc.tree2.pointPicking(pc.mouseX - viewportArray[0], viewportArray[1] - pc.mouseY);
	// 	}
	// 	pc.tree2.renderTree(c);
	// }

	//render grid
	if(document.getElementById('grid').checked) {
		pc.grid.render();
	}
	pc.basicCtx.popMatrix();
	
	//render markers
	if(document.getElementById('markers-cb').checked) {
		//allow marker placement, removal and editing only in top down ortho mode
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

			//get marker info from the user and send to the database
			if(setMarker) {
				markerIndex = pc.markers.displayMarkerInfo(pc.mouseX - viewportArray[0] + 0.5, viewportArray[1] - pc.mouseY + 0.5, false);
				if(markerIndex > -1) {
					switchDiv();
					pc.markers.setNewInfo(markerIndex);
				}
				setMarker = false;
			}
		}

		//display marker info if cursor is above an existing marker
		if(markerPick) {
			pc.markers.displayMarkerInfo(pc.mouseX - viewportArray[0] + 0.5, viewportArray[1] - pc.mouseY + 0.5, true);
		}

		pc.markers.renderMarkers();
	}

	//check for positions of logged in users and display them
	var now = (new Date()).getTime();
	if(now - lastTime > 1000) {
		pc.users.updateUsers(camPos);
		updateTimeStamp = 0;
		lastTime = now;
	}
	pc.users.render();
	pc.basicCtx.popMatrix();

	//update axes orientation and map arrow orientation and position
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


//application entry point
function start(table) {
	pc = new PointCloud(document.getElementById('canvas'), table);
	cam = new Camera({radius: pc.grid.getRadius() / Math.tan(Math.PI / 6.0)});
	pc.basicCtx.onRender = renderPC;
	pc.onMouseScroll = zoom;
	pc.onMousePressed = mousePressed;
	pc.onMouseReleased = mouseReleased;
	pc.onKeyDown = keyDown;
	pc.onKeyUp = keyUp;
	lastTime = (new Date()).getTime();
}
