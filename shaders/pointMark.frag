void main(void) {
	highp vec2 pos = gl_PointCoord - vec2(0.5, 0.5);
	if(dot(pos, pos) > 0.25) {
		discard;
	}
	gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}