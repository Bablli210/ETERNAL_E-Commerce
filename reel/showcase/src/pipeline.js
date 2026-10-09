// The render pipeline: each frame is the average of several sub-frames (motion blur
// across a 180° shutter, plus sub-pixel jitter that doubles as anti-aliasing). Each
// sub-frame is the scene with a depth-of-field gather; bloom and the grade (tone
// mapping, vignette, grain, a touch of lateral chromatic aberration) run once on
// the averaged image.
import * as THREE from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// Colour plus linear view depth in alpha, so the gather reads one texel per tap.
const PACK = /* glsl */ `
uniform sampler2D tColor; uniform sampler2D tDepth; uniform float near; uniform float far;
varying vec2 vUv;
void main() {
  float d = texture2D(tDepth, vUv).x;
  float z = 2.0 * near * far / (far + near - (d * 2.0 - 1.0) * (far - near));
  gl_FragColor = vec4(texture2D(tColor, vUv).rgb, z);
}`;

// A scatter-as-gather bokeh (after Gustafsson), at half resolution: taps on a golden-angle
// spiral, each counted where its own circle of confusion reaches the centre; background
// taps are clamped so they never bleed over a sharp subject. The spiral turns a little on
// every sub-frame, so the averaged frame has several times the taps of any one pass.
// Alpha carries how much out-of-focus foreground reached this pixel, so the composite can
// let a soft near edge spill over a sharp background.
const DOF = /* glsl */ `
uniform sampler2D tPacked; uniform vec2 px; uniform float focus; uniform float aperture; uniform float maxCoc; uniform float spin;
varying vec2 vUv;
float coc(float z) { return clamp(aperture * abs(1.0 - focus / max(z, 1e-3)), 0.0, maxCoc); }
void main() {
  vec4 c0 = texture2D(tPacked, vUv);
  float cz = c0.a;
  float cs = coc(cz) * 0.5;
  vec3 col = c0.rgb;
  float tot = 1.0;
  float fg = 0.0;
  float rmax = maxCoc * 0.5;
  float r = 0.75;
  float ang = spin;
  for (int i = 0; i < 48; i++) {
    if (r >= rmax) break;
    vec2 tc = vUv + vec2(cos(ang), sin(ang)) * px * r;
    vec4 s = texture2D(tPacked, tc);
    float ss = coc(s.a) * 0.5;
    if (s.a > cz) ss = min(ss, cs * 2.0);
    float m = smoothstep(r - 0.5, r + 0.5, ss);
    col += mix(col / tot, s.rgb, m);
    tot += 1.0;
    if (s.a < cz) fg += m;
    r += 0.9 / r;
    ang += 2.39996323;
  }
  gl_FragColor = vec4(col / tot, clamp(fg / max(tot - 1.0, 1.0) * 2.5, 0.0, 1.0));
}`;

// Full resolution: the sharp image where the centre is in focus, the half-resolution gather where it is not.
const COMPOSE = /* glsl */ `
uniform sampler2D tPacked; uniform sampler2D tBlur; uniform float focus; uniform float aperture; uniform float maxCoc;
varying vec2 vUv;
void main() {
  vec4 c0 = texture2D(tPacked, vUv);
  vec4 b = texture2D(tBlur, vUv);
  float c = clamp(aperture * abs(1.0 - focus / max(c0.a, 1e-3)), 0.0, maxCoc);
  float w = max(smoothstep(0.6, 2.2, c), b.a);
  gl_FragColor = vec4(mix(c0.rgb, b.rgb, w), 1.0);
}`;

const ACC = /* glsl */ `
uniform sampler2D tDiffuse; uniform float weight;
varying vec2 vUv;
void main() { gl_FragColor = vec4(texture2D(tDiffuse, vUv).rgb * weight, 1.0); }`;

const GRADE = /* glsl */ `
uniform sampler2D tAcc; uniform vec2 res; uniform float frame; uniform float exposure;
uniform float vignette; uniform float grain; uniform float ca; uniform float fade; uniform vec3 fadeColor;
varying vec2 vUv;
// Khronos PBR Neutral: keeps base colours (the page captures, the brand palette) true and only rolls off highlights.
vec3 neutral(vec3 color) {
  const float startCompression = 0.8 - 0.04;
  const float desaturation = 0.15;
  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) return color;
  const float d = 1.0 - startCompression;
  float newPeak = 1.0 - d * d / (peak + d - startCompression);
  color *= newPeak / peak;
  float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
  return mix(color, vec3(newPeak), g);
}
vec3 toSRGB(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main() {
  vec2 d = vUv - 0.5;
  vec3 c;
  c.r = texture2D(tAcc, vUv - d * ca).r;
  c.g = texture2D(tAcc, vUv).g;
  c.b = texture2D(tAcc, vUv + d * ca).b;
  c = neutral(c * exposure);
  float v = smoothstep(1.05, 0.25, length(d * vec2(1.0, 1.25)));
  c *= mix(1.0, v, vignette);
  c = mix(c, fadeColor, fade);
  c = toSRGB(c);
  // Grain: soft (two hashes), changes every frame, lighter in the highlights.
  vec2 g = floor(vUv * res / 1.5);
  float n = (hash(g + frame * 13.17) + hash(g * 1.37 + frame * 7.31)) * 0.5 - 0.5;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c += n * grain * (1.0 - 0.7 * l);
  c += (hash(vUv * res + 0.5) - 0.5) / 255.0;
  gl_FragColor = vec4(c, 1.0);
}`;

