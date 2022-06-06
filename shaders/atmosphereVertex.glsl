
varying vec3 vertexNormal;

void main() { //x y z, w(always 1)
    //normalize fixes bug where back of object is lit up
    vertexNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 0.9 );
}