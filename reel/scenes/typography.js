/*
 * Scene 07 · "Typography" (typography) — 6.2 s, from 64.1 s.
 *
 * The type's voice at size, in real brand lines. On Linen, everything hangs
 * from one left edge at x 120 in three rows, divided by Dune hairlines:
 *
 *   Row 1 — Display XL: the house line "Composed to be remembered." at 128 px,
 *           Cormorant Garamond 600, rising word by word.
 *   Row 2 — Signature: the Enzo 1898 tale line at 64 px, Cormorant 500 italic,
 *           rising word by word.
 *   Row 3 — UI: the site's two buttons (radius 0, no shadow), and on the right
 *           the Eyebrow specimen at 22 px.
 *
 * Each row's role label rises first, then its specimen; each hairline draws
 * left→right just ahead of the row below it, so the page is set top to bottom
 * like a specimen sheet. Everything is still from 3.24 s and holds, unfaded,
 * until scene 08's crossfade takes the frame. The runtime crossfades us in from
 * the colour-world grid (0.6 s); nothing of ours shows before 0.4 s, so the
 * grid dissolves into clean Linen and the eyebrow rises out of it.
 *
 * Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const E = R.ease;
  const nowrap = { whiteSpace: "nowrap" };

  /* ---- type: optical margins ----
   * Every box sits on its storyboard x, then moves by its first glyph's side
   * bearing, measured on the rendered frame with the site's fonts, so the ink,
   * not the box, lands on the edge: x 120 for the column, x 972 for row 3's
   * right group. The Display C carries 6 px of bearing at 128 px; the eyebrow
   * D, U and E stems 1 px; the italic H, the round S and the T ink on the box
   * edge already. The C is set flush on 120, not hung past it: nothing inks
   * left of the title-safe line.
   */
  const X = 120;
  const RIGHT = 972; // row 3, right: column 7 of the 12-column grid (see deviations: the board said 1000)

  /* ---- the column head ---- */
  const EYEBROW = { text: "Typography", x: X, y: 150, at: 0.4 };

  /* ---- the rows ----
   * Measured rhythm, identical in rows 1 and 2: label baseline → specimen
   * ascenders 31 px; specimen descenders → hairline 50 px; hairline → next
   * label's caps 42 px.
   */
  const LABELS = [
    { text: "Display XL · Cormorant Garamond 600", x: X - 1, y: 256, at: 0.6 },
    { text: "Signature · Cormorant Garamond 500 italic", x: X, y: 520, at: 1.4 },
    { text: "UI · Instrument Sans 500/600", x: X - 1, y: 720, at: 2.2 },
    { text: "Eyebrow · Instrument Sans 600 uppercase", x: RIGHT - 1, y: 720, at: 2.2 },
  ];
  // 128 px, line-height 1.02: box y 290–421, baseline 395, ink x 120–1585.
  const DISPLAY = { text: "Composed to be remembered.", x: X - 6, y: 290, at: 0.7 };
  // 64 px italic, line-height 1.2: box y 556–633, baseline 613, ink x 120–1105.
  const SIGNATURE = { text: "He looks like money was never the problem.", x: X, y: 556, at: 1.5 };
  const WORD_GAP = 0.08; // 80 ms between words, in reading order

  /*
   * 1 px Dune rules across the full grid, x 120–1800, drawn left→right with the
   * film's hairline curve (standard) from the board's start times, over the
   * spec's xl 1.2 s rather than 600 ms (see deviations). Every other hairline in
   * the film is under 600 px; this one is 1680, and at 600 ms its front covered
   * 336 px in the first frame and half the frame in 0.1 s, a zip against the
   * slow rises. At 1.2 s it leaves at 170 px a frame and glides in. The order
   * holds: each rule is past x 1060 before the labels under it show, rule 1
   * settles as rule 2 starts, and rule 2 lands at 3.2 s, inside the hold.
   */
  const HAIRLINES = [{ y: 480, at: 1.2 }, { y: 680, at: 2.0 }];
  const HAIR_DUR = R.dur.xl;

  /* ---- row 3: the UI ----
   * The site's buttons: Night fill with Linen label, and a 1 px Night outline
   * (inside the 260×64, as the site's border-box). Labels are Instrument Sans
   * 600, 18 px, tracking 0.04em, centred on their ink: the trailing tracking is
   * cancelled (padding-left = tracking) and the line drops 1 px so the capitals
   * (y 787–800) sit exactly on the button's centre line, y 794.
   * The eyebrow specimen at (972, 782), 22 px: its capitals (786–801) centre on
   * the same line, so the whole row reads along y 794.
   */
  const BUTTONS = [
    { text: "Shop the collection", x: X, y: 762, w: 320, h: 64, at: 2.4, primary: true },
    { text: "Find your scent", x: 464, y: 762, w: 260, h: 64, at: 2.52 },
  ];
  const LABEL_DROP = 1;
  const SPECIMEN = { text: "A tale from eterno", x: RIGHT, y: 782, at: 2.64 };

  let els = null;

  /*
   * The spec's rise (opacity 0→1 while travelling `dist` px up), made
   * order-independent, as in scenes 03 and 06. `.word` (reel.css) carries
   * will-change: transform, and Chrome keeps a will-change layer's raster from
   * whatever sub-pixel offset it was first painted at, so a settled word could
   * differ depending on which frame was painted before it: unpin() drops the
   * hint. Without it, an axis-aligned translate snaps glyphs to whole pixels and
   * the tail of a rise ticks; the 0.001° turn, held through the rise and at
   * rest, keeps the offset sub-pixel so the settle follows the ease exactly and
   * nothing changes at the moment of landing.
   */
  function riseFree(el, p, dist) {
    el.style.opacity = String(p);
    el.style.transform = `translate3d(0, ${((1 - p) * dist).toFixed(3)}px, 0) rotate(0.001deg)`;
  }
  const unpin = (el) => { el.style.willChange = "auto"; return el; };

  const eyebrowText = (parent, L, size, color) =>
    R.text(parent, L.text, { role: "eyebrow", x: L.x, y: L.y, size, color, style: nowrap });

  function build(root) {
    root.style.background = C.linen;

    const eyebrow = eyebrowText(root, EYEBROW, 18, C.ash);
    const labels = LABELS.map((L) => eyebrowText(root, L, 17, C.ash));

    // One R.text block per line, split into words for the stagger.
    const display = R.text(root, DISPLAY.text, {
      role: "display-xl", x: DISPLAY.x, y: DISPLAY.y, size: 128, lineHeight: 1.02, color: C.night, style: nowrap,
    });
    const displayWords = R.splitWords(display).map(unpin);
    const signature = R.text(root, SIGNATURE.text, {
      role: "signature", x: SIGNATURE.x, y: SIGNATURE.y, size: 64, lineHeight: 1.2, color: C.night, style: nowrap,
    });
    const signatureWords = R.splitWords(signature).map(unpin);

    const hairlines = HAIRLINES.map((H) => R.hairline(root, { x: X, y: H.y, w: 1800 - X, h: 1 }, C.dune, "left"));

    // Each button is one group, so box and label fade as one (the Linen label is
    // a knockout of the Night fill, never a grey ghost over it). Inside, the box
    // and the label share the rise but not the transform (see render).
    const buttons = BUTTONS.map((B) => {
      const group = R.box(root, { x: B.x, y: B.y, w: B.w, h: B.h }, { overflow: "visible" });
      const box = R.box(group, { x: 0, y: 0, w: B.w, h: B.h },
        B.primary ? { background: C.night } : { background: "transparent", border: `1px solid ${C.night}` });
      const label = R.text(group, B.text, {
        role: "body", x: 0, y: LABEL_DROP, w: B.w, align: "center", size: 18, weight: 600, tracking: "0.04em",
        lineHeight: `${B.h}px`, color: B.primary ? C.linen : C.night, style: { ...nowrap, paddingLeft: "0.04em" },
      });
      return { group, box, label };
    });

    const specimen = eyebrowText(root, SPECIMEN, 22, C.night);

    els = { eyebrow, labels, displayWords, signatureWords, hairlines, buttons, specimen };
  }

  function render(t) {
    const { eyebrow, labels, displayWords, signatureWords, hairlines, buttons, specimen } = els;

    riseFree(eyebrow, R.tween(t, EYEBROW.at, R.dur.l), 16);
    labels.forEach((el, i) => riseFree(el, R.tween(t, LABELS[i].at, R.dur.l), 16));

    // Display type rises 24 px, emphasized, 80 ms apart: 4 words, complete 1.54 s;
    // the signature's 8 words complete 2.66 s.
    R.stagger(t, DISPLAY.at, displayWords.length, WORD_GAP, R.dur.l, E.emphasized).forEach((p, i) => riseFree(displayWords[i], p, 24));
    R.stagger(t, SIGNATURE.at, signatureWords.length, WORD_GAP, R.dur.l, E.emphasized).forEach((p, i) => riseFree(signatureWords[i], p, 24));

    hairlines.forEach((el, i) => R.drawLine(el, R.tween(t, HAIRLINES[i].at, HAIR_DUR)));

    // Buttons 2.4 / 2.52, the eyebrow specimen 2.64: 16 px, 600 ms, standard. Still from 3.24 s.
    // The group carries the fade. The box moves on a plain translate: an
    // axis-aligned rect is drawn with exact sub-pixel coverage (measured within
    // 0.01 px of the ease every frame), where the 0.001° turn quantised its edges
    // to 1/8 px and they shimmered as the rise settled. The label keeps the turn
    // (a plain translate snaps glyphs to whole pixels), with the same offset.
    buttons.forEach((b, i) => {
      const p = R.tween(t, BUTTONS[i].at, R.dur.l);
      const dy = ((1 - p) * 16).toFixed(3);
      b.group.style.opacity = String(p);
      b.box.style.transform = `translate3d(0, ${dy}px, 0)`;
      b.label.style.transform = `translate3d(0, ${dy}px, 0) rotate(0.001deg)`;
    });
    riseFree(specimen, R.tween(t, SPECIMEN.at, R.dur.l), 16);

    return null;
  }

  // Grain 0 throughout: the runtime's grain is full-frame and must never fall on Linen.
  R.scene("typography", { build, render, grain: () => 0 });
})();
