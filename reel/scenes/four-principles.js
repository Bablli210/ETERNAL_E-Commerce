/*
 * Scene 03 · "Four principles" (four-principles) — 20.6 s, from 14.4 s.
 *
 * An editorial spread on Linen in the site's 5/7 asymmetry. The left column
 * (x 120–700) never moves: an eyebrow, a Dune hairline, and one principle at a
 * time in the same three slots (index numeral, name, description).
 * The right panel (x 800–1920, full height, bleeding off three edges) holds
 * four stacked layers; each arrives over the last on a soft edge of light
 * travelling left→right; the old principle leaves while the edge is low on the
 * panel and the next one rises as the light crosses it, so the column is never
 * empty. P1–P3 are photographs from the same hour, each on a slow 4 % push;
 * P3 (a dry-stone wall in low sun) also carries one band of warm light. P4 is
 * the hero bottle's own colour world, Wayne: flat field, Golden hour chip with
 * its legend, and the e∞ watermark, the chip and watermark placed exactly where
 * scene 04 has them so they hold still under its light-wipe. One slow band of
 * low sun crosses the field and is gone before that wipe. The runtime
 * crossfades us in; we hold the final state to the end and scene 04's wipe
 * carries us off.
 *
 * Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const E = R.ease;
  const WAYNE = "#2B2A28"; // the Wayne colour world (named here and in scene 04; "proposed" in scene 06)
  const nowrap = { whiteSpace: "nowrap" };

  /* ---- geometry (stage px) ---- */
  const PANEL = { x: 800, y: 0, w: 1120, h: 1080 }; // 7 columns, bleeding right/top/bottom
  const FULL = { x: 0, y: 0, w: PANEL.w, h: PANEL.h }; // a layer, panel-local
  const PUSH_TO = 1.04; // around the panel centre; scale only, so no edge can show
  // P4, panel-local. Stage: chip (1744, 120); watermark (1100, 640), 780 wide — scene 04's exact spots.
  // At 780 the whole e∞ is in frame (ink ≈ stage x 1124–1856, y 713–957): at 1000 the ∞'s right
  // loop ran off the frame at x 1920 and what was left read as "e ∝".
  const CHIP = { x: 1744 - PANEL.x, y: 120, w: 56, h: 56 };
  const MARK = { x: 1100 - PANEL.x, y: 640, width: 780, color: C.linen, stroke: 2 };
  const MARK_OPACITY = 0.07;
  // The legend beside the chip, so the panel reads as Wayne's colour world and not as a
  // missing picture: eyebrow type, Dune on the dark field, its ink ending 24 px left of
  // the chip (x 1720) and its caps centred on the chip's middle (y 148). The box's right
  // edge sits 4 px right of that: CSS tracking trails the last letter by 0.14em (2.5 px)
  // and the D carries ≈ 1.5 px of side bearing (measured: ink x 1331–1720, caps y 141–155).
  const LEGEND = { text: "eterno · Wayne — colour world", right: PANEL.x + PANEL.w - 1720 - 4, y: 139 };

  /* ---- the four layers of the panel ---- */
  const REVEAL_DUR = 1.2;
  // Reveal starts. The words need the time, not the photographs. P1 keeps only its first
  // sentence, "Nothing shouts." (the storyboard allows whole sentences to go), so its four
  // words settle at 1.6 and read for 2.6 s; the time that frees goes to the long ones.
  // P2, P3 and P4 (11, 11 and 13 words) each get 3.93 s of settled text: P(n) settles at
  // R + 1.52 and leaves at R(n+1) + 0.3; P4 reads until scene 04's wipe reaches the left
  // column at ≈ 19.65 s.
  const R2 = 3.9, R3 = 9.05, R4 = 14.2;
  const LAYERS = [
    // Each photo pushes from its first light until the next layer has covered it.
    { src: "img/mood-wild-garden.jpg", position: "50% 50%", reveal: null, push: [0, R2 + REVEAL_DUR] },
    { src: "img/mood-sea-air.jpg", position: "62% 50%", reveal: R2, push: [R2, R3 + REVEAL_DUR - R2] },
    // A dry-stone wall raked by low sun: the principle itself, one warm source and long hard shadows.
    { src: "img/finder-who-him.jpg", position: "50% 50%", reveal: R3, push: [R3, R4 + REVEAL_DUR - R3], band: true },
    { field: WAYNE, reveal: R4, band: true },
  ];
  // One band of warm light over P3, like the sun moving across the wall, and one slower,
  // softer pass across the Wayne field, gone (opacity 0) at 19.1 s, before scene 04's wipe
  // starts at 19.4 s, so the chip and watermark are pixel-identical to scene 04 under it.
  // The field's band is dithered (see ditheredBand): on a flat dark field an 8-bit ramp
  // shows its steps.
  const BANDS = [
    null,
    null,
    { at: R3 + 1.8, dur: 2.4, intensity: 0.35 },
    { at: R4 + 1.5, dur: 3.4, intensity: 0.22 },
  ];

  /* ---- the left column ---- */
  const X = 120;
  const EYEBROW = { text: "Four principles", y: 150, at: 0.6 };
  const HAIR = { x: X, y: 196, w: 700 - X, at: 0.7 };
  // Optical margin: the boxes sit at x 120, but the serif's rounds (Q, G, O) carry
  // ~4 px of side bearing at 84 px, M ~2, the sans ~1–2 px at 30 px. Each line moves
  // left by its first glyph's bearing (measured on the rendered frame) so the stems
  // of the eyebrow, numerals, names and descriptions share one ink edge at x 121 and
  // the rounds overshoot it by 1 px, as a typesetter would. The p of "per bottle" has an
  // entry serif left of its stem, so that line moves right 1 px: nothing inks left of 120.
  // The changeover, relative to the next layer's reveal start R: the old words leave
  // (320 ms, exit) from R + 0.3 while the light edge is still low on the panel, and are
  // gone at R + 0.62, just as the new numeral starts to rise at R + 0.6 — so the slot is
  // never empty for more than a frame or two and two sets of words never share it.
  const EXIT_AT = 0.3, NUM_AT = 0.6, NAME_AT = 0.65, DESC_AT = 0.8;
  const PRINCIPLES = [
    {
      num: "01", at: 0.8, exit: R2 + EXIT_AT,
      name: [{ text: "Quiet luxury", y: 444, dx: -4 }],
      // The board's first sentence alone: the principle, said as quietly as it asks.
      desc: [{ text: "Nothing shouts.", y: 566, dx: -1 }],
      tName: 0.85, tDesc: 1.0,
    },
    {
      num: "02", at: R2 + NUM_AT, exit: R3 + EXIT_AT,
      name: [{ text: "Matière", y: 444, dx: -1 }],
      // Broken at the sentence, not inside the list (see deviations): the five materials
      // stay together, the rule stands alone, and the rag runs long→short like P3 and P4.
      desc: [{ text: "Stone, sand, linen, wet glass, film grain.", y: 566, dx: -1 }, { text: "Texture replaces decoration.", y: 611, dx: -1 }],
      tName: R2 + NAME_AT, tDesc: R2 + DESC_AT,
    },
    {
      num: "03", at: R3 + NUM_AT, exit: R4 + EXIT_AT,
      name: [{ text: "Golden hour", y: 444, dx: -4 }],
      desc: [{ text: "One light source, low and warm,", y: 566, dx: -1 }, { text: "long hard shadows.", y: 611, dx: -1 }],
      tName: R3 + NAME_AT, tDesc: R3 + DESC_AT,
    },
    {
      num: "04", at: R4 + NUM_AT, exit: null, // holds to the end; scene 04's wipe carries it off
      // Line 2 at 540, not 532 (leading ≈ 1.14 for this two-line name only): at 1.05 the tail
      // of the y in "story" ended 4 px above the l of "bottle", directly over it.
      name: [{ text: "One story", y: 444, dx: -4 }, { text: "per bottle", y: 540, dx: 1 }],
      desc: [{ text: "Each scent owns a colour world", y: 664, dx: -1 }, { text: "and a tale.", y: 709, dx: -1 }],
      tName: R4 + NAME_AT, tDesc: R4 + DESC_AT,
    },
  ];
  const LEGEND_AT = R4 + 0.95; // once the light edge has fully uncovered its corner (≈ R4 + 0.87)
  const NUM_Y = 392;
  const WORD_GAP = 0.08; // name words, across lines in reading order
  const LINE_GAP = 0.12; // description line 2 after line 1

  let els = null;

  /*
   * Two measured Chrome behaviours shape how type moves here.
   *
   * 1. Frames must not depend on what was painted before them. `.word` (reel.css)
   *    and R.image's <img> carry will-change: transform, and Chrome keeps a
   *    will-change layer's raster from whatever sub-pixel offset it was first
   *    painted at: "Golden hour" at rest differed by up to 83 levels depending on
   *    whether a mid-rise frame came before it (--check caught it). unpin() drops
   *    the hint.
   * 2. Without the hint, R.rise's axis-aligned translate3d gets its offset baked
   *    into the raster, and Skia rounds glyph y to whole pixels: the tail of every
   *    rise stepped 0.8 px, 0, 0, 0.8 px, a visible tick as the words settle.
   *
   * riseFree() is the spec's rise (opacity 0→1, travel `dist` → 0, same curves)
   * with a 0.001° turn held through the rise *and* at rest. A non-axis-aligned
   * transform is rastered once in the layer's own space and placed by the
   * compositor at the true sub-pixel offset, so the settle follows the ease
   * exactly (… 0.49, 0.35, 0.24, 0.16, 0.11 px/frame) and every frame is the same
   * whatever order it is painted in (208 mid-motion frames, shuffled, identical).
   * Because the turn never switches off, nothing changes at the settle; at rest
   * the type is indistinguishable from R.rise's (0.001° moves a 530 px line by under 0.01 px).
   */
  function riseFree(el, p, dist) {
    el.style.opacity = String(p);
    el.style.transform = `translate3d(0, ${((1 - p) * dist).toFixed(3)}px, 0) rotate(0.001deg)`;
  }
  function unpin(el) {
    el.style.willChange = "auto";
    return el;
  }
  /*
   * The slow push, as R.push but with a 2D scale. A translate3d() promotes the
   * photo to its own compositor layer, whose raster scale Chrome only re-picks
   * when it judges the change worth it — so a frame's pixels depended on the
   * frames before it (seen when frames are painted out of order). A 2D scale is
   * painted into the panel at the exact scale on every frame: order-independent,
   * and a full-quality resample each time. Scale only, around the panel centre,
   * never below 1: no edge of the photo can ever show.
   */
  function push(img, p) {
    img.style.transform = `scale(${R.lerp(1, PUSH_TO, p).toFixed(5)})`;
  }
  /*
   * The warm light band: R.lightBand's colour, blend, 105° lean and travel, without
   * its seams. R.lightBand paints its gradient in a 40 %-wide background tile; at
   * 105° on a 1080-tall panel the tile's left and right edges cut the gradient near
   * full strength (the bottom-left corner sits at 39 % of the ramp), so the band
   * reads as a lit rectangle with a hard vertical edge — an effect, not light. Here
   * the gradient runs across a tile three panels wide, whose edges lie wholly in
   * the transparent stops, so only a soft shaft shows. Its falloff matches
   * R.lightBand's ramp (≈ 370 px from peak to nothing, measured horizontally) and
   * its centre travels the same path, −0.16 → 1.16 panel widths, under R.sweep's
   * sin(πp) envelope.
   */
  const BAND_TILE = 3; // panel widths
  function warmBand(parent) {
    const w = PANEL.w * BAND_TILE, h = PANEL.h;
    const a = (105 * Math.PI) / 180;
    const ramp = w * Math.sin(a) + h * Math.abs(Math.cos(a)); // gradient-line length
    const half = ((370 * Math.sin(a)) / ramp) * 100; // 370 px horizontally, in % of the ramp
    const warm = "rgba(255,214,160,0.9)";
    return R.el("div", { style: {
      position: "absolute", left: "0", top: "0", width: `${w}px`, height: `${h}px`, pointerEvents: "none",
      mixBlendMode: "soft-light", opacity: "0",
      background: `linear-gradient(105deg, transparent ${(50 - half).toFixed(3)}%, ${warm} 50%, transparent ${(50 + half).toFixed(3)}%)`,
    } }, parent);
  }
  /*
   * The same band over the flat Wayne field, dithered. On a photograph the picture's
   * own grain hides the 8-bit steps of a soft ramp; on flat #2B2A28 nothing does. The
   * light lifts the field by only ≈ 9 levels of red, 6 of green and 2 of blue over
   * 370 px, so the CSS gradient painted 20–40 px steps, each channel stepping at a
   * different x: diagonal stripes of olive and orange crawling across the field.
   * Noise in the gradient's own 8-bit values cannot fix that: at 0.22 opacity one level
   * of the band's alpha moves the result by 0.05 of a level. So the dither is designed
   * in the result. For each pixel the band's alpha and colour are solved (soft-light,
   * over the field) so that the field rises by the plain band's smooth ramp plus seeded
   * triangular noise, independently per channel, added before the compositor's one
   * rounding: that is what dither is. Where the noise asks for less than the field, the
   * colour drops below 0.5 and soft-light shades. Without the noise the solve returns
   * the plain band exactly (alpha 0.9 × ramp, colour 255/214/160), and over the chip,
   * legend and mark the colours stay within a level or two of the plain band's.
   * The noise has to survive the encoder too (tools/render.mjs: x264, CRF 16, tune film,
   * aq-mode 3). Measured on 1 s of this band through those settings: ±1 level of
   * single-pixel noise is flattened and the steps come back as 8 px blocks; ±1 level at
   * DITHER_REF = 0.075 (±2.9, σ ≈ 1 level at the band's 0.22 peak) in 2 × 2 px clumps
   * comes through, and the decoded ramp stays smooth. That is far below the film's
   * own grain and cannot be seen at 1:1. Drawn once, into a canvas just wider than the
   * shaft (its edges transparent), and moved in whole pixels, so the noise is never
   * resampled and the encoder can follow it.
   */
  const DITHER_REF = 0.075; // the band's opacity at which the noise spans ±1 level; it scales with the opacity
  const DITHER_CLUMP = 2; // px
  const DITHER_W = 1100; // the shaft reaches ±515 px from its centre line at the panel's top and bottom
  function mulberry32(a) { // runtime.js's generator: the same noise on every build
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function ditheredBand(parent, field) {
    const W = DITHER_W, H = PANEL.h;
    const canvas = R.el("canvas", { attrs: { width: String(W), height: String(H) }, style: {
      position: "absolute", left: "0", top: "0", width: `${W}px`, height: `${H}px`, pointerEvents: "none",
      mixBlendMode: "soft-light", opacity: "0",
    } }, parent);
    canvas.bandWidth = W;
    canvas.wholePixels = true;
    const g = canvas.getContext("2d");
    const image = g.createImageData(W, H);
    const px = image.data;
    const ang = (105 * Math.PI) / 180, ux = Math.sin(ang), uy = -Math.cos(ang); // the gradient line
    const reach = 370 * Math.sin(ang); // peak to nothing, measured along that line (370 px horizontally)
    const warm = [255, 214, 160], PEAK = 0.9;
    const cb = [1, 3, 5].map((k) => parseInt(field.slice(k, k + 2), 16) / 255);
    const D = (b) => (b <= 0.25 ? ((16 * b - 12) * b + 4) * b : Math.sqrt(b)); // soft-light, W3C
    const up = cb.map((b) => D(b) - b); // soft-light's most light over the field (source 1), per channel
    const down = cb.map((b) => b * (1 - b)); // and its most shade (source 0)
    const plain = warm.map((w, c) => (2 * (w / 255) - 1) * up[c]); // the plain band's lift per unit alpha
    // Triangular noise (−1…1), one value per 2 × 2 clump and channel.
    const rnd = mulberry32(0x2b2a28);
    const nw = Math.ceil(W / DITHER_CLUMP), nh = Math.ceil(H / DITHER_CLUMP);
    const noise = [0, 1, 2].map(() => Float32Array.from({ length: nw * nh }, () => rnd() - rnd()));
    const amp = 1 / 255 / DITHER_REF;
    const T = [0, 0, 0];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4, k = Math.floor(y / DITHER_CLUMP) * nw + Math.floor(x / DITHER_CLUMP);
        const d = Math.abs((x + 0.5 - W / 2) * ux + (y + 0.5 - H / 2) * uy);
        const win = R.clamp((reach + 40 - d) / 40); // full noise wherever there is light, gone 40 px past it
        if (win <= 0) { px[i + 3] = 0; continue; }
        const a0 = PEAK * Math.max(0, 1 - d / reach);
        let need = a0;
        for (let c = 0; c < 3; c++) {
          T[c] = a0 * plain[c] + win * noise[c][k] * amp;
          need = Math.max(need, T[c] >= 0 ? T[c] / up[c] : -T[c] / down[c]);
        }
        const a8 = Math.min(255, Math.ceil(need * 255 - 1e-9));
        if (a8 <= 0) { px[i + 3] = 0; continue; }
        const alpha = a8 / 255;
        for (let c = 0; c < 3; c++) {
          const v = T[c] / alpha; // the lift this pixel's colour must give
          const s = 0.5 + v / (2 * (v >= 0 ? up[c] : down[c]));
          px[i + c] = Math.round(R.clamp(s) * 255);
        }
        px[i + 3] = a8;
      }
    }
    g.putImageData(image, 0, 0);
    return canvas;
  }
  function sweepBand(band, p, intensity) {
    band.style.opacity = p <= 0 || p >= 1 ? "0" : String(intensity * Math.sin(Math.PI * p));
    const cx = R.lerp(-0.16, 1.16, R.clamp(p)) * PANEL.w; // centre of the shaft at mid-height
    const x = cx - (band.bandWidth ?? PANEL.w * BAND_TILE) / 2;
    band.style.transform = `translateX(${band.wholePixels ? Math.round(x) : x.toFixed(2)}px)`;
  }

  function build(root) {
    R.box(root, { x: 0, y: 0, w: R.W, h: R.H }, { background: C.linen });

    /* Right: the panel and its four layers, bottom to top. */
    const panel = R.box(root, PANEL, { overflow: "hidden", background: C.linen });
    const layers = LAYERS.map((L) => {
      if (L.field) {
        const layer = R.box(panel, FULL, { background: L.field });
        R.box(layer, CHIP, { background: C.gold });
        const mark = R.mark(layer, MARK);
        mark.svg.style.opacity = String(MARK_OPACITY);
        const legend = R.text(layer, LEGEND.text, { role: "eyebrow", right: LEGEND.right, y: LEGEND.y, size: 18, color: C.dune, align: "right", style: nowrap });
        // Over the chip, mark and legend: the light falls on the whole surface.
        const band = L.band ? ditheredBand(layer, L.field) : null;
        return { def: L, layer, mark, legend, band };
      }
      const { wrap, img } = R.image(panel, L.src, FULL, { position: L.position });
      unpin(img);
      const band = L.band ? warmBand(wrap) : null;
      return { def: L, layer: wrap, img, band };
    });

    /* Left: eyebrow and hairline, fixed for the whole scene. */
    const eyebrow = R.text(root, EYEBROW.text, { role: "eyebrow", x: X, y: EYEBROW.y, size: 18, color: C.ash, style: nowrap });
    const hair = R.hairline(root, { x: HAIR.x, y: HAIR.y, w: HAIR.w, h: 1 }, C.dune, "left");

    /* Left: the principles, one group each so the exit is a single fade. */
    const groups = PRINCIPLES.map((P) => {
      const group = R.box(root, { x: 0, y: 0, w: PANEL.x, h: R.H }, { pointerEvents: "none" });
      const num = R.text(group, P.num, { role: "numeral", x: X, y: NUM_Y, size: 40, weight: 500, lineHeight: 1, color: C.gold, style: nowrap });
      const words = P.name.flatMap((l) => R.splitWords(R.text(group, l.text, {
        role: "display-l", x: X + l.dx, y: l.y, size: 84, weight: 600, lineHeight: 1.05, tracking: "-0.01em", color: C.night, style: nowrap,
      }))).map(unpin);
      const lines = P.desc.map((l) => R.text(group, l.text, {
        role: "body", x: X + l.dx, y: l.y, size: 30, weight: 400, lineHeight: 1.5, color: C.ash, style: nowrap,
      }));
      return { P, group, num, words, lines };
    });

    els = { layers, eyebrow, hair, groups };
  }

  function render(t) {
    const { layers, eyebrow, hair, groups } = els;

    /* The panel. Each layer arrives on a soft light edge; photos push slowly. */
    const reveals = layers.map(({ def }) => (def.reveal == null ? 1 : R.tween(t, def.reveal, REVEAL_DUR, E.inOut)));
    layers.forEach((L, i) => {
      const { def, layer, img, band, mark, legend } = L;
      if (def.reveal != null) R.softReveal(layer, reveals[i], 100, 26);
      // A layer is only painted while it shows: from its first light until the next layer covers it.
      const covered = reveals.slice(i + 1).some((p) => p >= 1);
      layer.style.visibility = reveals[i] > 0 && !covered ? "visible" : "hidden";
      if (img) push(img, R.tween(t, def.push[0], def.push[1], E.inOut));
      // The sun moving across the surface: the shaft travels at an even pace while the
      // sweep's sin(πp) envelope eases its light in and out — on P3 visible ≈ 11.0–13.1 s at
      // ≈ 560 px/s. (Measured: standard, R.tween's default, lights it fully in 0.2 s
      // and whips it across in 0.4 s; inOut squeezes the pass into 1.6 s at 1100 px/s.)
      if (band) { const B = BANDS[i]; sweepBand(band, R.tween(t, B.at, B.dur, E.linear), B.intensity); }
      if (mark) R.drawMark(mark, 1); // fully drawn, still, as in scene 04
      if (legend) riseFree(legend, R.tween(t, LEGEND_AT, R.dur.l, E.standard), 16);
    });

    /* The left column's frame. */
    riseFree(eyebrow, R.tween(t, EYEBROW.at, R.dur.l, E.standard), 16);
    R.drawLine(hair, R.tween(t, HAIR.at, R.dur.l, E.standard));

    /* The principles: rise in, hold, exit (opacity only, 320 ms). */
    for (const { P, group, num, words, lines } of groups) {
      const out = P.exit == null ? 0 : R.tween(t, P.exit, R.dur.m, E.exit);
      group.style.opacity = String(1 - out);
      group.style.visibility = t < P.at || out >= 1 ? "hidden" : "visible";
      riseFree(num, R.tween(t, P.at, R.dur.l, E.standard), 16);
      R.stagger(t, P.tName, words.length, WORD_GAP, R.dur.l, E.emphasized).forEach((p, i) => riseFree(words[i], p, 24));
      R.stagger(t, P.tDesc, lines.length, LINE_GAP, R.dur.l, E.standard).forEach((p, i) => riseFree(lines[i], p, 16));
    }
    return null;
  }

  // Grain 0 throughout: the runtime's grain is full-frame and must never fall on Linen.
  R.scene("four-principles", { build, render, grain: () => 0 });
})();
