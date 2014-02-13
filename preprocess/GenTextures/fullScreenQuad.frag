uniform sampler2D uSampler;

varying highp vec2 vTexCoord;

void main(void) {
	gl_FragColor = texture2D(uSampler, vTexCoord);
}