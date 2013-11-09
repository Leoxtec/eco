attribute vec3 aVertexPosition;

uniform vec3 uVertexColor;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec4 vFrontColor;

void main(void) {
	vFrontColor = vec4(uVertexColor, 1.0);
	gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}