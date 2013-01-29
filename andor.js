//var ps, cloud1, cloud2;
var ps, cloud0;
//small map
var ps1, ps2;

var cloud = new Array(5);
var choosefile = [0,0,0,0,0];
var ratio = 0.0;
var preratio = 0.0;

ps = new PointStream();

// Create an orbit camera halfway between the closest and farthest point
var cam = new OrbitCam({closest:10, farthest:100, distance: 100});
var isDragging = false;
var rotationStartCoords = [0, 0];

function zoom(amt){
  var invert = document.getElementById('invertScroll').checked ? -1: 1;
  
  amt *= invert;
  
  if(amt < 0){
    cam.goCloser(-amt);
  }
  else{
    cam.goFarther(amt);
  }   
}

function updateValue(newvalue)
    {
        var num = parseFloat(newvalue);
        if (isNaN(num))
            newvalue = 0;
        //alert(num);             ///////debug

        document.getElementById("scale").innerHTML = num.toFixed(1);
        ratio = num.toFixed(1);
        var differ = preratio - ratio;
        preratio = ratio;
        if(differ < 0) 
        	ratio = (-1)*ratio;
        
        //	zoom(ratio);
        if(ratio < 0){
  			  cam.goCloser(-ratio);
  		}
  		else{
    		cam.goFarther(ratio);
  		}   
    }
//
//function resize_canvas(){
//	 canvas = document.getElementById('canvas');
//	 var inv = document.getElementById('resize_canvas').checked ? -1: 1;
//     if(inv < 0)
//     {
//            if (canvas.width  < window.innerWidth)
//            {
//                canvas.width  = window.innerWidth;
//            }
//
//            if (canvas.height < window.innerHeight)
//            {
//                canvas.height = window.innerHeight;
//            }
//    }
//}
function topview(objname){
    var img = new Image();   // Create new Image object
    img.src = 'texture.png'; // Set source path
    img.onload = function(){
        ps1 = document.getElementById('canvas1').getContext('2d');
        ps1.drawImage(img,0,0,270,270);
    }
}

function checkselect(objname)
{
	  var  o = document.getElementById(objname);
	  var  t = document.getElementById("output");
	  var intvalue="";
    	for(i=0;i<o.length;i++){   
		      if(o.options[i].selected){
	    	  intvalue+=o.options[i].value+",";
//put 1 in the selected file index 
			  choosefile[i]=1;
	    	  }
  		}
  	  t.value=intvalue.substr(0,intvalue.length-1);
//  	  alert("load  "+choosefile[0]+choosefile[1]+choosefile[2]+choosefile[3]+choosefile[4]+"  file(s)");
  
  ps.setup(document.getElementById('canvas'));
  
  ps.background([0, 0, 0, 0.5]);
  ps.pointSize(1);

  ps.onRender = render;
  ps.onMouseScroll = zoom;
  ps.onMousePressed = mousePressed;
  ps.onMouseReleased = mouseReleased;
  
  ps.registerParser("ply", PLYParser);
  cloud = new Array(5);
//load files
  if(choosefile[0] == 1){
     cloud[0] = ps.load("clouds/spring.ply");
//     cloud.push() = newelement;
  }
  if(choosefile[1] == 1){
     cloud[1] = ps.load("clouds/leaf_on.ply");
  }
  if(choosefile[2] == 1){
     cloud[2] = ps.load("clouds/leaf_off.ply");
  }
  if(choosefile[3] == 1){
     cloud[3] = ps.load("clouds/lidar.ply");
  }
  if(choosefile[4] == 1){
     cloud[4] = ps.load("clouds/senesce.ply");
  }
  choosefile = [0,0,0,0,0];	  
  preratio = 0.0;

  topview(objname);
}

function mousePressed(){
  rotationStartCoords[0] = ps.mouseX;
  rotationStartCoords[1] = ps.mouseY;
  
  isDragging = true;
}

function mouseReleased(){
  isDragging = false;
}

function render(){
  if(isDragging === true){		
		// how much was the cursor moved compared to last time
		// this function was called?
    var deltaX = ps.mouseX - rotationStartCoords[0];
    var deltaY = ps.mouseY - rotationStartCoords[1];
		
		// now that the camera was updated, reset where the
		// rotation will start for the next time this function is called.
		rotationStartCoords = [ps.mouseX, ps.mouseY];

    cam.yaw(-deltaX * 0.015);
    cam.pitch(deltaY * 0.015);
	}
 
  var c = cloud0.getCenter();    //center
   
  ps.multMatrix(M4x4.makeLookAt(cam.position, cam.direction, cam.up));
  ps.translate(-cam.position[0]-c[0], -cam.position[1]-c[1], -cam.position[2]-c[2] );
  
  ps.clear();
// render each file
  for(var i=0; i<5; i++)
  {
  	if(cloud[i])
  	{
  		ps.render(cloud[i]);
  	}
  	else
  		continue;
  }
//  cloud = new Array(5);
//    var ctx=ps.getContext("2d");
//    ctx.fillStyle="#FF0000";
//    ctx.fillRect(0,0,50,75);
//  ps.render(cloud0);
//   ps.render(cloud2);
}

function start(){
  // ps = new PointStream();
  
  ps.setup(document.getElementById('canvas'));
  
  ps.background([0, 0, 0, 0.5]);
  ps.pointSize(1);

  ps.onRender = render;
  ps.onMouseScroll = zoom;
  ps.onMousePressed = mousePressed;
  ps.onMouseReleased = mouseReleased;
  
  ps.registerParser("ply", PLYParser);

  cloud0 = ps.load("clouds/leaf_on.ply");

//   cloud1 = ps.load("clouds/leaf_on.ply");
//   cloud2 = ps.load("clouds/leaf_off.ply");
}


