attribute vec3 aVertexPosition;
attribute vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec4 vPosition;
varying vec3 vTransformedNormal;

void main(void) {
	vPosition = uModelViewMatrix * vec4(aVertexPosition, 1.0);
	gl_Position = uProjectionMatrix * vPosition;
	vTransformedNormal = normalize((uModelViewMatrix * vec4(aNormal, 0.0)).xyz);
}