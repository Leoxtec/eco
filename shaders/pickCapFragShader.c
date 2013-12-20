varying lowp vec4 vFrontColor;
varying highp vec2 vTexCoord;

void main(void) {
	highp vec2 pos = vTexCoord - vec2(0.5, 0.5);
	if(dot(pos, pos) > 0.25) {
		discard;
	}
	gl_FragColor = vFrontColor;
}