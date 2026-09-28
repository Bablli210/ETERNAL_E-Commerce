/*
 * Scene 06 · "Colour" (colour) — 10 s, from 54.7 s.
 *
 * The palette as a discipline, then the idea that sells. On Linen, under an
 * eyebrow that stays for the whole scene:
 *
 * The eyebrow is the chapter's running head, at (120, 150) like 03's "Four
 * principles" and 07's "Typography", so it does not jump between chapters; the
 * title slot sits 32 px under it, at y 182.
 *
 * BEAT A (0–5.32 s) — the ratio. "Neutrals do the work." rises word by word
 * while one soft edge of light lays down a single 1680 px bar split 70/20/6/4:
 * Linen (so it reads as mostly empty — that is the point), Night, Sand and a
 * sliver of Golden hour, each with its share set small in its corner. The
 * board's ratio line settles under it and the nine swatches follow the light
 * edge across, left to right, seven neutrals and two accents, each chip
 * bringing its own part of the hairline frame so the row grows as one gesture,
 * its name and hex rising just behind it. Built by 2.48 s; a 2.5 s hold, and
 * everything but the eyebrow leaves in 320 ms.
 *
 * BEAT B (5.4–10 s) — one world per scent. The heading rises word by word and
 * the ten colour-world tiles arrive in reading order, 60 ms apart: a flat field,
 * a chip of its second colour, the scent's name and — always — its status,
 * "from the packshot" or "proposed". Built by 6.74 s, the grid holds, still,
 * until scene 07's crossfade takes it (from 9.4 s). Nothing fades out at the end.
 *
 * Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const E = R.ease;
  const nowrap = { whiteSpace: "nowrap" };
  const TABULAR = { fontVariantNumeric: "tabular-nums lining-nums" };
  // Cormorant defaults to old-style figures, which turn the 1 of "Enzo 1898"
  // into a small-cap I ("Enzo I898"). Every serif name here sets lining figures.
  const LINING = { fontVariantNumeric: "lining-nums proportional-nums" };

  /* ---- type: optical margins ----
   * Every box sits on its storyboard x, then moves left by its first glyph's
   * side bearing, measured on the rendered frame with the site's fonts, so the
   * ink — not the box — lands on the edge it belongs to: x 120 for the column,
   * each chip's or segment's edge, 24 px inside each tile. Serifs, stems and
   * rounds all ink on the edge (the eyebrow's small C already inks at 120); no
   * round is hung past it, so nothing inks left of the 120 title-safe line.
   */

  /* ---- the frame: eyebrow and the title slot (shared by both beats) ---- */
  // The type waits for the 600 ms crossfade in (as 03's does), so it rises onto
  // clean Linen, never over the ghost of 05's photographs.
  const EYEBROW = { text: "Colour", x: 120, y: 150, at: 0.6 }; // same running-head slot as 03 and 07
  const TITLE_A = { text: "Neutrals do the work.", x: 120 - 2, y: 182, at: 0.65 }; // N's serif: 2 px bearing
  const TITLE_B = { text: "Colour worlds — one per scent", x: 120 - 4, y: 182, at: 5.4 }; // round C: 4 px bearing
  const WORD_GAP = 0.08; // 80 ms between words, across the line in reading order

  /* ---- BEAT A: the ratio bar ---- */
  // One layer: fills, outline and numerals, revealed together by the light edge.
  // The 1 px Dune outline sits just outside the 1680×240 bar (as the toolkit's
  // browser frame does), so Night and Golden hour keep clean edges and the
  // outline only shows where it is needed: around the Linen that is most of it.
  const BAR = { x: 120, y: 330, w: 1680, h: 240, at: 0.7, dur: R.dur.xl };
  const SEGMENTS = [
    { x: 120, w: 1176, fill: C.linen, num: "70", ink: C.night }, // 70 %
    { x: 1296, w: 336, fill: C.night, num: "20", ink: C.linen }, // 20 %
    { x: 1632, w: 100.8, fill: C.sand, num: "6", ink: C.night }, //  6 %
    { x: 1732.8, w: 67.2, fill: C.gold, num: "4", ink: C.linen }, //  4 %
  ];
  // Each share sits in its segment's bottom-left corner, 16 px in from both
  // edges: ink from x + 16 (the figures carry 2 px of bearing) and baseline at
  // y 554, 16 px above the bar's foot. The storyboard's "top y 476" (on its
  // bar at y 292) assumed a figure as tall as its 40 px size; Cormorant's lining
  // figures are 26 px, which left them floating 24 px up. So the 40 px line box
  // starts 192 px into the bar, at y 522.
  const NUM = { dx: 16 - 2, y: BAR.y + 192, size: 40 };

  // The ratio line settles under the bar while the light is still crossing it.
  const RATIO = { text: "70 linen · 20 night · 6 sand · 4 golden hour", x: 120 - 1, y: 590, at: 1.2 };

  /* ---- BEAT A: the swatch row ---- */
  // Each row label rises just before its group's first chip (see CHIP_AT).
  const LABELS = [
    { text: "Neutrals", x: 120 - 1, y: 698, at: 1.25 },
    { text: "Accents", x: 1432, y: 698, at: 1.7 },
  ];
  const CHIP = { y: 734, w: 184, h: 140, nameY: 890, hexY: 926 };
  const CHIPS = [
    { name: "Linen", hex: "#F3EFE7", fill: C.linen, x: 120, dx: -1, first: true },
    { name: "Paper", hex: "#FAF8F3", fill: C.paper, x: 304, dx: -1 },
    { name: "Sand", hex: "#E4D9C5", fill: C.sand, x: 488, dx: -2 },
    { name: "Dune", hex: "#CDBFA5", fill: C.dune, x: 672, dx: -1 },
    { name: "Stone", hex: "#9E9382", fill: C.stone, x: 856, dx: -2 },
    { name: "Ash", hex: "#6D665C", fill: C.ash, x: 1040, dx: 0 },
    { name: "Night", hex: "#171614", fill: C.night, x: 1224, dx: -1, last: true },
    { name: "Golden hour", hex: "#B97A2B", fill: C.gold, x: 1432, dx: -1, first: true },
    { name: "Deep sea", hex: "#163A4E", fill: C.sea, x: 1616, dx: -1, last: true },
  ];
  const RULE_X = 304; // the 1 px rule between the Linen and Paper chips
  // The chips follow the bar's light edge, about 600 px behind it, so the row
  // never runs ahead of the light: 1.30–1.78 s, last label complete 2.48 s.
  const CHIP_AT = 1.3, CHIP_GAP = 0.06, CHIP_LABEL_LAG = 0.1;
  const A_OUT = 5.0; // a 2.5 s hold, then everything but the eyebrow exits, 320 ms, gone at 5.32 s

  /* ---- BEAT B: the colour worlds ---- */
  // 316.8 × 300 under the lowered title: rows at y 312 and 636, the grid ends
  // at y 936. Name and status keep their 96 / 52 px from the tile's foot.
  const TILE = { w: 316.8, h: 300, inset: 24, chip: 56, nameY: 204, statusY: 248 };
  const COLS = [120, 460.8, 801.6, 1142.4, 1483.2];
  const ROWS = [312, 636];
  // Verbatim from the direction board: first colour = field, second = chip.
  // dx / sdx: the name's and the status's side bearing at 34 / 20 px.
  const WORLDS = [
    { name: "Destiny", status: "from the packshot", field: "#A9C4E4", chip: "#3F6FA8", dx: -1, sdx: 0 },
    { name: "Caribbean Punch", status: "from the packshot", field: "#F0E3CC", chip: "#D9843A", dx: -1, sdx: 0 },
    { name: "Shadow of the Sea", status: "proposed", field: "#0F2B3C", chip: "#C9D8DE", dark: true, dx: -2, sdx: -1 },
    { name: "Forbidden Apple", status: "proposed", field: "#F1D3D6", chip: "#4F6B3F", dx: 0, sdx: -1 },
    { name: "Wayne", status: "proposed", field: "#2B2A28", chip: "#B97A2B", dark: true, dx: 0, sdx: -1 },
    { name: "Mercury", status: "proposed", field: "#C7C3CE", chip: "#6F5E8A", dx: -1, sdx: -1 },
    { name: "Sapphire", status: "proposed", field: "#1B3F8F", chip: "#DCE6F5", dark: true, dx: -2, sdx: -1 },
    { name: "Enzo 1898", status: "proposed", field: "#2F5A4E", chip: "#6B3A2B", dark: true, dx: -1, sdx: -1 },
    { name: "Tonic Club", status: "proposed", field: "#DDE9C8", chip: "#3E5A2E", dx: 0, sdx: -1 },
    { name: "Linen", status: "proposed", field: "#F2EFE8", chip: "#9A968D", border: true, dx: -1, sdx: -1 },
  ];
  const TILE_AT = 5.6, TILE_GAP = 0.06; // last starts 6.14, complete 6.74 s; the grid holds 2.66 s

  let els = null;

  /*
   * The spec's rise, made order-independent. `.word` (reel.css) carries
   * will-change: transform, and Chrome keeps a will-change layer's raster from
   * whatever sub-pixel offset it was first painted at, so a settled word could
   * differ from the same word painted cold. Without the hint every frame rasters
   * at its real offset; the 0.001° turn keeps the glyphs unsnapped, so a rise
   * glides through its last pixel instead of stepping, and nothing pops when it
   * lands (the settled state is painted the same way).
   */
  function riseFree(el, p, dist) {
    el.style.opacity = String(p);
    el.style.transform = `translate3d(0, ${((1 - p) * dist).toFixed(3)}px, 0) rotate(0.001deg)`;
  }
  const unpin = (el) => { el.style.willChange = "auto"; return el; };
  /*
   * Linen on the Linen ground is the ground itself: the Linen segment and chip
   * are left unpainted, so their frame alone draws them. Painted, a Linen field
   * under the soft mask or a fade rounds to 242 against the ground's 243 in
   * places, and the light edge left faint streaks across the empty 70 %.
   */
  const ground = (fill) => (fill === C.linen ? "transparent" : fill);
  const words = (parent, T) =>
    R.splitWords(R.text(parent, T.text, { role: "display-l", x: T.x, y: T.y, size: 80, lineHeight: 1.05, color: C.night, style: nowrap })).map(unpin);

  function build(root) {
    root.style.background = C.linen;

    const eyebrow = R.text(root, EYEBROW.text, { role: "eyebrow", x: EYEBROW.x, y: EYEBROW.y, size: 18, color: C.ash, style: nowrap });

    /* ---------- BEAT A ---------- */
    const groupA = R.box(root, { x: 0, y: 0, w: R.W, h: R.H });
    const titleA = words(groupA, TITLE_A);

    // The bar layer is 1 px larger all round so the mask carries the outline too;
    // children are placed in its padding box, whose origin is the bar's (120, 330).
    const bar = R.box(groupA, { x: BAR.x - 1, y: BAR.y - 1, w: BAR.w + 2, h: BAR.h + 2 }, { border: `1px solid ${C.dune}` });
    for (const S of SEGMENTS) {
      R.box(bar, { x: S.x - BAR.x, y: 0, w: S.w, h: BAR.h }, { background: ground(S.fill) });
      R.text(bar, S.num, {
        role: "numeral", x: S.x - BAR.x + NUM.dx, y: NUM.y - BAR.y, size: NUM.size, weight: 500, lineHeight: 1, color: S.ink, style: nowrap,
      });
    }

    const ratio = R.text(groupA, RATIO.text, { role: "caption", x: RATIO.x, y: RATIO.y, size: 20, color: C.ash, style: { ...nowrap, ...TABULAR } });
    const labels = LABELS.map((L) => R.text(groupA, L.text, { role: "eyebrow", x: L.x, y: L.y, size: 17, color: C.ash, style: nowrap }));

    // Fills first, then every hairline above them. Each chip owns its part of its
    // group's 1 px Dune frame (top and bottom along its width; the group's ends
    // carry the sides) so the frame grows with the chips, left to right. The
    // Linen chip also owns the rule at x 304: it arrives as a closed swatch.
    const chipFills = CHIPS.map((K) => R.box(groupA, { x: K.x, y: CHIP.y, w: CHIP.w, h: CHIP.h }, { background: ground(K.fill) }));
    const hair = (rect) => R.box(groupA, rect, { background: C.dune });
    const chips = CHIPS.map((K, i) => {
      const x0 = K.x - (K.first ? 1 : 0), x1 = K.x + CHIP.w + (K.last ? 1 : 0);
      const edges = [
        hair({ x: x0, y: CHIP.y - 1, w: x1 - x0, h: 1 }),
        hair({ x: x0, y: CHIP.y + CHIP.h, w: x1 - x0, h: 1 }),
      ];
      if (K.first) edges.push(hair({ x: K.x - 1, y: CHIP.y, w: 1, h: CHIP.h }));
      if (K.last) edges.push(hair({ x: K.x + CHIP.w, y: CHIP.y, w: 1, h: CHIP.h }));
      if (i === 0) edges.push(hair({ x: RULE_X, y: CHIP.y, w: 1, h: CHIP.h }));
      return { fill: chipFills[i], edges };
    });
    CHIPS.forEach((K, i) => {
      chips[i].name = R.text(groupA, K.name, { role: "display-m", x: K.x + K.dx, y: CHIP.nameY, size: 28, lineHeight: 1.1, color: C.night, style: { ...nowrap, ...LINING } });
      chips[i].hex = R.text(groupA, K.hex, { role: "caption", x: K.x, y: CHIP.hexY, size: 18, lineHeight: 1.2, color: C.ash, style: { ...nowrap, ...TABULAR } });
    });

    /* ---------- BEAT B ---------- */
    const groupB = R.box(root, { x: 0, y: 0, w: R.W, h: R.H });
    const titleB = words(groupB, TITLE_B);

    const tiles = WORLDS.map((W, i) => {
      const x = COLS[i % COLS.length], y = ROWS[Math.floor(i / COLS.length)];
      // The Linen world is nearly the ground itself: its 1 px Dune border is drawn
      // inside the tile, so its visible edge lines up with its neighbours' fields.
      const tile = R.box(groupB, { x, y, w: TILE.w, h: TILE.h }, { background: W.field, border: W.border ? `1px solid ${C.dune}` : "none" });
      const o = W.border ? -1 : 0; // children are placed in the padding box
      const ink = W.dark ? C.linen : C.night;
      R.box(tile, { x: TILE.w - TILE.inset - TILE.chip + o, y: TILE.inset + o, w: TILE.chip, h: TILE.chip }, { background: W.chip });
      R.text(tile, W.name, { role: "display-m", x: TILE.inset + W.dx + o, y: TILE.nameY + o, size: 34, lineHeight: 1.1, color: ink, style: { ...nowrap, ...LINING } });
      R.text(tile, W.status, { role: "caption", x: TILE.inset + W.sdx + o, y: TILE.statusY + o, size: 20, color: ink, style: nowrap });
      return tile;
    });

    els = { eyebrow, groupA, titleA, bar, ratio, labels, chips, groupB, titleB, tiles };
  }

  function render(t) {
    const { eyebrow, groupA, titleA, bar, ratio, labels, chips, groupB, titleB, tiles } = els;

    // The eyebrow rises once and stays through both beats.
    riseFree(eyebrow, R.tween(t, EYEBROW.at, R.dur.l), 16);

    /* BEAT A — rise in, hold, then one exit for the whole group. */
    const outA = R.tween(t, A_OUT, R.dur.m, E.exit);
    groupA.style.opacity = String(1 - outA);
    groupA.style.visibility = outA < 1 ? "visible" : "hidden";

    R.stagger(t, TITLE_A.at, titleA.length, WORD_GAP, R.dur.l, E.emphasized).forEach((p, i) => riseFree(titleA[i], p, 24));

    const barP = R.tween(t, BAR.at, BAR.dur, E.inOut);
    R.softReveal(bar, barP, 100, 26);
    bar.style.visibility = barP > 0 ? "visible" : "hidden";

    riseFree(ratio, R.tween(t, RATIO.at, R.dur.l), 16);
    labels.forEach((el, i) => riseFree(el, R.tween(t, LABELS[i].at, R.dur.l), 16));

    chips.forEach((K, i) => {
      const at = CHIP_AT + CHIP_GAP * i;
      const p = R.tween(t, at, R.dur.l);
      K.fill.style.opacity = String(p);
      for (const e of K.edges) e.style.opacity = String(p);
      const q = R.tween(t, at + CHIP_LABEL_LAG, R.dur.l);
      riseFree(K.name, q, 16);
      riseFree(K.hex, q, 16);
    });

    /* BEAT B — rise in and hold to the end. */
    groupB.style.visibility = t >= TITLE_B.at ? "visible" : "hidden";
    R.stagger(t, TITLE_B.at, titleB.length, WORD_GAP, R.dur.l, E.emphasized).forEach((p, i) => riseFree(titleB[i], p, 24));
    R.stagger(t, TILE_AT, tiles.length, TILE_GAP, R.dur.l).forEach((p, i) => riseFree(tiles[i], p, 16));

    return null;
  }

  // Grain 0 throughout: the runtime's grain is full-frame and must never fall on Linen.
  R.scene("colour", { build, render, grain: () => 0 });
})();
