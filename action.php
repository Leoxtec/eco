<?php

$link = mysql_connect('localhost', 'root', 'jessica');
$db = mysql_select_db('markers' ,$link);

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
}

function findHeight($cyl) {
	$query = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM b250_15000 WHERE path = 'r'")));
	// $query = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM bothleavestext WHERE path = 'r'")));
	$data = json_decode($query['data']);
	$cyl[0] += ($data->BB[0] - $data->BB[3]) / 2 + $data->BB[3];
	$cyl[1] += ($data->BB[1] - $data->BB[4]) / 2 + $data->BB[4];
	$cyl[2] += ($data->BB[2] - $data->BB[5]) / 2 + $data->BB[5];
	$height = findHeightRecursive($cyl, 'r');
	if($height === -INF) {
		$height = $data->BB[5];
	}
	return $height;
}

function findHeightRecursive($cyl, $path) {
	$query = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM b250_15000 WHERE path = '%s'", $path)));
	// $query = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM bothleavestext WHERE path = '%s'", $path)));
	$data = json_decode($query['data']);
	if(intersect($cyl, $data->BB)) {
		$highest = -INF;
		$result;
		if($data->numChildren > 0) {
			for($i = 0; $i < $data->numChildren; $i++) {
				$result = findHeightRecursive($cyl, $path . '/' . $i);
				if($result > $highest) {
					$highest = $result;
				}
			}
		}
		else {
			for($i = 0; $i < count($data->Point); $i += 6) {
				$distX = $cyl[0] - $data->Point[$i];
				$distY = $cyl[1] - $data->Point[$i + 1];
				$squareDist = $distX * $distX + $distY * $distY;
				if($squareDist < $cyl[3] * $cyl[3] && $data->Point[$i + 2] > $highest) {
					$highest = $data->Point[$i + 2];
				}
			}
		}
		return $highest;
	}
	return -INF;
}

function intersect($cyl, $BB) {
	$closestX = clamp($cyl[0], $BB[3], $BB[0]);
	$closestY = clamp($cyl[1], $BB[4], $BB[1]);
	$distX = $cyl[0] - $closestX;
	$distY = $cyl[1] - $closestY;
	$squareDist = $distX * $distX + $distY * $distY;
	return $squareDist < $cyl[3] * $cyl[3];
}

function clamp($val, $min, $max) {
	if($val < $min) {
		return $min;
	}
	if($val > $max) {
		return $max;
	}
	return $val;
}

function add() {
	$cyl[0] = mysql_real_escape_string($_GET['centerX']);
	$cyl[1] = mysql_real_escape_string($_GET['centerY']);
	$cyl[2] = mysql_real_escape_string($_GET['centerZ']);
	$cyl[3] = mysql_real_escape_string($_GET['radius']);
	$height = findHeight($cyl);
	mysql_query(sprintf("INSERT INTO markers(radius, centerX, centerY, centerZ, height, species, description) VALUES(%f, %f, %f, %f, %f, '%s', '%s')",
						$cyl[3], $cyl[0], $cyl[1], $cyl[2], $height, mysql_real_escape_string($_GET['species']), mysql_real_escape_string($_GET['descr'])));
	echo '{"id":' . mysql_insert_id() . ',"height":' . $height . '}';
}

function delete() {
	mysql_query(sprintf("DELETE FROM markers WHERE id=%d", mysql_real_escape_string($_GET['id'])));
}

function start() {
	$result = mysql_query(sprintf("SELECT * FROM markers"));
	echo '{"markers" : [';
	if($row = mysql_fetch_assoc($result)) {
		echo '{"id":', $row['id'], ',"radius":', $row['radius'], ',"centerX":', $row['centerX'], ',"centerY":', $row['centerY'], ',"centerZ":', $row['centerZ'], ',"height":', $row['height'], ',"species":"', $row['species'], '","descr":"', $row['description'], '"}';
		while ($row = mysql_fetch_assoc($result)) {
			echo ',{"id":', $row['id'], ',"radius":', $row['radius'], ',"centerX":', $row['centerX'], ',"centerY":', $row['centerY'], ',"centerZ":', $row['centerZ'], ',"height":', $row['height'], ',"species":"', $row['species'], '","descr":"', $row['description'], '"}';
		}
	}
	echo "]}";
}

function getnode() {
	$result = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM b250_15000 WHERE path = '%s'", mysql_real_escape_string($_GET['path']))));
	// $result = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM bothleavestext WHERE path = '%s'", mysql_real_escape_string($_GET['path']))));
	echo $result['data'];
}

function getMapSize() {
	$result = mysql_fetch_assoc(mysql_query(sprintf("SELECT size FROM orthosize WHERE name = '%s'", mysql_real_escape_string($_GET['name']))));
	echo $result['size'];
}