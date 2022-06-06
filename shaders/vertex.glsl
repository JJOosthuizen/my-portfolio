varying vec2 vertexUV;
varying vec3 vertexNormal;

void main() { //x y z, w(always 1)
//position = vec3
//matrix is an array organised in spesific manner
    vertexUV = uv;
    vertexNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}

