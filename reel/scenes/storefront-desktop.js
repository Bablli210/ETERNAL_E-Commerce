/*
 * Scene 09 · "The storefront" (storefront-desktop) — 7.6 s, from 75.1 s.
 *
 * Depth of proof: two more real pages in a quiet browser, carrying the light
 * and the photographs the client has just felt. Sand ground; a browser window
 * at (600, 212), 1200×661, whose 1200×617 viewport shows the 1440-css pages
 * at 0.8333 (740 css rows). The left column (x 120–520) holds a fixed eyebrow
 * and one page name per window.
 *
 *   0.0  the runtime crossfades us in from Motion (600 ms) onto flat Sand: only
 *        Motion's column and its photograph dissolve, nothing of ours is in it.
 *   0.6  "The storefront" rises, on clean Sand.
 *   0.65 the browser, already on the Tales page (W1), rises 16 px.
 *   1.1  "Tales" rises as one unit.
 *   3.9  W1 → W2 inside the viewport only, through its Linen, as the site's G2
 *        does (the old body goes, the new one fades in on the ground): W1 and
 *        "Tales" leave together over 320 ms. W2 is the homepage's Shop by mood
 *        at rest: the six tiles alone in Linen, the site's own heading out of
 *        frame. No frame holds both pages.
 *   4.22 as "Tales" leaves, "Shop by mood" rises with the page it names, which
 *        fades in over 600 ms: each page name is on screen for as long as its
 *        page, and each page is readable for about 3 s.
 *   4.8  hold. Scene 10's crossfade takes the frame from 7.0; nothing fades,
 *        and the Sand and the eyebrow carry straight on into scene 10.
 *
 * Pure function of t: every animated property is written on every call.
 */
