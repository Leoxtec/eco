attribute vec3 aVertexPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uPickingMatrix;
uniform vec4 uColor;

varying vec4 vFrontColor;
varying vec2 vTexCoord;

void main(void) {
	vFrontColor = uColor;
	gl_Position = uPickingMatrix * uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
	vTexCoord = aTexCoord;
}