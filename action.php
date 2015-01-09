<?php
//this file handles various actions for the ecosynth point cloud viewer on the server

include 'PasswordHash.php';

//establish database connection
$link = mysql_connect('localhost', 'root', '');
$db = mysql_select_db('EcoBrowser', $link);

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
	case 'login':
		login();
		break;
	case 'logout':
		logout();
		break;
	case 'updateUsers':
		updateUsers();
		break;
}

$heightArr;
$polyBB;
$fb;
$w;
$h;

//$mPoints specifies both the vertices and the triangle indices
function findHeight($mPoints) {
	global $heightArr, $polyBB, $fb, $w, $h;
	$heightArr = array();
	$polyBB = array();
	$fb = array();
	$fbDim = array();

	//determine the polygon's bounding box
	$polyBB[0] = $polyBB[1] = INF;
	$polyBB[2] = $polyBB[3] = -INF;
	$pointCount = count($mPoints->v);
	for($i = 0; $i < $pointCount; $i += 2) {
		if($mPoints->v[$i] < $polyBB[0]) {
			$polyBB[0] = $mPoints->v[$i];
		}
		if($mPoints->v[$i + 1] < $polyBB[1]) {
			$polyBB[1] = $mPoints->v[$i + 1];
		}
		if($mPoints->v[$i] > $polyBB[2]) {
			$polyBB[2] = $mPoints->v[$i];
		}
		if($mPoints->v[$i + 1] > $polyBB[3]) {
			$polyBB[3] = $mPoints->v[$i + 1];
		}
	}

	//determine 2D array bounds for stencil lookup table down to a tenth of a meter
	$w = ceil($polyBB[2] * 10) - floor($polyBB[0] * 10);
	$h = ceil($polyBB[3] * 10) - floor($polyBB[1] * 10);
	
	//translate polygon to be in the range [0, width],[0, height] for the lookup table
	for($i = 0; $i < $pointCount; $i += 2) {
		$mPoints->v[$i] 	= floor(($mPoints->v[$i] - $polyBB[0]) * 10.0);
		$mPoints->v[$i + 1] = floor(($mPoints->v[$i + 1] - $polyBB[1]) * 10.0);
	}

	//create stencil lookup table with all false entries
	$fb = array_chunk(array_pad($fb, $w * $h, false), $w);

	//rasterize the polygon using barycentric coordinates and iteration variables
	for($i = 0; $i < count($mPoints->i); $i += 3) {
		$a = array($mPoints->v[$mPoints->i[$i] * 2], $mPoints->v[$mPoints->i[$i] * 2 + 1]);
		$b = array($mPoints->v[$mPoints->i[$i + 1] * 2], $mPoints->v[$mPoints->i[$i + 1] * 2 + 1]);
		$c = array($mPoints->v[$mPoints->i[$i + 2] * 2], $mPoints->v[$mPoints->i[$i + 2] * 2 + 1]);

		$ab = array($a[1] - $b[1], $b[0] - $a[0], $a[0] * $b[1] - $a[1] * $b[0]);
		$bc = array($b[1] - $c[1], $c[0] - $b[0], $b[0] * $c[1] - $b[1] * $c[0]);

		$ab_c_recip = 1.0 / ($ab[0] * $c[0] + $ab[1] * $c[1] + $ab[2]);
		$bc_a_recip = 1.0 / ($bc[0] * $a[0] + $bc[1] * $a[1] + $bc[2]);

		$Xmin = floor(min($a[0], $b[0], $c[0])); $Ymin = floor(min($a[1], $b[1], $c[1]));
		$Xmax = floor(max($a[0], $b[0], $c[0])); $Ymax = floor(max($a[1], $b[1], $c[1]));

		$alphaXIncr = $ab[0] * $ab_c_recip;
		$betaXIncr = $bc[0] * $bc_a_recip;

		for($y = $Ymin; $y < $Ymax; $y++) {
			$alpha = ($ab[0] * ($Xmin + 0.5) + $ab[1] * ($y + 0.5) + $ab[2]) * $ab_c_recip;
			$beta  = ($bc[0] * ($Xmin + 0.5) + $bc[1] * ($y + 0.5) + $bc[2]) * $bc_a_recip;
			for($x = $Xmin; $x < $Xmax; $x++) {
				if($alpha >= 0.0 && $beta >= 0.0 && ($alpha + $beta) <= 1.0) {
					$fb[$y][$x] = true;
				}
				$alpha += $alphaXIncr;
				$beta  += $betaXIncr;
			}
		}
	}

	$query = mysql_fetch_assoc(mysql_query(sprintf("SELECT header FROM %s_qt WHERE path = 'r'", mysql_real_escape_string($_GET['table']))));
	$data = json_decode($query['header']);

	//offset the polygon's local space bounding box to the point cloud's world space
	$offset[0] = ($data->BB[2] + $data->BB[0]) / 2;
	$offset[1] = ($data->BB[3] + $data->BB[1]) / 2;
	$polyBB[0] += $offset[0]; $polyBB[1] += $offset[1];
	$polyBB[2] += $offset[0]; $polyBB[3] += $offset[1];

	//recursively determine all points in the polygon and return the 95th percentil
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
	//get node
	$query = mysql_fetch_assoc(mysql_query(sprintf("SELECT header FROM %s_qt WHERE path = '%s'", mysql_real_escape_string($_GET['table']), $path)));
	$data = json_decode($query['header']);

	//check bounding box
	if(BBIntersect($data->BB)) {

		//recursively check children if not a leaf
		if($data->numChildren > 0) {
			for($i = 0; $i < $data->numChildren; $i++) {
				findHeightRecursive($path . '/' . $i);
			}
		}
		else {
			//check the points
			$query = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM %s_qt WHERE path = '%s'", mysql_real_escape_string($_GET['table']), $path)));
			$data = json_decode($query['data']);
			pointIntersect($data);
		}
	}
}


