<?php

function strToPoint($str) {
	$point = explode(' ', $str);
	for($i = 0; $i < 3; $i++) {
		$point[$i] = (float)$point[$i];
		$point[$i + 3] = (int)$point[$i + 3];
	}
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


$min; $max;
$file = fopen($_FILES["file"]["tmp_name"],"r");
while(!feof($file) && strncmp(fgets($file), 'end_header', 10) != 0) {;}

$startOfData = ftell($file);
$tempPoint = strToPoint(fgets($file));
$min[0] = $max[0] = $tempPoint[0]; $min[1] = $max[1] = $tempPoint[1];
while(!feof($file)) {
	$tempStr = fgets($file);
	if(!feof($file)) {
		$tempPoint = strToPoint($tempStr);
		for($i = 0; $i < 2; $i++) {
			MinMax($min[$i], $max[$i], $tempPoint[$i]);
		}
	}
}

$border; $dim; $scale; $color;
for($i = 0; $i < 2; $i++) {
	$border[$i] = ($max[$i] - $min[$i]) * 0.125;
	$min[$i] -= $border[$i]; $max[$i] += $border[$i];
	$dim[$i] = $max[$i] - $min[$i];
	$scale[$i] = 512 / $dim[$i];
}

$depth = array();
for($i = 0; $i < 512; $i++) {
	$depth[$i] = array();
	for($j = 0; $j < 512; $j++) {
		$depth[$i][$j] = -INF;
	}
}

$img = imagecreatetruecolor(512, 512);
$background = imagecolorallocatealpha($img, 0, 0, 0, 127);
imagealphablending($img, false);
imagefilledrectangle($img, 0, 0, 512, 512, $background);
imagecolordeallocate($img, $background);

fseek($file, $startOfData);
while(!feof($file)) {
	$tempStr = fgets($file);
	if(!feof($file)) {
		$tempPoint = strToPoint($tempStr);
		$tempPoint[0] = (int)(($tempPoint[0] - $min[0]) * $scale[0]);
		$tempPoint[1] = 512 - (int)(($tempPoint[1] - $min[1]) * $scale[1]);
		if($tempPoint[2] > $depth[$tempPoint[0]][$tempPoint[1]]) {
			$depth[$tempPoint[0]][$tempPoint[1]] = $tempPoint[2];
			$color = imagecolorallocatealpha($img, $tempPoint[3], $tempPoint[4], $tempPoint[5], 0);
			imagesetpixel($img, $tempPoint[0], $tempPoint[1], $color);
			imagecolordeallocate($img, $color);
		}
	}
}
fclose($file);
imagesavealpha($img, true);
imagepng($img, current(explode('.', $_FILES["file"]["name"])) . '.png');
imagedestroy($img);

echo 'DONE!';
?>