uniform sampler2D uSampler;

varying lowp float vLetterIndex;

void main(void) {
	gl_FragColor = texture2D(uSampler, vec2(mod(vLetterIndex, 2.0) * 0.5 + gl_PointCoord.x / 2.0, floor(vLetterIndex / 2.0) * 0.5 + gl_PointCoord.y / 2.0));
}