attribute vec3 aVertexPosition;
attribute vec3 aNormal;

uniform mat4 ps_ModelViewMatrix;
uniform mat4 ps_ProjectionMatrix;

varying vec4 vPosition;
varying vec3 vTransformedNormal;

void main(void) {
	vPosition = ps_ModelViewMatrix * vec4(aVertexPosition, 1.0);
	gl_Position = ps_ProjectionMatrix * vPosition;
	vTransformedNormal = (ps_ModelViewMatrix * vec4(aNormal, 0.0)).xyz;
}