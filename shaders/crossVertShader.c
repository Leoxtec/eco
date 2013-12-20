attribute vec2 aVertexPosition;

uniform vec2 uOffset;

void main(void) {
	gl_Position = vec4(aVertexPosition + uOffset, -1.0, 1.0);
}