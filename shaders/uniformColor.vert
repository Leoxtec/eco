//for setting a uniform color per draw 

attribute vec3 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uColor;

varying vec4 vColor;

void main(void) {
	vColor = vec4(uColor, 1.0);
	gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}