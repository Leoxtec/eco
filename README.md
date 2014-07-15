Ecosynth dataset browser
========================

Web-based browser of ecosynth datasets


## Dependencies (For Preprocessing Code)
	make
	build-essential
	libmysqlcppconn-dev

## MySQL Database Setup

1. Login to MySQL
2. Enter: 'CREATE SCHEMA IF NOT EXISTS EcoBrowser;'
3. Enter: 'USE EcoBrowser'
3. Enter: 'CREATE TABLE users(username VARCHAR(20), password CHAR(77), loggedin TINYINT(1), secs INT(11), x FLOAT, y FLOAT, z FLOAT);'
4. Exit: '\q'


## Setting Up EcosynthBrowser with MySQL

Modify mysql_connect() arguments in the following files:

- action.php
- checkUsers.php

1. Set 'ip' to 'localhost'
2. Set 'user' to MySQL user
3. Set 'password' to MySQL password


## Notes

To Find Places to Fill in SQL Information: `grep -r "'ip'" .`



## Preprocessing Notes


1. ./convertFromPMVS or ./convertFromBundler
	Inputs:
		/pmvsDir
		/bundlerDir

	Output:
		unfiltered_ecobrowser.ply (xyzrgbInIxIy.ply)

2. Noise Filtering
	Input:
		unfiltered_ecobrowser.ply

	Output:
		ecobrowser_ready.ply (filtered_xyzrgbInIxIy.ply)


Do Locally
----------
Do On Server


3. ./BuildOctree noise_filt.ply   (for Octree and Markers tables)
	./BuildQuadtree noise_filt.ply  (for Quadtree table)

	Input:
		ecobrowser_ready.ply

	Outputs:
		SQL Tables on (Synology Server? Do I check with PHPMyAdmin?)

(Necessary?)
4. Create 300x225 PNG Thumbnails
	
	Inputs:
		Image Set

	Outputs:
		300x225 PNG Thumbnails in Synology/.../thumbnails/newDir

(How?) 
5. Generate Map Texture and store in Synology/.../mapTextures



