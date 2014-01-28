uniform sampler2D uSampler;
uniform highp vec3 uBias;
uniform highp vec3 uScale;
uniform int uCEMode; 

varying highp vec2 vTexCoord;

void main(void) {
	highp vec4 c = texture2D(uSampler, vTexCoord);
	if(c.a == 0.0) {
		discard;
	}
	if(uCEMode == 1) {
		gl_FragColor = (c - vec4(uBias, 0.0)) * vec4(uScale, 1.0);
	}
	else {
		gl_FragColor = c;
	}
}