(() => {
  const C = R.color;
  const E = R.ease;
  const nowrap = { whiteSpace: "nowrap" };

  /* ---- geometry (stage px) ---- */
  const BROWSER = { x: 600, y: 212, w: 1200, h: 661 }; // 44 px bar → viewport 1200×617 at (600, 256)
  const CSS_W = 1440;
  const S = BROWSER.w / CSS_W; // 0.8333: 617 px show 740 css rows

  const VP = { w: BROWSER.w, h: BROWSER.h - 44 }; // the viewport, 1200×617 (740.4 css rows)

  /*
   * The two windows, as the css page-y at the viewport's top. Both hold still, on
   * whole stage pixels (css × 0.8333), so the captures are crisp.
   *  W1 tales-desktop at css 36 (the blank bar cropped): the header, 'One story
   *     per bottle.' and the featured Shadow of the Sea tale down to 'Read the
   *     tale'; bottom css 776.4.
   *  W2 home-desktop at css 4860 (stage 4050): the six tiles alone in Linen,
   *     37 px of Linen above them and 47 below, a touch above centre. The board's
   *     4870 left 29 px above and 55 below, the tiles pressed up under the
   *     window's bar. The site's '03 / Shop by mood' heading (ink css 4761–4818)
   *     and its line (ink ends css 4853) are out of frame, so the left column's
   *     "Shop by mood" is the only copy of that name on screen; the bottom
   *     (css 5600) stays above 'Try before you commit' (5665). It used to drift
   *     here from the heading, which kept the label waiting 2.2 s for the site's
   *     heading to leave and left the column empty meanwhile.
   * `crop` is the band of the capture each window reads (css px); both bands
   * start and end on whole stage pixels, and are 744 css rows (620 px) long, so
   * each resizes 2.4 : 1 exactly.
   */
  const W1 = { name: "tales-desktop", at: 36, crop: [36, 780] };
  const W2 = { name: "home-desktop", at: 4860, crop: [4860, 5604] };

  /* ---- type ----
   * Optical margins, measured on the rendered frame with the site's fonts: the
   * eyebrow's T inks at 120 (its box, as in scene 10, which continues it
   * unchanged). At 64 px the display T carries 2 px of side bearing and the
   * round S 4 px, so each page name moves left by its bearing and inks at 120
   * with the eyebrow; nothing inks left of the title-safe line.
   * Eyebrow caps y 258–272; names' caps from y 311, baseline 353.
   */
  const X = 120;
  const EYEBROW = { text: "The storefront", x: X, y: 256, at: 0.6 };
  const TITLE_Y = 300;
  const TALES = { text: "Tales", dx: -2, at: 1.1, out: 3.9 };
  /*
   * "Shop by mood" rises as "Tales" finishes leaving (3.9 + 320 ms), with W1:
   * "Tales" and W1 are at 10 % on the frame at 4.20 and gone on the next, where
   * "Shop by mood" and W2 start, so no frame holds both names or both pages, and
   * the label names its page from the moment the page is there.
   */
  const MOOD = { text: "Shop by mood", dx: -4, at: TALES.out + R.dur.m };

  /* ---- timing (scene-local seconds) ---- */
  // After the runtime's 600 ms crossfade from Motion: while it runs, the frame
  // holds only Motion dissolving into flat Sand. Rising inside it, the browser
  // met Motion's two lines and resin photo mid-dissolve (three headlines, and
  // Motion's panel edge through the page).
  const BROWSER_IN = { at: 0.65, dur: R.dur.l };
  /*
   * W1 leaves as its name does (320 ms, exit); W2 comes in with its name on the
   * symmetric curve the runtime uses for whole-frame dissolves. Page over page on
   * the standard curve jumped 20 % on its first frame and left the Tales type
   * ghosted over the tiles for a third of a second.
   */
  const SWAP = { at: TALES.out, out: R.dur.m, in: MOOD.at, dur: R.dur.l };

  let els = null;

  /*
   * The spec's rise, order-independent, as in scenes 03, 06 and 08: the 0.001°
   * turn keeps glyphs at their true sub-pixel offset through the rise so the
   * settle glides instead of stepping, and it is held at rest: dropping it on
   * landing re-rasterises the glyphs, a one-frame tick on still type. The
   * eyebrow's ink sits exactly where scene 10's static eyebrow does (x 120–313,
   * y 258–272); their few-level antialiasing difference blends away in the
   * 600 ms crossfade instead of ticking at 1.2 s.
   */
  function riseFree(el, p, dist) {
    el.style.opacity = String(p);
    el.style.transform = `translate3d(0, ${((1 - p) * dist).toFixed(3)}px, 0) rotate(0.001deg)`;
  }

  /*
   * The captures are read as bands, not placed with R.capture. home-desktop.jpg
   * decodes to 206 MB (2880 × 17892): as an <img>, the runtime's decode() of it
   * fails ("The source image cannot be decoded") whenever other large images
   * share the page, which the full film always does (checked with scene 08
   * beside it). So each window reads only the band it shows, cropped from the
   * 2× capture and resized once with the browser's high-quality filter, and
   * draws it on a canvas: no <img> of either capture is ever in the DOM.
   * The band is display width, and `vScale` × display height.
   */
  async function band({ name, crop }, vScale) {
    const meta = R.manifest[`site/${name}.jpg`];
    const k = meta.w / CSS_W; // source px per css px (2)
    const blob = await (await fetch(R.asset(`site/${name}.jpg`))).blob();
    const h = Math.round((crop[1] - crop[0]) * S * vScale);
    return createImageBitmap(blob, 0, Math.round(crop[0] * k), meta.w, Math.round((crop[1] - crop[0]) * k),
      { resizeWidth: VP.w, resizeHeight: h, resizeQuality: "high" });
  }
  const canvasIn = (viewport) => R.el("canvas", { attrs: { width: VP.w, height: VP.h }, style: {
    position: "absolute", left: "0", top: "0", width: `${VP.w}px`, height: `${VP.h}px`,
  } }, viewport);

  /* A window holds still: its band at display size, drawn once. */
  async function still(viewport, W) {
    const bitmap = await band(W, 1);
    const canvas = canvasIn(viewport);
    canvas.getContext("2d").drawImage(bitmap, 0, (W.crop[0] - W.at) * S);
    bitmap.close();
    return { canvas };
  }

  async function build(root) {
    R.box(root, { x: 0, y: 0, w: R.W, h: R.H }, { background: C.sand });

    const { frame, viewport } = R.browser(root, BROWSER);
    const w1 = await still(viewport, W1);
    const w2 = await still(viewport, W2);

    const eyebrow = R.text(root, EYEBROW.text, { role: "eyebrow", x: EYEBROW.x, y: EYEBROW.y, size: 18, color: C.ash, style: nowrap });
    const title = (L) => R.text(root, L.text, {
      role: "display-l", x: X + L.dx, y: TITLE_Y, size: 64, weight: 600, lineHeight: 1.05, tracking: "-0.01em", color: C.night, style: nowrap,
    });
    const tales = title(TALES);
    const mood = title(MOOD);

    els = { frame, w1, w2, eyebrow, tales, mood };
  }

  function render(t) {
    const { frame, w1, w2, eyebrow, tales, mood } = els;

    /* The browser arrives already on the Tales page. */
    const b = R.tween(t, BROWSER_IN.at, BROWSER_IN.dur, E.emphasized);
    frame.style.opacity = String(b);
    frame.style.transform = b >= 1 ? "none" : `translate(0, ${((1 - b) * 16).toFixed(3)}px)`;

    /* W1 → Linen → W2 inside the viewport. */
    const out = R.tween(t, SWAP.at, SWAP.out, E.exit);
    const swap = R.tween(t, SWAP.in, SWAP.dur, E.inOut);
    w1.canvas.style.opacity = String(1 - out);
    w1.canvas.style.visibility = out >= 1 ? "hidden" : "visible";
    w2.canvas.style.opacity = String(swap);
    w2.canvas.style.visibility = swap > 0 ? "visible" : "hidden";

    /* Left column: the eyebrow stays; one page name per window, each as one unit. */
    riseFree(eyebrow, R.tween(t, EYEBROW.at, R.dur.l, E.standard), 16);
    const talesIn = R.tween(t, TALES.at, R.dur.l, E.emphasized);
    riseFree(tales, talesIn, 24);
    tales.style.opacity = String(talesIn * (1 - R.tween(t, TALES.out, R.dur.m, E.exit))); // exit: fade only, no movement
    riseFree(mood, R.tween(t, MOOD.at, R.dur.l, E.emphasized), 24);

    return null;
  }

  R.scene("storefront-desktop", { build, render, grain: () => 0 });
})();
