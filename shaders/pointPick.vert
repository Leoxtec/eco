#pragma STDGL invariant(all)

attribute highp vec3 aVertexPosition;
attribute vec4 aPickColor;

uniform mat4 uPPMV;

varying vec4 vColor;

void main(void) {
	//pick color is used as an id to determine closest point after ReadPixels()
	vColor = aPickColor;

	//using an extra matrix to scale the view volume to a 10 by 10 pixel area centered on the cursor position
	gl_Position = uPPMV * vec4(aVertexPosition, 1.0);
	gl_PointSize = 1.0;
}