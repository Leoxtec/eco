<?php
//include('db.php');

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
}	

function add() {
	mysql_query(sprintf("INSERT INTO markers(radius, centerX, centerY, centerZ, height, species, description) VALUES(%f, %f, %f, %f, %f, '%s', '%s')",
						mysql_real_escape_string($_GET['radius']), 
						mysql_real_escape_string($_GET['centerX']),
						mysql_real_escape_string($_GET['centerY']),
						mysql_real_escape_string($_GET['centerZ']),
						mysql_real_escape_string($_GET['height']),
						mysql_real_escape_string($_GET['species']),
						mysql_real_escape_string($_GET['descr'])));
	echo mysql_insert_id();
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