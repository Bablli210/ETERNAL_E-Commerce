/*
 * The reel's toolkit. Every scene is a pure function of its local time: the
 * same t must always paint the same frame, whatever was rendered before it.
 * So nothing here keeps state between frames, and nothing uses CSS
 * transitions, CSS animations, timers or requestAnimationFrame.
 */
(() => {
  const R = (window.R = {});
  R.W = 1920;
  R.H = 1080;
  R.FPS = 30;
  R.scenes = {};
  R.manifest = {};

  R.color = {
    linen: "#F3EFE7", paper: "#FAF8F3", sand: "#E4D9C5", dune: "#CDBFA5", stone: "#9E9382",
    ash: "#6D665C", night: "#171614", gold: "#B97A2B", goldText: "#8F5B1B", sea: "#163A4E",
    blush: "#E3CFC4", slate: "#1F3F50", bone: "#E9E4D3",
  };
  /** Motion-spec duration tokens, in seconds. */
  R.dur = { xs: 0.12, s: 0.2, m: 0.32, l: 0.6, xl: 1.2 };

  /* ---------- time ---------- */

  R.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  R.lerp = (a, b, p) => a + (b - a) * p;
  /** 0 → 1 as t runs from start to start + dur (clamped). */
  R.progress = (t, start, dur) => (dur <= 0 ? (t >= start ? 1 : 0) : R.clamp((t - start) / dur));

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (u) => ((ax * u + bx) * u + cx) * u;
    const sy = (u) => ((ay * u + by) * u + cy) * u;
    const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let u = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(u) - x;
        if (Math.abs(e) < 1e-6) return sy(u);
        const d = dx(u);
        if (Math.abs(d) < 1e-6) break;
        u -= e / d;
      }
      let lo = 0, hi = 1;
      u = x;
      for (let i = 0; i < 30; i++) {
        const v = sx(u);
        if (Math.abs(v - x) < 1e-6) break;
        if (x > v) lo = u; else hi = u;
        u = (lo + hi) / 2;
      }
      return sy(u);
    };
  }
  R.bezier = bezier;
  /** The motion spec's curves, plus a symmetric one for long slow moves. */
  R.ease = {
    linear: (p) => p,
    standard: bezier(0.2, 0.7, 0.2, 1),
    emphasized: bezier(0.16, 1, 0.3, 1),
    exit: bezier(0.4, 0, 1, 1),
    inOut: bezier(0.45, 0, 0.55, 1),
  };
  /** Eased progress of a tween that starts at `start` and lasts `dur`. */
  R.tween = (t, start, dur, ease = R.ease.standard) => ease(R.progress(t, start, dur));
  /** In, hold, out: 0→1 over [a, a+inDur], 1 until b-outDur, →0 at b. */
  R.envelope = (t, a, b, inDur = R.dur.l, outDur = R.dur.l, easeIn = R.ease.standard, easeOut = R.ease.exit) => {
    if (t < a || t > b) return 0;
    const i = inDur > 0 ? easeIn(R.progress(t, a, inDur)) : 1;
    const o = outDur > 0 ? 1 - easeOut(R.progress(t, b - outDur, outDur)) : 1;
    return Math.min(i, o);
  };
  /** Staggered progresses for n items: item i starts at start + i*gap. */
  R.stagger = (t, start, n, gap, dur, ease = R.ease.standard) =>
    Array.from({ length: n }, (_, i) => R.tween(t, start + i * gap, dur, ease));

  /* ---------- DOM ---------- */

  R.asset = (p) => `assets/${p}`;

  /** Create an element. props: class, style, text, html, attrs. */
  R.el = (tag, props = {}, parent) => {
    const e = document.createElement(tag);
    if (props.class) e.className = props.class;
    if (props.style) Object.assign(e.style, props.style);
    if (props.text != null) e.textContent = props.text;
    if (props.html != null) e.innerHTML = props.html;
    if (props.attrs) for (const [k, v] of Object.entries(props.attrs)) e.setAttribute(k, v);
    if (parent) parent.append(e);
    return e;
  };
  const px = (v) => (typeof v === "number" ? `${v}px` : v);
  /** An absolutely positioned box. rect: {x, y, w, h} in stage pixels. */
  R.box = (parent, rect = {}, style = {}) =>
    R.el("div", { class: "abs", style: { left: px(rect.x ?? 0), top: px(rect.y ?? 0), width: px(rect.w ?? R.W), height: px(rect.h ?? R.H), ...style } }, parent);

  /**
   * A photo cropped into a box. Returns { wrap, img }. The img fills the box
   * with object-fit, so move it with R.push() for slow pushes and pans.
   */
  R.image = (parent, src, rect = {}, opts = {}) => {
    const wrap = R.box(parent, rect, { overflow: "hidden", background: opts.background ?? "transparent" });
    const img = R.el("img", { attrs: { src: src.startsWith("assets/") ? src : R.asset(src), alt: "" }, style: {
      position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: opts.fit ?? "cover",
      objectPosition: opts.position ?? "50% 50%", transformOrigin: opts.origin ?? "50% 50%",
    } }, wrap);
    return { wrap, img };
  };
  /** Slow push/pan: interpolates {scale, x, y} from `from` to `to` by progress p. */
  R.push = (el, p, from = { scale: 1, x: 0, y: 0 }, to = { scale: 1.06, x: 0, y: 0 }) => {
    const s = R.lerp(from.scale ?? 1, to.scale ?? 1, p);
    const x = R.lerp(from.x ?? 0, to.x ?? 0, p);
    const y = R.lerp(from.y ?? 0, to.y ?? 0, p);
    // 2D on purpose: a 3D transform promotes the image to its own layer, whose
    // raster scale Chrome only re-picks when it sees fit, so a frame's pixels
    // would depend on the frames painted before it.
    el.style.transform = `translate(${x.toFixed(3)}px, ${y.toFixed(3)}px) scale(${s.toFixed(5)})`;
  };

  /* ---------- type ---------- */

  /**
   * A line or block of text in one of the type roles (display-xl, display-l,
   * display-m, signature, body, eyebrow, caption, numeral, wordmark, mono).
   * opts: x, y, w, color, align, size, weight, italic, tracking, lineHeight, style.
   */
  R.text = (parent, text, opts = {}) => {
    const e = R.el("div", { class: `abs t-${opts.role ?? "body"}`, text }, parent);
    const s = e.style;
    if (opts.x != null) s.left = px(opts.x);
    if (opts.y != null) s.top = px(opts.y);
    if (opts.right != null) s.right = px(opts.right);
    if (opts.bottom != null) s.bottom = px(opts.bottom);
    if (opts.w != null) s.width = px(opts.w);
    if (opts.color) s.color = opts.color;
    if (opts.align) s.textAlign = opts.align;
    if (opts.size) s.fontSize = px(opts.size);
    if (opts.weight) s.fontWeight = opts.weight;
    if (opts.italic) s.fontStyle = "italic";
    if (opts.tracking != null) s.letterSpacing = opts.tracking;
    if (opts.lineHeight) s.lineHeight = opts.lineHeight;
    if (opts.style) Object.assign(s, opts.style);
    return e;
  };
  /** Wrap each word in an inline-block span so words can rise one by one. Returns the spans. */
  R.splitWords = (el) => {
    const words = el.textContent.split(/(\s+)/);
    el.textContent = "";
    const spans = [];
    for (const w of words) {
      if (/^\s+$/.test(w)) { el.append(document.createTextNode(w)); continue; }
      if (!w) continue;
      spans.push(R.el("span", { class: "word", text: w }, el));
    }
    return spans;
  };
  /** Wrap each character (spaces kept as text). Returns the spans. */
  R.splitChars = (el) => {
    const chars = [...el.textContent];
    el.textContent = "";
    return chars.map((c) => (c === " " ? (el.append(document.createTextNode(" ")), null) : R.el("span", { class: "word", text: c }, el))).filter(Boolean);
  };
  /** The spec's rise: fade in while travelling up `dist` px (16 by default, 24 for the hero). */
  R.rise = (el, p, dist = 16) => {
    el.style.opacity = String(p);
    // The 0.001° turn is held through the rise and at rest. A non-axis-aligned
    // transform is rastered once in its own space and placed at the true
    // sub-pixel offset: the settle follows the ease exactly instead of stepping
    // whole pixels, and the frame is the same whatever was painted before it.
    // At rest it moves a 500 px line by under 0.01 px.
    el.style.transform = `translate3d(0, ${((1 - p) * dist).toFixed(3)}px, 0) rotate(0.001deg)`;
  };
  R.fade = (el, p) => { el.style.opacity = p; };

  /* ---------- reveals and light ---------- */

  /**
   * Reveal with a hard edge: clip-path inset from one side. dir: 'left' (reveals
   * left→right), 'right', 'up' (bottom→top), 'down'.
   */
  R.reveal = (el, p, dir = "left") => {
    const q = (1 - R.clamp(p)) * 100;
    const inset = { left: `0 ${q}% 0 0`, right: `0 0 0 ${q}%`, up: `${q}% 0 0 0`, down: `0 0 ${q}% 0` }[dir];
    el.style.clipPath = p >= 1 ? "none" : `inset(${inset})`;
  };
  /**
   * Reveal through a soft-edged mask that travels across like light.
   * angle in degrees (90 = left→right), soft = edge width in %.
   */
  R.softReveal = (el, p, angle = 100, soft = 24) => {
    if (p >= 1) { el.style.maskImage = el.style.webkitMaskImage = "none"; return; }
    const pos = R.lerp(-soft, 100, R.clamp(p));
    // The edge follows a smoothstep rather than a straight ramp: no hard start or
    // end to the light, and the 8-bit steps are spread instead of banding.
    const stops = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8, a = 1 - u * u * (3 - 2 * u);
      stops.push(`rgba(0,0,0,${a.toFixed(4)}) ${(pos + soft * u).toFixed(3)}%`);
    }
    el.style.maskImage = el.style.webkitMaskImage = `linear-gradient(${angle}deg, ${stops.join(", ")})`;
  };
  /**
   * A band of warm light passing across an element (child overlay). Create it
   * once with R.lightBand(parent), then call R.sweep(band, p) each frame.
   */
  R.lightBand = (parent, opts = {}) => {
    // A strip three times the parent's width carries one soft shaft in its middle,
    // so the gradient never meets a tile edge (a tiled band shows hard seams).
    const w = parent.offsetWidth || parseFloat(parent.style.width) || R.W;
    const h = parent.offsetHeight || parseFloat(parent.style.height) || R.H;
    const angle = opts.angle ?? 105;
    const a = (angle * Math.PI) / 180;
    const ramp = 3 * w * Math.abs(Math.sin(a)) + h * Math.abs(Math.cos(a));
    const half = (((opts.width ?? 370) * Math.abs(Math.sin(a))) / ramp) * 100;
    const band = R.el("div", { style: { position: "absolute", left: "0", top: "0", width: `${3 * w}px`, height: `${h}px`,
      pointerEvents: "none", mixBlendMode: opts.blend ?? "soft-light", opacity: "0",
      background: `linear-gradient(${angle}deg, transparent ${(50 - half).toFixed(3)}%, ${opts.color ?? "rgba(255,214,160,0.9)"} 50%, transparent ${(50 + half).toFixed(3)}%)` } }, parent);
    band._w = w;
    return band;
  };
  /** Move a light band across its parent: p 0 → 1, brightest mid-way. */
  R.sweep = (band, p, intensity = 0.6) => {
    band.style.opacity = p <= 0 || p >= 1 ? "0" : String(intensity * Math.sin(Math.PI * p));
    const cx = R.lerp(-0.16, 1.16, R.clamp(p)) * band._w;
    band.style.transform = `translateX(${(cx - 1.5 * band._w).toFixed(2)}px)`;
  };

  /* ---------- SVG: hairlines and the mark ---------- */

  const SVGNS = "http://www.w3.org/2000/svg";
  R.svgEl = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.append(e);
    return e;
  };
  /** A horizontal (or vertical) hairline that draws from its origin. */
  R.hairline = (parent, rect, color = R.color.dune, origin = "left") =>
    R.box(parent, rect, { background: color, transformOrigin: origin === "left" ? "0 50%" : origin === "right" ? "100% 50%" : origin === "top" ? "50% 0" : "50% 100%" });
  R.drawLine = (el, p, axis = "x") => { el.style.transform = axis === "x" ? `scaleX(${R.clamp(p)})` : `scaleY(${R.clamp(p)})`; };

  /**
   * The e∞ mark, from the storefront's components/ui/Wordmark.tsx.
   * Returns { svg, paths }. Draw it with R.drawMark(mark, p): one stroke,
   * never a spin — the three paths draw in sequence, weighted by length.
   */
  R.mark = (parent, { x = 0, y = 0, width = 192, color = R.color.night, stroke = 3 } = {}) => {
    const svg = R.svgEl("svg", { viewBox: "0 0 96 48", width, height: width / 2, fill: "none", stroke: color, "stroke-width": stroke, "stroke-linecap": "round", "stroke-linejoin": "round" });
    Object.assign(svg.style, { position: "absolute", left: px(x), top: px(y), overflow: "visible" });
    parent.append(svg);
    const d = [
      "M30 24c0 8-5.4 14-13 14S4 32 4 24s5.4-14 13-14c5 0 8.5 2.6 11 7",
      "M8 22h20",
      "M92 24c0 7-4.5 12-10 12-9 0-13-24-22-24-5.5 0-10 5-10 12s4.5 12 10 12c9 0 13-24 22-24 5.5 0 10 5 10 12Z",
    ];
    // The bar of the e is drawn first, then the bowl, then the loop: one continuous gesture.
    const order = [1, 0, 2];
    const paths = order.map((i) => R.svgEl("path", { d: d[i] }, svg));
    return { svg, paths };
  };
  R.drawMark = (mark, p) => {
    const lens = mark.paths.map((path) => path.getTotalLength());
    const total = lens.reduce((a, b) => a + b, 0);
    let acc = 0;
    mark.paths.forEach((path, i) => {
      const L = lens[i];
      const local = R.clamp((p * total - acc) / L);
      path.style.strokeDasharray = `${L} ${L}`;
      path.style.strokeDashoffset = `${L * (1 - local)}`;
      acc += L;
    });
  };
  /** Draw any SVG path by progress (uses its real length). */
  R.drawPath = (path, p) => {
    const L = path.getTotalLength();
    path.style.strokeDasharray = `${L} ${L}`;
    path.style.strokeDashoffset = `${L * (1 - R.clamp(p))}`;
  };

  /* ---------- the storefront in frames ---------- */

  /**
   * A minimal browser window: Paper top bar with three hairline dots, a Dune
   * hairline border, radius 0, no shadow. Returns { frame, viewport } — put a
   * capture in the viewport with R.capture().
   */
  R.browser = (parent, { x, y, w, h, bar = 44, dark = false } = {}) => {
    const frame = R.box(parent, { x, y, w, h }, { background: dark ? "#22211f" : R.color.paper, outline: `1px solid ${dark ? "#3a3834" : R.color.dune}` });
    const top = R.box(frame, { x: 0, y: 0, w, h: bar }, { background: dark ? "#22211f" : R.color.paper, borderBottom: `1px solid ${dark ? "#3a3834" : R.color.dune}` });
    for (let i = 0; i < 3; i++) R.box(top, { x: 20 + i * 20, y: bar / 2 - 5, w: 10, h: 10 }, { borderRadius: "50%", border: `1px solid ${dark ? "#6d665c" : R.color.stone}` });
    const viewport = R.box(frame, { x: 0, y: bar, w, h: h - bar }, { overflow: "hidden", background: R.color.linen });
    return { frame, viewport };
  };
  /**
   * A phone: Night bezel, rounded, no notch. Height sets the size (width is
   * 390/844 of the screen height). Returns { frame, screen }.
   */
  R.phone = (parent, { x, y, h = 820, bezel = 14, color = R.color.night } = {}) => {
    const sh = h - bezel * 2, sw = Math.round((sh * 390) / 844), w = sw + bezel * 2;
    const frame = R.box(parent, { x, y, w, h }, { background: color, borderRadius: `${Math.round(h * 0.075)}px` });
    const screen = R.box(frame, { x: bezel, y: bezel, w: sw, h: sh }, { overflow: "hidden", borderRadius: `${Math.round(h * 0.06)}px`, background: R.color.linen });
    return { frame, screen, w, h, sw, sh };
  };
  /**
   * A storefront capture inside a viewport. cssWidth is the page width it was
   * captured at (1440 desktop, 390 mobile). Returns { img, scale, scroll(yCss) }:
   * scroll() moves the page so page-y (in the site's CSS px) sits at the top.
   */
  R.capture = (viewport, name, cssWidth = 1440) => {
    const vw = parseFloat(viewport.style.width);
    const src = R.asset(`site/${name}.jpg`);
    const meta = R.manifest[`site/${name}.jpg`];
    const scale = vw / cssWidth;
    const img = R.el("img", { attrs: { src, alt: "" }, style: { position: "absolute", left: "0", top: "0", width: `${vw}px`, height: meta ? `${(meta.h * vw) / meta.w}px` : "auto", transformOrigin: "0 0" } }, viewport);
    const cssHeight = meta ? (meta.h * cssWidth) / meta.w : 0;
    return { img, scale, cssHeight, scroll: (yCss) => { img.style.transform = `translate3d(0, ${-yCss * scale}px, 0)`; } };
  };

  /* ---------- the hero film ---------- */

  /**
   * The hero film as a frame sequence (assets/film: 1920x1080; assets/film-mobile:
   * 1080x1880). Returns { wrap, img, at(t) } — at(t) shows the frame for film
   * time t (looping, 24 fps) and returns a promise the runtime waits on.
   */
  R.film = (parent, rect = {}, { dir = "film", fit = "cover", position = "50% 50%" } = {}) => {
    const meta = R.manifest[dir];
    if (!meta) throw new Error(`no film frames in assets/${dir} — run tools/prepare.mjs`);
    const { wrap, img } = R.image(parent, `${dir}/001.jpg`, rect, { fit, position });
    let current = 1;
    const at = (t, { loop = true } = {}) => {
      let f = Math.floor(t * meta.fps + 1e-6);
      f = loop ? ((f % meta.frames) + meta.frames) % meta.frames : R.clamp(f, 0, meta.frames - 1);
      const n = f + 1;
      if (n === current) return null;
      current = n;
      img.src = R.asset(`${dir}/${String(n).padStart(3, "0")}.jpg`);
      return img.decode();
    };
    return { wrap, img, at, frames: meta.frames, fps: meta.fps };
  };

  /* ---------- registration ---------- */

  /**
   * Register a scene. def: {
   *   build(root, ctx)  — create the DOM once (root is a 1920x1080 box),
   *   render(t, ctx)    — paint local time t; may return a promise (film frames),
   *   grain?            — number or (t) => number, 0..0.06, for dark fields,
   * }
   */
  R.scene = (slug, def) => { R.scenes[slug] = def; };
})();
