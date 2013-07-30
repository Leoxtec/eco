uniform sampler2D uSampler;

varying lowp float vLetterIndex;

void main(void) {
	gl_FragColor = texture2D(uSampler, vec2((mod(vLetterIndex, 2.0) + gl_PointCoord.x) * 0.5, (floor(vLetterIndex / 2.0) + gl_PointCoord.y) * 0.5));
}