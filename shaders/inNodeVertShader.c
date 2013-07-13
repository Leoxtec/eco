attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uSize;

varying vec4 vFrontColor;

void main(void) {
	vFrontColor = aVertexColor;
	gl_PointSize = uSize;
	gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}