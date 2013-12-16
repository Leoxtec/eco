<?php
include 'PasswordHash.php';

$link = mysql_connect('localhost', 'root', 'jessica');
$db = mysql_select_db('markers', $link);

$key = $_GET["a"];

switch($key) {
	case 'add':
		add();
		break;
	case 'delete':
		delete();
		break;
	case 'start':
		start();
		break;
	case 'getnode':
		getnode();
		break;
	case 'getMapSize':
		getMapSize();
		break;
	case 'login':
		login();
		break;
	case 'logout':
		logout();
		break;
	case 'updateUsers':
		updateUsers();
		break;
	case 'getBS':
		getBS();
}

$heightArr;
$planes;
$polyBB;
function findHeight($mPoints) {
	global $planes, $heightArr, $polyBB;
	$heightArr = array();
	$planes = array();
	$polyBB = array();
	$query = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM point_pick_test_qt WHERE path = 'r'")));
	$data = json_decode($query['data']);
	$offset[0] = ($data->BB[2] - $data->BB[0]) / 2 + $data->BB[0];
	$offset[1] = ($data->BB[3] - $data->BB[1]) / 2 + $data->BB[1];
	for($i = 0; $i < count($mPoints); $i += 2) {
		$mPoints[$i] 	 += $offset[0];
		$mPoints[$i + 1] += $offset[1];
	}
	$pointCount = count($mPoints);
	$polyBB[0] = $polyBB[1] = INF;
	$polyBB[2] = $polyBB[3] = -INF;
	for($i = 0, $j = 0; $i < $pointCount; $i += 2, $j += 5) {
		$x = $mPoints[$i + 1] - $mPoints[($i + 3) % $pointCount];
		$y = $mPoints[($i + 2) % $pointCount] - $mPoints[$i];
		$planes[$j] = $x;
		$planes[$j + 1] = $y;
		$planes[$j + 2] = $x * $mPoints[$i] + $y * $mPoints[$i + 1];
		$planes[$j + 3] = $mPoints[$i + 1];
		$planes[$j + 4] = $mPoints[($i + 3) % $pointCount];
		if($mPoints[$i] < $polyBB[0]) {
			$polyBB[0] = $mPoints[$i];
		}
		if($mPoints[$i + 1] < $polyBB[1]) {
			$polyBB[1] = $mPoints[$i + 1];
		}
		if($mPoints[$i] > $polyBB[2]) {
			$polyBB[2] = $mPoints[$i];
		}
		if($mPoints[$i + 1] > $polyBB[3]) {
			$polyBB[3] = $mPoints[$i + 1];
		}
	}
	findHeightRecursive('r');
	if(count($heightArr) === 0) {
		return 0.0;
	}
	else {
		sort($heightArr);
		return $heightArr[floor(0.95 * count($heightArr))];
	}
}

function findHeightRecursive($path) {
	$query = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM point_pick_test_qt WHERE path = '%s'", $path)));
	$data = json_decode($query['data']);
	if(BBIntersect($data->BB)) {
		if($data->numChildren > 0) {
			for($i = 0; $i < $data->numChildren; $i++) {
				findHeightRecursive($path . '/' . $i);
			}
		}
		else {
			pointIntersect($data->Point);
		}
	}
}

function BBIntersect($BB) {
	global $planes, $polyBB;

	if($BB[0] > $polyBB[2] || $BB[2] < $polyBB[0] || $BB[1] > $polyBB[3] || $BB[3] < $polyBB[1]) {
		return false;
	}
	return true;
}

function pointIntersect($points) {
	global $planes, $heightArr, $polyBB;
	for($i = 0; $i < count($points); $i += 3) {
		if($points[$i] <= $polyBB[2] && $points[$i] >= $polyBB[0] && $points[$i + 1] <= $polyBB[3] && $points[$i + 1] >= $polyBB[1]) {
			// winding count code adapted from http://geomalgorithms.com/a03-_inclusion.html
			// Copyright 2000 softSurfer, 2012 Dan Sunday 
			// This code may be freely used and modified for any purpose providing that this copyright notice is included with it.
			// SoftSurfer makes no warranty for this code, and cannot be held liable for any real or imagined damage resulting from its use.
			// Users of this code must verify correctness for their application.
			$wn = 0;
			for($j = 0; $j < count($planes); $j += 5) {
				if($planes[$j + 3] <=  $points[$i + 1]) {
					if($planes[$j + 4] > $points[$i + 1]) {
						if($points[$i] * $planes[$j] + $points[$i + 1] * $planes[$j + 1] - $planes[$j + 2] > 0.0) {
							$wn++;
						}
					}
				}
				else {
					if($planes[$j + 4] <= $points[$i + 1]) {
						if($points[$i] * $planes[$j] + $points[$i + 1] * $planes[$j + 1] - $planes[$j + 2] < 0.0) {
							$wn--;
						}
					}
				}
			}
			if($wn != 0) {
				array_push($heightArr, $points[$i + 2]);
			}
		}
	}
}

