attribute vec3 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main(void) {
	gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);

	//make the point marks always visible regardless of scene geometry
	gl_Position[2] = -1.0;
	gl_PointSize = 10.0;
}