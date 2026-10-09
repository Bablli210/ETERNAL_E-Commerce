// The edit: 30 s at 30 fps on a 112.5 BPM grid (a beat is 16 frames, a bar 64). One
// storefront runs on two screens set on a Linen table; the camera moves between five
// framings (camera.js) with three hard cuts; Orbit's numbered statements explain each part.
// Takes are the real site recorded frame-exactly (tools/takes.mjs); each plays at its own
// film time, holding its first and last frames.
import { el, browser, phone, loadTake, DESK_SCALE } from "./stage.js";
import { camera, worldTransform, CUTS } from "./camera.js";
import { block, chip, endCard } from "./type.js";
import { clamp } from "./ease.js";

export const FPS = 30;
export const DURATION = 30;
const LOOP = new URLSearchParams(location.search).has("loop");

export const BLOCKS = [
  { zone: "band", at: 2.1333, out: 4.8, label: "Orbit — Case study", lines: ["A storefront for eternal,", "a perfume house in Cairo."] },
  { zone: "band", at: 5.3333, out: 8.5333, num: "01", label: "Home", lines: ["Built phone-first, for shoppers", "arriving from Instagram ads."] },
  { zone: "left", at: 9.6, out: 12.8, num: "02", label: "Catalogue", lines: ["Next.js in front.", "Shopify for stock", "and checkout."] },
  { zone: "right", at: 12.8, out: 17.0667, num: "03", label: "Product page", lines: ["Product pages that sell", "on the first screen."], synced: { at: 14.9333, text: "Add to bag follows you down the page." } },
  { zone: "band", at: 18.1333, out: 21.3333, num: "04", label: "Bag", lines: ["One bag: a drawer on desktop,", "a sheet on the phone."] },
  { zone: "right", at: 21.3333, out: 23.4667, num: "05", label: "Scent finder", lines: ["Five questions,", "three matches."] },
  { zone: "left", at: 23.4667, out: 25.6, num: "05", label: "Scent finder", lines: ["The answers live", "in the link."] },
];
export const CHIPS = [
  // Level with the Woody chip, under the browser, on the click frame.
  { text: "Re-flow · 320 ms · ease-standard", at: 10.6667, out: 12.8, x: 900, y: 942 },
  // On the drawer's first frame (the 450 ms reveal after the 18.667 click), at the right end of the label line.
  { text: "Drawer · 320 ms · ease-emphasized", at: 19.1167, out: 21.3333, x: 1254, y: 75, align: "right" },
];
export const END = { label: 26.6667, signature: 27.7333 };

export async function createEdit(stage) {
  const [D1, D3, D4, P1, P2, P3] = await Promise.all(["v2-d1", "v2-d3", "v2-d4", "v2-p1", "v2-p2", "v2-p3"].map(loadTake));
  const world = el("div", "world", stage);
  el("div", "table", world);
  const win = browser(world);
  const ph = phone(world);
  const layer = el("div", "abs", stage, { width: "1920px", height: "1080px" });
  const blocks = BLOCKS.map((b) => block(layer, b));
  const chips = CHIPS.map((c) => chip(layer, c));
  const end = endCard(layer, END);
  const fade = el("div", "abs", stage, { width: "1920px", height: "1080px", background: "var(--linen)", opacity: "0" });

  const desk = (t) => (t < 12.9 ? D1 : t < CUTS[2] ? D3 : D4);
  const hand = (t) => (t < 9.6 ? P1 : t < CUTS[1] ? P2 : P3);

  function pose(t) {
    const cam = camera(t);
    world.style.transform = worldTransform(cam);
    const d = desk(t);
    // The full-resolution frames only while the camera is close to the desktop (the loader).
    const level = d === D1 && cam.k * DESK_SCALE > 0.95 ? "full" : "mid";
    win.pose(d, t, { level });
    ph.pose(hand(t), t);
    for (const b of blocks) b.pose(t);
    for (const c of chips) c.pose(t);
    end.pose(t);
    fade.style.opacity = LOOP ? String(clamp((t - 29.6) / 0.4)) : "0";
    return [win.ready(), ph.ready()];
  }
  /**
   * Sub-frames this output frame needs for its 180° shutter: 3 (t − 8.3 ms, t, t + 8.3 ms)
   * while the camera, a screen or the pointer moves, 1 when everything holds still.
   */
  const H = 1 / 120;
  function samples(t) {
    const a = camera(t - H), b = camera(t + H);
    const corner = (c, x, y) => [960 + c.k * (x - c.cx), 540 + c.k * (y - c.cy)];
    for (const [x, y] of [[0, 0], [1920, 1080]]) {
      const p = corner(a, x / a.k + a.cx - 960 / a.k, y / a.k + a.cy - 540 / a.k), q = corner(b, x / a.k + a.cx - 960 / a.k, y / a.k + a.cy - 540 / a.k);
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.2 || Math.abs(a.lean - b.lean) > 0.001) return 3;
    }
    for (const take of [desk(t - H), desk(t + H), hand(t - H), hand(t + H)]) {
      const i0 = take.index(t - H), i1 = take.index(t + H);
      for (let i = i0 + 1; i <= i1; i++) if (!take.same[i]) return 3;
      const e0 = take.log[i0], e1 = take.log[i1];
      if (e0.x !== e1.x || e0.y !== e1.y || e0.down !== e1.down) return 3;
    }
    if (desk(t - H) !== desk(t + H) || hand(t - H) !== hand(t + H)) return 3;
    return 1;
  }
  /** [time, weight] pairs for frame t: 1:2:1 across the shutter, never reaching across a cut. */
  function subframes(t) {
    if (samples(t) === 1) return [[t, 1]];
    const shot = (x) => CUTS.filter((c) => x >= c - 1e-6).length;
    let w0 = 1, w1 = 2, w2 = 1;
    if (shot(t - H) !== shot(t)) { w1 += w0; w0 = 0; }
    if (shot(t + H) !== shot(t)) { w1 += w2; w2 = 0; }
    return [[t - H, w0], [t, w1], [t + H, w2]].filter(([, w]) => w > 0);
  }
  const label = (t) => {
    const c = camera(t);
    return `k ${c.k.toFixed(3)} · (${c.cx.toFixed(0)}, ${c.cy.toFixed(0)}) · lean ${c.lean.toFixed(2)}° · ${desk(t).id}/${hand(t).id}`;
  };
  return { pose, label, samples, subframes, takes: { D1, D3, D4, P1, P2, P3 } };
}
