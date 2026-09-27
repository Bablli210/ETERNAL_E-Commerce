/*
 * Scene 02 · "The direction, applied" (already-applied) — 8 s, from 7.0 s.
 *
 * Linen ground in the site's 5/7 asymmetry. Right: a quiet browser window whose
 * viewport runs the hero film on scene 01's clock (τ = 7.0 + t), frame-blended,
 * with the real homepage's first screen (film area transparent) settling over
 * it. Left: the eyebrow and the board's sentence, five line blocks, word by
 * word. The runtime draws the light-wipe in; scene 03's crossfade takes us out
 * at 7.4 s, so everything holds to the end.
 *
 *   0.0  the light-wipe reveals clean Linen. The window is not there yet: its
 *        film and scene 01's full-frame film would otherwise overlap in the
 *        wipe's soft edge, two bottles at two scales (the edge clears scene
 *        01's bottle at t ≈ 0.86 and the window's right edge at t ≈ 1.0).
 *   0.9  the window, film already running, rises 16 px and fades in (1200 ms,
 *        standard, the way the page itself arrives at 3.2).
 *   1.2  the eyebrow rises; 1.4 the sentence, word by word (done at 2.96).
 *   3.2  the capture settles over the moving water (1200 ms, standard).
 *   4.4  hold. Only the water moves.
 */
(() => {
  const C = R.color;

  /* ---- geometry (stage px) ---- */
  const BROWSER = { x: 800, y: 264, w: 1000, h: 553 }; // 44 px bar → viewport 1000×509 at (800, 308)
  const VIEW_H = BROWSER.h - 44;
  const S = 1000 / 1440; // the 1440-css homepage shown 1000 px wide
  // The site's hero: the 16:9 film covers the 1440×900 css hero as 1600×900 at css x −80;
  // the viewport starts at css y 36 (the dark announcement bar is cropped).
  const PAGE = { x: 0, y: -36 * S, w: 1440 * S, h: 900 * S };
  /*
   * The film sits bottom-aligned in the viewport (y −116, not the page's −25):
   * at the page's own framing the site headline 'Some things are never meant to
   * fade.' (stage y 632–698) runs across the bottle (y 475–710) and its label.
   * Raised 91 px, the bottle stands at y 384–619, clear of the headline's
   * tallest ascender and 44 px under the header; the 625 px film still covers
   * the 509 px viewport edge to edge, so no edge ever shows. The site's own fix
   * (the hero h1 held to the text column) is flagged to the site team.
   */
  const FILM = { x: -80 * S, y: VIEW_H - 900 * S, w: 1600 * S, h: 900 * S };

  /* ---- type ---- */
  // 64 px, the film's statement size (scenes 09 and 10), eyebrow 44 px above the
  // first line as there. Broken at the sentence's own joints, so the two halves
  // echo: 'Quiet enough / to feel expensive,' and 'warm enough / to feel like
  // Cairo' — then the coda. The block's ink centres on the window's mid-line.
  const EYEBROW = { text: "The direction, applied", x: 120, y: 356 };
  const LINE_Y = 400, LINE_PITCH = 67; // 64 × 1.05: ink y 359–721, centred on 540
  // dx hangs each line's first glyph on the eyebrow's x 120 (the Q's bowl by 3 px).
  const LINES = [
    { text: "Quiet enough", dx: -3 },
    { text: "to feel expensive,", dx: -1 },
    { text: "warm enough", dx: 0 },
    { text: "to feel like Cairo", dx: -1 },
    { text: "in October.", dx: -1 },
  ];

  /* ---- timing (local seconds) ---- */
  const FILM_T0 = 7.0; // scene 01's film clock continues
  const T_BROWSER = 0.9; // after the wipe's soft edge has cleared scene 01's bottle
  const T_EYEBROW = 1.2;
  const T_WORDS = 1.4, WORD_GAP = 0.08;
  const T_PAGE = 3.2;

  let els = null;

  function build(root) {
    R.box(root, { x: 0, y: 0, w: R.W, h: R.H }, { background: C.linen });

    // Right: the window, the film, the page.
    const { frame, viewport } = R.browser(root, BROWSER);
    viewport.style.background = C.night; // never seen: the film always covers it
    // Film frame blending: A shows frame n, B (above) frame n+1 at the fractional weight.
    const filmA = R.film(viewport, FILM);
    const filmB = R.film(viewport, FILM);
    const page = R.image(viewport, "site/home-desktop-hero-clear.webp", PAGE, { fit: "cover" });

    // Left: eyebrow and the board's sentence, one nowrap block per line.
    const eyebrow = R.text(root, EYEBROW.text, {
      role: "eyebrow", x: EYEBROW.x, y: EYEBROW.y, size: 18, color: C.ash, style: { whiteSpace: "nowrap" },
    });
    // The word stagger runs across the lines in reading order.
    const words = LINES.flatMap((l, i) => R.splitWords(R.text(root, l.text, {
      role: "display-l", x: 120 + l.dx, y: LINE_Y + i * LINE_PITCH, size: 64, lineHeight: 1.05, tracking: "-0.01em", color: C.night,
      style: { whiteSpace: "nowrap" },
    })));

    els = { frame, filmA, filmB, page, eyebrow, words };
  }

  function render(t) {
    const { frame, filmA, filmB, page, eyebrow, words } = els;

    // The water: τ = 7.0 + t at native speed, blended between neighbouring frames.
    // It runs from t = 0 even while the window is hidden, so it is continuous.
    const tau = FILM_T0 + t;
    const fps = filmA.fps;
    const k = tau * fps;
    const frac = R.clamp(k - Math.floor(k + 1e-6));
    // at() swaps the frame and returns its decode; settled() below is what we wait on,
    // so a superseded decode here must not surface as an unhandled rejection.
    filmA.at(tau)?.catch(() => {});
    filmB.at(tau + 1 / fps)?.catch(() => {});
    filmB.wrap.style.opacity = String(frac);

    // The window arrives once the wipe has passed: one group, 16 px rise, at rest untransformed.
    // 1200 ms standard, as the page arrives: a dark window on Linen settles, it does not pop.
    const b = R.tween(t, T_BROWSER, R.dur.xl, R.ease.standard);
    frame.style.opacity = String(b);
    frame.style.transform = b >= 1 ? "none" : `translate(0, ${((1 - b) * 16).toFixed(3)}px)`;

    // The real page settles over the moving water.
    R.fade(page.wrap, R.tween(t, T_PAGE, R.dur.xl, R.ease.standard));

    // Type.
    R.rise(eyebrow, R.tween(t, T_EYEBROW, R.dur.l, R.ease.standard), 16);
    words.forEach((w, i) => R.rise(w, R.tween(t, T_WORDS + i * WORD_GAP, R.dur.l, R.ease.emphasized), 24));

    // Wait until both film frames on screen are decoded.
    return Promise.all([settled(filmA.img), settled(filmB.img)]);
  }

  /*
   * A decode that only fails for real. If a later seek swaps the frame before this
   * decode finishes (e.g. a tool seeks while the runtime's first seek(0) is still
   * in flight), the browser rejects the stale decode with EncodingError; that seek
   * then waits on its own decode, so the stale one simply resolves. Asking every
   * frame (not only when the frame changes) also covers a repeat seek landing on a
   * frame whose decode is still pending.
   */
  function settled(img) {
    const src = img.src;
    return img.decode().catch((err) => { if (img.src === src) throw err; });
  }

  R.scene("already-applied", { build, render, grain: () => 0 });
})();
