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
// Every time in the edit is an output frame (F(n) = n / 30), so a boundary can never fall
// between a frame and its cut (a 4-decimal literal once rounded past frame 704 and left a
// one-frame double exposure on the third cut).
export const F = (n) => n / 30;
export const CUTS = [F(384), F(640), F(704)];

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
const GRID = [1072, 637]; // Raw Seduction in the Woody grid (column 4), on the table
const PHONE_C = [1603, 598]; // the phone's centre
const BETWEEN = [1330, 600]; // between the drawer and the sheet
const RESULTS = [687, 700]; // the finder's results row

// 0–2.133: the loader, then one continuous pull-back from inside the desktop to both screens.
const OPEN_K1 = 2.15;
const openShare = Math.log(OPEN_K1 / OPEN.k) / Math.log(SPLIT.k / OPEN.k); // the creep's share of the zoom
const openMove = move(OPEN, SPLIT, (u) => u);
const creepSlope = openShare / 0.8; // per second
const pullK = hermite((creepSlope * (F(64) - 0.8)) / (1 - openShare));
function opening(t) {
  const u = t < 0.8 ? creepSlope * t : openShare + (1 - openShare) * pullK((t - 0.8) / (F(64) - 0.8));
  return openMove(u);
}

// The keyed drifts.
const s0 = SPLIT;
const s1 = shift(about(s0, [960, 540], 1.006), 0, -4);
const s2 = shift(about(s1, [960, 540], 1.012), -4, 0);
const s3 = about(s2, THREE_LINES, 1.018);
const splitDrift = driftTrack([{ t: F(64), c: s0 }, { t: F(128), c: s1 }, { t: F(192), c: s2 }, { t: F(256), c: s3 }]);

const d0 = DESK;
const d1 = about(d0, [960, 540], 1.006);
const d2 = about(d1, GRID, 1.015);
const deskDrift = driftTrack([{ t: F(288), c: d0 }, { t: F(320), c: d1 }, { t: CUTS[0], c: d2 }]);

const p0 = PHONE;
const p1 = shift(about(p0, PHONE_C, 1.15), 0, -6);
const p2 = about(p1, PHONE_C, 1.16);
const phoneDrift = driftTrack([{ t: CUTS[0], c: p0 }, { t: F(448), c: p1 }, { t: F(512), c: p2 }]);

const b0 = SPLIT;
const b1 = about(b0, BETWEEN, 1.015);
const bagDrift = driftTrack([{ t: F(560), c: b0 }, { t: F(576), c: b0 }, { t: CUTS[1], c: b1 }]);

const f0 = PHONE;
const f1 = about(f0, PHONE_C, 1.155);
const finderDrift = driftTrack([{ t: CUTS[1], c: f0 }, { t: CUTS[2], c: f1 }]);

const r1 = about(DESK, RESULTS, 1.03);
const toWide = move(r1, WIDE, pullEase);
const w1 = about(WIDE, [WIDE.cx, WIDE.cy], 0.663); // breathe about the frame centre

const SEGMENTS = [
  { a: 0, b: F(64), f: opening },
  { a: F(64), b: F(256), f: splitDrift },
  { a: F(256), b: F(288), move: move(s3, DESK, sine), lean: 1 },
  { a: F(288), b: CUTS[0], f: deskDrift },
  { a: CUTS[0], b: F(512), f: phoneDrift },
  { a: F(512), b: F(560), move: move(p2, SPLIT, sine), lean: 1 },
  { a: F(560), b: CUTS[1], f: bagDrift },
  { a: CUTS[1], b: CUTS[2], f: finderDrift },
  // A small push toward the results while the matches are composed (eased at both ends: no kick).
  { a: CUTS[2], b: F(768), f: (t) => (t < 24.28 ? DESK : move(DESK, r1, sine)((t - 24.28) / 0.6)) },
  { a: F(768), b: F(822), move: toWide, lean: 0.75 },
  { a: F(822), b: 30.01, f: (t) => move(WIDE, w1, sine)((t - F(822)) / (30 - F(822))) },
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
