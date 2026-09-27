/*
 * Scene 11 — Never meant to fade (88.3 → 94.7 s, light-wipe in, 1.2 s).
 *
 * The film closes where it opened. The hero film returns full-bleed with
 * scene 01's framing, frame blending, push and scrim, and the house signs it:
 * the wordmark "eternal", a short Dune hairline and the tagline, set in the
 * open sea on the left and never crossing the bottle. From 3.8 s only the
 * water and the slow push move; the frame at exactly t = 6.4 s is the end
 * card that stays on screen for the conversation. No fade to black.
 *
 *   0.0  the runtime's light-wipe (1.2 s) carries scene 10's phones off and
 *        reveals the film; the 3 % push starts (0 → 6.4 s, inOut).
 *   0.6  the left scrim fades in over 1200 ms, standard.
 *   1.4  the wordmark fades in and rises 24 px as one unit, 1200 ms,
 *        emphasized.
 *   2.4  the hairline draws left→right, 600 ms, standard.
 *   2.7  the tagline rises word by word (24 px, 600 ms, emphasized, 80 ms
 *        stagger; 7 words, settled at 3.78 s).
 *   3.8  hold to the end.
 *
 * Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const FRAME = { x: 0, y: 0, w: R.W, h: R.H };
  const FILM_FPS = 24;
  // As scene 01: the push is anchored on the bottle (stage 1360, 540), so the
  // product holds still while the sea and the stone widen around it.
  const FILM_ORIGIN = "70.8% 50%";
  const SCRIM = "linear-gradient(90deg, rgba(23,22,20,.50) 0%, rgba(23,22,20,.28) 38%, rgba(23,22,20,0) 62%)";

  // Beats (scene-local seconds).
  const PUSH_AT = 0, PUSH_END = 6.4, PUSH_TO = 1.03;
  const SCRIM_AT = 0.6, SCRIM_DUR = R.dur.xl;
  const MARK_AT = 1.4, MARK_DUR = R.dur.xl, MARK_RISE = 24;
  const RULE_AT = 2.4, RULE_DUR = R.dur.l;
  const WORDS_AT = 2.7, WORD_GAP = 0.08, WORD_DUR = R.dur.l, WORD_RISE = 24;

  const nowrap = { whiteSpace: "nowrap" };

  /*
   * The signature block, on one left edge. The hairline is the one element
   * whose ink sits exactly where its box does, so it sets the edge: x 124.
   * The two lines of type are moved left by their side bearings, measured in
   * Chromium on the storefront's own font files, so their ink lands on it:
   *   - "eternal", 168 px 600: the e's bowl starts 5.25 px inside its box.
   *     Box at 118 puts the bowl's extreme at 123.25, the ~0.75 px overshoot a
   *     round needs to look flush with a straight edge.
   *   - the tagline, 52 px 500 italic: the S starts 1.6 px inside its box.
   *     Box at 122 puts it at 123.6, the same overshoot.
   * Vertically the block is the storyboard's: wordmark box 380–548 (baseline
   * 517.5, ascender top 394), hairline at 590, tagline box 616–678 (baseline
   * 663.75, descender 678.4). Ink 394–678 centres on y 536, just above the
   * frame's centre, where the eye puts it. Tagline ink ends at x 800; the
   * bottle starts at 1222.
   */
  const WORDMARK = { text: "eternal", x: 118, y: 380 };
  const RULE = { x: 124, y: 590, w: 64, h: 1 };
  const TAGLINE = { text: "Some things are never meant to fade.", x: 122, y: 616 };
  const LINEN_92 = "rgba(243, 239, 231, 0.92)";

  R.scene("never-meant-to-fade", {
    build(root, ctx) {
      // Night underneath, as the storyboard's background; the film covers it.
      root.style.background = C.night;

      // The film: two stacked frames for blending (A = frame at τ, B = the
      // next frame, over A by the fraction). Identical transforms on both.
      const filmLayer = R.box(root, FRAME);
      const filmA = R.film(filmLayer, FRAME);
      const filmB = R.film(filmLayer, FRAME);
      for (const f of [filmA, filmB]) f.img.style.transformOrigin = FILM_ORIGIN;

      // Scene 01's legibility scrim over the open sea, left side only.
      const scrim = R.box(root, FRAME, { background: SCRIM, opacity: 0, pointerEvents: "none" });

      // The wordmark: set as type in the Wordmark component's face —
      // Cormorant Garamond 600, lowercase, tracking 0.02em — 168 px, Linen.
      const wordmark = R.text(root, WORDMARK.text, {
        role: "wordmark", x: WORDMARK.x, y: WORDMARK.y, size: 168, lineHeight: 1, tracking: "0.02em", color: C.linen, style: nowrap,
      });

      // A short Dune hairline, drawn from its left end.
      const rule = R.hairline(root, RULE, C.dune, "left");

      // The tagline: one line, nowrap, Cormorant Garamond 500 italic 52/1.2,
      // Linen at 92 %. Split into words so it can rise word by word.
      const tagline = R.text(root, TAGLINE.text, {
        role: "signature", x: TAGLINE.x, y: TAGLINE.y, size: 52, lineHeight: 1.2, color: LINEN_92, style: nowrap,
      });
      const words = R.splitWords(tagline);

      ctx.parts = { films: [filmA, filmB], scrim, wordmark, rule, words };
    },

    render(t, ctx) {
      const { films, scrim, wordmark, rule, words } = ctx.parts;
      const [filmA, filmB] = films;

      // Film: always running at native speed (τ = t), frame-blended.
      const tau = t;
      const f = tau * FILM_FPS;
      let frac = R.clamp(f - Math.floor(f + 1e-6));
      if (frac < 1e-4) frac = 0;
      // B is only swapped when it shows: at frac 0 it is invisible, so its
      // frame does not matter, and a seek on a frame boundary starts no decode
      // that a following seek could interrupt.
      const pending = [filmA.at(tau), frac > 0 ? filmB.at(tau + 1 / FILM_FPS) : null].filter(Boolean);
      filmB.wrap.style.opacity = String(frac);

      // Slow push, identical on both frames, from the first frame to the last.
      const push = R.tween(t, PUSH_AT, PUSH_END - PUSH_AT, R.ease.inOut);
      for (const film of films) R.push(film.img, push, { scale: 1 }, { scale: PUSH_TO });

      // Scrim, wordmark (one unit), hairline, tagline word by word.
      R.fade(scrim, R.tween(t, SCRIM_AT, SCRIM_DUR, R.ease.standard));
      R.rise(wordmark, R.tween(t, MARK_AT, MARK_DUR, R.ease.emphasized), MARK_RISE);
      R.drawLine(rule, R.tween(t, RULE_AT, RULE_DUR, R.ease.standard));
      R.stagger(t, WORDS_AT, words.length, WORD_GAP, WORD_DUR, R.ease.emphasized).forEach((p, i) => R.rise(words[i], p, WORD_RISE));

      return pending.length ? Promise.all(pending) : null;
    },

    // No grain while the wipe passes over scene 10's Sand; it comes up from
    // 0.9 s and reaches 0.035 at 1.5 s, then holds under the end card.
    grain: (t) => (t < 0.9 ? 0 : Math.min(0.035, (0.035 * (t - 0.9)) / 0.6)),
  });
})();
