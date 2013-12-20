attribute vec3 aVertexPosition;
attribute float aLetterIndex;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uSizeFactor;

varying float vLetterIndex;

void main(void) {
	vLetterIndex = aLetterIndex;
	vec4 ecPos4 = uModelViewMatrix * vec4(aVertexPosition, 1.0);
	gl_PointSize = uSizeFactor / -ecPos4.z;
	gl_Position = uProjectionMatrix * ecPos4;
}