varying highp vec3 vTransformedNormal;
varying highp vec4 vPosition;

void main(void) {
	highp vec3 lightDirection = normalize(-vPosition.xyz);
	highp float directionalLightWeighting = dot(vTransformedNormal, lightDirection);
	if(directionalLightWeighting < 0.0) {
		discard;
	}
	highp vec3 lightWeighting = vec3(0.0, 0.0, 0.2) + vec3(0.0, 0.0, 0.8) * directionalLightWeighting;
	lowp vec4 fragmentColor = vec4(0.0, 0.0, 1.0, 0.5);
	gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}