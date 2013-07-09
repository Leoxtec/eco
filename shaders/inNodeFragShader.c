varying lowp vec4 frontColor;

void main(void) {
	highp vec2 pos = gl_PointCoord - vec2(0.5, 0.5);
	highp float dist_squared = dot(pos, pos);
	if(dist_squared > 0.25) {
		discard;
	}
	gl_FragColor = vec4(frontColor.rgb * sqrt(0.5 - dist_squared) * 2.0, frontColor.a);
}