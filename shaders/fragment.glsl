uniform sampler2D globeTexture;

varying vec2 vertexUV; //vec2(0, 0.24) example
varying vec3 vertexNormal;
//normal is a group data to pinpoint what direction the vertex is facing
void main() { //rgba
    float intesity = 1.05 - dot(vertexNormal,
     vec3(0.0, 0.0, 1.0));
    vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intesity, 1.5);
    //default it vec4 but we want vec3
    gl_FragColor = vec4(atmosphere + texture2D(globeTexture, vertexUV)
    .xyz, 1.0);
}