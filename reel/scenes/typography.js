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
 *           the Eyebrow specimen, set exactly as every eyebrow in the film and
 *           on the site: Instrument Sans 600, 18 px, caps, 0.14em, Ash.
 *
 * The role labels are annotations, not eyebrows: sentence case in the film's
 * caption voice (Instrument Sans 500, 18 px, 0.02em, Ash), as the hex labels in
 * scene 06. So the only caps on the page are the two real eyebrows, the running
 * head "Typography" and the specimen, and the specimen looks like its role.
 *
 * Each row's role label rises first, then its specimen; each hairline draws
 * left→right just ahead of the row below it, so the page is set top to bottom
 * like a specimen sheet. Everything is still from 3.24 s and holds 2 s. At 5.2 s
 * the board (everything but the eyebrow) leaves with the spec's exit, 320 ms,
 * opacity only, as scene 06 does: gone at 5.52, so scene 08's crossfade (5.6)
 * brings its charcoal panel over clean Linen, never over type caught mid-exit.
 * The runtime crossfades us in from the colour-world grid (0.6 s); nothing of
 * ours shows before 0.4 s, so the grid dissolves into clean Linen and the
 * eyebrow rises out of it.
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
   * right group. The Display C carries 6 px of bearing at 128 px; the labels'
   * D, U and E stems 1 px; the italic H, the round S, the T and the specimen's
   * A ink on the box edge already. The C is set flush on 120, not hung past it: nothing inks
   * left of the title-safe line.
   */
  const X = 120;
  const RIGHT = 972; // row 3, right: column 7 of the 12-column grid (see deviations: the board said 1000)

  /* ---- the column head ---- */
  const EYEBROW = { text: "Typography", x: X, y: 150, at: 0.4 };

  /* ---- the rows ----
   * Measured rhythm, identical in rows 1 and 2: label baseline → specimen
   * ascenders 31 px; specimen descenders → hairline 50 px; hairline → next
   * label's caps 41 px.
   * Labels: caption voice, 18 px, line-height 1.2, sentence case, Ash. Their
   * baselines (270, 535, 735) are the ones the caps labels had, so the rhythm
   * above and below holds; measured on the frame.
   */
  const LABEL = { size: 18, lineHeight: 1.2 };
  const LABELS = [
    { text: "Display XL · Cormorant Garamond 600", x: X - 1, y: 255, at: 0.6 },
    { text: "Signature · Cormorant Garamond 500 italic", x: X, y: 519, at: 1.4 },
    { text: "UI · Instrument Sans 500/600", x: X - 1, y: 719, at: 2.2 },
    { text: "Eyebrow · Instrument Sans 600 uppercase", x: RIGHT - 1, y: 719, at: 2.2 },
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
   * The eyebrow specimen at x 972, 18 px Ash like the film's eyebrows: its
   * capitals centre on the same line, so the whole row reads along y 794.
   */
  const BUTTONS = [
    { text: "Shop the collection", x: X, y: 762, w: 320, h: 64, at: 2.4, primary: true },
    { text: "Find your scent", x: 464, y: 762, w: 260, h: 64, at: 2.52 },
  ];
  const LABEL_DROP = 1;
  // Capitals y 788–800: centred on 794 with the buttons.
  const SPECIMEN = { text: "A tale from eterno", x: RIGHT, y: 785, size: 18, at: 2.64 };

  /* ---- the exit: the board clears before scene 08's crossfade (5.6) ---- */
  const BOARD_OUT = 5.2; // + R.dur.m (320 ms), R.ease.exit: gone at 5.52

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

    // The board: everything but the eyebrow, one group so the exit is a single
    // fade (the button labels stay knockouts of their fills while it runs).
    // At rest its opacity is 1 and it lays out exactly as the root.
    const board = R.box(root, { x: 0, y: 0, w: R.W, h: R.H });

    const labels = LABELS.map((L) => R.text(board, L.text, {
      role: "caption", x: L.x, y: L.y, size: LABEL.size, lineHeight: LABEL.lineHeight, color: C.ash, style: nowrap,
    }));

    // One R.text block per line, split into words for the stagger.
    const display = R.text(board, DISPLAY.text, {
      role: "display-xl", x: DISPLAY.x, y: DISPLAY.y, size: 128, lineHeight: 1.02, color: C.night, style: nowrap,
    });
    const displayWords = R.splitWords(display).map(unpin);
    const signature = R.text(board, SIGNATURE.text, {
      role: "signature", x: SIGNATURE.x, y: SIGNATURE.y, size: 64, lineHeight: 1.2, color: C.night, style: nowrap,
    });
    const signatureWords = R.splitWords(signature).map(unpin);

    const hairlines = HAIRLINES.map((H) => R.hairline(board, { x: X, y: H.y, w: 1800 - X, h: 1 }, C.dune, "left"));

    // Each button is one group, so box and label fade as one (the Linen label is
    // a knockout of the Night fill, never a grey ghost over it). Inside, the box
    // and the label share the rise but not the transform (see render).
    const buttons = BUTTONS.map((B) => {
      const group = R.box(board, { x: B.x, y: B.y, w: B.w, h: B.h }, { overflow: "visible" });
      const box = R.box(group, { x: 0, y: 0, w: B.w, h: B.h },
        B.primary ? { background: C.night } : { background: "transparent", border: `1px solid ${C.night}` });
      const label = R.text(group, B.text, {
        role: "body", x: 0, y: LABEL_DROP, w: B.w, align: "center", size: 18, weight: 600, tracking: "0.04em",
        lineHeight: `${B.h}px`, color: B.primary ? C.linen : C.night, style: { ...nowrap, paddingLeft: "0.04em" },
      });
      return { group, box, label };
    });

    const specimen = eyebrowText(board, SPECIMEN, SPECIMEN.size, C.ash);

    els = { eyebrow, board, labels, displayWords, signatureWords, hairlines, buttons, specimen };
  }

  function render(t) {
    const { eyebrow, board, labels, displayWords, signatureWords, hairlines, buttons, specimen } = els;

    // The eyebrow rises once and stays until scene 08's crossfade takes it.
    riseFree(eyebrow, R.tween(t, EYEBROW.at, R.dur.l), 16);

    // The board's exit: opacity only, 320 ms, exit ease, from 5.2 s; gone at 5.52.
    const out = R.tween(t, BOARD_OUT, R.dur.m, E.exit);
    board.style.opacity = String(1 - out);
    board.style.visibility = out < 1 ? "visible" : "hidden";

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
