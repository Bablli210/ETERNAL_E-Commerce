// Time helpers. Every animated value in the film is a pure function of time.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const mix3 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
export const smooth = (p) => p * p * (3 - 2 * p);

/** A CSS cubic-bezier(x1, y1, x2, y2) as a function of progress. */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-6) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return sy(clamp(t));
  };
}

// The storefront's motion tokens (app/globals.css), plus two long curves for the camera.
export const ease = {
  linear: (p) => p,
  standard: bezier(0.2, 0.7, 0.2, 1),
  emphasized: bezier(0.16, 1, 0.3, 1),
  exit: bezier(0.4, 0, 1, 1),
  inOut: bezier(0.65, 0, 0.35, 1),
  sine: (p) => 0.5 - 0.5 * Math.cos(Math.PI * p),
  expoOut: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
};

/** Eased 0→1 from `start` over `dur` seconds. */
export const tween = (t, start, dur, e = ease.standard) => e(clamp((t - start) / dur));
/** 0→1 over [a, a+fin], hold, 1→0 over [b-fout, b]. */
export const envelope = (t, a, b, fin, fout, ein = ease.standard, eout = ease.exit) =>
  Math.min(tween(t, a, fin, ein), 1 - tween(t, b - fout, fout, eout));

/** Seeded generator (mulberry32): the same "random" layout on every frame and worker. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A keyframed track: cubic Hermite through { t, v } keys, C1-continuous in time, so
 * the camera never jolts at a key. Tangents are the time-weighted neighbours'
 * slope; a key with `hold: true` (and the first and last keys) has zero velocity.
 * Values may be numbers or arrays.
 */
export function track(keys) {
  const k = keys.map((x) => ({ ...x, v: Array.isArray(x.v) ? x.v : [x.v] }));
  const n = k.length;
  const dim = k[0].v.length;
  const m = k.map((key, i) => {
    if (i === 0 || i === n - 1 || key.hold) return new Array(dim).fill(0);
    const a = k[i - 1], b = k[i + 1];
    const dt = b.t - a.t;
    return key.v.map((_, d) => (b.v[d] - a.v[d]) / dt * (key.tension ?? 1));
  });
  const scalar = !Array.isArray(keys[0].v);
  return (t) => {
    let out;
    if (t <= k[0].t) out = k[0].v.slice();
    else if (t >= k[n - 1].t) out = k[n - 1].v.slice();
    else {
      let i = 0;
      while (t > k[i + 1].t) i++;
      const a = k[i], b = k[i + 1];
      const h = b.t - a.t;
      const s = (t - a.t) / h;
      const s2 = s * s, s3 = s2 * s;
      const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
      out = a.v.map((_, d) => h00 * a.v[d] + h10 * h * m[i][d] + h01 * b.v[d] + h11 * h * m[i + 1][d]);
    }
    return scalar ? out[0] : out;
  };
}

/** Slow, deterministic drift (sum of incommensurate sines), for a breathing, hand-held camera. */
export function drift(t, seed = 0, amp = 1) {
  const s = seed * 1.7;
  return amp * (0.6 * Math.sin(t * 0.53 + s) + 0.3 * Math.sin(t * 1.27 + s * 2.3) + 0.1 * Math.sin(t * 2.71 + s * 3.1));
}
