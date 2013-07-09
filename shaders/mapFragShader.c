uniform sampler2D uSampler;

varying highp vec2 v_texCoord;

void main(void) {
	gl_FragColor = texture2D(uSampler, v_texCoord);
}