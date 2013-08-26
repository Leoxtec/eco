attribute vec3 aVertexPosition;
attribute float aLetterIndex;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTexCoord;

void main(void) {
	vec4 ecPos4 = uModelViewMatrix * vec4(aVertexPosition, 1.0);
	// if(ecPos4.x < ecPos4.z * 0.57735) {
	// 	ecPos4.x = ecPos4.z * 0.57735;
	// }
	// else if(ecPos4.x > ecPos4.z * -0.57735) {
	// 	ecPos4.x = ecPos4.z * -0.57735;
	// }
	// if(ecPos4.y < ecPos4.z * 0.57735) {
	// 	ecPos4.y = ecPos4.z * 0.57735;
	// }
	// else if(ecPos4.y > ecPos4.z * -0.57735) {
	// 	ecPos4.y = ecPos4.z * -0.57735;
	// }
	// if(ecPos4.z > -0.1) {
	// 	ecPos4.y = 0.057735;
	// }
	// ecPos4.z = -1.0;
	float tri = mod(aLetterIndex, 4.0);
	float xOffset = mod(tri, 2.0);
	float yOffset = floor(tri * 0.5);
	ecPos4.xy = ecPos4.xy + vec2(xOffset * 2.0 - 1.0, yOffset * 2.0 - 1.0) * -ecPos4.z * 0.02;
	float texIndex = floor(aLetterIndex * 0.25);
	vTexCoord = vec2((mod(texIndex, 2.0) + xOffset) * 0.5, (1.0 - floor(texIndex * 0.5) + yOffset) * 0.5);
	gl_Position = uProjectionMatrix * ecPos4;
}