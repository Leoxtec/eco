<?php 

$img = imagecreatetruecolor(32, 32);
$background = imagecolorallocatealpha($img, 0, 0, 0, 127);
imagealphablending($img, false);
imagefilledrectangle($img, 0, 0, 32, 32, $background);
imagecolordeallocate($img, $background);
$white = imagecolorallocatealpha($img, 255, 255, 255, 0);

//E
imageline($img, 2, 1, 2, 14, $white);
imageline($img, 3, 1, 3, 14, $white);
imageline($img, 4, 1, 12, 1, $white);
imageline($img, 4, 2, 12, 2, $white);
imageline($img, 4, 7, 8, 7, $white);
imageline($img, 4, 8, 8, 8, $white);
imageline($img, 4, 13, 12, 13, $white);
imageline($img, 4, 14, 12, 14, $white);

//N
imageline($img, 19, 1, 19, 13, $white);
imageline($img, 20, 1, 20, 13, $white);
imageline($img, 28, 1, 28, 13, $white);
imageline($img, 29, 1, 29, 13, $white);
imageline($img, 20, 1, 28, 11, $white);
imageline($img, 20, 2, 28, 12, $white);
imageline($img, 20, 3, 28, 13, $white);

//U
imageline($img, 2, 18, 2, 30, $white);
imageline($img, 3, 18, 3, 30, $white);
imageline($img, 11, 18, 11, 30, $white);
imageline($img, 12, 18, 12, 30, $white);
imageline($img, 4, 29, 10, 29, $white);
imageline($img, 4, 30, 10, 30, $white);

imagecolordeallocate($img, $white);
imagesavealpha($img, true);
imagepng($img, 'letters.png');
imagedestroy($img);

echo 'DONE!';

?>