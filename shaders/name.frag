uniform sampler2D uSampler;

varying highp vec2 vTexCoord;
varying lowp float changeBG;

void main(void) {
	gl_FragColor = texture2D(uSampler, vTexCoord);
	if(gl_FragColor.a == 0.0) {
		//change the background color if the texture is behind the viewer
		if(changeBG == 1.0) {
			gl_FragColor.ra = vec2(1.0, 1.0);
		}
	}
	else {
		gl_FragColor.a = 1.0;
	}
}