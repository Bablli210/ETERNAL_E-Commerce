/*
 * Composes the scenes on the timeline and exposes window.__reel for the
 * preview and render tools:
 *   await __reel.ready            // fonts, scenes and every image decoded
 *   await __reel.seek(seconds)    // paint that exact moment
 *   __reel.duration, __reel.fps, __reel.scenes
 * URL params: ?solo=<slug> plays one scene from its own t=0; ?debug shows
 * the timecode and the title-safe area.
 */
(() => {
  const params = new URLSearchParams(location.search);
  const solo = params.get("solo");
  const debug = params.has("debug");
  const stage = document.getElementById("stage");

  const loadScript = (src) => new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = ok;
    s.onerror = () => fail(new Error(`could not load ${src}`));
    document.body.append(s);
  });
  const raf = () => new Promise((r) => requestAnimationFrame(() => r()));

  // Deterministic grain: six noise tiles from a seeded generator, picked by frame number.
  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function grainTiles(n = 6, size = 256) {
    const tiles = [];
    for (let k = 0; k < n; k++) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d");
      const d = g.createImageData(size, size);
      const rnd = mulberry32(1234 + k * 977);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 110; // soft gaussian-ish
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
        d.data[i + 3] = 255;
      }
      g.putImageData(d, 0, 0);
      tiles.push(c.toDataURL("image/png"));
    }
    return tiles;
  }

  async function boot() {
    R.manifest = await (await fetch("assets/manifest.json")).json();
    const T = window.TIMELINE;
    let tl = T.scenes.map((s) => ({ ...s }));
    let duration = T.duration;
    if (solo) {
      const s = tl.find((x) => x.slug === solo);
      if (!s) throw new Error(`no scene "${solo}" on the timeline`);
      tl = [{ ...s, start: 0, in: { type: "cut", duration: 0 } }];
      duration = s.duration;
    }
    for (const s of tl) await loadScript(`scenes/${s.slug}.js`);

    const entries = [];
    for (const [i, s] of tl.entries()) {
      const def = R.scenes[s.slug];
      if (!def) throw new Error(`scenes/${s.slug}.js did not call R.scene("${s.slug}", …)`);
      const root = R.el("div", { class: "scene", attrs: { "data-scene": s.slug }, style: { zIndex: String(i + 1), display: "none" } }, stage);
      const ctx = { slug: s.slug, duration: s.duration, start: s.start, root, W: R.W, H: R.H };
      await def.build?.(root, ctx);
      entries.push({ s, def, root, ctx });
    }

    const dip = R.el("div", { attrs: { id: "dip" } }, stage);
    const grain = R.el("div", { attrs: { id: "grain" } }, stage);
    const tiles = grainTiles();
    let dbg = null;
    if (debug) {
      dbg = R.el("div", { attrs: { id: "debug" } }, stage);
      R.el("div", { class: "safe" }, dbg);
      dbg.tc = R.el("div", { class: "tc" }, dbg);
    }

    // Everything decoded before the first frame: every <img> the scenes built.
    const imgs = [...stage.querySelectorAll("img")];
    await Promise.all(imgs.map((img) => img.decode().catch(() => { throw new Error(`image failed to load: ${img.getAttribute("src")}`); })));
    await document.fonts.ready;
    // Force the three families to load even if no text has been laid out yet.
    await Promise.all(["600 40px 'Cormorant Garamond'", "italic 500 40px 'Cormorant Garamond'", "500 20px 'Instrument Sans'", "600 20px 'Instrument Sans'"].map((f) => document.fonts.load(f)));

    const last = entries[entries.length - 1];

    function applyIn(e, t) {
      const tin = e.s.in ?? { type: "cut", duration: 0 };
      const d = tin.duration ?? 0;
      const p = d > 0 ? R.clamp(t / d) : 1;
      const st = e.root.style;
      st.opacity = "1";
      st.visibility = "visible";
      st.maskImage = st.webkitMaskImage = "none";
      if (p >= 1 || tin.type === "cut") return null;
      if (tin.type === "crossfade") st.opacity = String(R.ease.standard(p));
      else if (tin.type === "light-wipe") R.softReveal(e.root, R.ease.inOut(p), 100, 26);
      else if (tin.type === "dip-to-night" || tin.type === "dip-to-linen") {
        if (p < 0.5) st.visibility = "hidden";
        return { color: tin.type === "dip-to-night" ? R.color.night : R.color.linen, o: p < 0.5 ? R.ease.standard(p * 2) : 1 - R.ease.standard((p - 0.5) * 2) };
      }
      return null;
    }

    async function seek(time) {
      const pending = [];
      let g = 0;
      let dipState = null;
      for (const e of entries) {
        const { start, duration: d } = e.s;
        const active = time >= start && (time < start + d || (e === last && time <= start + d + 1e-6));
        if (!active) { e.root.style.display = "none"; continue; }
        const t = time - start;
        e.root.style.display = "block";
        dipState = applyIn(e, t) ?? dipState;
        const r = e.def.render(t, e.ctx);
        if (r && typeof r.then === "function") pending.push(r);
        const eg = typeof e.def.grain === "function" ? e.def.grain(t) : e.def.grain ?? e.s.grain ?? 0;
        g = Math.max(g, eg);
      }
      dip.style.opacity = dipState ? String(dipState.o) : "0";
      if (dipState) dip.style.background = dipState.color;
      const frame = Math.round(time * R.FPS);
      grain.style.opacity = String(R.clamp(g * 6, 0, 0.5));
      grain.style.backgroundImage = `url(${tiles[frame % tiles.length]})`;
      grain.style.backgroundPosition = `${(frame * 73) % 256}px ${(frame * 151) % 256}px`;
      if (dbg) {
        const active = entries.filter((e) => e.root.style.display === "block").map((e) => `${e.s.slug} ${(time - e.s.start).toFixed(2)}s`).join(" · ");
        dbg.tc.textContent = `${time.toFixed(3)}s  f${frame}  ${active}`;
      }
      await Promise.all(pending);
      await raf();
      await raf();
    }

    window.__reel = {
      fps: R.FPS,
      duration,
      seek,
      scenes: entries.map((e) => ({ slug: e.s.slug, start: e.s.start, duration: e.s.duration })),
    };
    await seek(0);
    return window.__reel;
  }

  const ready = boot().catch((err) => {
    document.title = `ERROR: ${err.message}`;
    window.__reelError = err.message;
    console.error(err);
    throw err;
  });
  window.__reelReady = ready;
})();
