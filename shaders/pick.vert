attribute vec3 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uPickingMatrix;
uniform vec4 uColor;

varying vec4 vColor;

void main(void) {
	vColor = uColor;

	//use picking matrix to scale view volume down to what would only be seen in a single pixel
	gl_Position = uPickingMatrix * uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}