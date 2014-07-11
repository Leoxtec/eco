attribute vec2 aVertexPosition;

uniform vec2 uOffset;

void main(void) {
	//use offset to center cross on the point closest to the cursor
	gl_Position = vec4(aVertexPosition + uOffset, -1.0, 1.0);
}