// The space the film happens in: a dark studio lit like golden hour. A sky dome with
// a low warm glow and a deep-sea cool on the far side, a studio environment for the
// reflections (softboxes, so glass and lacquer carry long clean highlights), drifting
// motes in the light, and soft shafts of light behind the bottle.
import * as THREE from "three";
import { rng } from "./ease.js";

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() { vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`;

const SKY_FRAG = /* glsl */ `
uniform vec3 base; uniform vec3 warm; uniform vec3 cool; uniform vec3 warmDir; uniform vec3 coolDir;
uniform float warmAmt; uniform float coolAmt; uniform float lift;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float w = pow(max(dot(d, normalize(warmDir)), 0.0), 6.0);
  float c = pow(max(dot(d, normalize(coolDir)), 0.0), 4.0);
  float horizon = exp(-pow(d.y * 3.2, 2.0));
  vec3 col = base * (0.55 + 0.45 * horizon) * lift;
  col += warm * w * warmAmt * (0.4 + 0.6 * horizon);
  col += cool * c * coolAmt * (0.5 + 0.5 * horizon);
  gl_FragColor = vec4(col, 1.0);
}`;

export function makeSky() {
  const mat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      base: { value: new THREE.Color("#171614") }, warm: { value: new THREE.Color("#b97a2b") }, cool: { value: new THREE.Color("#163a4e") },
      warmDir: { value: new THREE.Vector3(0.1, 0.02, -1) }, coolDir: { value: new THREE.Vector3(1, 0.05, -0.6) },
      warmAmt: { value: 0.3 }, coolAmt: { value: 0.4 }, lift: { value: 1 },
    },
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), mat);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return { mesh, mat };
}

/** A studio for reflections: a dark room with softboxes, prefiltered for PBR. */
export function makeEnvironment(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#050404");
  const box = (w, h, color, power, pos, look) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(...look);
    scene.add(m);
  };
  // Key: a tall warm softbox, front left. Fill: a dim neutral panel, right. Two rim
  // strips behind, which draw the glass's edges. A low warm bounce, like sun off stone.
  box(3.2, 7, "#ffd8a8", 7, [-6, 2.5, 4], [0, 0, 0]);
  box(2.4, 5, "#e8e4dc", 1.6, [7, 1, 3], [0, 0, 0]);
  box(0.7, 8, "#ffc98a", 9, [-4, 1, -6], [0, 0, 0]);
  box(0.7, 8, "#ffe2bf", 6, [4.5, 1, -6], [0, 0, 0]);
  box(14, 3, "#a5662a", 1.2, [0, -5, 0], [0, 0, 0]);
  box(6, 6, "#fff4e6", 1.5, [0, 9, 0], [0, 0, 0]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.02).texture;
  pmrem.dispose();
  return env;
}

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

const DUST_VERT = /* glsl */ `
uniform float time; uniform float focus; uniform float aperture; uniform float maxCoc; uniform float scale;
attribute vec3 seed;
varying float vA;
void main() {
  vec3 p = position + vec3(sin(time * 0.21 + seed.x * 6.28) * 0.35, sin(time * 0.17 + seed.y * 6.28) * 0.25 + time * 0.03, cos(time * 0.19 + seed.z * 6.28) * 0.35);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float z = -mv.z;
  float coc = clamp(aperture * abs(1.0 - focus / max(z, 0.01)), 0.0, maxCoc * 2.5);
  float core = scale * (0.6 + seed.x) / z;
  float size = max(core, 1.5) + coc * 1.6;
  gl_PointSize = size;
  // A defocused mote spreads the same light over a larger disc.
  vA = (0.35 + 0.65 * seed.y) * min(1.0, (core * core + 2.0) / (size * size)) * smoothstep(0.3, 1.5, z) * smoothstep(60.0, 20.0, z);
  gl_Position = projectionMatrix * mv;
}`;

const DUST_FRAG = /* glsl */ `
uniform sampler2D map; uniform vec3 color; uniform float amount;
varying float vA;
void main() { float a = texture2D(map, gl_PointCoord).a * vA * amount; if (a < 0.002) discard; gl_FragColor = vec4(color * a, 1.0); }`;

/** Motes of dust drifting in the light, in a box around `center`. Rendered over the depth-of-field pass, sized by their own focus. */
export function makeDust(count, center, size, seed = 3) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3);
  const sd = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = center[0] + (r() - 0.5) * size[0];
    pos[i * 3 + 1] = center[1] + (r() - 0.5) * size[1];
    pos[i * 3 + 2] = center[2] + (r() - 0.5) * size[2];
    sd[i * 3] = r(); sd[i * 3 + 1] = r(); sd[i * 3 + 2] = r();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("seed", new THREE.BufferAttribute(sd, 3));
  const mat = new THREE.ShaderMaterial({
    vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    uniforms: { map: { value: dotTexture() }, time: { value: 0 }, focus: { value: 5 }, aperture: { value: 0 }, maxCoc: { value: 0 }, scale: { value: 28 }, color: { value: new THREE.Color("#ffd9a8") }, amount: { value: 1 } },
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, mat };
}

function shaftTexture() {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 512;
  const g = c.getContext("2d");
  const h = g.createLinearGradient(0, 0, 128, 0);
  h.addColorStop(0, "rgba(255,255,255,0)");
  h.addColorStop(0.5, "rgba(255,255,255,1)");
  h.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = h;
  g.fillRect(0, 0, 128, 512);
  g.globalCompositeOperation = "destination-in";
  const v = g.createLinearGradient(0, 0, 0, 512);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(0.25, "rgba(0,0,0,0.9)");
  v.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = v;
  g.fillRect(0, 0, 128, 512);
  return new THREE.CanvasTexture(c);
}

/** Soft, slanting shafts of light: additive cards that never write depth. */
export function makeShafts(n, seed = 11) {
  const r = rng(seed);
  const tex = shaftTexture();
  const group = new THREE.Group();
  const mats = [];
  for (let i = 0; i < n; i++) {
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color("#ffb86b"), transparent: true, opacity: 0.05 + r() * 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6 + r() * 1.4, 9), mat);
    m.position.set((r() - 0.5) * 5, 1.5, (r() - 0.5) * 2);
    m.rotation.z = -0.42 + (r() - 0.5) * 0.12;
    m.userData.base = { x: m.position.x, o: mat.opacity, ph: r() * 6.28 };
    group.add(m);
    mats.push(mat);
  }
  return { group, mats };
}