export function createPipeline(renderer, W, H) {
  const half = { type: THREE.HalfFloatType, depthBuffer: false };
  const depthTexture = new THREE.DepthTexture(W, H, THREE.FloatType);
  const sceneRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: true, depthTexture });
  const packRT = new THREE.WebGLRenderTarget(W, H, half);
  const blurRT = new THREE.WebGLRenderTarget(W / 2, H / 2, half);
  const dofRT = new THREE.WebGLRenderTarget(W, H, half);
  const accRT = new THREE.WebGLRenderTarget(W, H, half);

  const pack = new FullScreenQuad(new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: PACK, uniforms: { tColor: { value: sceneRT.texture }, tDepth: { value: depthTexture }, near: { value: 0.1 }, far: { value: 200 } }, depthTest: false, depthWrite: false }));
  const dof = new FullScreenQuad(new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: DOF, uniforms: { tPacked: { value: packRT.texture }, px: { value: new THREE.Vector2(2 / W, 2 / H) }, focus: { value: 5 }, aperture: { value: 0 }, maxCoc: { value: 0 }, spin: { value: 0 } }, depthTest: false, depthWrite: false }));
  const compose = new FullScreenQuad(new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: COMPOSE, uniforms: { tPacked: { value: packRT.texture }, tBlur: { value: blurRT.texture }, focus: { value: 5 }, aperture: { value: 0 }, maxCoc: { value: 0 } }, depthTest: false, depthWrite: false }));
  const acc = new FullScreenQuad(new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: ACC, uniforms: { tDiffuse: { value: dofRT.texture }, weight: { value: 1 } }, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
  const grade = new FullScreenQuad(new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: GRADE, depthTest: false, depthWrite: false,
    uniforms: { tAcc: { value: accRT.texture }, res: { value: new THREE.Vector2(W, H) }, frame: { value: 0 }, exposure: { value: 1 }, vignette: { value: 0.55 }, grain: { value: 0.035 }, ca: { value: 0.0025 }, fade: { value: 0 }, fadeColor: { value: new THREE.Color(0, 0, 0) } },
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.35, 0.6, 0.82);

  // Halton(2,3) sub-pixel offsets: an even spread for any number of sub-frames.
  const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

  /**
   * Paint one frame. `prepare(time)` poses the world and returns { camera, focus,
   * aperture, maxCoc, look } for that instant; it is called once per sub-frame.
   */
  // ?profile: time each stage (forces the GPU to finish after each).
  const profile = new URLSearchParams(location.search).has("profile");
  const gl = renderer.getContext();
  const px = new Uint8Array(4);
  const times = {};
  const mark = (name, t0) => {
    if (!profile) return 0;
    const rt = renderer.getRenderTarget();
    renderer.setRenderTarget(null);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    renderer.setRenderTarget(rt);
    const n = performance.now();
    if (name) times[name] = (times[name] ?? 0) + (n - t0);
    return n;
  };
  function frame(t, fps, samples, prepare, frameIndex) {
    let p0 = mark(null);
    const shutter = 0.5 / fps;
    let look = null;
    renderer.setRenderTarget(accRT);
    renderer.setClearColor(0x000000, 1);
    renderer.clear(true, false, false);
    for (let k = 0; k < samples; k++) {
      const st = samples > 1 ? t + shutter * ((k + 0.5) / samples - 0.5) : t;
      const s = prepare(st);
      look = look ?? s.look;
      const cam = s.camera;
      if (samples > 1) cam.setViewOffset(W, H, halton(k + 1, 2) - 0.5, halton(k + 1, 3) - 0.5, W, H);
      else cam.clearViewOffset();
      renderer.setRenderTarget(sceneRT);
      renderer.setClearColor(s.clear ?? 0x000000, 1);
      renderer.clear();
      renderer.render(s.scene, cam);
      p0 = mark("scene", p0);

      pack.material.uniforms.near.value = cam.near;
      pack.material.uniforms.far.value = cam.far;
      renderer.setRenderTarget(packRT);
      pack.render(renderer);

      for (const u of [dof.material.uniforms, compose.material.uniforms]) {
        u.focus.value = s.focus;
        u.aperture.value = s.aperture;
        u.maxCoc.value = s.maxCoc;
      }
      dof.material.uniforms.spin.value = k * 0.61;
      renderer.setRenderTarget(blurRT);
      dof.render(renderer);
      renderer.setRenderTarget(dofRT);
      compose.render(renderer);
      p0 = mark("dof", p0);
      // Things that draw their own defocus (the motes) go over the depth of field.
      if (s.overlay) renderer.render(s.overlay, cam);
      cam.clearViewOffset();
      p0 = mark("overlay+acc", p0);

      acc.material.uniforms.weight.value = 1 / samples;
      renderer.setRenderTarget(accRT);
      acc.render(renderer);
    }
    // Pose the world at the frame's own instant again, so anything read after (the HUD) matches it.
    const s = prepare(t);
    look = s.look ?? look;
    bloom.strength = look.bloom ?? 0.35;
    bloom.threshold = look.bloomThreshold ?? 0.82;
    p0 = mark("pose", p0);
    bloom.render(renderer, null, accRT, 0, false);
    p0 = mark("bloom", p0);
    const g = grade.material.uniforms;
    g.frame.value = frameIndex;
    g.exposure.value = look.exposure ?? 1;
    g.vignette.value = look.vignette ?? 0.55;
    g.grain.value = look.grain ?? 0.035;
    g.ca.value = look.ca ?? 0.0025;
    g.fade.value = look.fade ?? 0;
    g.fadeColor.value.set(look.fadeColor ?? 0x000000);
    renderer.setRenderTarget(null);
    grade.render(renderer);
    mark("grade", p0);
  }

  return { frame, times };
}
