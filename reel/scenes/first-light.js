/*
 * Scene 01 — First light (0 → 8.2 s, cut in).
 *
 * Night. The e∞ mark signs the film in one stroke. A soft edge of low light
 * crosses the frame left→right and reveals the hero film (the eterno Wayne
 * bottle on wet stone at golden hour), which carries the mark away with it.
 * A scrim settles over the open sea on the left and the direction is named:
 * an eyebrow, then "Salt, stone and golden hour." word by word. Then only the
 * water and a slow 3 % push move until scene 02's light-wipe takes the frame.
 *
 * Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const FRAME = { x: 0, y: 0, w: R.W, h: R.H };
  const FILM_FPS = 24;
  // The push is anchored on the bottle (stage 1360, 540) so the product holds
  // still while the sea and stone widen around it.
  const FILM_ORIGIN = "70.8% 50%";

  // Beats (scene-local seconds).
  const MARK_AT = 0.2, MARK_DUR = 1.2;
  const REVEAL_AT = 1.8, REVEAL_DUR = 1.2;
  const PUSH_AT = 1.8, PUSH_END = 8.2, PUSH_TO = 1.03;
  const SCRIM_AT = 3.0, SCRIM_DUR = 1.2;
  const EYEBROW_AT = 3.4;
  const WORDS_AT = 3.6, WORD_GAP = 0.08;

  const nowrap = { whiteSpace: "nowrap" };
  // Optical margin. At 120 px the serif's S and a carry 8.5 and 5.5 px of
  // side bearing, so boxes at x 120 would set their ink at 128.5 and 125.5,
  // visibly indented from the eyebrow's T (ink at 120.5). The boxes move left
  // by the bearings so all three lines put their ink on the same edge, x 120.5,
  // inside the title-safe line.
  const display = (text, x, y) => ({
    text,
    opts: { role: "display-xl", x, y, size: 120, lineHeight: 1.02, tracking: "-0.01em", color: C.linen, style: nowrap },
  });

  R.scene("first-light", {
    build(root, ctx) {
      // (1) Night field.
      root.style.background = C.night;

      // (2) The e∞ mark, centred on (960, 540): 240×120 box, stroke 3 viewBox
      // units = 7.5 px rendered — the site's own weight.
      const mark = R.mark(root, { x: 840, y: 480, width: 240, color: C.linen, stroke: 3 });

      // (3) The film layer: two stacked frames of the hero film for frame
      // blending (A = frame at τ, B = the next frame, over A by the fraction).
      const filmLayer = R.box(root, FRAME);
      const filmA = R.film(filmLayer, FRAME);
      const filmB = R.film(filmLayer, FRAME);
      for (const f of [filmA, filmB]) f.img.style.transformOrigin = FILM_ORIGIN;

      // (4) Legibility scrim over the open sea, left side only.
      const scrim = R.box(root, FRAME, {
        background: "linear-gradient(90deg, rgba(23,22,20,.50) 0%, rgba(23,22,20,.28) 38%, rgba(23,22,20,0) 62%)",
        opacity: 0,
        pointerEvents: "none",
      });

      // (5) Type. One R.text block per line, nowrap, at the storyboard's
      // coordinates; the two display lines carry the optical-margin offset.
      const eyebrow = R.text(root, "The direction", { role: "eyebrow", x: 120, y: 452, size: 18, color: C.dune, style: nowrap });
      const lines = [display("Salt, stone", 112, 492), display("and golden hour.", 115, 614)].map((l) => R.text(root, l.text, l.opts));
      // Word stagger runs across both lines in reading order.
      const words = lines.flatMap((el) => R.splitWords(el));

      ctx.parts = { mark, filmLayer, films: [filmA, filmB], scrim, eyebrow, words };
    },

    render(t, ctx) {
      const { mark, filmLayer, films, scrim, eyebrow, words } = ctx.parts;
      const [filmA, filmB] = films;

      // Mark: one continuous stroke — bar, bowl, loop — then it holds still.
      // inOut, not emphasized: emphasized lays down 43 % of the stroke (the
      // whole e) in the first three frames and then creeps for 0.8 s; inOut
      // sets the pen down, travels at an even hand's pace and lands at 1.4 s.
      R.drawMark(mark, R.tween(t, MARK_AT, MARK_DUR, R.ease.inOut));

      // Film: always running at native speed (τ = t), frame-blended.
      const tau = t;
      const f = tau * FILM_FPS;
      let frac = R.clamp(f - Math.floor(f + 1e-6));
      if (frac < 1e-4) frac = 0;
      // B is only swapped when it shows. At frac 0 it is invisible, so the
      // pixels are the same whatever frame it holds, and a seek that lands on
      // a film frame boundary (t = 0 at boot among them) starts no decode that
      // a following seek could interrupt.
      const pending = [filmA.at(tau), frac > 0 ? filmB.at(tau + 1 / FILM_FPS) : null].filter(Boolean);
      filmB.wrap.style.opacity = String(frac);

      // Slow push, identical on both frames.
      const push = R.tween(t, PUSH_AT, PUSH_END - PUSH_AT, R.ease.inOut);
      for (const film of films) R.push(film.img, push, { scale: 1 }, { scale: PUSH_TO });

      // Light reveals the film left→right; the mark beneath goes with it.
      R.softReveal(filmLayer, R.tween(t, REVEAL_AT, REVEAL_DUR, R.ease.inOut), 100, 26);

      // Scrim, eyebrow, headline.
      R.fade(scrim, R.tween(t, SCRIM_AT, SCRIM_DUR, R.ease.standard));
      R.rise(eyebrow, R.tween(t, EYEBROW_AT, R.dur.l, R.ease.standard), 16);
      R.stagger(t, WORDS_AT, words.length, WORD_GAP, R.dur.l, R.ease.emphasized).forEach((p, i) => R.rise(words[i], p, 24));

      return pending.length ? Promise.all(pending) : null;
    },

    // 0.035 until 7.0 s, then down to 0 by 7.6 s so scene 02's Linen stays clean.
    grain: (t) => (t < 7.0 ? 0.035 : Math.max(0, 0.035 * (1 - (t - 7.0) / 0.6))),
  });
})();
