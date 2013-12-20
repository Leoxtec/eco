attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uMVP;
// uniform mat4 uModelViewMatrix;
// uniform mat4 uProjectionMatrix;
uniform float uPointSize;
// uniform vec3 uAttenuation;
uniform vec3 uBias;
uniform vec3 uScale;
uniform int uCEMode;

varying vec4 vFrontColor;

void main(void) {
	if(uCEMode == 1) {
		vFrontColor = (aVertexColor - vec4(uBias, 0.0)) * vec4(uScale, 1.0);
	}
	else {
		vFrontColor = aVertexColor;
	}
	// vec4 ecPos4 = uModelViewMatrix * vec4(aVertexPosition, 1.0);
	// float dist = length(ecPos4);
	// float attn = uAttenuation[0] + (uAttenuation[1] * dist) + (uAttenuation[2] * dist * dist);
	// gl_PointSize = (attn > 0.0 && attn < uPointSize) ? uPointSize * sqrt(1.0/attn) : uPointSize;
	// gl_Position = uProjectionMatrix * ecPos4;
	gl_PointSize = uPointSize;
	gl_Position = uMVP * vec4(aVertexPosition, 1.0);
}