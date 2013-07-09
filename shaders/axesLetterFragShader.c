uniform sampler2D uSampler;

varying lowp float li;

void main(void) {
	gl_FragColor = texture2D(uSampler, vec2(mod(li, 2.0) * 0.5 + gl_PointCoord.x / 2.0, floor(li / 2.0) * 0.5 + gl_PointCoord.y / 2.0));
}