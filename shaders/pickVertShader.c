attribute vec3 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uPickingMatrix;
uniform vec4 uColor;

varying vec4 vFrontColor;

void main(void) {
	vFrontColor = uColor;
	gl_Position = uPickingMatrix * uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}