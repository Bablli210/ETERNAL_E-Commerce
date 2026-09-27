/*
 * Scene 04 · "One story per bottle" (one-story-per-bottle) — 13.3 s, from 33.8 s.
 *
 * The emotional core. BEAT A (0–7.3 s): the frame becomes the hero bottle's own
 * colour world, Wayne #2B2A28, as the runtime's light-wipe carries scene 03's
 * P4 spread off. Its chip and e∞ watermark are already where P4 left them, so
 * only the left of the frame changes. Wayne's tale photograph (a stone room at
 * night, one lit lamp over a laid table) sits on columns 1–7 and pushes slowly
 * toward the lamp; the eyebrow and the tale's signature line settle on the
 * right. BEAT B (from 6.1 s): the Wayne words exit as a second tale, Shadow of
 * the Sea, crossfades in full-bleed (a fishing boat in amber fog) and pushes
 * toward the boat; its line arrives word by word over the dark water, lower
 * left. Everything then holds until scene 05's dip through Linen takes the frame.
 *
 * Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const WAYNE = "#2B2A28"; // the Wayne colour world (proposed), deliberately unlabelled here
  const FRAME = { x: 0, y: 0, w: R.W, h: R.H };
  const nowrap = { whiteSpace: "nowrap" };

  /* ---- geometry (stage px) ---- */
  // Columns 1–7 of the grid (x 120–1090). The 2560×1429 source covers 970×840
  // at 0.588: source x 455–2105 at full height, clear of the black pillar bars
  // and the rounded corners on its left and right edges.
  const PHOTO_A = { x: 120, y: 120, w: 970, h: 840 };
  const CHIP = { x: 1744, y: 120, w: 56, h: 56 };
  // Identical to scene 03's P4 panel, so both hold still through the wipe.
  const MARK = { x: 1100, y: 640, width: 1000, stroke: 2, opacity: 0.07 };

  /* ---- timing (scene-local seconds) ---- */
  const A_PUSH = { at: 0, dur: 7.3, to: 1.04, origin: "70% 20%" }; // toward the lamp
  const A_EYEBROW = 1.2;
  const A_LINES = [1.4, 1.52]; // 120 ms line stagger, as in the site's tale band
  // The spec's exit (320 ms, opacity only, R.ease.exit) from holdUntil 6.1,
  // running with the crossfade: the words leave first (gone at 6.42 s) and the
  // room dissolves into the fog after them. Left to the crossfade alone, the
  // Wayne line would ghost across the boat's wheelhouse until about 7.0 s.
  const A_TEXT_OUT = 6.1;
  const B_IN = { at: 6.1, dur: R.dur.xl };
  const B_PUSH = { at: 6.1, dur: 13.3 - 6.1, to: 1.05, origin: "60% 39%" }; // toward the boat
  const B_EYEBROW = 7.3;
  const B_WORDS = 7.5, WORD_GAP = 0.08;

  /* ---- type ---- */
  // Optical margins, measured in Chromium with the site's own fonts: the ink of
  // every line sits on one edge with its eyebrow's A (ink at x + 0.5). At 50 px
  // the italic D and B already land there (1162.4); at 64 px the italic Y and d
  // carry 4.4 and 1.4 px of side bearing, so those boxes move left to put their
  // ink at 120.4, inside the title-safe line.
  const A_TEXT = {
    eyebrow: { text: "A tale from eterno · Wayne", x: 1162, y: 456 },
    lines: [
      { text: "Don’t be the man she notices.", x: 1162, y: 494 },
      { text: "Be the man she asks about.", x: 1162, y: 554 },
    ],
  };
  const B_TEXT = {
    eyebrow: { text: "A tale from eterno", x: 120, y: 772 },
    lines: [
      { text: "You can smell the ones the sea", x: 116, y: 812 }, // italic Y: 4.4 px bearing
      { text: "decided to give back.", x: 119, y: 889 }, // italic d: 1.4 px bearing
    ],
  };
  const eyebrow = (parent, e) =>
    R.text(parent, e.text, { role: "eyebrow", x: e.x, y: e.y, size: 18, color: C.dune, style: nowrap });
  const signature = (parent, l, size) =>
    R.text(parent, l.text, { role: "signature", x: l.x, y: l.y, size, lineHeight: 1.2, color: C.linen, style: nowrap });

  let els = null;

  function build(root) {
    // The Wayne world fills the frame.
    root.style.background = WAYNE;

    /* BEAT A */
    const groupA = R.box(root, FRAME);
    const photoA = R.image(groupA, "img/tale-wayne.jpg", PHOTO_A, { fit: "cover", position: "50% 50%", origin: A_PUSH.origin, background: WAYNE });
    R.box(groupA, CHIP, { background: C.gold });
    const mark = R.mark(groupA, { x: MARK.x, y: MARK.y, width: MARK.width, color: C.linen, stroke: MARK.stroke });
    mark.svg.style.opacity = String(MARK.opacity);
    R.drawMark(mark, 1); // fully drawn, and it never moves
    const textA = R.box(groupA, FRAME, { pointerEvents: "none" });
    const eyebrowA = eyebrow(textA, A_TEXT.eyebrow);
    const linesA = A_TEXT.lines.map((l) => signature(textA, l, 50));

    /* BEAT B: a full-frame layer stacked above beat A */
    const layerB = R.box(root, FRAME);
    const photoB = R.image(layerB, "img/tale-shadow-of-the-sea.jpg", FRAME, { fit: "cover", position: "50% 50%", origin: B_PUSH.origin });
    R.box(layerB, FRAME, { background: "linear-gradient(0deg, rgba(23,22,20,.60) 0%, rgba(23,22,20,0) 50%)", pointerEvents: "none" });
    const eyebrowB = eyebrow(layerB, B_TEXT.eyebrow);
    // The word stagger runs across both lines in reading order (11 words).
    const wordsB = B_TEXT.lines.flatMap((l) => R.splitWords(signature(layerB, l, 64)));

    els = { groupA, photoA, textA, eyebrowA, linesA, layerB, photoB, eyebrowB, wordsB };
  }

  function render(t) {
    const { groupA, photoA, textA, eyebrowA, linesA, layerB, photoB, eyebrowB, wordsB } = els;

    /* BEAT A — the push starts under the wipe; the words settle as it completes. */
    R.push(photoA.img, R.tween(t, A_PUSH.at, A_PUSH.dur, R.ease.inOut), { scale: 1 }, { scale: A_PUSH.to });
    R.rise(eyebrowA, R.tween(t, A_EYEBROW, R.dur.l, R.ease.standard), 16);
    linesA.forEach((el, i) => R.rise(el, R.tween(t, A_LINES[i], R.dur.l, R.ease.standard), 16));
    R.fade(textA, 1 - R.tween(t, A_TEXT_OUT, R.dur.m, R.ease.exit));

    /* BEAT B — crossfades over A, then its line arrives word by word. */
    const b = R.tween(t, B_IN.at, B_IN.dur, R.ease.standard);
    layerB.style.opacity = String(b);
    layerB.style.visibility = b > 0 ? "visible" : "hidden";
    groupA.style.visibility = b < 1 ? "visible" : "hidden"; // fully covered from 7.3 s
    R.push(photoB.img, R.tween(t, B_PUSH.at, B_PUSH.dur, R.ease.inOut), { scale: 1 }, { scale: B_PUSH.to });
    R.rise(eyebrowB, R.tween(t, B_EYEBROW, R.dur.l, R.ease.standard), 16);
    R.stagger(t, B_WORDS, wordsB.length, WORD_GAP, R.dur.l, R.ease.emphasized).forEach((p, i) => R.rise(wordsB[i], p, 24));

    return null;
  }

  // No grain while scene 03's Linen is still on screen, full grain on the dark
  // Wayne world, none on the bright amber fog or the Linen dip.
  const grain = (t) =>
    t < 0.6 ? 0
      : t < 1.2 ? 0.035 * (t - 0.6) / 0.6
      : t < 6.1 ? 0.035
      : t < 7.3 ? 0.035 * (1 - (t - 6.1) / 1.2)
      : 0;

  R.scene("one-story-per-bottle", { build, render, grain });
})();
