attribute vec3 aVertexPosition;
attribute vec2 aTexCoord;

uniform mat4 uMVP;

varying vec2 vTexCoord;

void main(void) {
	gl_Position = uMVP * vec4(aVertexPosition, 1.0);
	vTexCoord = aTexCoord;
}