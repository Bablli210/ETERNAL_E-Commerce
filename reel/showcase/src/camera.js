// The camera: a centre (cx, cy) on the table in stage px, a zoom k, and a lean (rotateY,
// 2400 px perspective) that only appears while moving. Five framings, four moves, three
// cuts; between them the camera drifts about a chosen point and is never frozen.
//   screen = (960, 540) + k · (stage − centre)
import { clamp, lerp, bezier, track } from "./ease.js";

export const FRAMING = {
  OPEN: { cx: 687, cy: 675, k: 2.2 },
  SPLIT: { cx: 960, cy: 540, k: 1 },
  DESK: { cx: 390, cy: 655, k: 1 },
  PHONE: { cx: 2132, cy: 598, k: 1.14 },
  WIDE: { cx: 514, cy: 568, k: 0.66 },
};
export const CUTS = [12.8, 21.333, 23.467].map((t) => Math.round(t * 30) / 30);

/** Zoom to k2 about a fixed table point P: the point stays where it is on screen. */
const about = (c, P, k2) => ({ cx: P[0] + (c.cx - P[0]) * (c.k / k2), cy: P[1] + (c.cy - P[1]) * (c.k / k2), k: k2 });
const shift = (c, dx, dy) => ({ ...c, cx: c.cx - dx / c.k, cy: c.cy - dy / c.k }); // move the picture by (dx, dy) screen px

/**
 * A move between two framings: zoom in log scale, and the centre coupled to the zoom
 * (it travels with the visible width, 1/k), so the picture scales and slides as one.
 */
function move(a, b, e) {
  const la = Math.log(a.k), lb = Math.log(b.k);
  return (p) => {
    const u = e(clamp(p));
    const k = Math.exp(lerp(la, lb, u));
    const w = Math.abs(1 / b.k - 1 / a.k) < 1e-9 ? u : (1 / k - 1 / a.k) / (1 / b.k - 1 / a.k);
    return { cx: lerp(a.cx, b.cx, w), cy: lerp(a.cy, b.cy, w), k };
  };
}
/** A drift through keys {t, c}, C1-continuous, at rest at both ends. */
function driftTrack(keys) {
  const f = track(keys.map(({ t, c }) => ({ t, v: [c.cx, c.cy, Math.log(c.k)] })));
  return (t) => { const [cx, cy, lk] = f(t); return { cx, cy, k: Math.exp(lk) }; };
}
const sine = (p) => 0.5 - 0.5 * Math.cos(Math.PI * p);
const pullEase = bezier(0.45, 0, 0.2, 1);
/** Starts at slope s0 (to carry on from a creep) and lands at rest. */
const hermite = (s0) => (p) => (-2 * p ** 3 + 3 * p ** 2) + s0 * (p ** 3 - 2 * p ** 2 + p);

const { OPEN, SPLIT, DESK, PHONE, WIDE } = FRAMING;
const THREE_LINES = [407, 800]; // the eterno row on the desktop, on the table
const GRID = [559, 652]; // the eterno grid's raw-seduction column
const PHONE_C = [1603, 598]; // the phone's centre
const BETWEEN = [1330, 600]; // between the drawer and the sheet
const RESULTS = [687, 700]; // the finder's results row

// 0–2.133: the loader, then one continuous pull-back from inside the desktop to both screens.
const OPEN_K1 = 2.15;
const openShare = Math.log(OPEN_K1 / OPEN.k) / Math.log(SPLIT.k / OPEN.k); // the creep's share of the zoom
const openMove = move(OPEN, SPLIT, (u) => u);
const creepSlope = openShare / 0.8; // per second
const pullK = hermite((creepSlope * (2.133 - 0.8)) / (1 - openShare));
function opening(t) {
  const u = t < 0.8 ? creepSlope * t : openShare + (1 - openShare) * pullK((t - 0.8) / (2.1333 - 0.8));
  return openMove(u);
}

// The keyed drifts.
const s0 = SPLIT;
const s1 = shift(about(s0, [960, 540], 1.006), 0, -4);
const s2 = shift(about(s1, [960, 540], 1.012), -4, 0);
const s3 = about(s2, THREE_LINES, 1.018);
const splitDrift = driftTrack([{ t: 2.1333, c: s0 }, { t: 4.2667, c: s1 }, { t: 6.4, c: s2 }, { t: 8.5333, c: s3 }]);

