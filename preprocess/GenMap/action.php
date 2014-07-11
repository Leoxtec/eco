<?php
//grab nodes from the database for a specified octree

$link = mysql_connect('ip', 'user', 'password');
$db = mysql_select_db('database', $link);

$key = $_GET["a"];

switch($key) {
	case 'getnode':
		getnode();
}

function getnode() {
	$result = mysql_fetch_assoc(mysql_query(sprintf("SELECT data FROM %s WHERE path = '%s'", mysql_real_escape_string($_GET['table']), mysql_real_escape_string($_GET['path']))));
	echo $result['data'];
}