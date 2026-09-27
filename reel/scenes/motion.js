/*
 * Scene 08 · "Motion" (motion) — 6 s, from 69.7 s.
 *
 * Motion named as a rule of the direction, and the scene obeys what it says.
 * Linen in the 5/7 asymmetry: on the left an eyebrow and two of the motion
 * board's six rules; on the right a flat panel of After dark (#2B2A28, the
 * site's own placeholder wash for that mood), bleeding off three edges.
 *
 *   0.0  the runtime crossfades us in: Linen, the flat panel, nothing drawn.
 *   0.5  "Motion" rises; from 0.6 "One thing at a time." rises word by word.
 *   1.6  the e∞ mark draws alone in one stroke, as the site's loader does.
 *   2.8  it holds still.
 *   3.0  "Light, not decoration." rises word by word.
 *   3.9  the After dark photograph comes up out of its colour — how every
 *        image loads on the site — as the mark sinks back into that colour;
 *        its slow 3 % push starts.
 *   5.1  hold; only the push moves. Scene 09's crossfade takes us from 5.4.
 *
 * Each rule finishes before its demonstration starts. Nothing fades out at the
 * end. Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const E = R.ease;
  const AFTER_DARK = "#2B2A28"; // content/taxonomy.ts · moods · after-dark · wash
  const nowrap = { whiteSpace: "nowrap" };

  /* ---- geometry (stage px) ---- */
  const PANEL = { x: 800, y: 0, w: 1120, h: 1080 }; // 7 columns, bleeding right/top/bottom (as scenes 02, 03)
  const FULL = { x: 0, y: 0, w: PANEL.w, h: PANEL.h }; // panel-local
  // The mark, panel-local: stage x 1240–1480, y 480–600, centred on (1360, 540).
  // Stroke 3 viewBox units = 7.5 px rendered, the same mark as scene 01.
  const MARK = { x: 440, y: 480, width: 240, color: C.linen, stroke: 3 };
  // Drawn on inOut, as in scene 01, so the film's mark always draws the same
  // way. Emphasized over 1.2 s lays down 43 % of the stroke (bar and bowl of
  // the e) in three frames and then creeps for 0.8 s; inOut sets the pen down,
  // travels at an even hand's pace and lands at 2.8 s.
  const MARK_AT = 1.6, MARK_DUR = R.dur.xl;

  // The photo: 2400×1792 covers 1120×1080 at 1446×1080; 55 % keeps source
  // x 297–2155, so the resin lands where the mark was drawn and the smoke rises
  // toward the Linen column.
  //
  // It arrives as an image does on the site (G7): the panel is its colour-world
  // placeholder and the picture fades in over that colour. The picture comes
  // up over 1200 ms on the reel's light curve (inOut, the curve of every soft
  // light edge in the film); the standard curve put 30 % of it on screen in
  // three frames, a switch rather than light coming up on stone. Over the first
  // 600 ms of it the mark sinks back into the colour (the placeholder covering
  // it), so the two meet as one dissolve through After dark: at mid-fade the
  // mark is gone while the stone is still mostly shadow, never the mark printed
  // over a readable photograph, which the brand does not do.
  //
  // `full` is where the fade lands. Chrome blends a translucent layer in 8 bits
  // and truncates, so every frame of a fade sits about one level below the true
  // mix, and the frame the opacity reaches exactly 1 the whole panel stepped up
  // one level at once: a visible tick on a field that had otherwise settled.
  // Landing at 0.99 keeps the same arithmetic from the fade's first frame to
  // the scene's last, so the picture settles without a step (0.99 is 252/255:
  // the colour world stays under the photo at 1 %, never visible as such).
  const PHOTO = { src: "img/mood-after-dark.jpg", position: "55% 50%", at: 3.9, cover: R.dur.l, dur: R.dur.xl, full: 0.99 };
  const PUSH = { at: 3.9, end: 6.0, to: 1.03 }; // around the panel centre, scale only

  /* ---- the left column: x 120–720, block y 402–678, centred on 540 ---- */
  const X = 120;
  const EYEBROW = { text: "Motion", y: 402, at: 0.5 };
  // Optical margin, measured on the rendered frame with the site's fonts: at
  // 72 px the round O carries 3 px of side bearing and the L's serif 2 px, so
  // boxes at x 120 inked at 123 and 122, visibly indented from the eyebrow's M
  // (ink at 121). Each line moves left by its bearing, as in scenes 01 and 03:
  // stems and serifs ink at 121 with the eyebrow, the round O overshoots to 120,
  // and nothing inks left of the 120 title-safe line.
  const RULES = [
    { text: "One thing at a time.", y: 442, at: 0.6, dx: -3 },
    { text: "Light, not decoration.", y: 602, at: 3.0, dx: -1 },
  ];
  const WORD_GAP = 0.08;

  let els = null;

  /*
   * The spec's rise (opacity 0→1 while travelling `dist` px up), made
   * order-independent, as in scenes 03 and 06: `.word` and R.image's <img>
   * carry will-change: transform, and Chrome keeps a will-change layer's raster
   * from whatever sub-pixel offset it was first painted at, so a settled word
   * could differ with the frames painted before it. unpin() drops the hint; the
   * 0.001° turn, held through the rise and at rest, keeps the glyphs placed at
   * their true sub-pixel offset so the settle glides instead of stepping.
   */
  function riseFree(el, p, dist) {
    el.style.opacity = String(p);
    el.style.transform = `translate3d(0, ${((1 - p) * dist).toFixed(3)}px, 0) rotate(0.001deg)`;
  }
  function unpin(el) {
    el.style.willChange = "auto";
    return el;
  }
  // The slow push as a 2D scale (no compositor layer, so every frame resamples
  // at its exact scale whatever was painted before). Never below 1, around the
  // panel centre: no edge of the photo can show.
  function push(img, p) {
    img.style.transform = `scale(${R.lerp(1, PUSH.to, p).toFixed(5)})`;
  }

  function build(root) {
    R.box(root, { x: 0, y: 0, w: R.W, h: R.H }, { background: C.linen });

    /* Right: the After dark panel; the mark, then the photo above it. */
    const panel = R.box(root, PANEL, { overflow: "hidden", background: AFTER_DARK });
    const mark = R.mark(panel, MARK);
    const photo = R.image(panel, PHOTO.src, FULL, { position: PHOTO.position });
    unpin(photo.img);

    /* Left: the eyebrow and the two rules, one R.text block per line. */
    const eyebrow = R.text(root, EYEBROW.text, { role: "eyebrow", x: X, y: EYEBROW.y, size: 18, color: C.ash, style: nowrap });
    const rules = RULES.map((L) => R.splitWords(R.text(root, L.text, {
      role: "display-l", x: X + L.dx, y: L.y, size: 72, weight: 600, lineHeight: 1.05, tracking: "-0.01em", color: C.night, style: nowrap,
    })).map(unpin));

    els = { mark, photo, eyebrow, rules };
  }

  function render(t) {
    const { mark, photo, eyebrow, rules } = els;

    /* Left column. */
    riseFree(eyebrow, R.tween(t, EYEBROW.at, R.dur.l, E.standard), 16);
    RULES.forEach((L, i) => {
      R.stagger(t, L.at, rules[i].length, WORD_GAP, R.dur.l, E.emphasized).forEach((p, j) => riseFree(rules[i][j], p, 24));
    });

    /* The mark: one continuous stroke — bar, bowl, loop — then still. */
    R.drawMark(mark, R.tween(t, MARK_AT, MARK_DUR, E.inOut));

    /* The photo comes up out of its colour, over the mark, and pushes slowly. */
    const cover = R.tween(t, PHOTO.at, PHOTO.cover, E.inOut);
    const light = R.tween(t, PHOTO.at, PHOTO.dur, E.inOut);
    mark.svg.style.opacity = String(1 - cover);
    photo.img.style.opacity = String(PHOTO.full * light);
    photo.wrap.style.visibility = light > 0 ? "visible" : "hidden";
    push(photo.img, R.tween(t, PUSH.at, PUSH.end - PUSH.at, E.inOut));

    return null;
  }

  // Grain 0 throughout: the runtime's grain is full-frame and would fall on the Linen column.
  R.scene("motion", { build, render, grain: () => 0 });
})();
