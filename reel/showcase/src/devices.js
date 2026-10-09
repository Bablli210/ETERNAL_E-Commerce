// The storefront, on screens in the world: a frameless browser window and phones.
// Each screen is a captured page, scrollable by css px, with a power-on wipe and a
// glare that slides across the glass as the camera moves.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const SCREEN_VERT = /* glsl */ `
#include <fog_pars_vertex>
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SCREEN_FRAG = /* glsl */ `
#include <fog_pars_fragment>
uniform sampler2D map; uniform float window; uniform float scroll; uniform float smear; uniform float reveal; uniform float bright;
uniform float glare; uniform float radius; uniform float aspect; uniform float island; uniform float opacity;
uniform float sweepX; uniform float sweepAmt;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  // window: the fraction of the texture's height on screen; scroll: fraction from its top.
  vec2 uv = vec2(vUv.x, 1.0 - scroll - (1.0 - vUv.y) * window);
  // A scrolling page is smeared along the scroll over this sub-frame's slice of the shutter,
  // so a fast scroll blurs smoothly instead of showing a few stepped copies.
  vec3 col;
  if (smear < 1e-6) col = texture2D(map, uv).rgb;
  else {
    col = vec3(0.0);
    for (int i = 0; i < 16; i++) col += texture2D(map, uv + vec2(0.0, smear * ((float(i) + 0.5) / 16.0 - 0.5))).rgb;
    col /= 16.0;
  }
  col *= bright;
  // Power on: a soft edge of light runs down the screen, the page settling behind it.
  // Below the edge the screen is not there yet: transparent, not black.
  float e = smoothstep(reveal * 1.25 - 0.25, reveal * 1.25, 1.0 - vUv.y);
  float edge = exp(-pow((1.0 - vUv.y - (reveal * 1.25 - 0.12)) * 9.0, 2.0)) * step(0.001, reveal) * (1.0 - step(0.999, reveal));
  col += vec3(1.0, 0.86, 0.66) * edge * 0.35;
  // Glare: a broad diagonal band, from the reflected view direction.
  vec3 r = reflect(-vV, normalize(vN));
  float g = smoothstep(0.35, 0.0, abs(r.x * 0.8 + r.y * 0.6 - 0.15)) * glare;
  float lit = smoothstep(0.2, 1.0, reveal);
  col += vec3(1.0, 0.95, 0.88) * g * 0.07 * lit;
  col += vec3(1.0, 0.82, 0.55) * sweepAmt * exp(-pow((vUv.x - sweepX) * 5.0, 2.0)) * 0.12 * lit;
  // Rounded corners and the camera island, for phones.
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  float d = rbox(p, vec2(aspect * 0.5, 0.5), radius);
  float a = 1.0 - smoothstep(-0.002, 0.002, d);
  if (island > 0.0) {
    float di = rbox(p - vec2(0.0, 0.5 - 0.032), vec2(0.075, 0.013), 0.013);
    col = mix(vec3(0.0), col, smoothstep(-0.002, 0.002, di));
  }
  a *= opacity * (1.0 - e);
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

/** A screen surface showing one capture. tex: { texture, meta }. */
export function screenMaterial(tex, { radius = 0, aspect = 1.6, island = 0 } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: SCREEN_VERT, fragmentShader: SCREEN_FRAG, fog: true, transparent: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      map: { value: null }, window: { value: 1 }, scroll: { value: 0 }, reveal: { value: 1 }, bright: { value: 0.86 },
      glare: { value: 1 }, radius: { value: radius }, aspect: { value: aspect }, island: { value: island }, opacity: { value: 1 },
      sweepX: { value: -1 }, sweepAmt: { value: 0 }, smear: { value: 0 },
    }]),
    // UniformsUtils.merge clones textures; set the map after.
  });
}

function setMap(mat, tex) { mat.uniforms.map.value = tex.texture; }

/**
 * Scroll a screen to `cssY` (css px from the page top). viewCss is the css height on screen.
 */
export function scrollTo(mat, meta, cssY, viewCss, smearCss = 0) {
  // smearCss: how far (css px) the page moves during one sub-frame's slice of the shutter.
  mat.uniforms.smear.value = smearCss / meta.cssH;
  const frac = Math.min(1, viewCss / meta.cssH);
  mat.uniforms.window.value = frac;
  mat.uniforms.scroll.value = Math.min(Math.max(cssY / meta.cssH, 0), 1 - frac);
}

/**
 * A browser window, `w` world units wide, 16:10 (the 1440×900 captures). A thin Night
 * frame with a Paper title bar, no URL, no shadow: the direction's minimal window.
 */
export function makeBrowser(tex, w) {
  const h = w / 1.6;
  const bar = w * 0.028;
  const group = new THREE.Group();
  const frameMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#1d1b19"), roughness: 0.35, metalness: 0.6, clearcoat: 0.6, envMapIntensity: 0.8, transparent: true });
  const frame = new THREE.Mesh(new RoundedBoxGeometry(w + 0.04, h + bar + 0.04, 0.05, 3, 0.018), frameMat);
  frame.position.set(0, bar / 2, -0.03);
  group.add(frame);
  const c = document.createElement("canvas");
  c.width = 2048; c.height = Math.round(2048 * (bar / w));
  const g = c.getContext("2d");
  g.fillStyle = "#faf8f3";
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "#cdbfa5";
  g.lineWidth = 3;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(40 + i * 34, c.height / 2, 9, 0, Math.PI * 2); g.stroke(); }
  g.fillStyle = "#cdbfa5";
  g.fillRect(0, c.height - 2, c.width, 2);
  const barTex = new THREE.CanvasTexture(c);
  barTex.colorSpace = THREE.SRGBColorSpace;
  const barMat = new THREE.MeshBasicMaterial({ map: barTex, fog: true, transparent: true });
  const barMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, bar), barMat);
  barMesh.position.set(0, h / 2 + bar / 2, 0.001);
  group.add(barMesh);
  const mat = screenMaterial(tex, { aspect: 1.6 });
  setMap(mat, tex);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  screen.position.z = 0.001;
  group.add(screen);
  scrollTo(mat, tex.meta, 0, 900);
  return { group, mat, barMat, frameMat, w, h, meta: tex.meta, viewCss: 900 };
}

/** A phone, `h` world units tall (390×844 screen, titanium edge). */
export function makePhone(tex, h) {
  const sh = h * 0.955;
  const sw = sh * (390 / 844);
  const w = sw + h * 0.045;
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#2b2723"), roughness: 0.32, metalness: 0.85, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 1, transparent: true });
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, h * 0.05, 6, h * 0.075), bodyMat);
  group.add(body);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#050505"), roughness: 0.08, metalness: 0, clearcoat: 1, envMapIntensity: 1, transparent: true });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.985, h * 0.99), glassMat);
  glass.position.z = h * 0.025 + 0.0008;
  group.add(glass);
  const mat = screenMaterial(tex, { radius: 0.065, aspect: sw / sh, island: 1 });
  setMap(mat, tex);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), mat);
  screen.position.z = h * 0.025 + 0.0016;
  screen.renderOrder = 5;
  group.add(screen);
  scrollTo(mat, tex.meta, 0, 844);
  return { group, mat, bodyMat, glassMat, w, h, meta: tex.meta, viewCss: 844 };
}
