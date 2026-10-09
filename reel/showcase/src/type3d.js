// Typography set in the 3D world. Each word (or letter) is its own plane, drawn
// from a canvas in the brand faces at its true advance, so a line can rise word by
// word, arrive out of focus and catch a band of passing light, and still keep the
// face's spacing.
import * as THREE from "three";
import { tween, ease, clamp } from "./ease.js";

export const FACES = {
  serif: { family: "'The Seasons', 'Cormorant Garamond', serif", weight: 400, style: "normal" },
  italic: { family: "'The Seasons Italic', 'Cormorant Garamond', serif", weight: 400, style: "italic" },
  sub: { family: "'Cabinet Grotesk', sans-serif", weight: 400, style: "normal" },
  sans: { family: "'General Sans', sans-serif", weight: 400, style: "normal" },
};

const VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

// Soft defocus from a 12-tap disc at a matching mip, then a warm band of light that can
// sweep across the line in world x.
const FRAG = /* glsl */ `
uniform sampler2D map; uniform vec3 color; uniform float opacity; uniform float blur; uniform vec2 texel;
uniform float sweepX; uniform float sweepW; uniform float sweepAmt; uniform vec3 sweepColor; uniform float gain;
varying vec2 vUv; varying vec3 vWorld;
const vec2 D[12] = vec2[12](vec2(-0.326,-0.406), vec2(-0.840,-0.074), vec2(-0.696,0.457), vec2(-0.203,0.621), vec2(0.962,-0.195), vec2(0.473,-0.480), vec2(0.519,0.767), vec2(0.185,-0.893), vec2(0.507,0.064), vec2(0.896,0.412), vec2(-0.322,-0.933), vec2(-0.792,-0.598));
void main() {
  float a;
  if (blur < 0.05) a = texture2D(map, vUv).a;
  else {
    // Mostly mip blur (smooth), with a small disc of taps to round it off.
    float lod = log2(1.0 + blur);
    a = 0.0;
    for (int i = 0; i < 12; i++) a += texture2D(map, vUv + D[i] * blur * 0.45 * texel, lod).a;
    a /= 12.0;
  }
  a *= opacity;
  if (a < 0.015) discard;
  float band = sweepAmt * exp(-pow((vWorld.x - sweepX) / max(sweepW, 1e-3), 2.0));
  gl_FragColor = vec4(color * gain + sweepColor * band, a);
}`;

/** Measure and draw text in the brand faces. */
function ctx2d(w = 4, h = 4) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return { c, g: c.getContext("2d") };
}

/**
 * A block of text in the world.
 *   lines: string[]; face: key of FACES; em: world size of the font; px: canvas font size
 *   tracking (em), lineHeight (em), align "left" | "center" | "right", split "word" | "char" | "line"
 *   caps: uppercase. Returns { group, units[], width, height }.
 * The group's origin is the first line's baseline at the alignment point.
 */
export function text3d({ lines, face = "serif", em = 1, px = 180, tracking = 0, lineHeight = 1.1, align = "left", split = "word", caps = false, color = "#f3efe7", gain = 1 }) {
  const f = FACES[face];
  const font = `${f.style} ${f.weight} ${px}px ${f.family}`;
  const { g: m } = ctx2d();
  m.font = font;
  m.letterSpacing = `${tracking * px}px`;
  const fm = m.measureText("Hgjy");
  const asc = Math.ceil(fm.fontBoundingBoxAscent ?? px * 0.9);
  const desc = Math.ceil(fm.fontBoundingBoxDescent ?? px * 0.3);
  const pad = Math.ceil(px * 0.25);
  const s = em / px;
  const group = new THREE.Group();
  const units = [];
  let maxW = 0;
  lines.forEach((raw, li) => {
    const line = caps ? raw.toUpperCase() : raw;
    const lineW = m.measureText(line).width;
    maxW = Math.max(maxW, lineW * s);
    const x0 = align === "center" ? -lineW / 2 : align === "right" ? -lineW : 0;
    const pieces = [];
    if (split === "line") pieces.push({ text: line, at: 0 });
    else if (split === "char") [...line].forEach((ch, i) => { if (ch.trim()) pieces.push({ text: ch, at: i }); });
    else { let at = 0; for (const w of line.split(" ")) { if (w) pieces.push({ text: w, at }); at += w.length + 1; } }
    for (const p of pieces) {
      const adv = m.measureText(line.slice(0, p.at)).width;
      const w = Math.ceil(m.measureText(p.text).width) + pad * 2;
      const h = asc + desc + pad * 2;
      const { c, g } = ctx2d(w, h);
      g.font = font;
      g.letterSpacing = `${tracking * px}px`;
      g.fillStyle = "#fff";
      g.textBaseline = "alphabetic";
      g.fillText(p.text, pad, pad + asc);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.NoColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.anisotropy = 4;
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: true,
        uniforms: {
          map: { value: tex }, color: { value: new THREE.Color(color) }, opacity: { value: 1 }, blur: { value: 0 }, texel: { value: new THREE.Vector2(1 / w, 1 / h) },
          sweepX: { value: -1e4 }, sweepW: { value: 1 }, sweepAmt: { value: 0 }, sweepColor: { value: new THREE.Color("#ffd29a") }, gain: { value: gain },
        },
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w * s, h * s), mat);
      const baseY = -li * lineHeight * em;
      mesh.position.set((x0 + adv - pad) * s + (w * s) / 2, baseY - (h * s) / 2 + (pad + asc) * s, 0);
      mesh.userData.base = mesh.position.clone();
      mesh.renderOrder = 10;
      group.add(mesh);
      units.push({ mesh, mat, line: li, text: p.text });
    }
  });
  return { group, units, width: maxW, height: lines.length * lineHeight * em };
}

/**
 * Pose a block at time t: units arrive one after another (rise, come forward, focus in)
 * and leave together. Every property is set on every call.
 */
export function animateText(block, t, o) {
  const { inAt, stagger = 0.06, dur = 0.9, rise = 0.12, depth = 0, blur = 8, outAt = Infinity, outDur = 0.5, outRise = 0, opacity = 1 } = o;
  const n = block.units.length;
  block.units.forEach((u, i) => {
    const order = o.reverse ? n - 1 - i : i;
    const p = tween(t, inAt + order * stagger, dur, ease.emphasized);
    const q = tween(t, outAt + (o.outStagger ?? 0) * order, outDur, ease.exit);
    const b = u.mesh.userData.base;
    u.mesh.position.set(b.x, b.y - (1 - p) * rise + q * outRise, b.z + (1 - p) * depth);
    u.mat.uniforms.opacity.value = clamp(p * 1.15) * (1 - q) * opacity;
    u.mat.uniforms.blur.value = (1 - p) * blur + q * blur * 0.6;
    u.mesh.visible = u.mat.uniforms.opacity.value > 0.002;
  });
}

/** A band of warm light crossing the block in world x (worldX moves from a to b). */
export function sweepText(block, worldX, width, amount) {
  for (const u of block.units) {
    u.mat.uniforms.sweepX.value = worldX;
    u.mat.uniforms.sweepW.value = width;
    u.mat.uniforms.sweepAmt.value = amount;
  }
}