function add() {
	$height = findHeight(json_decode($_GET['points']));
	if($_GET['id'] > -1) {
		delete();
	}
	mysql_query(sprintf("INSERT INTO new_markers(points, height, species, description, user) VALUES('%s', %f, '%s', '%s', '%s')",
						mysql_real_escape_string($_GET['points']), $height, mysql_real_escape_string($_GET['species']), mysql_real_escape_string($_GET['descr']), mysql_real_escape_string($_GET['user']))) or die('Query failed. ' . mysql_error());
	echo '{"id":' . mysql_insert_id() . ',"height":' . $height . '}';
}

function delete() {
	mysql_query(sprintf("DELETE FROM new_markers WHERE id=%d", mysql_real_escape_string($_GET['id'])));
}

function start() {
	$result = mysql_query("SELECT * FROM new_markers");
	echo '{"markers" : [';
	if($row = mysql_fetch_assoc($result)) {
		echo '{"id":', $row['id'], ',"points":', $row['points'], ',"height":', $row['height'], ',"species":"', $row['species'], '","descr":"', $row['description'], '","user":"', $row['user'], '"}';
		while ($row = mysql_fetch_assoc($result)) {
			echo ',{"id":', $row['id'], ',"points":', $row['points'], ',"height":', $row['height'], ',"species":"', $row['species'], '","descr":"', $row['description'], '","user":"', $row['user'], '"}';

		}
	}
	echo "]}";
}

function getnode() {
	$paths = explode(";", $_GET['path']);
	if(count($paths) > 1) {
		echo '[';
	}
	$i = 0;
	for($i = 0; $i < count($paths) - 1; $i++) {
		$result = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM %s WHERE path = '%s'", mysql_real_escape_string($_GET['table']), mysql_real_escape_string($paths[$i]))));
		echo $result['data'] . ',';
	}
	$result = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM %s WHERE path = '%s'", mysql_real_escape_string($_GET['table']), mysql_real_escape_string($paths[$i]))));
	echo $result['data'];
	if(count($paths) > 1) {
		echo ']';
	}
}

function getMapSize() {
	$result = mysql_fetch_assoc(mysql_query(sprintf("SELECT size FROM orthosize WHERE name = '%s'", mysql_real_escape_string($_GET['name']))));
	echo $result['size'];
}

function login() {
	$result = mysql_fetch_assoc(mysql_query(sprintf("SELECT password FROM users WHERE username = '%s'", mysql_real_escape_string($_GET['username']))));
	if($result) {
		if(validate_password($_GET['password'], $result['password'])) {
			mysql_query(sprintf("UPDATE users SET loggedin = 1, secs = %d WHERE username = '%s'", time(), mysql_real_escape_string($_GET['username'])));
			echo '{"success":true}';
		}
		else {
			echo '{"success":false,"error":"password does not match"}';
		}
	}
	else {
		echo '{"success":false,"error":"username does not exist"}';
	}
}

function logout() {
	mysql_query(sprintf("UPDATE users SET loggedin = 0 WHERE username = '%s'", mysql_real_escape_string($_GET['username'])));
}

function updateUsers() {
	$currentTime = time();
	if($_GET['update'] == 1) {
		mysql_query(sprintf("UPDATE users SET secs = %d, x = %f, y = %f, z = %f WHERE username = '%s'", $currentTime, $_GET['x'], $_GET['y'], $_GET['z'], mysql_real_escape_string($_GET['id'])));
	}
	$result = mysql_query(sprintf("SELECT * FROM users WHERE loggedin = 1 and username != '%s'", mysql_real_escape_string($_GET['id'])));
	echo '{"users" : [';
	if($row = mysql_fetch_assoc($result)) {
		echo '{"username":"', $row['username'], '","x":', $row['x'], ',"y":', $row['y'], ',"z":', $row['z'], ',"t":', $row['secs'], '}';
		while ($row = mysql_fetch_assoc($result)) {
			echo ',{"username":"', $row['username'], '","x":', $row['x'], ',"y":', $row['y'], ',"z":', $row['z'], ',"t":', $row['secs'], '}';
		}
	}
	echo '], "t" : ', $currentTime, '}';
}

function getBS() {
	$result = mysql_fetch_assoc(mysql_query(sprintf("SELECT bs FROM change_color WHERE name = '%s'", mysql_real_escape_string($_GET['name'])))) or die(mysql_error());
	echo $result['bs'];
}