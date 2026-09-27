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
 * P3 (a dry-stone wall in low sun) also carries one band of warm light. P4 says
 * its own sentence in two steps: the light edge lays down the hero bottle's
 * colour world (the Wayne field, with its Golden hour chip and legend), and once
 * the words have settled its tale comes up out of that colour, as every image
 * on the site does (G7): the Wayne room, matted in the field like a plate. The
 * field, chip, legend and plate are exactly where scene 04 has them, and the
 * plate's push runs on one clock across both scenes, so under scene 04's
 * light-wipe the whole right side holds pixel-still and only the left column
 * changes. The runtime crossfades us in; we hold the final state to the end
 * and scene 04's wipe carries us off.
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
  // P4, panel-local; every stage value below is scene 04's too (change both files or neither).
  // The key sits on the spread's one head row: the legend is set exactly like the left column's
  // eyebrow ("Four principles": 18 px caps, box y 150, caps filling pixel rows 153–165), Dune on
  // the dark field, its ink ending 24 px left of the chip (x 1720), and the 56 px chip stands on
  // that same line (stage 1744, rows 110–165), its right edge the plate's. So one baseline runs
  // across the spread at y 166, and 30 px under it both halves start: the hairline on the left,
  // the plate on the right (y 196). The legend box's right edge sits 4 px right of its ink: CSS
  // tracking trails the last letter by 0.14em (2.5 px) and the D carries ≈ 1.5 px of side bearing.
  const CHIP = { x: 1744 - PANEL.x, y: 110, w: 56, h: 56 };
  const LEGEND = { text: "eterno · Wayne — colour world", right: PANEL.x + PANEL.w - 1720 - 4, y: 150 };
  // The tale's plate, matted in its world: stage x 920–1800, y 196–960. 120 px of field left and
  // right of it and below it (the margin), and a deeper mat on top that holds the key; its top
  // edge is the left column's hairline (y 196), its right edge the chip's. The 2560×1429 source
  // covers 880×764 at 0.535: source x 457–2103 at full height, clear of the black pillar bars
  // (x < 306, > 2256) and the rounded corners, with the chair, the table and the lamp in it.
  // No watermark in P4: the plate fills the field, and the e∞ never goes on a photograph and is
  // never cropped. Scene 04 sets it on the field it opens up on the left.
  const PLATE = { x: 920 - PANEL.x, y: 196, w: 880, h: 764, src: "img/tale-wayne.jpg", position: "50% 50%" };

  /* ---- the four layers of the panel ---- */
  const REVEAL_DUR = 1.2;
  // Reveal starts. The words need the time, not the photographs. P1 keeps only its first
  // sentence, "Nothing shouts." (the storyboard allows whole sentences to go), so its four
  // words settle at 1.6 and read for 2.45 s; the time that frees goes to the long ones.
  // P2 and P3 (11 words each) get 3.93 s of settled text: P(n) settles at R + 1.52 and leaves
  // at R(n+1) + 0.3. P4 (13 words) settles at 15.57 and reads until scene 04's wipe first
  // touches its ink (≈ 19.67 s, 34.07 on the timeline): ≈ 4.1 s.
  const R2 = 3.75, R3 = 8.9, R4 = 14.05;
  const LAYERS = [
    // Each photo pushes from its first light until the next layer has covered it.
    { src: "img/mood-wild-garden.jpg", position: "50% 50%", reveal: null, push: [0, R2 + REVEAL_DUR] },
    { src: "img/mood-sea-air.jpg", position: "62% 50%", reveal: R2, push: [R2, R3 + REVEAL_DUR - R2] },
    // A dry-stone wall raked by low sun: the principle itself, one warm source and long hard shadows.
    { src: "img/finder-who-him.jpg", position: "50% 50%", reveal: R3, push: [R3, R4 + REVEAL_DUR - R3], band: true },
    // The colour world first; its tale comes up into it (PLATE_IN).
    { field: WAYNE, reveal: R4 },
  ];
  // One band of warm light over P3, like the sun moving across the wall. The Wayne field has
  // none now: its life is the tale, and a ramp that faint on a flat dark field shows 8-bit steps.
  const BANDS = [null, null, { at: R3 + 1.8, dur: 2.4, intensity: 0.35 }, null];
  // The plate comes up out of the field once P4's words are at rest: one thing at a time, and in
  // the order the sentence says it, "a colour world and a tale". The site's image arrival (G7,
  // from the scent's colour) at the film's pace: 1.6 s, inOut (29.75 → 31.35 s global). At R4 + 1.3
  // the last line ("and a tale.") is 97 % risen (0.5 px to go) and the plate at 0; it reaches 5 %
  // only at R4 + 1.57, once the words are at rest (R4 + 1.52).
  const PLATE_IN = { at: R4 + 1.3, dur: 1.6 };
  // One slow push toward the lamp for the whole life of the room, in THIS scene's clock: from
  // its first light (29.75 s on the timeline) until scene 04 has faded it back into the field and
  // the boat has covered the frame (its t = 7.0, our 26.4; scene 04 starts at our 19.4). Scene 04
  // runs the same numbers, so the plate is the same picture on both sides of the wipe. 5 % over
  // 11.05 s, inOut: ≈ 1.35 % by the wipe.
  const PLATE_PUSH = { at: R4 + 1.3, dur: 11.05, to: 1.05, origin: "74% 20%" }; // the lamp: plate x 652, y 155

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
  /*
   * The plate's push: a 2D scale about the lamp, written exactly as scene 04 writes it (same
   * string, same origin, same box), so the room is the same pixels on both sides of the wipe.
   * 2D for the reason given at push(); scale only and never below 1, so no edge can show.
   */
  function pushPlate(img, t) {
    const p = R.tween(t, PLATE_PUSH.at, PLATE_PUSH.dur, E.inOut);
    img.style.transform = `scale(${R.lerp(1, PLATE_PUSH.to, p).toFixed(5)})`;
  }

  function build(root) {
    R.box(root, { x: 0, y: 0, w: R.W, h: R.H }, { background: C.linen });

    /* Right: the panel and its four layers, bottom to top. */
    const panel = R.box(root, PANEL, { overflow: "hidden", background: C.linen });
    const layers = LAYERS.map((L) => {
      if (L.field) {
        // The colour world and its key arrive together on the light edge (the legend is part
        // of the surface: no rise of its own while P4's words rise); the plate comes up later.
        const layer = R.box(panel, FULL, { background: L.field });
        R.box(layer, CHIP, { background: C.gold });
        const legend = R.text(layer, LEGEND.text, { role: "eyebrow", right: LEGEND.right, y: LEGEND.y, size: 18, color: C.dune, align: "right", style: nowrap });
        const plate = R.image(layer, PLATE.src, PLATE, { position: PLATE.position, origin: PLATE_PUSH.origin, background: L.field });
        unpin(plate.img);
        return { def: L, layer, legend, plate };
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
      const { def, layer, img, band, legend, plate } = L;
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
      // The legend at rest, with riseFree's held turn. Without it Chrome paints this line with
      // grayscale anti-aliasing while an ancestor is masked or fading, and with LCD sub-pixel
      // anti-aliasing otherwise: it snapped heavier, with colour fringes, in the one frame the
      // light edge's mask came off (R4 + 1.2) and back in the first frame of scene 04's exit.
      // Turned, it is always its own layer and always grayscale, as scene 04 holds it.
      if (legend) riseFree(legend, 1, 16);
      if (plate) {
        R.fade(plate.wrap, R.tween(t, PLATE_IN.at, PLATE_IN.dur, E.inOut));
        pushPlate(plate.img, t);
      }
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
