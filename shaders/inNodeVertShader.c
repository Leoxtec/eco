attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 ps_ModelViewMatrix;
uniform mat4 ps_ProjectionMatrix;
uniform float ps_size;

varying vec4 frontColor;

void main(void) {
	frontColor = aVertexColor;
	gl_PointSize = ps_size;
	gl_Position = ps_ProjectionMatrix * ps_ModelViewMatrix * vec4(aVertexPosition, 1.0);
}