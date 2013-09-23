<?php

$link = mysql_connect('localhost', 'root', 'jessica');
$db = mysql_select_db('markers', $link);

$result = mysql_query(sprintf("SELECT * FROM users WHERE loggedin = 1"));
while ($row = mysql_fetch_assoc($result)) {
	if(time() - $row['secs'] > 60) {
		mysql_query(sprintf("UPDATE users SET loggedin = 0 WHERE username = '%s'", $row['username']));
	}
}

?>