#pragma STDGL invariant(all)

attribute highp vec3 aVertexPosition;
attribute vec3 aPickColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uPickingMatrix;
uniform mat4 uPPMV;
// uniform vec4 uColor;

varying vec4 vColor;

void main(void) {
	// vColor = uColor;
	vColor = vec4(aPickColor, 1.0);

	// vec4 temp = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
	// temp /= temp.w;
	// gl_Position = uPickingMatrix * temp;
	// gl_Position = uPickingMatrix * uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
	gl_Position = uPPMV * vec4(aVertexPosition, 1.0);
	
	// gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
	gl_PointSize = 1.0;
}