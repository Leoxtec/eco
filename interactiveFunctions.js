//This file includes various function used for interactivity
//most are called from html elements and the rest are for handling keyboard and mouse events


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
		$("#failed-login").dialog({close: function() {flipControl();}});
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

//turns off point lcoud interaction while the user needs to input info
//for either logging in or entering marker info
function flipControl() {
	controllable = !controllable;
}


//switches which html elements are visible during login and marker info entry
function switchDiv() {
	switch(calcHeight) {
	case 0:
		document.getElementById('markupInfo').style.display = "none";
		document.getElementById('newMarkupInfo').style.display = "block";
		break;
	case 1:
		document.getElementById('newMarkupInfo').style.display = "none";
		document.getElementById('CalculatingHeight').style.display = "block";
		break;
	}
	calcHeight++;
	controllable = !controllable;
	updateTimeStamp = 1;
}

//set the user entered marker values 
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

//for undetermined point attenuation feature
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

//set view mode and projection type
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

//mouse wheel zooming
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
			//V
			//marker picking mode
			case 86:
			case 118:
				markerPick = true;
				break;

			//W
			//move forward or rotate up
			case 87:
			case 119:
				cam.setStraightVel(0.05);
				break;

			//S
			//move backward or rotate down
			case 83:
			case 115:
				cam.setStraightVel(-0.05);
				break;

			//A
			//move or rotate left
			case 65:
			case 97:
				cam.setSideVel(-0.05);
				break;

			//D
			//move or rotate right
			case 68:
			case 100:
				cam.setSideVel(0.05);
				break;

			//X
			//zoom in
			case 88:
			case 120:
				cam.setZoomVel(0.1);
				orthoZoom = true;
				break;

			//Z
			//zoom out
			case 90:
			case 122:
				cam.setZoomVel(-0.1);
				orthoZoom = true;
				break;

			//N
			//start and stop editing an existing marker
			case 78:
			case 110:
				if(pcvUsername && viewMode === 4 && !placingMarker && !setMarker) {
				// if(viewMode === 4 && !placingMarker && !setMarker) {
					editMarker = !editMarker;
					if(!editMarker) {
						pc.markers.generateMesh();
						pc.markers.restoreMarker();
						markerFound = false;
					}
				}
				break;

			//1
			//add polygon/marker vertex
			case 49:				
				if(pcvUsername && viewMode === 4) {
				// if(viewMode === 4) {
					if(!editMarker) {
						addPoint = isDragging = placingMarker = true;
					}
					if(markerFound) {
						pc.markers.addEditPoint(pickResults);
					}
				}
				break;

			//2
			//remove polygon/marker vertex
			case 50:
				if(pcvUsername && viewMode === 4) {
				// if(viewMode === 4) {
					if(placingMarker) {
						isDragging = placingMarker = pc.markers.removePoint();
					}
					if(markerFound) {
						pc.markers.removeEditPoint(pickResults);
					}
				}
				break;

			//3
			//cancel polygon/marker that is currently being edited
			case 51:
				if(pcvUsername && viewMode === 4) {
				// if(viewMode === 4) {
					if(placingMarker) {
						pc.markers.cancelNewMarker();
						isDragging = placingMarker = false;
					}
				}
				break;

			//4
			//accept and close polygon/marker
			case 52:
				if(pcvUsername && viewMode === 4) {
				// if(viewMode === 4) {
					if(placingMarker) {
						placingMarker = isDragging = pc.markers.recordNewMarker(pickResults);
						switchDiv();
					}
				}
				break;

			//5
			//delete marker
			case 53:
				if(pcvUsername && viewMode === 4) {
				// if(viewMode === 4) {
					if(!editMarker) {
						removingMarker = true;
						StartCoords[0] = pc.mouseX;
						StartCoords[1] = pc.mouseY;
					}
				}
				break;

			//6
			//start the process of getting marker info from user and sending to the
			//server for 95th height percentile calculation and storage
			case 54:
				if(pcvUsername && viewMode === 4) {
				// if(viewMode === 4) {
					if(!editMarker && !setMarker && calcHeight == 0) {
						setMarker = true;
					}
				}
				break;

			//B
			//point picking for displaying thumbnails
			case 66:
			case 98:
				photoPick = true;
				break;
		}
	}

	updateTimeStamp = 1;
}

//cancel actions when key is released
function keyUp() {
	if(controllable) {
		switch(pc.key) {
			//V
			case 86:
			case 118:
				markerPick = false;
				$("#createdBy").val('');
				$("#markHeight").val('');
				$("#markSpecies").val('');
				$("#markDescr").val('');
				break;

			//W S
			case 87:
			case 119:
			case 83:
			case 115:
				cam.setStraightVel(0);
				break;

			//A D
			case 65:
			case 97:
			case 68:
			case 100:
				cam.setSideVel(0);
				break;

			//X Z
			case 88:
			case 120:
			case 90:
			case 122:
				cam.setZoomVel(0);
				orthoZoom = false;
				break;

			//B
			case 66:
			case 98:
				photoPick = false;
				break;
		}
	}
}
