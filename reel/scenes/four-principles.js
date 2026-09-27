/*
 * Scene 03 · "Four principles" (four-principles) — 20.6 s, from 14.4 s.
 *
 * An editorial spread on Linen in the site's 5/7 asymmetry. The left column
 * (x 120–700) never moves: an eyebrow, a Dune hairline, and one principle at a
 * time in the same three slots (index numeral, name, two-line description).
 * The right panel (x 800–1920, full height, bleeding off three edges) holds
 * four stacked layers; each arrives over the last on a soft edge of light
 * travelling left→right, and each principle's words rise as that light
 * settles. P1–P3 are photographs from the same hour, each on a slow 4 % push;
 * P3 also carries one band of warm light crossing the table. P4 is the hero
 * bottle's own colour world, Wayne: flat field, Golden hour chip and the e∞
 * watermark, placed exactly where scene 04 has them so they hold still under
 * its light-wipe. The runtime crossfades us in; we hold the final state to the
 * end and scene 04's wipe carries us off.
 *
 * Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const E = R.ease;
  const WAYNE = "#2B2A28"; // the Wayne colour world (named in scene 04, labelled in scene 06)
  const nowrap = { whiteSpace: "nowrap" };

  /* ---- geometry (stage px) ---- */
  const PANEL = { x: 800, y: 0, w: 1120, h: 1080 }; // 7 columns, bleeding right/top/bottom
  const FULL = { x: 0, y: 0, w: PANEL.w, h: PANEL.h }; // a layer, panel-local
  const PUSH_TO = 1.04; // around the panel centre; scale only, so no edge can show
  // P4, panel-local. Stage: chip (1744, 120); watermark (1100, 640), 1000 wide — scene 04's exact spots.
  const CHIP = { x: 1744 - PANEL.x, y: 120, w: 56, h: 56 };
  const MARK = { x: 1100 - PANEL.x, y: 640, width: 1000, color: C.linen, stroke: 2 };
  const MARK_OPACITY = 0.07;

  /* ---- the four layers of the panel ---- */
  const REVEAL_DUR = 1.2;
  const PUSH_DUR = 6.1; // P2 and P3; P1 runs 0 → 6.3
  const LAYERS = [
    { src: "img/mood-wild-garden.jpg", position: "50% 50%", reveal: null, push: [0, 6.3] },
    { src: "img/mood-sea-air.jpg", position: "62% 50%", reveal: 5.1, push: [5.1, PUSH_DUR] },
    { src: "img/house-film-poster.jpg", position: "100% 50%", reveal: 10.0, push: [10.0, PUSH_DUR], band: true },
    { field: WAYNE, reveal: 14.9 },
  ];
  // One band of warm light over P3, like the sun moving across the table.
  const BAND = { at: 11.8, dur: 2.4, intensity: 0.35 };

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
  const PRINCIPLES = [
    {
      num: "01", at: 0.8, exit: 5.1,
      name: [{ text: "Quiet luxury", y: 444, dx: -4 }],
      desc: [{ text: "Nothing shouts. Fewer elements,", y: 566, dx: -1 }, { text: "larger, with room to breathe.", y: 611, dx: -1 }],
      tName: 0.85, tDesc: 1.0,
    },
    {
      num: "02", at: 5.9, exit: 10.0,
      name: [{ text: "Matière", y: 444, dx: -1 }],
      // Broken at the sentence, not inside the list (see deviations): the five materials
      // stay together, the rule stands alone, and the rag runs long→short like P1, P3, P4.
      desc: [{ text: "Stone, sand, linen, wet glass, film grain.", y: 566, dx: -1 }, { text: "Texture replaces decoration.", y: 611, dx: -1 }],
      tName: 5.95, tDesc: 6.1,
    },
    {
      num: "03", at: 10.8, exit: 14.9,
      name: [{ text: "Golden hour", y: 444, dx: -4 }],
      desc: [{ text: "One light source, low and warm,", y: 566, dx: -1 }, { text: "long hard shadows.", y: 611, dx: -1 }],
      tName: 10.85, tDesc: 11.0,
    },
    {
      num: "04", at: 15.5, exit: null, // holds to the end; scene 04's wipe carries it off
      name: [{ text: "One story", y: 444, dx: -4 }, { text: "per bottle", y: 532, dx: 1 }],
      desc: [{ text: "Each scent owns a colour world", y: 656, dx: -1 }, { text: "and a tale.", y: 701, dx: -1 }],
      tName: 15.55, tDesc: 15.8,
    },
  ];
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
  function sweepBand(band, p, intensity) {
    band.style.opacity = p <= 0 || p >= 1 ? "0" : String(intensity * Math.sin(Math.PI * p));
    const cx = R.lerp(-0.16, 1.16, R.clamp(p)) * PANEL.w; // centre of the shaft at mid-height
    band.style.transform = `translateX(${(cx - (PANEL.w * BAND_TILE) / 2).toFixed(2)}px)`;
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
        return { def: L, layer, mark };
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
      const { def, layer, img, band, mark } = L;
      if (def.reveal != null) R.softReveal(layer, reveals[i], 100, 26);
      // A layer is only painted while it shows: from its first light until the next layer covers it.
      const covered = reveals.slice(i + 1).some((p) => p >= 1);
      layer.style.visibility = reveals[i] > 0 && !covered ? "visible" : "hidden";
      if (img) push(img, R.tween(t, def.push[0], def.push[1], E.inOut));
      // The sun moving across the table: the shaft travels at an even pace while the
      // sweep's sin(πp) envelope eases its light in and out — visible ≈ 12.0–14.0 s at
      // ≈ 560 px/s. (Measured: standard, R.tween's default, lights it fully in 0.2 s
      // and whips it across in 0.4 s; inOut squeezes the pass into 1.6 s at 1100 px/s.)
      if (band) sweepBand(band, R.tween(t, BAND.at, BAND.dur, E.linear), BAND.intensity);
      if (mark) R.drawMark(mark, 1); // fully drawn, still, as in scene 04
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
