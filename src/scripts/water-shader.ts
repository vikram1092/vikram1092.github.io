/** Screen-space lake: reflects the photographed scene and its moving typography. */
export const waterVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const waterFragment = /* glsl */ `
  uniform sampler2D uScene;
  uniform float uTime;
  uniform float uHorizon;
  uniform float uAspect;
  uniform vec4 uRipples[12];
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float depth = max(0.0, uHorizon - uv.y);
    if (uv.y > uHorizon) {
      gl_FragColor = texture2D(uScene, uv);
    } else {
      // Fine ripples grow toward the viewer, preserving a quiet distant waterline.
      float perspective = smoothstep(0.0, uHorizon, depth);
      float wave = sin(uv.y * 260.0 + sin(uv.x * 18.0 + uTime * .24) * 2.0 + uTime * .7);
      float crossWave = sin(uv.y * 127.0 - uv.x * 27.0 - uTime * .45);
      vec2 distortion = vec2(wave * .0018 + crossWave * .0009, wave * .0007) * (.1 + perspective * 2.4);
      float light = 0.0;
      for (int i = 0; i < 12; i++) {
        vec4 ripple = uRipples[i];
        float age = uTime - ripple.z;
        if (age > 0.0 && age < 5.0) {
          vec2 delta = vec2((uv.x - ripple.x) * uAspect, (uv.y - ripple.y) * 3.7);
          float radius = length(delta);
          float front = radius - age * .19;
          float envelope = exp(-front * front * 160.0) * exp(-age * .9) * ripple.w;
          float ring = sin(front * 95.0);
          distortion += normalize(delta + .00001) * ring * envelope * .009;
          light += cos(front * 95.0) * envelope * .075;
        }
      }
      vec2 reflection = vec2(uv.x, uHorizon + depth * .90) + distortion;
      reflection = clamp(reflection, .002, .998);
      vec3 reflected = texture2D(uScene, reflection).rgb;
      vec3 deep = vec3(.018, .069, .085);
      vec3 color = mix(reflected * vec3(.65, .82, .85), deep, .22 + perspective * .72);
      // The part of a letter crossing the surface remains visible through the water.
      vec3 submerged = texture2D(uScene, uv + distortion * .65).rgb;
      float shore = exp(-depth * 75.0);
      color = mix(color, submerged * vec3(.58, .77, .78), shore * .58);
      color += light * vec3(.59, .81, .78);
      color += pow(max(0.0, wave * crossWave), 14.0) * perspective * .022;
      color += exp(-depth * 800.0) * vec3(.08, .12, .12);
      gl_FragColor = vec4(color, 1.0);
    }
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
