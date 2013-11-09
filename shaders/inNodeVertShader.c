attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uMVP;
// uniform mat4 uModelViewMatrix;
// uniform mat4 uProjectionMatrix;
uniform float uSize;
uniform vec3 uBias;
uniform vec3 uScale;
uniform bool uUseBS;

varying vec4 vFrontColor;

void main(void) {
	if(uUseBS) {
		vFrontColor = (aVertexColor - vec4(uBias, 0.0)) * vec4(uScale, 1.0); 
	}
	else {
		vFrontColor = aVertexColor;
	}
	gl_PointSize = uSize;
	gl_Position = uMVP * vec4(aVertexPosition, 1.0);
	// gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}