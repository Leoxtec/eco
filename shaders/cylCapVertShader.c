attribute vec3 aVertexPosition;
attribute vec2 vTexCoord;

uniform mat4 ps_ModelViewMatrix;
uniform mat4 ps_ProjectionMatrix;

varying vec2 v_texCoord;

void main(void) {
	gl_Position = ps_ProjectionMatrix * ps_ModelViewMatrix * vec4(aVertexPosition, 1.0);
	v_texCoord = vTexCoord;
}