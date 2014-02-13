<?php

$link = mysql_connect('localhost', 'root', 'jessica');
$db = mysql_select_db('markers', $link);

$key = $_GET["a"];

switch($key) {
	case 'getnode':
		getnode();
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