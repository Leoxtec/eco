attribute float index;

varying vec2 vTexCoord;

void main(void) {
	vec2 temp = vec2(mod(index, 2.0), floor(index * 0.5));
	vTexCoord = temp;
	gl_Position = vec4(temp * 2.0 - vec2(1.0, 1.0), 0.0, 1.0);
}