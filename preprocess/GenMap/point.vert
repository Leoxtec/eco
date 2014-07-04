attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uMVP;

varying vec4 vColor;

void main(void) {
	vColor = aVertexColor;
	gl_Position = uMVP * aVertexPosition;
	gl_PointSize = 1.0;
}