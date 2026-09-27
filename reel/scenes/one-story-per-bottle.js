/*
 * Scene 04 · "One story per bottle" (one-story-per-bottle) — 13.3 s, from 33.8 s.
 *
 * The emotional core. BEAT A (0–5.5 s) continues scene 03's P4 spread. The
 * runtime's light-wipe carries off only its left column: the Linen and P4's words
 * go, and the hero bottle's colour world, Wayne #2B2A28, takes the whole frame.
 * Everything P4 set on the right (the Golden hour chip and its legend, and Wayne's
 * tale on its plate: a stone room at night, one lit lamp over a laid table, on its
 * slow push toward the lamp) holds pixel-still under the light, because it is the
 * same drawing on the same clock. The wipe also lays the e∞ watermark on the field
 * it opens up, lower left. Then the tale speaks where the principle stood: its
 * eyebrow and signature line rise in P4's slots, and the key, whose job was P4's,
 * hands over to that eyebrow.
 * BEAT B (from 5.5 s): the words and the watermark leave, and the room goes back
 * into its colour, as it came (one gesture, gone at 6.1 s). Out of that flat field
 * rises a second tale, Shadow of the Sea, full-bleed (a fishing boat in amber fog),
 * which pushes toward the boat while its line arrives word by word over the dark
 * water, lower left. Everything then holds until scene 05's dip through Linen takes
 * the frame.
 *
 * Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const WAYNE = "#2B2A28"; // the Wayne colour world (proposed); scene 03's legend names it, scene 06 labels it
  const FRAME = { x: 0, y: 0, w: R.W, h: R.H };
  const nowrap = { whiteSpace: "nowrap" };

  /* ---- scene 03's P4 surface ---- */
  // Copied exactly from four-principles.js (CHIP, LEGEND, PLATE, PLATE_PUSH there: panel-local
  // and in its clock; stage values and ours here), so the chip, its legend and the plate are
  // the same pixels on both sides of the light-wipe and only the left of the frame changes.
  // Change them in both files or in neither.
  const S03 = 19.4; // scene 03's clock at our t = 0 (33.8 − 14.4 on the timeline)
  // The key on P4's head row: legend caps on pixel rows 153–165 (ink ends at x 1720), the chip
  // standing on the same baseline (rows 110–165).
  const CHIP = { x: 1744, y: 110, w: 56, h: 56 };
  const LEGEND = { text: "eterno · Wayne — colour world", right: 196, y: 150 };
  // The tale's plate: x 920–1800, y 196–960, source x 457–2103 at full height (clear of the
  // source's black pillar bars and rounded corners). One push toward the lamp from its first
  // light in scene 03 (its 15.35, our −4.05) to our 7.0: 5 % over 11.05 s, inOut.
  const PLATE = { x: 920, y: 196, w: 880, h: 764, src: "img/tale-wayne.jpg", position: "50% 50%" };
  const PLATE_PUSH = { at: 15.35 - S03, dur: 11.05, to: 1.05, origin: "74% 20%" };

  /* ---- beat A's own ---- */
  // The e∞ watermark (the direction: 6–8 % on colour-world bands, never on photography) on the
  // field the wipe opens up, under the tale's words: 780 wide, its ink (stroke included) at
  // x 120–609, y 718–960, so its left edge is the words' and its foot the plate's. Never over
  // the plate (x ≥ 920) and wholly in frame.
  const MARK = { x: -25, y: 644, width: 780, stroke: 2, opacity: 0.07 };
  // The tale takes the principle's place: its eyebrow in the numeral's slot, its line where
  // "One story per bottle" stood (scene 03: numeral y 392, name y 444), at x 120. 60 px italic,
  // line-height 1.2, one size for the tale's line wherever it appears. Measured in Chromium
  // with the site's fonts: the italic D and B land on the eyebrow's edge.
  const SIG = 60;
  const A_TEXT = {
    eyebrow: { text: "A tale from eterno · Wayne", x: 120, y: 404 },
    lines: [
      { text: "Don’t be the man she notices.", x: 120, y: 444 },
      { text: "Be the man she asks about.", x: 120, y: 516 },
    ],
  };

  /* ---- timing (scene-local seconds) ---- */
  // The wipe (0–1.2) is the only thing that moves at first. Then the eyebrow, then the two
  // lines (120 ms line stagger, as in the site's tale band): settled at 2.12 s.
  const A_EYEBROW = 1.2;
  const A_LINES = [1.4, 1.52];
  // The chip and its legend were P4's key to the colour world; once the tale names the scent
  // they have done their job. They hand over to its eyebrow: the spec's exit (320 ms, opacity
  // only) from 1.2 s, as the light has passed and the eyebrow starts to rise; gone at 1.52 s.
  // Only then does anything on the right move, so the wipe's match with scene 03 is untouched.
  const A_KEY_OUT = A_EYEBROW;
  // The words and the watermark leave with the spec's exit (320 ms, opacity only): gone at
  // 5.82 s. The line reads 3.4 s settled. With them the room goes back into its colour, the
  // reverse of the way it came up in scene 03 (0.6 s, inOut, gone at 6.1 s): one gesture that
  // returns the frame to the flat Wayne field before the boat rises out of it. So nothing of
  // the room, the words or the mark ever lies over the boat, and the plate's hard edges never
  // show in the fog (at 5.95 s the room is at 12 % and the boat at 3 %; at 6.05 s, 1 % and 8 %).
  const A_OUT = 5.5;
  const A_ROOM_OUT = { at: A_OUT, dur: R.dur.l };
  // The field → boat dissolve: a whole-frame change, so the symmetric curve (the standard one is
  // front-loaded: most of the boat in a few frames).
  const B_IN = { at: 5.8, dur: R.dur.xl };
  const B_PUSH = { at: B_IN.at, dur: 13.3 - B_IN.at, to: 1.05, origin: "60% 39%" }; // toward the boat
  // Nothing but the boat is under its line: the eyebrow rises from 6.7 s, the boat ≈ 90 % in over
  // the flat field, and the words are complete at 8.3 s (42.1 s global): about 3.8 s fully read
  // before scene 05's dip takes it.
  const B_EYEBROW = 6.7;
  const B_WORDS = 6.9, WORD_GAP = 0.08;

  /* ---- beat B's type ---- */
  // Broken after "the ones", so the relative clause "the sea decided to give back"
  // stays whole. The eyebrow names the scent, as beat A's does (the tale page's own
  // eyebrow: "A tale from eterno · Shadow of the Sea · 3 min read"). The block sits
  // over the dark water with the eyebrow-to-line spacing of beat A; it is set 24 px
  // higher than a block ending at y 966 would be, so the full stop of the longer
  // second line (ink to x 707) keeps clear of the shoreline rising toward the
  // rocks, which crosses y ≈ 935 under it while the line lands.
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

  /* The plate's push, written exactly as scene 03's pushPlate() writes it. */
  function pushPlate(img, t) {
    const p = R.tween(t, PLATE_PUSH.at, PLATE_PUSH.dur, R.ease.inOut);
    img.style.transform = `scale(${R.lerp(1, PLATE_PUSH.to, p).toFixed(5)})`;
  }

  let els = null;

  function build(root) {
    // The Wayne world fills the frame.
    root.style.background = WAYNE;

    /* BEAT A */
    const groupA = R.box(root, FRAME);
    // P4's key, in its own box so it hands over as one.
    const keyA = R.box(groupA, FRAME, { pointerEvents: "none" });
    R.box(keyA, CHIP, { background: C.gold });
    const legendA = R.text(keyA, LEGEND.text, { role: "eyebrow", right: LEGEND.right, y: LEGEND.y, size: 18, color: C.dune, align: "right", style: nowrap });
    const plate = R.image(groupA, PLATE.src, PLATE, { position: PLATE.position, origin: PLATE_PUSH.origin, background: WAYNE });
    plate.img.style.willChange = "auto"; // as scene 03's unpin()
    // The words and the mark, in one group so they leave as one.
    const outA = R.box(groupA, FRAME, { pointerEvents: "none" });
    const mark = R.mark(outA, { x: MARK.x, y: MARK.y, width: MARK.width, color: C.linen, stroke: MARK.stroke });
    mark.svg.style.opacity = String(MARK.opacity);
    R.drawMark(mark, 1); // fully drawn, and it never moves
    const eyebrowA = eyebrow(outA, A_TEXT.eyebrow);
    const linesA = A_TEXT.lines.map((l) => signature(outA, l));

    /* BEAT B: a full-frame layer stacked above beat A */
    const layerB = R.box(root, FRAME);
    const photoB = R.image(layerB, "img/tale-shadow-of-the-sea.jpg", FRAME, { fit: "cover", position: "50% 50%", origin: B_PUSH.origin });
    R.box(layerB, FRAME, { background: "linear-gradient(0deg, rgba(23,22,20,.60) 0%, rgba(23,22,20,0) 50%)", pointerEvents: "none" });
    const eyebrowB = eyebrow(layerB, B_TEXT.eyebrow);
    // The word stagger runs across both lines in reading order (11 words).
    const wordsB = B_TEXT.lines.flatMap((l) => R.splitWords(signature(layerB, l)));

    els = { groupA, keyA, legendA, outA, plate, eyebrowA, linesA, layerB, photoB, eyebrowB, wordsB };
  }

  function render(t) {
    const { groupA, keyA, legendA, outA, plate, eyebrowA, linesA, layerB, photoB, eyebrowB, wordsB } = els;

    /* BEAT A — the right side is scene 03's, still; the tale's words rise on the left. */
    // The legend held as scene 03 holds it (a rise at rest keeps its 0.001° turn): always its own
    // layer and grayscale anti-aliased, so it is scene 03's pixels under the wipe and cannot
    // snap to LCD anti-aliasing as its box starts to fade.
    R.rise(legendA, 1, 16);
    const keyOut = R.tween(t, A_KEY_OUT, R.dur.m, R.ease.exit);
    keyA.style.opacity = String(1 - keyOut);
    keyA.style.visibility = keyOut >= 1 ? "hidden" : "visible";
    pushPlate(plate.img, t);
    R.fade(plate.wrap, 1 - R.tween(t, A_ROOM_OUT.at, A_ROOM_OUT.dur, R.ease.inOut));
    R.rise(eyebrowA, R.tween(t, A_EYEBROW, R.dur.l, R.ease.standard), 16);
    linesA.forEach((el, i) => R.rise(el, R.tween(t, A_LINES[i], R.dur.l, R.ease.standard), 16));
    const out = R.tween(t, A_OUT, R.dur.m, R.ease.exit);
    outA.style.opacity = String(1 - out);
    outA.style.visibility = out >= 1 ? "hidden" : "visible";

    /* BEAT B — the boat rises out of the flat field, then its line arrives word by word. */
    const b = R.tween(t, B_IN.at, B_IN.dur, R.ease.inOut);
    layerB.style.opacity = String(b);
    layerB.style.visibility = b > 0 ? "visible" : "hidden";
    groupA.style.visibility = b < 1 ? "visible" : "hidden"; // fully covered from 7.0 s
    R.push(photoB.img, R.tween(t, B_PUSH.at, B_PUSH.dur, R.ease.inOut), { scale: 1 }, { scale: B_PUSH.to });
    R.rise(eyebrowB, R.tween(t, B_EYEBROW, R.dur.l, R.ease.standard), 16);
    R.stagger(t, B_WORDS, wordsB.length, WORD_GAP, R.dur.l, R.ease.emphasized).forEach((p, i) => R.rise(wordsB[i], p, 24));

    return null;
  }

  // No grain under the wipe (scene 03's Linen is still on screen, and the held right side
  // stays exactly scene 03's), full grain on the dark Wayne world once the light has passed,
  // none on the bright amber fog or the Linen dip; it follows the dissolve's curve out.
  const grain = (t) =>
    t < 1.2 ? 0
      : t < 1.8 ? 0.035 * (t - 1.2) / 0.6
      : t < B_IN.at ? 0.035
      : 0.035 * (1 - R.tween(t, B_IN.at, B_IN.dur, R.ease.inOut));

  R.scene("one-story-per-bottle", { build, render, grain });
})();
