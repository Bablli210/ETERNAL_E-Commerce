/*
 * Scene 04 · "One story per bottle" (one-story-per-bottle) — 13.3 s, from 33.8 s.
 *
 * The emotional core. BEAT A (0–7.0 s): the frame becomes the hero bottle's own
 * colour world, Wayne #2B2A28, as the runtime's light-wipe carries scene 03's
 * P4 spread off. Its chip, legend and e∞ watermark are already where P4 left
 * them, so only the left of the frame changes: the wipe carries the flat world
 * alone, and Wayne's tale photograph (a stone room at night, one lit lamp over a
 * laid table, columns 1–7) comes up from that colour once the light has passed,
 * pushing slowly toward the lamp. The chip and its legend then hand over to the
 * tale: they leave as its eyebrow and signature line settle on the right.
 * BEAT B (from 5.8 s): the Wayne words exit, then a second tale, Shadow of the
 * Sea, crossfades in full-bleed (a fishing boat in amber fog) and pushes toward
 * the boat; its line arrives word by word over the dark water, lower left.
 * Everything then holds until scene 05's dip through Linen takes the frame.
 *
 * Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const WAYNE = "#2B2A28"; // the Wayne colour world (proposed); scene 03's legend names it, scene 06 labels it
  const FRAME = { x: 0, y: 0, w: R.W, h: R.H };
  const nowrap = { whiteSpace: "nowrap" };

  /* ---- geometry (stage px) ---- */
  // Columns 1–7 of the grid (x 120–1090). The 2560×1429 source covers 970×840
  // at 0.588: source x 455–2105 at full height, clear of the black pillar bars
  // and the rounded corners on its left and right edges.
  const PHOTO_A = { x: 120, y: 120, w: 970, h: 840 };
  // Scene 03's P4 surface, copied exactly from four-principles.js (CHIP, MARK,
  // LEGEND there, panel-local; stage values here), so the chip, its legend and
  // the watermark are pixel-identical on both sides of the light-wipe and only
  // the left of the frame changes. Change them in both files or in neither.
  const CHIP = { x: 1744, y: 120, w: 56, h: 56 };
  const MARK = { x: 1100, y: 640, width: 780, stroke: 2, opacity: 0.07 }; // whole e∞ in frame: ink ≈ x 1124–1856
  const LEGEND = { text: "eterno · Wayne — colour world", right: 196, y: 139 }; // ink ends at x 1720, caps centred on the chip

  /* ---- timing (scene-local seconds) ---- */
  // The photo is held back until the wipe's soft edge has fully cleared its box
  // (x 1090 at the bottom corner, 0.72 s), so the light carries only the flat
  // Wayne world: scene 03's hard column edge at x 800 is never seen through the
  // lamp and the table. It then comes up from the field's own colour (the site's
  // image fade: 600 ms, standard). The push runs from 0, under the wipe, as before.
  const A_PHOTO_IN = { at: 0.75, dur: R.dur.l };
  const A_PUSH = { at: 0, dur: 7.3, to: 1.04, origin: "70% 20%" }; // toward the lamp
  // The chip and its legend are P4's key to the colour world. Once the light has
  // passed (the chip's corner is uncovered at 0.92 s, the frame at 1.2 s) they hand
  // over to the tale: the spec's exit (320 ms, opacity only) as its eyebrow rises.
  const A_KEY_OUT = 1.2;
  const A_EYEBROW = 1.2;
  const A_LINES = [1.4, 1.52]; // 120 ms line stagger, as in the site's tale band
  // The Wayne words hold 3.5 s settled, then leave with the spec's exit (320 ms,
  // opacity only, R.ease.exit): gone at 5.92 s. The room starts to dissolve into
  // the fog 200 ms after the words start to go (they are half gone by then), so the
  // two motions never start together and the line never ghosts over the boat's
  // wheelhouse as it comes through.
  const A_TEXT_OUT = 5.6;
  const B_IN = { at: 5.8, dur: R.dur.xl };
  const B_PUSH = { at: B_IN.at, dur: 13.3 - B_IN.at, to: 1.05, origin: "60% 39%" }; // toward the boat
  // The boat line enters as the crossfade settles and is complete at 8.3 s
  // (42.1 s global): about 3.8 s fully read before scene 05's dip takes it.
  const B_EYEBROW = 6.7;
  const B_WORDS = 6.9, WORD_GAP = 0.08;

  /* ---- type ---- */
  // One size for the tale's line wherever it appears: 60 px italic, line-height 1.2.
  const SIG = 60;
  // Optical margins, measured in Chromium with the site's own fonts: the ink of
  // every line sits on one edge with its eyebrow's A (ink at x + 0.5). See the
  // notes on each line for the side bearings that move a box off that edge.
  // Beat A: at 60 px the italic D and B land on the eyebrow's edge (1162.6) and
  // the longer line's ink ends at x 1775, inside the column (1162–1800). 34 px
  // from the eyebrow's caps to the first line's caps; the block's ink (y 458–622)
  // centres on the photo's mid-line, y 540.
  const A_TEXT = {
    eyebrow: { text: "A tale from eterno · Wayne", x: 1162, y: 456 },
    lines: [
      { text: "Don’t be the man she notices.", x: 1162, y: 496 },
      { text: "Be the man she asks about.", x: 1162, y: 568 },
    ],
  };
  // Broken after "the ones", so the relative clause "the sea decided to give back"
  // stays whole. The eyebrow names the scent, as beat A's does (the tale page's own
  // eyebrow: "A tale from eterno · Shadow of the Sea · 3 min read"). The block sits
  // over the dark water with the eyebrow-to-line spacing of beat A; it is set 24 px
  // higher than a block ending at y 966 would be, so the full stop of the longer
  // second line (ink to x 707) keeps clear of the shoreline rising toward the
  // rocks, which crosses y ≈ 935 under it while the line lands (8.3 s).
  const B_TEXT = {
    eyebrow: { text: "A tale from eterno · Shadow of the Sea", x: 120, y: 748 },
    lines: [
      { text: "You can smell the ones", x: 116, y: 788 }, // italic Y: 4.5 px bearing
      { text: "the sea decided to give back.", x: 117, y: 860 }, // italic t: 3.1 px bearing
    ],
  };
  const eyebrow = (parent, e) =>
    R.text(parent, e.text, { role: "eyebrow", x: e.x, y: e.y, size: 18, color: C.dune, style: nowrap });
  const signature = (parent, l) =>
    R.text(parent, l.text, { role: "signature", x: l.x, y: l.y, size: SIG, lineHeight: 1.2, color: C.linen, style: nowrap });

  let els = null;

  function build(root) {
    // The Wayne world fills the frame.
    root.style.background = WAYNE;

    /* BEAT A */
    const groupA = R.box(root, FRAME);
    const photoA = R.image(groupA, "img/tale-wayne.jpg", PHOTO_A, { fit: "cover", position: "50% 50%", origin: A_PUSH.origin, background: WAYNE });
    // P4's key: the chip and its legend, in one group so they leave as one.
    const keyA = R.box(groupA, FRAME, { pointerEvents: "none" });
    R.box(keyA, CHIP, { background: C.gold });
    const legendA = R.text(keyA, LEGEND.text, { role: "eyebrow", right: LEGEND.right, y: LEGEND.y, size: 18, color: C.dune, align: "right", style: nowrap });
    const mark = R.mark(groupA, { x: MARK.x, y: MARK.y, width: MARK.width, color: C.linen, stroke: MARK.stroke });
    mark.svg.style.opacity = String(MARK.opacity);
    R.drawMark(mark, 1); // fully drawn, and it never moves
    const textA = R.box(groupA, FRAME, { pointerEvents: "none" });
    const eyebrowA = eyebrow(textA, A_TEXT.eyebrow);
    const linesA = A_TEXT.lines.map((l) => signature(textA, l));

    /* BEAT B: a full-frame layer stacked above beat A */
    const layerB = R.box(root, FRAME);
    const photoB = R.image(layerB, "img/tale-shadow-of-the-sea.jpg", FRAME, { fit: "cover", position: "50% 50%", origin: B_PUSH.origin });
    R.box(layerB, FRAME, { background: "linear-gradient(0deg, rgba(23,22,20,.60) 0%, rgba(23,22,20,0) 50%)", pointerEvents: "none" });
    const eyebrowB = eyebrow(layerB, B_TEXT.eyebrow);
    // The word stagger runs across both lines in reading order (11 words).
    const wordsB = B_TEXT.lines.flatMap((l) => R.splitWords(signature(layerB, l)));

    els = { groupA, photoA, keyA, legendA, textA, eyebrowA, linesA, layerB, photoB, eyebrowB, wordsB };
  }

  function render(t) {
    const { groupA, photoA, keyA, legendA, textA, eyebrowA, linesA, layerB, photoB, eyebrowB, wordsB } = els;

    /* BEAT A — the wipe carries the flat world; the photo comes up once the light
       has passed (its push already running); the words settle as it completes. */
    R.fade(photoA.wrap, R.tween(t, A_PHOTO_IN.at, A_PHOTO_IN.dur, R.ease.standard));
    R.push(photoA.img, R.tween(t, A_PUSH.at, A_PUSH.dur, R.ease.inOut), { scale: 1 }, { scale: A_PUSH.to });
    R.rise(legendA, 1, 16); // at rest, exactly as P4 leaves it (same 0.001° turn)
    R.fade(keyA, 1 - R.tween(t, A_KEY_OUT, R.dur.m, R.ease.exit));
    R.rise(eyebrowA, R.tween(t, A_EYEBROW, R.dur.l, R.ease.standard), 16);
    linesA.forEach((el, i) => R.rise(el, R.tween(t, A_LINES[i], R.dur.l, R.ease.standard), 16));
    R.fade(textA, 1 - R.tween(t, A_TEXT_OUT, R.dur.m, R.ease.exit));

    /* BEAT B — crossfades over A, then its line arrives word by word. */
    const b = R.tween(t, B_IN.at, B_IN.dur, R.ease.standard);
    layerB.style.opacity = String(b);
    layerB.style.visibility = b > 0 ? "visible" : "hidden";
    groupA.style.visibility = b < 1 ? "visible" : "hidden"; // fully covered from 7.0 s
    R.push(photoB.img, R.tween(t, B_PUSH.at, B_PUSH.dur, R.ease.inOut), { scale: 1 }, { scale: B_PUSH.to });
    R.rise(eyebrowB, R.tween(t, B_EYEBROW, R.dur.l, R.ease.standard), 16);
    R.stagger(t, B_WORDS, wordsB.length, WORD_GAP, R.dur.l, R.ease.emphasized).forEach((p, i) => R.rise(wordsB[i], p, 24));

    return null;
  }

  // No grain while scene 03's Linen is still on screen, full grain on the dark
  // Wayne world, none on the bright amber fog or the Linen dip.
  const B_END = B_IN.at + B_IN.dur;
  const grain = (t) =>
    t < 0.6 ? 0
      : t < 1.2 ? 0.035 * (t - 0.6) / 0.6
      : t < B_IN.at ? 0.035
      : t < B_END ? 0.035 * (1 - (t - B_IN.at) / B_IN.dur)
      : 0;

  R.scene("one-story-per-bottle", { build, render, grain });
})();
