/*
 * Scene 05 · "Three lines, one house" (three-lines) — 9.4 s, from 45.9 s.
 *
 * The house's structure at a glance. The runtime dips through Linen out of the
 * boat tale; the title, alone on Linen, rises word by word and leaves. Then one
 * soft edge of light crosses the frame left→right and lays down three flat tone
 * fields, full bleed, 638 px wide with 3 px Linen seams: Blush clay (eterna),
 * Sea slate (eterno), Bone (eternal). Each line's photograph (a person seen
 * from behind) arrives out of its own tone, as images load on the site, in the
 * top 850 px of its panel and starts a slow 1.04 → 1.07 push. The bottom 230 px
 * stay tone: the line name rises there, then its audience and its tone. We hold
 * on the three pushes until scene 06's crossfade takes the frame.
 *
 * Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const E = R.ease;
  const FRAME = { x: 0, y: 0, w: R.W, h: R.H };
  const nowrap = { whiteSpace: "nowrap" };
  const NIGHT_75 = "rgba(23, 22, 20, 0.75)"; // Night at 75 %, as a colour so opacity stays free for the rise

  /* ---- geometry (stage px) ---- */
  const PANEL_W = 638, PANEL_H = R.H; // three portrait panels, 3 px Linen seams
  const PHOTO_H = 850; // photo in the top 638×850; y 850–1080 is the tone band that carries the text
  const INSET = 120; // text inset from each panel's edges: all text stays inside x 120–1800
  const NAME_Y = 868, SUB_Y = 956;
  // Sources are 1856×2304: cover renders them 684.7×850, ~47 px of width to place.
  //  eterna 42 %: both jambs of the arch stay in; feet at y ≈ 716 at full push.
  //  eterno 50 %: base scale 1.04 trims the source's 27 px white border (≈ 10 px
  //    rendered) with 7 px to spare top and bottom; the cover crop clears it on the sides.
  //  eternal 60 %: crops the dark pillar on the source's right edge and keeps the
  //    couple ≈ 26 px clear of the panel's right edge at 1.07.
  const PANELS = [
    { x: 0, tone: C.blush, src: "img/line-eterna.jpg", position: "42% 50%",
      name: "eterna", audience: "for her", tone_label: "Blush clay · #E3CFC4", ink: C.night, sub: NIGHT_75 },
    { x: 641, tone: C.slate, src: "img/line-eterno.jpg", position: "50% 50%",
      name: "eterno", audience: "for him", tone_label: "Sea slate · #1F3F50", ink: C.linen, sub: C.dune },
    { x: 1282, tone: C.bone, src: "img/line-eternal.jpg", position: "60% 50%",
      name: "eternal", audience: "for both", tone_label: "Bone · #E9E4D3", ink: C.night, sub: NIGHT_75 },
  ];
  const PUSH = { from: 1.04, to: 1.07 }; // around each photo's box centre (319, 425)

  /* ---- type: optical margins ----
   * Measured on the rendered frame with the site's fonts. At 120 px the T's
   * crossbar inks 4 px right of its box, so the title box sits at x 116 to put
   * the crossbar on the 120 margin. In the bands, each eyebrow's stem inks at
   * inset + 1; the names' round e inked at inset + 2, a hair right of the stem,
   * so the names move 2 px left and the round overshoots the stem by 1 px, as a
   * typesetter would hang it. Line boxes: the title's 122 px box is centred on
   * y 540 (caps 496–577, a touch above centre, where the eye puts it).
   */
  const TITLE_DX = -4;
  const NAME_DX = -2;

  /* ---- timing (scene-local seconds) ---- */
  const TITLE = { text: "Three lines, one house", x: 120 + TITLE_DX, y: 479, at: 0.9, gap: 0.08, out: 3.1 };
  const REVEAL = { at: 3.5, dur: R.dur.xl }; // one soft light edge across the whole frame
  const PHOTO_AT = [4.8, 4.92, 5.04]; // fade 600 ms, standard; each push starts with its fade
  const NAME_AT = [5.8, 5.92, 6.04]; // 24 px rise, 600 ms, emphasized
  const SUB_AT = [6.1, 6.22, 6.34]; // eyebrow + tone caption together, 16 px, 600 ms, standard

  let els = null;

  function build(root) {
    root.style.background = C.linen;

    /* BEAT A: the title alone on Linen, one line, vertically centred on 540. */
    const title = R.text(root, TITLE.text, {
      role: "display-xl", x: TITLE.x, y: TITLE.y, size: 120, lineHeight: 1.02, color: C.night, style: nowrap,
    });
    const titleWords = R.splitWords(title);

    /* BEAT B: the triptych — tone fields, photos, then the words in each band. */
    const triptych = R.box(root, FRAME);
    const panels = PANELS.map((P) => {
      const panel = R.box(triptych, { x: P.x, y: 0, w: PANEL_W, h: PANEL_H }, { background: P.tone, overflow: "hidden" });
      const photo = R.image(panel, P.src, { x: 0, y: 0, w: PANEL_W, h: PHOTO_H }, { fit: "cover", position: P.position });
      const rx = R.W - (P.x + PANEL_W - INSET); // the tone caption's right edge, as a CSS `right`
      const name = R.text(triptych, P.name, {
        role: "display-l", x: P.x + INSET + NAME_DX, y: NAME_Y, size: 72, lineHeight: 1.05, color: P.ink, style: nowrap,
      });
      // Eyebrow and caption share one line box height (1.2) so their baselines agree.
      const audience = R.text(triptych, P.audience, {
        role: "eyebrow", x: P.x + INSET, y: SUB_Y, size: 18, lineHeight: 1.2, color: P.sub, style: nowrap,
      });
      const label = R.text(triptych, P.tone_label, {
        role: "caption", right: rx, y: SUB_Y, size: 18, lineHeight: 1.2, color: P.sub, align: "right",
        style: { ...nowrap, fontVariantNumeric: "tabular-nums lining-nums" },
      });
      return { panel, photo, name, audience, label };
    });

    els = { title, titleWords, triptych, panels };
  }

  function render(t, ctx) {
    const { title, titleWords, triptych, panels } = els;
    const end = ctx.duration;

    /* BEAT A — the title rises word by word under the clearing dip, then exits. */
    R.stagger(t, TITLE.at, titleWords.length, TITLE.gap, R.dur.l, E.emphasized)
      .forEach((p, i) => R.rise(titleWords[i], p, 24));
    const titleOut = R.tween(t, TITLE.out, R.dur.m, E.exit);
    R.fade(title, 1 - titleOut);
    title.style.visibility = titleOut < 1 ? "visible" : "hidden";

    /* BEAT B — light lays down the three tone fields. */
    const reveal = R.tween(t, REVEAL.at, REVEAL.dur, E.inOut);
    R.softReveal(triptych, reveal, 100, 26);
    triptych.style.visibility = reveal > 0 ? "visible" : "hidden";

    panels.forEach((P, i) => {
      // The photo arrives out of its tone and pushes from that moment to the end.
      R.fade(P.photo.img, R.tween(t, PHOTO_AT[i], R.dur.l, E.standard));
      R.push(P.photo.img, R.tween(t, PHOTO_AT[i], end - PHOTO_AT[i], E.inOut), { scale: PUSH.from }, { scale: PUSH.to });
      R.rise(P.name, R.tween(t, NAME_AT[i], R.dur.l, E.emphasized), 24);
      const sub = R.tween(t, SUB_AT[i], R.dur.l, E.standard);
      R.rise(P.audience, sub, 16);
      R.rise(P.label, sub, 16);
    });

    return null;
  }

  // Grain 0 throughout: Linen and flat tone fields stay clean.
  const grain = () => 0;

  R.scene("three-lines", { build, render, grain });
})();
