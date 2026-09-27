/*
 * Scene 10 · "Mobile first" (storefront-mobile) — 7.4 s, from 82.1 s.
 *
 * Proof on the device the direction designs for first. Sand ground, as scene
 * 09. The left column keeps scene 09's eyebrow exactly where it was and sets a
 * two-line rule from the motion map; on the right, two minimal phones (Night
 * bodies, no notch, buttons, reflections, shadow or outline) show the real
 * mobile homepage: phone A still on the house band, phone B drifting through
 * the tales.
 *
 *   0.0  the runtime crossfades us in (600 ms): the browser dissolves while
 *        the Sand ground and the eyebrow, identical in both scenes, stay put.
 *   0.2  phone A fades in and rises 16 px (600 ms, emphasized); phone B
 *        follows at 0.32 s.
 *   0.9  "Mobile is / the primary device." rises word by word across its two
 *        lines (24 px, 600 ms, emphasized, 80 ms stagger; settled at 1.82 s).
 *   1.9  phone B scrolls css 8380 → 9000 over 4 s: 600 ms sine ease-in, an
 *        even 174 css px/s (157 stage px/s), 600 ms sine ease-out. It is the
 *        only thing moving.
 *   5.9  phone B rests on the Enzo 1898 and Forbidden Apple cards; hold.
 *   6.2  scene 11's light-wipe (1.2 s) carries everything off. Nothing of ours
 *        fades out.
 *
 * Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const E = R.ease;
  const nowrap = { whiteSpace: "nowrap" };

  /* ---- the left column ---- */
  // Identical to scene 09 (same box, role, size, colour) and present from
  // frame 0 with no entrance, so it reads as fixed through the crossfade.
  const EYEBROW = { text: "The storefront", x: 120, y: 256 };
  const EYEBROW_REST = "translate3d(0, 0.000px, 0) rotate(0.001deg)";
  // 64 px Cormorant Garamond 600, line-height 1.05 (67.2 px): scene 09's page
  // names sit on the same (120, 300) box, so the headline takes their place.
  // Optical margin, measured on the rendered frame: the eyebrow's T inks from
  // x 120, but the M's foot serif and the t's crossbar each carry about 1 px
  // more side bearing, so both lines move left by 1 px and hang on the
  // eyebrow's edge (ink from x 120.6 and 120.3). Nothing inks left of the 120
  // title-safe line.
  // The break follows the phrase, subject / predicate, so no line ends on the
  // article: "Mobile is" / "the primary device." (line 2 inks to x 586, far
  // from phone A at 920).
  const LINES = [
    { text: "Mobile is", x: 120, y: 300, dx: -1 },
    { text: "the primary device.", x: 120, y: 367, dx: -1 },
  ];
  const HEAD = { at: 0.9, gap: 0.08, dur: R.dur.l, dist: 24 };

  /* ---- the phones ----
   * R.phone at h 784, bezel 12: a 375×784 Night body, 351×760 screen, corner
   * radii 59 / 47 (concentric across the 12 px bezel). Both centred on y 540;
   * phone B's right edge sits on the 1800 margin, as scene 09's browser did.
   * Screens show the 390-css page at 351/390 = 0.9: 844 css rows.
   */
  const PHONE_Y = 148, PHONE_H = 784, BEZEL = 12;
  const PHONES = {
    a: { x: 920, at: 0.2 },
    b: { x: 1425, at: 0.32 },
  };
  const RISE = { dur: R.dur.l, dist: 16 };
  const CSS_W = 390; // the mobile capture's page width (3 capture px per css px)
  // Phone A, still: css 7547 → 8391, the Night house band (css 7595–8342,
  // measured on the capture) framed by an even margin of Linen above and below
  // (48 / 49 css, 44 stage px each on the rendered frame), so the band reads as
  // deliberately set, not mis-scrolled. It ends before the "Tales" glyphs at
  // css 8417.
  const A_SCROLL = 7547;
  // Phone B, drifting: css 8380 ("Tales", "All tales", the Wayne card) → 9000
  // (Enzo 1898 and Forbidden Apple with their lines, bottom edge at css 9844,
  // above the Join band at 9885).
  const B_SCROLL = { from: 8380, to: 9000, at: 1.9, dur: 4.0, ramp: R.dur.l };

  /*
   * The page: only the rows this scene may show, resampled once, shown from
   * canvases.
   *
   * Why not R.capture: home-mobile.jpg is 1170×34470, 161 MB decoded. The
   * runtime decodes every <img> of the film together before the first frame,
   * and Chrome refuses a decode past its image budget ("The source image
   * cannot be decoded"): next to scene 09's home-desktop.jpg (206 MB) the
   * capture, or even a 32 MB strip of it as an <img>, made one of them fail
   * and the film would not load. So the phones hold no <img>. build() decodes
   * the capture once, keeps css 7540–9850 (1170×6930 capture px), resamples it
   * to the screens' 351 px and lets the decode go. It also makes the notes'
   * limits physical: nothing above css 7540 or below 9850 (the Join band
   * starts at 9885) exists in the scene. The mystery-box offer card and its
   * price end at css 7523; css 7524–7594 is the section's plain Linen padding
   * (a uniform 238/230/217 in the capture from 7528): the strip starts 17 css
   * rows below the card's edge, on that empty ground, so the card is never in
   * the scene. The top moves by 20 css (60 capture px = 18 screen px, whole),
   * so phone B samples the page on exactly the same grid as before.
   *
   * Why phases: a bitmap at the screen's own resolution, moved by fractional
   * pixels, is re-sampled bilinearly by the browser, so a scrolling page goes
   * soft and sharp again every few frames (measured: ±12 % edge contrast at
   * 5.2 px a frame) — text that shimmers as it moves. Instead the strip is
   * resampled with Lanczos-3 at eight sub-pixel phases (0, 1/8 … 7/8 px), one
   * canvas each, and every frame shows the phase nearest the page's exact
   * position at a whole-pixel offset. Each frame is a clean resample at its
   * own position (within 1/16 px), equally crisp at rest and in motion, and
   * render() still only sets styles. Chrome gives each visible canvas its own
   * layer, which only ever moves by whole pixels, so nothing is re-sampled.
   */
  const STRIP = { name: "site/home-mobile.jpg", top: 7540, bottom: 9850 };
  const PHASES = 8;

  async function loadStrip() {
    const meta = R.manifest[STRIP.name];
    const k = meta.w / CSS_W;
    const res = await fetch(R.asset(STRIP.name));
    if (!res.ok) throw new Error(`could not load ${STRIP.name}`);
    const sy = Math.round(STRIP.top * k), sh = Math.round((STRIP.bottom - STRIP.top) * k);
    const bmp = await createImageBitmap(await res.blob(), 0, sy, meta.w, sh);
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(bmp, 0, 0);
    bmp.close();
    const src = g.getImageData(0, 0, c.width, c.height);
    c.width = c.height = 0; // release the canvas backing store
    return src;
  }

  /*
   * Lanczos-3 taps, separable, in sRGB as browsers resample (the canvas's own
   * "high" smoothing drew the tale lines visibly softer and paler than the
   * browser draws the capture as an <img>). Output pixel i shows the source
   * around output position i − shift, so shift = 3/8 moves the page 3/8 px
   * down. Taps past the strip's ends are dropped and the rest renormalised
   * (those edge rows are never on screen).
   */
  function taps(srcN, dstN, shift = 0, a = 3) {
    const scale = srcN / dstN, support = a * scale;
    const sinc = (x) => (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
    return Array.from({ length: dstN }, (_, i) => {
      const c = (i - shift + 0.5) * scale - 0.5;
      const lo = Math.max(0, Math.ceil(c - support)), hi = Math.min(srcN - 1, Math.floor(c + support));
      const w = [];
      for (let j = lo; j <= hi; j++) {
        const x = (j - c) / scale;
        w.push(Math.abs(x) < a ? sinc(x) * sinc(x / a) : 0);
      }
      const sum = w.reduce((s, v) => s + v, 0);
      return { lo, w: Float32Array.from(w, (v) => v / sum) };
    });
  }
  // Horizontal pass, shared by every phase: RGB floats, dw × src.height.
  function resampleX(src, dw) {
    const sw = src.width, sh = src.height, s = src.data, tx = taps(sw, dw);
    const mid = new Float32Array(dw * sh * 3);
    for (let y = 0; y < sh; y++) {
      const row = y * sw * 4, out = y * dw * 3;
      for (let x = 0; x < dw; x++) {
        const { lo, w } = tx[x];
        let r = 0, g = 0, b = 0;
        for (let k = 0, i = row + lo * 4; k < w.length; k++, i += 4) { r += s[i] * w[k]; g += s[i + 1] * w[k]; b += s[i + 2] * w[k]; }
        const o = out + x * 3;
        mid[o] = r; mid[o + 1] = g; mid[o + 2] = b;
      }
    }
    return { mid, w: dw, h: sh };
  }
  // Vertical pass at one sub-pixel phase: an opaque ImageData, dw × dh.
  function resampleY({ mid, w: dw, h: sh }, dh, shift) {
    const ty = taps(sh, dh, shift);
    const img = new ImageData(dw, dh), d = img.data, n = dw * 3, acc = new Float32Array(n);
    for (let y = 0; y < dh; y++) {
      const { lo, w } = ty[y];
      acc.fill(0);
      for (let k = 0; k < w.length; k++) {
        const base = (lo + k) * n, wk = w[k];
        for (let i = 0; i < n; i++) acc[i] += mid[base + i] * wk;
      }
      for (let x = 0, o = y * dw * 4; x < dw; x++, o += 4) {
        d[o] = acc[x * 3]; d[o + 1] = acc[x * 3 + 1]; d[o + 2] = acc[x * 3 + 2]; d[o + 3] = 255; // clamped, rounded
      }
    }
    return img;
  }

  /*
   * The scroll as the board asks: a sine ease-in, constant speed, a sine
   * ease-out. The ramps are cosine segments whose end speed equals the cruise
   * speed, so speed is continuous everywhere and acceleration is 0 where each
   * ramp meets the cruise: ramp distance d = 2·v·ramp/π, and
   * v = D / (dur − 2·ramp + 4·ramp/π) = 620 / 3.564 ≈ 174 css px/s.
   * Returns css px travelled, 0 → D.
   */
  function scrollTravel(t) {
    const { from, to, at, dur, ramp } = B_SCROLL;
    const D = to - from;
    const v = D / (dur - 2 * ramp + (4 * ramp) / Math.PI);
    const d = (2 * v * ramp) / Math.PI;
    const u = t - at;
    if (u <= 0) return 0;
    if (u >= dur) return D;
    if (u < ramp) return d * (1 - Math.cos((Math.PI * u) / (2 * ramp)));
    if (u > dur - ramp) return D - d * (1 - Math.cos((Math.PI * (dur - u)) / (2 * ramp)));
    return d + v * (u - ramp);
  }

  let els = null;

  /*
   * The spec's rise, made order-independent as in scenes 03, 06 and 08:
   * `.word` spans carry will-change: transform, and Chrome keeps a
   * will-change layer's raster from whatever sub-pixel offset it was first
   * painted at, so a settled word could differ with the frames painted before
   * it. unpin() drops the hint; transforms are plain 2D, so every frame is
   * rasterised at its exact offset. The 0.001° turn keeps glyphs placed at
   * their true sub-pixel offset through the rise and at rest, so the settle
   * glides instead of stepping.
   */
  function unpin(el) {
    el.style.willChange = "auto";
    return el;
  }
  function riseFree(el, p, dist) {
    el.style.opacity = String(p);
    el.style.transform = `translate(0px, ${((1 - p) * dist).toFixed(3)}px) rotate(0.001deg)`;
  }

  function makePhone(root, x, phases) {
    const phone = R.phone(root, { x, y: PHONE_Y, h: PHONE_H, bezel: BEZEL });
    // The screen's own ground is the bezel's Night, not Linen: the rounded clip
    // anti-aliases the ground and the page separately, and a Linen ground bled
    // a pale seam along the corner curves wherever the page is dark (phone A's
    // house band). The page covers the screen entirely, so the ground only
    // shows in those edge pixels, where it now matches the bezel.
    phone.screen.style.background = C.night;
    const pages = phases.map((img) => {
      const c = R.el("canvas", { attrs: { width: img.width, height: img.height }, style: {
        position: "absolute", left: "0", top: "0", width: `${img.width}px`, height: `${img.height}px`, visibility: "hidden",
      } }, phone.screen);
      c.getContext("2d", { alpha: false, willReadFrequently: true }).putImageData(img, 0, 0);
      return c;
    });
    return { ...phone, pages, scale: phone.sw / CSS_W };
  }

  /*
   * One phone for this frame: the body rises by `rise` (0 → 1), and the page
   * shows page-y `yCss` (site css px) at the top of the screen. The page's
   * exact offset inside the rising body, rise + (7560 − yCss)·0.9, is split
   * into whole pixels and the nearest of the eight phases; the chosen canvas
   * cancels the body's fractional rise, so it always lands on whole pixels.
   */
  function placePhone(ph, rise, yCss) {
    const ty = rise >= 1 ? 0 : +((1 - rise) * RISE.dist).toFixed(3);
    ph.frame.style.opacity = String(rise);
    ph.frame.style.transform = ty === 0 ? "none" : `translate(0px, ${ty}px)`;
    const total = ty - (yCss - STRIP.top) * ph.scale;
    let whole = Math.floor(total);
    let k = Math.round((total - whole) * PHASES);
    if (k === PHASES) { k = 0; whole += 1; }
    const shift = `translate(0px, ${(whole - ty).toFixed(3)}px)`;
    ph.pages.forEach((c, i) => {
      c.style.visibility = i === k ? "visible" : "hidden";
      c.style.transform = shift;
    });
  }

  async function build(root) {
    R.box(root, { x: 0, y: 0, w: R.W, h: R.H }, { background: C.sand });

    const eyebrow = R.text(root, EYEBROW.text, { role: "eyebrow", x: EYEBROW.x, y: EYEBROW.y, size: 18, color: C.ash, style: nowrap });

    // One R.text block per line; the word stagger runs across both in reading order.
    const words = LINES.flatMap((l) => R.splitWords(R.text(root, l.text, {
      role: "display-l", x: l.x + l.dx, y: l.y, size: 64, weight: 600, lineHeight: 1.05, color: C.night, style: nowrap,
    })).map(unpin));

    // The page strip at the screens' resolution (351 × 2079), in eight phases.
    const sw = Math.round(((PHONE_H - 2 * BEZEL) * CSS_W) / 844); // R.phone's screen width
    const src = await loadStrip();
    const dh = Math.round((src.height * sw) / src.width);
    const across = resampleX(src, sw);
    const phases = Array.from({ length: PHASES }, (_, k) => resampleY(across, dh, k / PHASES));

    const a = makePhone(root, PHONES.a.x, phases);
    const b = makePhone(root, PHONES.b.x, phases);
    if (a.sw !== sw) throw new Error(`storefront-mobile: screen is ${a.sw} px, strip is ${sw} px`);

    els = { eyebrow, words, a, b };
  }

  function render(t) {
    const { eyebrow, words, a, b } = els;

    // The eyebrow simply stays, from frame 0, set exactly as scene 09 leaves
    // its own at rest (the spec's rise, settled): the same box, and the same
    // transform, so both rasterise alike (grayscale, on its own layer) and the
    // crossfade blends two identical eyebrows. With "none" it was painted with
    // sub-pixel colour fringes and visibly re-weighted through the dissolve.
    eyebrow.style.opacity = "1";
    eyebrow.style.transform = EYEBROW_REST;

    // The phones arrive, A then B. Phone A holds on the house; phone B drifts
    // through the tales.
    placePhone(a, R.tween(t, PHONES.a.at, RISE.dur, E.emphasized), A_SCROLL);
    placePhone(b, R.tween(t, PHONES.b.at, RISE.dur, E.emphasized), B_SCROLL.from + scrollTravel(t));

    // The headline, word by word across its two lines.
    words.forEach((w, i) => riseFree(w, R.tween(t, HEAD.at + i * HEAD.gap, HEAD.dur, E.emphasized), HEAD.dist));

    return null;
  }

  // Grain 0 throughout: the runtime's grain is full-frame and would fall on the Sand.
  R.scene("storefront-mobile", { build, render, grain: () => 0 });
})();
