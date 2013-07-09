attribute vec3 aVertexPosition;
attribute float letterIndex;

uniform mat4 ps_ModelViewMatrix;
uniform mat4 ps_ProjectionMatrix;
uniform float sizeFactor;

varying float li;

void main(void) {
	li = letterIndex;
	vec4 ecPos4 = ps_ModelViewMatrix * vec4(aVertexPosition, 1.0);
	gl_PointSize = sizeFactor / -ecPos4.z;
	gl_Position = ps_ProjectionMatrix * ecPos4;
}