/*
 * Scene 02 · "The direction, applied" (already-applied) — 8 s, from 7.0 s.
 *
 * Linen ground in the site's 5/7 asymmetry. Right: a quiet browser window whose
 * viewport runs the hero film on scene 01's clock (τ = 7.0 + t), frame-blended,
 * with the real homepage's first screen (film area transparent) settling over
 * it at 3 s. Left: the eyebrow and the board's sentence, four line blocks, word
 * by word. The runtime draws the light-wipe in; scene 03's crossfade takes us
 * out at 7.4 s, so everything holds to the end.
 */
(() => {
  const C = R.color;

  /* ---- geometry (stage px) ---- */
  const BROWSER = { x: 800, y: 264, w: 1000, h: 553 }; // 44 px bar → viewport 1000×509 at (800, 308)
  const S = 1000 / 1440; // the 1440-css homepage shown 1000 px wide
  // The site's hero: the 16:9 film covers the 1440×900 css hero as 1600×900 at css x −80;
  // the viewport starts at css y 36 (the dark announcement bar is cropped).
  const FILM = { x: -80 * S, y: -36 * S, w: 1600 * S, h: 900 * S };
  const PAGE = { x: 0, y: -36 * S, w: 1440 * S, h: 900 * S };

  /* ---- type ---- */
  const EYEBROW = { text: "The direction, applied", x: 120, y: 392 };
  const LINES = [
    { text: "Quiet enough to feel", y: 428 },
    { text: "expensive, warm enough", y: 491 },
    { text: "to feel like Cairo", y: 554 },
    { text: "in October.", y: 617 },
  ];

  /* ---- timing (local seconds) ---- */
  const FILM_T0 = 7.0; // scene 01's film clock continues
  const T_EYEBROW = 0.9;
  const T_WORDS = 1.1, WORD_GAP = 0.08;
  const T_PAGE = 3.0;

  let els = null;

  function build(root) {
    R.box(root, { x: 0, y: 0, w: R.W, h: R.H }, { background: C.linen });

    // Right: the window, the film, the page.
    const { viewport } = R.browser(root, BROWSER);
    viewport.style.background = C.night; // never seen: the film always covers it
    // Film frame blending: A shows frame n, B (above) frame n+1 at the fractional weight.
    const filmA = R.film(viewport, FILM);
    const filmB = R.film(viewport, FILM);
    const page = R.image(viewport, "site/home-desktop-hero-clear.webp", PAGE, { fit: "cover" });

    // Left: eyebrow and the board's sentence, one nowrap block per line.
    const eyebrow = R.text(root, EYEBROW.text, {
      role: "eyebrow", x: EYEBROW.x, y: EYEBROW.y, size: 18, color: C.ash, style: { whiteSpace: "nowrap" },
    });
    // The word stagger runs across the four lines in reading order.
    const words = LINES.flatMap((l) => R.splitWords(R.text(root, l.text, {
      role: "display-l", x: 120, y: l.y, size: 60, lineHeight: 1.05, tracking: "-0.01em", color: C.night,
      style: { whiteSpace: "nowrap" },
    })));

    els = { filmA, filmB, page, eyebrow, words };
  }

  function render(t) {
    const { filmA, filmB, page, eyebrow, words } = els;

    // The water: τ = 7.0 + t at native speed, blended between neighbouring frames.
    const tau = FILM_T0 + t;
    const fps = filmA.fps;
    const k = tau * fps;
    const frac = R.clamp(k - Math.floor(k + 1e-6));
    // at() swaps the frame and returns its decode; settled() below is what we wait on,
    // so a superseded decode here must not surface as an unhandled rejection.
    filmA.at(tau)?.catch(() => {});
    filmB.at(tau + 1 / fps)?.catch(() => {});
    filmB.wrap.style.opacity = String(frac);

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
