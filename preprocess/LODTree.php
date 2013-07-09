<?php

class Node {
	public $bbMin;
	public $bbMax;
	public $children;
	public $points;
	public $subDim;

	public function __construct($min, $max) {
		$this->bbMin = $min;
		$this->bbMax = $max;
		$this->points = array();
		$this->children = array();
		for($i = 0; $i < 3; $i++) {
			$this->subDim[$i] = ($max[$i] - $min[$i]) / $_POST['partition'];
		}
	}

	public function addPoint($point) {
		if(count($this->children) == 0) {
			$pointCount = count($this->points);
			if($pointCount / 6 <= $_POST['density']) {
				array_splice($this->points,0,0,$point);
			}
			else {
				for($i = 0; $i < $pointCount; $i += 6) {
					$this->addToChild(array_slice($this->points, $i, 6));
				}
				$this->points = array();
				$this->addToChild($point);
			}
		}
		else {
			$this->addToChild($point);
		}
 	}

 	private function addToChild($point) {
 		$relPos = array($point[0] - $this->bbMin[0], $point[1] - $this->bbMin[1], $point[2] - $this->bbMin[2]);
 		$offsets;
 		for($i = 0; $i < 3; $i++) {
 			$offsets[$i] = (int)($relPos[$i] / $this->subDim[$i]);
 		}
 		$index = $offsets[0] * $_POST['partition'] * $_POST['partition'] + $offsets[1] * $_POST['partition'] + $offsets[2];
 		if(array_key_exists($index, $this->children)) {
 			$this->children[$index]->addPoint($point);
 		}
 		else {
 			$min;
 			$max;
 			for($i = 0; $i < 3; $i++) {
 				$min[$i] = $this->bbMin[$i] + $offsets[$i] * $this->subDim[$i];
 				$max[$i] = $min[$i] + $this->subDim[$i];
 			}
 			$this->children[$index] = new Node($min, $max);
 			$this->children[$index]->addPoint($point);
 		}
 	}

 	public function averageAndCommit() {
 		$this->recursiveAAC('r');
 	}

 	private function recursiveAAC($path) {
 		$totalPoints = 0;
 		$avg = array(0, 0, 0, 0, 0, 0);
 		if(count($this->children) != 0) {
 			$childCount = 0;
	 		foreach($this->children as $child) {
	 			$result = $child->recursiveAAC($path . '/' . $childCount);
	 			for($i = 0; $i < 6; $i++) {
		 			$avg[$i] += $result[$i];
		 		}
	 			$totalPoints += count($child->points) / 6;
	 			$childCount++;
	 		}
	 		for($i = 0; $i < count($avg); $i++) {
	 			$avg[$i] /= $totalPoints;
	 			$this->points[$i] = $avg[$i];
	 		}
	 	}
	 	else {
	 		for($i = 0; $i < count($this->points); $i += 6) {
	 			$avg[0] += $this->points[$i]; 	  $avg[1] += $this->points[$i + 1]; $avg[2] += $this->points[$i + 2];
	 			$avg[3] += $this->points[$i + 3]; $avg[4] += $this->points[$i + 4]; $avg[5] += $this->points[$i + 5];
	 		}
 		}
 		$data = '{"numChildren":' . count($this->children) . ',"BB":[' . vsprintf("%.6f,%.6f,%.6f,", $this->bbMax) 
 			  . vsprintf("%.6f,%.6f,%.6f", $this->bbMin) . '],"Point":[';
 		for($i = 0; $i < count($this->points) - 1; $i++) {
 			if($i % 6 < 3) {
 				$data .= sprintf("%.4f,", $this->points[$i]);
 			}
 			else {
 				$data .= (int)$this->points[$i] . ',';
 			}
 		}
 		$data .= (int)end($this->points) . ']}';
 		mysql_query(sprintf("INSERT INTO %s(path, data) VALUES('%s', '%s')", $_POST['table'], $path, $data));
 		return $avg;
 	}
}

function strToPoint($str) {
	$point = explode(' ', $str);
	for($i = 0; $i < 3; $i++) {
		$point[$i] = (float)$point[$i];
		$point[$i + 3] = (int)$point[$i + 3];
	}
	// if(count($point) > 6) {
	// 	unset($point[6]);
	// 	unset($point[7]);
	// }
	return $point;
}

function MinMax(&$min, &$max, $val) {
	if($val < $min) {
		$min = $val;
	}
	else if($val > $max) {
		$max = $val;
	}
}

if ($_FILES["file"]["error"] > 0) {
	echo "Error: " . $_FILES["file"]["error"] . "<br/>";
	die();
}
if(strcmp(end(explode('.', $_FILES["file"]["name"])), 'ply') != 0) {
	echo "Error: Please upload a .ply file<br/>";
	die();
}

$link = mysql_connect('localhost', 'root', 'jessica') or die(mysql_error());
$db = mysql_select_db('markers', $link) or die(mysql_error());

// mysql_query("CREATE TABLE " . $_POST['table'] . "(path VARCHAR(100) NOT NULL,PRIMARY KEY(path),data VARCHAR(" . (116 + 48 * $_POST['density']) . "))") or die(mysql_error());
mysql_query("CREATE TABLE " . $_POST['table'] . "(path VARCHAR(100) NOT NULL,PRIMARY KEY(path),data MEDIUMTEXT)") or die(mysql_error());

$min; $max;
$file = fopen($_FILES["file"]["tmp_name"],"r");
while(!feof($file) && strncmp(fgets($file), 'end_header', 10) != 0) {;}

$startOfData = ftell($file);
$tempPoint = strToPoint(fgets($file));
$min[0] = $max[0] = $tempPoint[0]; $min[1] = $max[1] = $tempPoint[1]; $min[2] = $max[2] = $tempPoint[2];
while(!feof($file)) {
	$tempStr = fgets($file);
	if(!feof($file)) {
		$tempPoint = strToPoint($tempStr);
		for($i = 0; $i < 3; $i++) {
			MinMax($min[$i], $max[$i], $tempPoint[$i]);
		}
	}
}
for($i = 0; $i < 3; $i++) {
	$min[$i] -= 0.5; $max[$i] += 0.5;
}

$root = new Node($min, $max);

fseek($file, $startOfData);
while(!feof($file)) {
	$tempStr = fgets($file);
	if(!feof($file)) {
		$root->addPoint(strToPoint($tempStr));
	}
}
fclose($file);

$root->averageAndCommit();

echo 'DONE!';
?>