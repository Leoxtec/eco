//this could be made more efficient by putting the 3 letters in a single row
//in a 64x16 texture
//right now they are in a 32x32 texture

attribute vec3 aVertexPosition;
attribute float aLetterIndex;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTexCoord;

void main(void) {
	vec4 ecPos4 = uModelViewMatrix * vec4(aVertexPosition, 1.0);

	//get the triangle from the letter index
	float tri = mod(aLetterIndex, 4.0);

	//determine the x and y offset from the triangle
	float xOffset = mod(tri, 2.0);
	float yOffset = floor(tri * 0.5);

	//offset from the center to get the quad vertex
	ecPos4.xy = ecPos4.xy + vec2(xOffset * 2.0 - 1.0, yOffset * 2.0 - 1.0) * 0.0666;

	//determine the texture coordinates for this quad vertex
	float texIndex = floor(aLetterIndex * 0.25);
	vTexCoord = vec2((mod(texIndex, 2.0) + xOffset) * 0.5, (1.0 - floor(texIndex * 0.5) + yOffset) * 0.5);

	gl_Position = uProjectionMatrix * ecPos4;
}