// Frame-exact capture of the real site's motion.
//
// The page gets a virtual clock (an init script) that owns setTimeout/setInterval,
// requestAnimationFrame, performance.now and Date.now. Every CSS animation and
// transition (document.getAnimations()) is paused and stepped on the same clock.
// So a JS timer (the loader's 1020 ms, the finder's 280 ms advance) and the CSS it
// sets off stay in lockstep, however long each screenshot takes.
//
// Playwright's own scripts run in an isolated world, so clicks and waits are not
// affected by the virtual clock.

/** The init script: installs window.__vc in the page's main world. Starts frozen. */
export const VCLOCK_INIT = () => {
  if (window.__vc) return;
  const real = { setTimeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window), setInterval: window.setInterval.bind(window), clearInterval: window.clearInterval.bind(window), raf: window.requestAnimationFrame.bind(window), caf: window.cancelAnimationFrame.bind(window), perf: performance.now.bind(performance), date: Date.now };
  const epochReal = real.date();
  const vc = { now: 0, timers: new Map(), rafs: new Map(), seq: 1, on: true, seen: new WeakMap(), real };
  window.__vc = vc;
  window.setTimeout = (fn, ms = 0, ...a) => { const id = vc.seq++; vc.timers.set(id, { at: vc.now + Math.max(0, +ms || 0), fn, a, every: 0 }); return id; };
  window.setInterval = (fn, ms = 0, ...a) => { const id = vc.seq++; const every = Math.max(1, +ms || 0); vc.timers.set(id, { at: vc.now + every, fn, a, every }); return id; };
  window.clearTimeout = window.clearInterval = (id) => { vc.timers.delete(id); };
  window.requestAnimationFrame = (fn) => { const id = vc.seq++; vc.rafs.set(id, fn); return id; };
  window.cancelAnimationFrame = (id) => { vc.rafs.delete(id); };
  performance.now = () => vc.now;
  Date.now = () => epochReal + vc.now;
  // Idle callbacks run on the clock too (the hero film starts "once the page is idle"): at the next step.
  window.requestIdleCallback = (fn) => window.setTimeout(() => fn({ didTimeout: false, timeRemaining: () => 50 }), 1);
  window.cancelIdleCallback = (id) => window.clearTimeout(id);
  const run = (fn, a) => { try { typeof fn === "function" ? fn(...a) : (0, eval)(fn); } catch (e) { console.error(e); } };
  /** Advance the clock by ms: fire due timers in order, then one round of rAF at the new time. */
  vc.advance = (ms) => {
    const end = vc.now + ms;
    for (;;) {
      let next = null;
      for (const [id, t] of vc.timers) if (t.at <= end && (!next || t.at < next[1].at)) next = [id, t];
      if (!next) break;
      const [id, t] = next;
      vc.now = Math.max(vc.now, t.at);
      if (t.every) t.at += t.every; else vc.timers.delete(id);
      run(t.fn, t.a);
    }
    vc.now = end;
    const rafs = [...vc.rafs.values()];
    vc.rafs.clear();
    for (const fn of rafs) run(fn, [vc.now]);
  };
  /** Pin every CSS animation/transition to the clock: born when first seen, then stepped. */
  vc.step = () => {
    for (const a of document.getAnimations()) {
      let birth = vc.seen.get(a);
      if (birth === undefined) { birth = vc.now - (a.currentTime ?? 0); vc.seen.set(a, birth); }
      a.pause();
      a.currentTime = Math.max(0, vc.now - birth);
    }
  };
  /** Freeze everything that is already running at the current clock (used before the first frame). */
  vc.freeze = () => { for (const a of document.getAnimations()) { a.pause(); if (!vc.seen.has(a)) vc.seen.set(a, vc.now - (a.currentTime ?? 0)); } };
  /** Let the browser render twice in real time, so IntersectionObservers and React commits land. */
  vc.flush = () => new Promise((ok) => real.raf(() => real.raf(ok)));
  /** In-view images still loading or decoding: the recorder waits for them, so nothing pops in. */
  const decoded = new WeakSet();
  vc.images = async (limit) => {
    const near = (i) => { const r = i.getBoundingClientRect(); return r.width > 0 && r.bottom > -300 && r.top < innerHeight + 300 && r.right > 0 && r.left < innerWidth; };
    const later = (t) => new Promise((ok) => real.setTimeout(ok, t));
    const imgs = [...document.images].filter((i) => !decoded.has(i) && near(i));
    await Promise.race([later(limit), Promise.all(imgs.map(async (i) => {
      if (!i.complete) await new Promise((ok) => { i.addEventListener("load", ok, { once: true }); i.addEventListener("error", ok, { once: true }); });
      try { await i.decode(); } catch {}
      if (i.complete) decoded.add(i);
    }))]);
    return imgs.filter((i) => !i.complete).length;
  };

  // Video and audio play on the virtual clock too. The element itself stays paused; the page
  // sees it playing (play(), paused, play/pause/ended events), and every step seeks it to where
  // it would be, so a film on the page plays exactly in time with everything else.
  const MP = HTMLMediaElement.prototype;
  const realPause = MP.pause;
  const pausedGet = Object.getOwnPropertyDescriptor(MP, "paused").get;
  const media = new Map(); // element → { playing, start (vc ms), offset (s) }
  const fire = (el, type) => el.dispatchEvent(new Event(type));
  const vtime = (el, s) => (s.playing ? s.offset + ((vc.now - s.start) / 1000) * (el.playbackRate || 1) : s.offset);
  const track = (el, playing) => {
    const s = { playing, start: vc.now, offset: 0 };
    media.set(el, s);
    // A new source starts from its beginning.
    el.addEventListener("emptied", () => { s.offset = 0; s.start = vc.now; s.frame = undefined; });
    return s;
  };
  MP.play = function () {
    const s = media.get(this) ?? track(this, false);
    if (!s.playing) {
      s.offset = this.currentTime || 0;
      s.start = vc.now;
      s.playing = true;
      queueMicrotask(() => { fire(this, "play"); fire(this, "playing"); });
    }
    if (!pausedGet.call(this)) realPause.call(this);
    return Promise.resolve();
  };
  MP.pause = function () {
    const s = media.get(this);
    if (s && s.playing) { s.offset = vtime(this, s); s.playing = false; queueMicrotask(() => fire(this, "pause")); }
    realPause.call(this);
  };
  Object.defineProperty(MP, "paused", { configurable: true, get() { const s = media.get(this); return s ? !s.playing : pausedGet.call(this); } });
  /**
   * Seek every playing medium to the clock; resolves once each has its frame (bounded by `limit` ms).
   * A film changes picture only once per film frame (vc.mediaFps, 24 by default), so it is seeked
   * only when that frame changes, to the frame's centre (WebM's 1 ms timecodes round frame starts),
   * and not at all while it is off screen.
   */
  vc.mediaFps = 24;
  vc.media = (limit = 4000) => {
    const waits = [];
    for (const el of document.querySelectorAll("video, audio")) {
      let s = media.get(el);
      if (!s) {
        // Started by the browser (autoplay) rather than by play(): take it over from here.
        if (pausedGet.call(el) && !(el.autoplay && el.readyState >= 1)) continue;
        s = track(el, true);
      }
      if (!pausedGet.call(el)) realPause.call(el);
      let t = vtime(el, s);
      const d = el.duration;
      if (Number.isFinite(d) && d > 0 && t >= d) {
        if (el.loop) t %= d;
        else {
          t = d;
          if (s.playing) { s.playing = false; s.offset = d; queueMicrotask(() => { fire(el, "pause"); fire(el, "ended"); }); }
        }
      }
      const r = el.getBoundingClientRect();
      const seen = r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      const frame = Math.floor(t * vc.mediaFps + 1e-6);
      const at = (frame + 0.5) / vc.mediaFps;
      if (el.readyState >= 1 && seen && (s.frame !== frame || el.readyState < 2)) {
        s.frame = frame;
        if (Math.abs(el.currentTime - at) > 1e-4) {
          waits.push(new Promise((ok) => el.addEventListener("seeked", ok, { once: true })));
          el.currentTime = Number.isFinite(d) ? Math.min(at, d) : at;
        }
      }
    }
    return Promise.race([Promise.all(waits), new Promise((ok) => real.setTimeout(ok, limit))]).then(() => waits.length);
  };
};

