attribute vec3 aVertexPosition;

uniform mat4 ps_ModelViewMatrix;
uniform mat4 ps_ProjectionMatrix;
uniform mat4 ps_PickingMatrix;
uniform vec4 ps_Color;

varying vec4 frontColor;

void main(void) {
	frontColor = ps_Color;
	gl_Position = ps_PickingMatrix * ps_ProjectionMatrix * ps_ModelViewMatrix * vec4(aVertexPosition, 1.0);
}