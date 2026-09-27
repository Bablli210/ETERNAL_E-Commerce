/*
 * Scene 09 · "The storefront" (storefront-desktop) — 7.6 s, from 75.1 s.
 *
 * Depth of proof: two more real pages in a quiet browser, carrying the light
 * and the photographs the client has just felt. Sand ground; a browser window
 * at (600, 212), 1200×661, whose 1200×617 viewport shows the 1440-css pages
 * at 0.8333 (740 css rows). The left column (x 120–520) holds a fixed eyebrow
 * and one page name per window.
 *
 *   0.0  the runtime crossfades us in from Motion (600 ms): Sand, empty.
 *   0.2  the browser, already on the Tales page (W1), rises 16 px.
 *   0.6  "The storefront" rises; 0.8 "Tales" rises as one unit.
 *   3.4  W1 → W2 crossfade inside the viewport only (the site's G2); "Tales"
 *        leaves over 320 ms; 3.8 "Shop by mood" rises.
 *   4.3  W2, the homepage's Shop by mood, drifts 133 px over 2.4 s on the
 *        spec's long-move curve, from its '03 / Shop by mood' heading to the
 *        six tiles alone in Linen. The only motion on screen.
 *   6.7  hold. Scene 10's crossfade takes the frame from 7.0; nothing fades,
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
   * The two windows, as the css page-y at the viewport's top. Rest positions sit
   * on whole stage pixels (css × 0.8333), so the captures are crisp where they hold.
   *  W1 tales-desktop at css 36 (the blank bar cropped): the header, 'One story
   *     per bottle.' and the featured Shadow of the Sea tale down to 'Read the
   *     tale'; bottom css 776.4.
   *  W2 home-desktop drifts from css 4700.4 (stage 3917: '03', 'Shop by mood',
   *     its line, the first row of tiles) to css 4860 (stage 4050): the six tiles
   *     alone in Linen, 37 px of Linen above them and 47 below, a touch above
   *     centre. The board's 4870 left 29 px above and 55 below, the tiles pressed
   *     up under the window's bar. The section's line (ink ends css 4853) is out
   *     of frame, and the bottom (css 5600) stays above 'Try before you commit'
   *     (5665).
   * `crop` is the band of the capture each window ever reads (css px); both
   * bands start and end on whole stage pixels.
   */
  const W1 = { name: "tales-desktop", at: 36, crop: [36, 780] };
  const W2 = { name: "home-desktop", from: 3917 / S, to: 4050 / S, crop: [4692, 5616] };

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
  const TALES = { text: "Tales", dx: -2, at: 0.8, out: 3.4 };
  const MOOD = { text: "Shop by mood", dx: -4, at: 3.8 };

  /* ---- timing (scene-local seconds) ---- */
  const BROWSER_IN = { at: 0.2, dur: R.dur.l };
  const SWAP = { at: 3.4, dur: R.dur.l };
  // The board says standard; over 2.4 s that curve leaves rest at 3.5× the
  // mean speed (7 px in the first frame), a jolt, not a drift. inOut is the
  // spec's curve for long slow moves: it leaves and lands at rest.
  const DRIFT = { at: 4.3, dur: 2.4, ease: E.inOut };

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

  /* W1 holds still: its band at display size, drawn once. */
  async function still(viewport, W) {
    const bitmap = await band(W, 1);
    const canvas = canvasIn(viewport);
    canvas.getContext("2d").drawImage(bitmap, 0, (W.crop[0] - W.at) * S);
    bitmap.close();
    return { canvas };
  }

  /*
   * W2 moves. Its band is display width and four times display height; each
   * frame averages groups of four of its rows at the scroll offset rounded to a
   * quarter pixel. Every frame is filtered by the same kernel, so the page is
   * exactly as sharp moving as at rest (measured: 0.2 % variation). A sub-pixel
   * draw of a display-size bitmap goes 15 % soft between whole pixels, so the
   * page would blur as it starts and visibly pull focus as it lands; half-pixel
   * steps left the odd still frame in the slow tails. Quarter-pixel steps move
   * on every frame of the drift.
   */
  const SUB = 4; // band rows per display row
  async function drift(viewport, W) {
    const bitmap = await band(W, SUB);
    const scratch = R.el("canvas", { attrs: { width: bitmap.width, height: bitmap.height } });
    const sg = scratch.getContext("2d", { willReadFrequently: true });
    sg.drawImage(bitmap, 0, 0);
    const src = sg.getImageData(0, 0, bitmap.width, bitmap.height).data;
    bitmap.close();
    const canvas = canvasIn(viewport);
    const g = canvas.getContext("2d");
    const out = g.createImageData(VP.w, VP.h);
    const o = out.data, SW = VP.w * 4;
    const show = (yCss) => {
      const q = Math.round((yCss - W.crop[0]) * S * SUB); // the viewport's top, in the band's rows
      for (let r = 0; r < VP.h; r++) {
        let a = (q + SUB * r) * SW, d = r * SW;
        for (let c = 0; c < VP.w; c++, a += 4, d += 4) {
          let R0 = 0, G0 = 0, B0 = 0;
          for (let j = 0, i = a; j < SUB; j++, i += SW) { R0 += src[i]; G0 += src[i + 1]; B0 += src[i + 2]; }
          o[d] = (R0 + SUB / 2) / SUB | 0;
          o[d + 1] = (G0 + SUB / 2) / SUB | 0;
          o[d + 2] = (B0 + SUB / 2) / SUB | 0;
          o[d + 3] = 255;
        }
      }
      g.putImageData(out, 0, 0);
    };
    return { canvas, show };
  }

  async function build(root) {
    R.box(root, { x: 0, y: 0, w: R.W, h: R.H }, { background: C.sand });

    const { frame, viewport } = R.browser(root, BROWSER);
    const w1 = await still(viewport, W1);
    const w2 = await drift(viewport, W2);

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

    /* W1 → W2 inside the viewport; then W2 drifts. */
    const swap = R.tween(t, SWAP.at, SWAP.dur, E.standard);
    w1.canvas.style.visibility = swap >= 1 ? "hidden" : "visible";
    w2.canvas.style.opacity = String(swap);
    w2.canvas.style.visibility = swap > 0 ? "visible" : "hidden";
    w2.show(R.lerp(W2.from, W2.to, R.tween(t, DRIFT.at, DRIFT.dur, DRIFT.ease)));

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
