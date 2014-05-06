attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uPointSize;

//for undetermined point attenuation feature
// uniform vec3 uAttenuation;

uniform vec3 uBias;
uniform vec3 uScale;
uniform int uCEMode;

varying vec4 vColor;

void main(void) {
	if(uCEMode == 1) {
		//use bias and scale unifroms for min max color enhancement
		vColor = (aVertexColor - vec4(uBias, 0.0)) * vec4(uScale, 1.0);
	}
	else {
		vColor = aVertexColor;
	}

	vec4 ecPos4 = uModelViewMatrix * vec4(aVertexPosition, 1.0);

	//make points larger as they get further away from the viewer
	//helps to make the cloud look less sparse when far enough to only see
	//the first level or two of the octree
	gl_PointSize = length(ecPos4) / uPointSize * 3.0;

	//for undetermined point attenuation feature
	// float attn = uAttenuation[0] + (uAttenuation[1] * dist) + (uAttenuation[2] * dist * dist);
	// gl_PointSize = (attn > 0.0 && attn < uPointSize) ? uPointSize * sqrt(1.0/attn) : uPointSize;

	gl_Position = uProjectionMatrix * ecPos4;
}