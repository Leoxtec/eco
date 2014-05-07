<?php
//quick script used by cron job on server side to logout users who have not moved in the last half hour
//which assumes they have closed the borwser without logging out
//now that sessions are being used, this should be replaced to log out when the session expires

$link = mysql_connect('ip', 'user', 'password');
$db = mysql_select_db('database', $link);

$result = mysql_query(sprintf("SELECT * FROM users WHERE loggedin = 1"));
while ($row = mysql_fetch_assoc($result)) {
	if(time() - $row['secs'] > 1800) {
		mysql_query(sprintf("UPDATE users SET loggedin = 0 WHERE username = '%s'", $row['username']));
	}
}

?>