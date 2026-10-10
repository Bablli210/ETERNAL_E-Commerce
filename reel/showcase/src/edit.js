// The edit: 30 s at 30 fps on a 112.5 BPM grid (a beat is 16 frames, a bar 64). One
// storefront runs on two screens set on a Linen table; the camera moves between five
// framings (camera.js) with three hard cuts; Orbit's numbered statements explain each part.
// Takes are the real site recorded frame-exactly (tools/takes.mjs); each plays at its own
// film time, holding its first and last frames.
import { el, browser, phone, loadTake, DESK_SCALE } from "./stage.js";
import { camera, worldTransform, CUTS, F } from "./camera.js";
import { block, chip, endCard } from "./type.js";
import { clamp } from "./ease.js";

export const FPS = 30;
export const DURATION = 30;
const LOOP = new URLSearchParams(location.search).has("loop");

// Times are output frames, F(n) = n / 30, so nothing can land between a frame and its cut.
export const BLOCKS = [
  { zone: "band", at: F(64), out: F(153), label: "Orbit — Case study", lines: ["A storefront for eternal,", "a perfume house in Cairo."] },
  // The phone shows the ad landing (an ad pins its own bottle, content/heroes.ts), beside the desktop's film.
  { zone: "band", at: F(160), out: F(256), num: "01", label: "Home", lines: ["Built phone-first: an Instagram ad", "lands on the bottle it showed."] },
  { zone: "left", at: F(288), out: CUTS[0], num: "02", label: "Catalogue", lines: ["Next.js in front.", "Shopify for stock", "and checkout."] },
  { zone: "right", at: CUTS[0], out: F(512), num: "03", label: "Product page", lines: ["Product pages that sell", "on the first screen."], synced: { at: F(448), text: "Add to bag follows you down the page." } },
  { zone: "band", at: F(544), out: CUTS[1], num: "04", label: "Bag", lines: ["The bag: a drawer on desktop,", "a sheet on the phone."] },
  // The one short hold: the shot is a bar long, between two cuts.
  { zone: "right", at: CUTS[1], out: CUTS[2], num: "05", label: "Scent finder", lines: ["Five questions,", "three matches."] },
  { zone: "left", at: CUTS[2], out: F(792), num: "05", label: "Scent finder", lines: ["The answers live", "in the link."] },
];
export const CHIPS = [
  // Level with the Woody chip, below the browser and its shadow, on the click frame.
  // One frame early, so the rise is under way on the first frame of the animation it names.
  { text: "Re-flow · 320 ms", at: F(319), out: CUTS[0], x: 900, y: 968 },
  // On the drawer's first frame (the 450 ms reveal after the F(560) click), at the right end of the label line.
  { text: "Drawer · 320 ms", at: F(573), out: CUTS[1], x: 1254, y: 75, align: "right" },
];
export const END = { label: F(800), signature: F(832) };
// While the desktop plays the hero film (until its scroll at F(128)), every sub-frame shows the take
// at the frame's own time: a 24 fps film then never double-exposes, and the loader's curtain stays crisp.
const SNAP_UNTIL = F(128);

export async function createEdit(stage) {
  const [D1, D3, D4, P1, P2, P3, P4] = await Promise.all(["v2-d1", "v2-d3", "v2-d4", "v2-p1", "v2-p2", "v2-p3", "v2-p4"].map(loadTake));
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
  // The phone is off screen from the third cut until the final pull-back brings it back on the results.
  const hand = (t) => (t < 9.6 ? P1 : t < CUTS[1] ? P2 : t < F(768) ? P3 : P4);

  /** Paint film time t; `centre` is the output frame this sub-frame belongs to. */
  function pose(t, centre = t) {
    const cam = camera(t);
    world.style.transform = worldTransform(cam);
    const d = desk(t);
    // The full-resolution frames only while the camera is close to the desktop (the loader).
    const level = d === D1 && cam.k * DESK_SCALE > 0.95 ? "full" : "mid";
    // Frame 0 is bare Linen: the loader's first paint (a dot where its stroke will start) lasts 4 ms on the site.
    win.pose(d, d === D1 && centre < SNAP_UNTIL ? centre : t, { level, blank: centre < 1 / 60 });
    ph.pose(hand(t), t);
    for (const b of blocks) b.pose(t);
    for (const c of chips) c.pose(t);
    end.pose(t);
    fade.style.opacity = LOOP ? String(clamp((t - 29.6) / (F(899) - 29.6))) : "0";
    return [win.ready(), ph.ready()];
  }

  /**
   * The shutter: 180° at 30 fps, so a frame gathers ±1/120 s. While anything moves, 9 taps across
   * it with triangular weights: the camera is continuous, and screens cross-fade between their
   * recorded frames (240 Hz for the scroll takes), so both blur instead of strobing. One sample
   * when everything holds still, or when a click or tap switches the page's state inside the
   * shutter. No tap reaches across a cut.
   */
  const H = 1 / 120;
  const corners = [[0, 0], [1920, 0], [0, 1080], [1920, 1080], [960, 540]];
  function cameraTravel(t) {
    const a = camera(t - H), b = camera(t + H);
    let m = 0;
    for (const [x, y] of corners) {
      const X = (x - 960) / a.k + a.cx, Y = (y - 540) / a.k + a.cy;
      m = Math.max(m, Math.hypot(960 + b.k * (X - b.cx) - x, 540 + b.k * (Y - b.cy) - y));
    }
    return m + Math.abs(a.lean - b.lean) * 30;
  }
  function pageMoves(t) {
    if (desk(t - H) !== desk(t + H) || hand(t - H) !== hand(t + H)) return true;
    for (const take of new Set([desk(t - H), desk(t + H), hand(t - H), hand(t + H)])) {
      if (take === D1 && t < SNAP_UNTIL) continue;
      const i0 = take.index(t - H), i1 = take.index(t + H);
      for (let i = i0 + 1; i <= i1; i++) if (!take.same[i]) return true;
      const e0 = take.log[i0], e1 = take.log[i1];
      if (e0.x !== e1.x || e0.y !== e1.y || e0.down !== e1.down) return true;
    }
    return false;
  }
  /** A click or tap inside the shutter: the page changes state at once (a real 30 fps capture shows one side). */
  function clicks(t) {
    for (const take of new Set([desk(t), hand(t)])) {
      for (const m of take.marks) if ((m.do === "up" || m.do === "tap") && m.at > t - H - 1e-9 && m.at <= t + H + 1e-9) return true;
    }
    return false;
  }
  function samples(t) {
    const travel = cameraTravel(t);
    if (travel > 3) return 9;
    if (clicks(t)) return 1;
    return travel > 0.3 || pageMoves(t) ? 9 : 1;
  }
  /** [time, weight, frame centre] for each sub-frame of output frame t. */
  function subframes(t) {
    const n = samples(t);
    if (n === 1) return [[t, 1, t]];
    const shot = (x) => CUTS.filter((c) => x >= c - 1e-9).length;
    const half = (n - 1) / 2, out = [];
    for (let k = 0; k < n; k++) {
      const x = t + ((k - half) / half) * H;
      if (shot(x) === shot(t)) out.push([x, half + 1 - Math.abs(k - half), t]);
    }
    return out;
  }
  const label = (t) => {
    const c = camera(t);
    return `k ${c.k.toFixed(3)} · (${c.cx.toFixed(0)}, ${c.cy.toFixed(0)}) · lean ${c.lean.toFixed(2)}° · ${desk(t).id}/${hand(t).id}`;
  };
  return { pose, label, samples, subframes, takes: { D1, D3, D4, P1, P2, P3, P4 } };
}