const d0 = DESK;
const d1 = about(d0, [960, 540], 1.006);
const d2 = about(d1, GRID, 1.015);
const deskDrift = driftTrack([{ t: 9.6, c: d0 }, { t: 10.6667, c: d1 }, { t: 12.8, c: d2 }]);

const p0 = PHONE;
const p1 = shift(about(p0, PHONE_C, 1.15), 0, -6);
const p2 = about(p1, PHONE_C, 1.16);
const phoneDrift = driftTrack([{ t: 12.8, c: p0 }, { t: 14.9333, c: p1 }, { t: 17.0667, c: p2 }]);

const b0 = SPLIT;
const b1 = about(b0, BETWEEN, 1.015);
const bagDrift = driftTrack([{ t: 18.6667, c: b0 }, { t: 19.2, c: b0 }, { t: 21.3333, c: b1 }]);

const f0 = PHONE;
const f1 = about(f0, PHONE_C, 1.155);
const finderDrift = driftTrack([{ t: 21.3333, c: f0 }, { t: 23.4667, c: f1 }]);

const r1 = about(DESK, RESULTS, 1.03);
const toWide = move(r1, WIDE, pullEase);
const w1 = about(WIDE, [WIDE.cx, WIDE.cy], 0.663); // breathe about the frame centre

const SEGMENTS = [
  { a: 0, b: 2.1333, f: opening },
  { a: 2.1333, b: 8.5333, f: splitDrift },
  { a: 8.5333, b: 9.6, move: move(s3, DESK, sine), lean: 1 },
  { a: 9.6, b: 12.8, f: deskDrift },
  { a: 12.8, b: 17.0667, f: phoneDrift },
  { a: 17.0667, b: 18.6667, move: move(p2, SPLIT, sine), lean: 1 },
  { a: 18.6667, b: 21.3333, f: bagDrift },
  { a: 21.3333, b: 23.4667, f: finderDrift },
  // A small push toward the results while the matches are composed (eased at both ends: no kick).
  { a: 23.4667, b: 25.6, f: (t) => (t < 24.28 ? DESK : move(DESK, r1, sine)((t - 24.28) / 0.6)) },
  { a: 25.6, b: 27.4, move: toWide, lean: 0.75 },
  { a: 27.4, b: 30.01, f: (t) => move(WIDE, w1, sine)((t - 27.4) / 2.6) },
];

function base(t) {
  for (const s of SEGMENTS) {
    if (t < s.b || s === SEGMENTS[SEGMENTS.length - 1]) {
      if (s.move) return { ...s.move((t - s.a) / (s.b - s.a)), seg: s };
      return { ...s.f(t), seg: s };
    }
  }
}

/**
 * The camera at film time t: {cx, cy, k, lean}. Lean is up to 2° into the direction of
 * travel, from the move's own screen velocity, so it is zero at rest and never jolts.
 */
export function camera(t) {
  const c = base(t);
  let lean = 0;
  if (c.seg.lean) {
    const h = 1 / 240;
    const a = base(Math.max(c.seg.a, t - h)), b = base(Math.min(c.seg.b - 1e-6, t + h));
    const vx = ((a.cx - b.cx) * c.k) / (2 * h); // screen px/s of the picture
    lean = clamp(vx / 1500, -1, 1) * 2 * c.seg.lean;
  }
  return { cx: c.cx, cy: c.cy, k: c.k, lean };
}

/** The world transform for a camera pose. */
export function worldTransform({ cx, cy, k, lean }) {
  const rot = Math.abs(lean) > 0.005 ? ` perspective(2400px) rotateY(${lean.toFixed(4)}deg)` : "";
  return `translate(960px, 540px)${rot} scale(${k.toFixed(6)}) translate(${(-cx).toFixed(3)}px, ${(-cy).toFixed(3)}px)`;
}

/** A table point on screen (no lean). */
export const toScreen = (c, x, y) => [960 + c.k * (x - c.cx), 540 + c.k * (y - c.cy)];