/**
 * Capture hygiene for every take: images load eagerly (no lazy pop-in while the clock is
 * paused), and page scrolls are instant (smooth scrolling runs on the compositor's real
 * clock, which the virtual clock does not own).
 */
export const HYGIENE_INIT = () => {
  const eager = (img) => { if (img.getAttribute("loading") === "lazy") img.setAttribute("loading", "eager"); };
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === "attributes") { if (m.target.tagName === "IMG") eager(m.target); continue; }
      for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; if (n.tagName === "IMG") eager(n); n.querySelectorAll?.("img").forEach(eager); }
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["loading"] });
  const instant = (o) => (o && typeof o === "object" ? { ...o, behavior: "instant" } : o);
  for (const [obj, k] of [[window, "scrollTo"], [window, "scroll"], [window, "scrollBy"], [Element.prototype, "scrollTo"], [Element.prototype, "scrollBy"]]) {
    const f = obj[k];
    obj[k] = function (a, ...rest) { return f.call(this, instant(a), ...rest); };
  }
  const siv = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (o) { return siv.call(this, instant(o)); };
};

/** Wait until fonts and every <img> in view have loaded, without moving the clock. */
export async function settle(page, ms = 8000) {
  await page.evaluate(async (limit) => {
    // The page's own setTimeout is the frozen virtual one: bound every wait with the real timer.
    const later = (t) => new Promise((ok) => (window.__vc?.real?.setTimeout ?? setTimeout)(ok, t));
    const bounded = (p) => Promise.race([p, later(limit)]);
    await bounded(document.fonts.ready);
    const imgs = [...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; });
    await bounded(Promise.all(imgs.map((i) => (i.complete ? null : new Promise((ok) => { i.addEventListener("load", ok, { once: true }); i.addEventListener("error", ok, { once: true }); })))));
    for (const i of imgs) { try { await bounded(i.decode()); } catch {} }
  }, ms);
}