//determine if the polygon's bounding box intersects a given bounding box (from the quad tree)
function BBIntersect($BB) {
	global $polyBB;
	if($BB[0] > $polyBB[2] || $BB[2] < $polyBB[0] || $BB[1] > $polyBB[3] || $BB[3] < $polyBB[1]) {
		return false;
	}
	return true;
}

//determine if a node's points are in the polygon
function pointIntersect($points) {
	global $heightArr, $polyBB, $fb;
	for($i = 0; $i < count($points); $i += 3) {

		//first check if the point is in the poylgon's bounding box
		if($points[$i] <= $polyBB[2] && $points[$i] >= $polyBB[0] && $points[$i + 1] <= $polyBB[3] && $points[$i + 1] >= $polyBB[1]) {

			//check the rasterized stencil lookup table to see if the point is in the polygon
			if($fb[floor(($points[$i + 1] - $polyBB[1]) * 10.0)][floor(($points[$i] - $polyBB[0]) * 10.0)]) {
				array_push($heightArr, $points[$i + 2]);
			}
		}
	}
}

//add a marker to the database (only if user is logged in)
//calls function to determine the 95th height percentile 
function add() {
	session_start();
	if($_SESSION['logged_in'] == true) {
		$p = json_decode($_GET['points']);
		$vertStr = "[" . implode(",", $p->v) . "]";
		$height = findHeight($p);
		if($_GET['id'] > -1) {
			delete();
		}
		mysql_query(sprintf("INSERT INTO %s_markers(points, height, species, description, user) VALUES('%s', %f, '%s', '%s', '%s')", mysql_real_escape_string($_GET['table']),
							mysql_real_escape_string($vertStr), $height, mysql_real_escape_string($_GET['species']), mysql_real_escape_string($_GET['descr']), mysql_real_escape_string($_GET['user']))) or die('Query failed. ' . mysql_error());
		echo '{"id":' . mysql_insert_id() . ',"height":' . $height . '}';
	}
}

//delete a marker from the database (only if user is logged in)
function delete() {
	session_start();
	if($_SESSION['logged_in'] == true) {
		mysql_query(sprintf("DELETE FROM %s_markers WHERE id=%d", mysql_real_escape_string($_GET['table']), mysql_real_escape_string($_GET['id'])));
	}
}

//get existing markers for a specified point cloud
function start() {
	$result = mysql_query(sprintf("SELECT * FROM %s_markers", mysql_real_escape_string($_GET['table'])));
	echo '{"markers" : [';
	if($row = mysql_fetch_assoc($result)) {
		echo '{"id":', $row['id'], ',"points":', $row['points'], ',"height":', $row['height'], ',"species":"', $row['species'], '","descr":"', $row['description'], '","user":"', $row['user'], '"}';
		while ($row = mysql_fetch_assoc($result)) {
			echo ',{"id":', $row['id'], ',"points":', $row['points'], ',"height":', $row['height'], ',"species":"', $row['species'], '","descr":"', $row['description'], '","user":"', $row['user'], '"}';

		}
	}
	echo "]}";
}

//retrieve a specificed node of a specified pointcloud from the database
function getnode() {
	//this code is a hack for use with servers that limit the number of requests
	// $paths = explode(";", $_GET['path']);
	// if(count($paths) > 1) {
	// 	echo '[';
	// }
	// $i = 0;
	// for($i = 0; $i < count($paths) - 1; $i++) {
	// 	$result = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM %s WHERE path = '%s'", mysql_real_escape_string($_GET['table']), mysql_real_escape_string($paths[$i]))));
	// 	echo $result['data'] . ',';
	// }
	// $result = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM %s WHERE path = '%s'", mysql_real_escape_string($_GET['table']), mysql_real_escape_string($paths[$i]))));
	// echo $result['data'];
	// if(count($paths) > 1) {
	// 	echo ']';
	// }

	//this code allows for unlimited requests
	$result = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM %s_oct WHERE path = '%s'", mysql_real_escape_string($_GET['table']), mysql_real_escape_string($_GET['path']))));
	echo $result['data'];
}

//check for user and start a session if they are in the system
function login() {
	$result = mysql_fetch_assoc(mysql_query(sprintf("SELECT password FROM users WHERE username = '%s'", mysql_real_escape_string($_GET['username']))));
	if($result) {
		if(validate_password($_GET['password'], $result['password'])) {
			mysql_query(sprintf("UPDATE users SET loggedin = 1, secs = %d WHERE username = '%s'", time(), mysql_real_escape_string($_GET['username'])));
			echo '{"success":true}';
			session_start();
			$_SESSION['logged_in'] = true;
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
	session_destroy();
}

//get positions of users currently logged in so that they are displayable in the application
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
