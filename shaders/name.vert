attribute float aVertIndex;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTexCoord;
varying float changeBG;

const vec2 offset = vec2(75.0 / 540.0, 20.0 / 540.0);

void main(void) {
	//variable used to change the name texture background if it is behind the viewer
	changeBG = 0.0;

	vec4 ecPos4 = uProjectionMatrix * uModelViewMatrix * vec4(0.0, 0.0, 2.1036, 1.0);
	float tempZ = ecPos4.z;
	float tempW = ecPos4.w;

	//homogeneous divide
	ecPos4 /= ecPos4.w;

	//behind the viewer
	//flip x so the texture appears on the proper side horizontally
	//and force the texture to the bottom of the screen
	if(tempZ < -tempW) {
		ecPos4.x *= -1.0;
		ecPos4.y = -1.0 + offset.y;
		changeBG = 1.0;
	}

	//keep the texture clamped to the edges of the screen
	else if(ecPos4.y < -1.0 + offset.y) {
		ecPos4.y = -1.0 + offset.y;
	}
	else if(ecPos4.y > 1.0 - offset.y) {
		ecPos4.y = 1.0 - offset.y;
	}
	if(ecPos4.x < -1.0 + offset.x) {
		ecPos4.x = -1.0 + offset.x;
	}
	else if(ecPos4.x > 1.0 - offset.x) {
		ecPos4.x = 1.0 - offset.x;
	}

	//use the index to determine the offset from the center for the quad vertex
	ecPos4.z = -1.0;
	float xOffset = mod(aVertIndex, 2.0);
	float yOffset = floor(aVertIndex * 0.5);
	ecPos4.xy += vec2(xOffset * 2.0 - 1.0, yOffset * 2.0 - 1.0) * offset;
	vTexCoord = vec2(xOffset, yOffset);
	gl_Position =  ecPos4;
}