<?php
// code adapted from http://stackoverflow.com/questions/9771986/fabric-js-canvas-todataurl-sent-to-php-by-ajax
// used to store the webGL generated map of a point cloud

$data = base64_decode($_POST["str"]);

$urlUploadImages = "../StartupTextures/";
// $urlUploadImages = "../startTextures/";
$nameImage = $_POST["file"] . ".png";

$img = imagecreatefromstring($data);

imageAlphaBlending($img, true);
imageSaveAlpha($img, true);

if($img) {
	imagepng($img, $urlUploadImages . $nameImage, 0);
	imagedestroy($img);

	echo "OK";
}
else {
	echo 'ERROR';
}