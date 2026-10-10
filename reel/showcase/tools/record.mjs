// Records takes of the real site, frame-exactly, for the film.
//
//   node reel/showcase/tools/record.mjs [only,these,takes] [--force] [--probe] [--base http://localhost:3000]
//
// Each take (tools/takes.mjs) is a viewport, a URL and a timeline in film seconds: an
// eased pointer glide, a press, a tap, an eased scroll. The page runs on a virtual
// clock (tools/vclock.mjs): its timers, requestAnimationFrame and every CSS animation and
// transition advance exactly 1/fps per frame, and the document timeline is held at rate 0
// between steps, so the site's own motion is captured as it really plays however long
// each screenshot takes. Between frames the recorder waits, in real time with the clock
// stopped, for every request and in-view image: the network is instant on film.
//
// Writes reel/showcase/assets/rec/<take>/mid/00000.jpg … (Lanczos3 to 1 px per css px
// on desktop, 1.25 on the phone), full/… (native DPR, only where the camera is close),
// and meta.json: per frame, the pointer, its computed cursor, the press, the hovered
// control, the URL, the scroll, and on the phone the colour of the page's top row.
// --probe records at DPR 1 and 30 Hz into assets/probe/ to check positions and hovers.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { VCLOCK_INIT, HYGIENE_INIT, settle } from "./vclock.mjs";
import { TAKES } from "./takes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, "..", "..", "..");
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const PROBE = argv.includes("--probe");
const FORCE = argv.includes("--force");
const BASE = opt("base", "http://localhost:3000");
const ONLY = argv.find((a, i) => !a.startsWith("--") && !(argv[i - 1] ?? "").startsWith("--base"))?.split(",");
const OUT = path.join(here, "..", "assets", PROBE ? "probe" : "rec");
const exe = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
// Capture hygiene, plus one redaction: each "Inspired by <name>" line is hidden, so no other
// house's trademark appears in the film. The house's own labels ("Eternal Original", "Not
// inspired by another fragrance: only at eternal.") stay. REDACT_INIT marks the lines.
const CSS = "html{scroll-behavior:auto!important} .wa-float, a[href*='wa.me'][class*='fixed']{visibility:hidden!important} input,textarea{caret-color:transparent!important} ::-webkit-scrollbar{display:none} html{scrollbar-width:none} [data-film-redact], p:has(> [data-film-redact] + span:last-child){display:none!important}";
const REDACT_INIT = () => {
  const mark = () => {
    for (const l of document.querySelectorAll(".inspired-label, dt")) if (/^\s*inspired by\s*$/i.test(l.textContent)) l.parentElement?.setAttribute("data-film-redact", "");
  };
  new MutationObserver(mark).observe(document, { subtree: true, childList: true, characterData: true });
  document.addEventListener("DOMContentLoaded", mark);
};

// ── Images: Shopify's CDN is unreachable here, so each packshot is answered with one of
// the product's own local stills, chosen per take (routes: {handle: [suffixes]}).
const LOCAL = path.join(ROOT, "public", "images", "products");
const snapshot = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalogue.snapshot.json"), "utf8"));
const handleOf = new Map();
for (const p of snapshot.products) for (const im of p.images ?? []) handleOf.set(im.url.split("?")[0], p.handle);
const resized = new Map();
function router(routes = {}) {
  const pick = (h) => {
    for (const s of routes[h] ?? routes.default ?? ["-2", "-3", "", "-4"]) { const f = path.join(LOCAL, `${h}${s}.jpg`); if (fs.existsSync(f)) return f; }
    for (const s of ["", "-2", "-3", "-4"]) { const f = path.join(LOCAL, `${h}${s}.jpg`); if (fs.existsSync(f)) return f; }
    return null;
  };
  return async (route) => {
    const u = new URL(route.request().url());
    const src = u.pathname === "/_next/image" ? u.searchParams.get("url") : u.href;
    const h = src && handleOf.get(src.split("?")[0]);
    const file = h && pick(h);
    if (!file) return route.fulfill({ status: 404, body: "" });
    const w = Math.min(Number(u.searchParams.get("w")) || 1200, 2048);
    const key = `${file}@${w}`;
    if (!resized.has(key)) resized.set(key, sharp(file).resize({ width: w, withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer());
    return route.fulfill({ status: 200, contentType: "image/jpeg", body: await resized.get(key) });
  };
}

// ── Easing and paths ─────────────────────────────────────────────────────────
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let k = 0; k < 40; k++) { const v = sx(t); if (Math.abs(v - x) < 1e-7) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return sy(t);
  };
}
const EASE = {
  linear: (p) => p,
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2), // easeInOutCubic
  sine: (p) => 0.5 - 0.5 * Math.cos(Math.PI * p),
  standard: bezier(0.2, 0.7, 0.2, 1), // the site's ease-standard
  emphasized: bezier(0.16, 1, 0.3, 1),
  hand: bezier(0.3, 0.05, 0.2, 1), // a hand's reach: gentle start, long settle
};
const invert = (f, y) => { let lo = 0, hi = 1; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (f(m) < y) lo = m; else hi = m; } return (lo + hi) / 2; };

/** A smooth path through points (Catmull–Rom), walked by arc length. */
function spline(pts) {
  if (pts.length === 2) pts = [pts[0], [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2], pts[1]];
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  const dense = [];
  for (let s = 1; s < P.length - 2; s++) {
    const [p0, p1, p2, p3] = [P[s - 1], P[s], P[s + 1], P[s + 2]];
    for (let k = 0; k < 48; k++) {
      const t = k / 48, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      dense.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  dense.push(pts[pts.length - 1]);
  const len = [0];
  for (let i = 1; i < dense.length; i++) len.push(len[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const L = len[len.length - 1] || 1;
  return (u) => {
    const d = Math.min(1, Math.max(0, u)) * L;
    let i = 1;
    while (i < len.length - 1 && len[i] < d) i++;
    const f = (d - len[i - 1]) / Math.max(1e-9, len[i] - len[i - 1]);
    return [dense[i - 1][0] + (dense[i][0] - dense[i - 1][0]) * f, dense[i - 1][1] + (dense[i][1] - dense[i - 1][1]) * f];
  };
}

async function locate(page, target) {
  if (typeof target === "string") return page.locator(target).first();
  if (target.role) return page.getByRole(target.role, { name: target.name, exact: target.exact ?? false }).first();
  if (target.text) return page.getByText(target.text, { exact: target.exact ?? false }).first();
  throw new Error(`cannot locate ${JSON.stringify(target)}`);
}
/** A target's centre in document css px (so it can be found again after a scroll). */
async function docCentre(page, sel, dx = 0, dy = 0) {
  const el = await locate(page, sel);
  const box = await el.boundingBox();
  if (!box) throw new Error(`not visible: ${JSON.stringify(sel)}`);
  const sy = await page.evaluate(() => scrollY);
  return [box.x + box.width / 2 + dx, box.y + box.height / 2 + sy + dy];
}

// ── A take ───────────────────────────────────────────────────────────────────
async function runTake(browser, take) {
  const phone = take.device === "phone";
  const css = phone ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const dpr = PROBE ? 1 : phone ? 3 : 2;
  const fps = PROBE ? 30 : take.fps ?? 120;
  const dt = 1000 / fps;
  const ctx = await browser.newContext({ viewport: css, deviceScaleFactor: dpr, isMobile: phone, hasTouch: phone, reducedMotion: "no-preference", userAgent: phone ? IPHONE : undefined });
  await ctx.addCookies([{ name: "eternal_consent", value: `1.0.0.${Date.now()}`, domain: new URL(BASE).hostname, path: "/" }]);
  if (!take.loader) await ctx.addInitScript(() => { try { sessionStorage.setItem("eternal.loaded", "1"); } catch {} });
  await ctx.addInitScript(VCLOCK_INIT);
  await ctx.addInitScript(HYGIENE_INIT);
  await ctx.addInitScript(REDACT_INIT);
  await ctx.addInitScript((c) => { const s = () => { const st = document.createElement("style"); st.textContent = c; (document.head || document.documentElement).append(st); }; if (document.documentElement) s(); else document.addEventListener("DOMContentLoaded", s); }, CSS);
  // A take's image routes can change mid-take ({do: "route"}), e.g. once a product page is about to open.
  const routes = structuredClone(take.routes ?? {});
  const route = router(routes);
  await ctx.route(/\/_next\/image\?url=https%3A%2F%2Fcdn\.shopify\.com/, route);
  await ctx.route(/^https:\/\/cdn\.shopify\.com\//, route);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  // The document timeline stands still; vc.step() alone moves animations, from the frame they are born.
  await cdp.send("Animation.enable");
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 });
  const inflight = new Map();
  // Films stream on open-ended range requests; their frames are waited for by vc.media instead.
  page.on("request", (r) => { if (!r.url().includes("/videos/")) inflight.set(r, Date.now()); });
  page.on("requestfinished", (r) => inflight.delete(r));
  page.on("requestfailed", (r) => inflight.delete(r));
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const quiet = async () => {
    const t = Date.now();
    for (;;) {
      for (const [r, at] of inflight) if (Date.now() - at > 8000) inflight.delete(r); // a stuck request never holds the film
      if (!inflight.size || Date.now() - t > 8000) break;
      await new Promise((ok) => setTimeout(ok, 8));
    }
    await page.evaluate(() => window.__vc.images(4000));
    // Films on the page: seek each to the clock and wait for its frame.
    if (await page.evaluate(() => window.__vc.media(6000))) await page.evaluate(() => window.__vc.flush());
  };

  await page.goto(BASE + take.url, { waitUntil: take.loader ? "commit" : "domcontentloaded" });
  await settle(page);
  await page.evaluate(() => window.__vc.flush());
  await quiet();
  const checks = [];
  const check = async (fn, note, t) => { let ok; try { ok = await page.evaluate(`(${fn})()`); } catch (e) { ok = `error: ${e.message.split("\n")[0]}`; } checks.push({ t, note, ok }); if (ok !== true) console.log(`  ${take.id} @${t ?? "setup"}: CHECK ${note} → ${JSON.stringify(ok)}`); };
  if (take.loader) await check("() => document.documentElement.dataset.loading === '1'", "loader is up");
  await check("() => !document.documentElement.hasAttribute('data-ad')", "no data-ad");
  // Warm up: hydrate, reveal what is in view, let entrance motion (or a page's slow zoom) run.
  const warmSteps = Math.round((take.warm ?? 0) * 30);
  for (let i = 0; i < warmSteps; i++) {
    await page.evaluate(() => { window.__vc.advance(1000 / 30); window.__vc.step(); return window.__vc.flush(); });
    if (i % 10 === 9) await quiet();
  }
  let pointer = null;
  const press = { down: false };
  for (const s of take.setup ?? []) {
    if (s.do === "move") {
      if (Array.isArray(s.to)) pointer = [...s.to];
      else { const [x, y] = await docCentre(page, s.to.sel, s.to.dx ?? 0, s.to.dy ?? 0); pointer = [x, y - (await page.evaluate(() => scrollY))]; }
      await page.mouse.move(...pointer);
    }
    else if (s.do === "advance") for (let k = 0; k < Math.round(s.ms / 33.333); k++) await page.evaluate(() => { window.__vc.advance(1000 / 30); window.__vc.step(); return window.__vc.flush(); });
    else if (s.do === "eval") await page.evaluate(s.fn);
  }
  await quiet();
  await page.evaluate(() => window.__vc.step());

  const dir = path.join(OUT, take.id);
  fs.rmSync(dir, { recursive: true, force: true });
  for (const d of ["mid", "full"]) fs.mkdirSync(path.join(dir, d), { recursive: true });
  const n = Math.round((take.until - take.t0) * fps);
  const midW = phone ? Math.round(390 * 1.25) : 1440;
  const fullUntil = PROBE ? -1 : Math.round(((take.full ?? -1) - take.t0) * fps);
  const actions = (take.timeline ?? []).map((a) => ({ ...a, done: false }));
  const log = [], marks = [], writes = [];
  let scroll = null, glide = null;
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const t = take.t0 + i / fps; // film time
    for (const a of actions) {
      if (a.done || t + 1e-6 < a.at) continue;
      a.done = true;
      if (a.do === "scroll") {
        const from = await page.evaluate(() => scrollY);
        // Targets come from the page where they can: {sel, off} (an element's top + off), or {expr} (a function's result).
        const value = async (v) => (typeof v === "number" ? v : v.expr ? await page.evaluate(`(${v.expr})()`) : Math.round((await docCentre(page, v.sel))[1] - (await (await locate(page, v.sel)).boundingBox()).height / 2 + (v.off ?? 0)));
        const to = await value(a.to);
        let dur = a.dur;
        const ease = EASE[a.ease ?? "inOut"];
        // Cross a threshold on an exact frame (the sticky bar mounts when the main button passes under the header).
        if (a.cross) {
          const cy = await value(a.cross.y);
          dur = (a.cross.at - a.at) / invert(ease, (cy - from) / (to - from));
          marks.push({ at: a.at, do: "cross", y: cy, at2: a.cross.at });
        }
        scroll = { from, to, t0: a.at, dur, ease };
        marks.push({ at: a.at, do: "scroll", from, to, dur });
      } else if (a.do === "glide") {
        let to = a.to;
        if (!Array.isArray(to)) {
          // Aim at a control by where it will be once any scroll in progress has landed.
          const [x, y] = await docCentre(page, to.sel, to.dx ?? 0, to.dy ?? 0);
          const sy = scroll ? scroll.to : await page.evaluate(() => scrollY);
          to = [x, y - sy];
        }
        const from = pointer ?? to;
        glide = { at: a.at, dur: a.dur, path: spline([from, ...(a.via ?? []), to]), ease: EASE[a.ease ?? "hand"] };
        marks.push({ at: a.at, do: "glide", from, to, dur: a.dur });
      } else if (a.do === "move") {
        pointer = [...a.to];
        await page.mouse.move(...pointer);
      } else if (a.do === "down" || a.do === "up") {
        await page.mouse[a.do]();
        press.down = a.do === "down";
        marks.push({ at: a.at, do: a.do, x: pointer?.[0], y: pointer?.[1] });
      } else if (a.do === "tap") {
        const el = await locate(page, a.target);
        const box = await el.boundingBox();
        if (!box) throw new Error(`tap target not visible: ${JSON.stringify(a.target)}`);
        const x = box.x + box.width / 2, y = box.y + box.height / 2;
        await page.touchscreen.tap(x, y);
        marks.push({ at: a.at, do: "tap", x, y, w: box.width, h: box.height });
      } else if (a.do === "route") {
        Object.assign(routes, a.set);
      } else if (a.do === "eval") {
        await page.evaluate(a.fn);
      } else if (a.do === "check") {
        await check(a.fn, a.note, a.at);
      } else throw new Error(`unknown action ${a.do}`);
    }
    if (scroll) {
      const p = Math.min(1, Math.max(0, (t - scroll.t0) / scroll.dur));
      // Render once after the scroll, so IntersectionObservers (the sticky bar) answer on this frame.
      await page.evaluate((y) => { window.scrollTo({ top: y, behavior: "instant" }); return window.__vc.flush(); }, scroll.from + (scroll.to - scroll.from) * scroll.ease(p));
      if (p >= 1) scroll = null;
    }
    if (glide) {
      const p = Math.min(1, Math.max(0, (t - glide.at) / glide.dur));
      pointer = glide.path(glide.ease(p));
      await page.mouse.move(pointer[0], pointer[1]);
      if (p >= 1) glide = null;
    }
    await quiet();
    const state = await page.evaluate(([pt, watch]) => {
      window.__vc.step();
      const o = { sy: Math.round(scrollY), url: location.pathname + location.search };
      if (pt) {
        const e = document.elementFromPoint(pt[0], pt[1]);
        o.cur = e ? getComputedStyle(e).cursor : "auto";
        const c = e?.closest("a,button,[role=button],label,input,select,summary,[data-card]");
        if (c) o.hov = (c.tagName.toLowerCase() + (c.getAttribute("data-card") ? `[data-card=${c.getAttribute("data-card")}]` : "") + " " + (c.getAttribute("aria-label") || c.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40)).trim();
      }
      if (watch) { try { o.w = (0, eval)(watch)(); } catch (e) { o.w = String(e); } }
      return o;
    }, [pointer, take.watch ?? null]);
    const entry = { i, t: +t.toFixed(4), ...state };
    if (pointer) { entry.x = +pointer[0].toFixed(2); entry.y = +pointer[1].toFixed(2); entry.down = press.down; }
    log.push(entry);
    const shot = Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true })).data, "base64");
    const name = `${String(i).padStart(5, "0")}.jpg`;
    const keepFull = i <= fullUntil;
    writes.push((async () => {
      const { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const raw = { raw: { width: info.width, height: info.height, channels: 3 } };
      if (phone) {
        // The status bar is tinted from the page's top pixel row (its centre 60 %).
        const a = Math.round(info.width * 0.2), b = Math.round(info.width * 0.8);
        const s = [0, 0, 0];
        for (let x = a; x < b; x++) for (let c = 0; c < 3; c++) s[c] += data[x * 3 + c];
        entry.top = s.map((v) => Math.round(v / (b - a)));
      }
      if (PROBE) return sharp(data, raw).jpeg({ quality: 70 }).toFile(path.join(dir, "mid", name));
      await sharp(data, raw).resize({ width: midW, kernel: "lanczos3" }).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toFile(path.join(dir, "mid", name));
      if (keepFull) await sharp(data, raw).jpeg({ quality: 93, chromaSubsampling: "4:4:4" }).toFile(path.join(dir, "full", name));
    })());
    if (writes.length > 6) await writes.shift();
    await page.evaluate((ms) => { window.__vc.advance(ms); return window.__vc.flush(); }, dt);
    if (i % 120 === 119) console.log(`  ${take.id}: ${i + 1}/${n} · ${((Date.now() - t0) / (i + 1) / 1000).toFixed(2)} s/frame`);
  }
  await Promise.all(writes);
  for (const a of actions) if (!a.done) console.log(`  ${take.id}: action at ${a.at} never ran (take ends ${take.until})`);
  const mid = phone ? { w: midW, h: Math.round(844 * 1.25) } : { w: 1440, h: 900 };
  const meta = { id: take.id, device: take.device, url: take.url, css, dpr, fps, t0: take.t0, until: take.until, frames: n, mid, full: { w: css.width * dpr, h: css.height * dpr, frames: Math.max(0, Math.min(n, fullUntil + 1)) }, marks, checks, errors: errors.slice(0, 10), log };
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta));
  if (errors.length) console.log(`  page errors in ${take.id}: ${errors.slice(0, 3).join(" | ")}`);
  await ctx.close();
  return meta;
}

const todo = TAKES.filter((x) => (ONLY ? ONLY.includes(x.id) : FORCE || PROBE || !fs.existsSync(path.join(OUT, x.id, "meta.json"))));
const browser = await chromium.launch({ executablePath: exe });
try {
  const queue = [...todo].sort((a, b) => (b.until - b.t0) * (b.device === "phone" ? 1.3 : 1) - (a.until - a.t0) * (a.device === "phone" ? 1.3 : 1));
  await Promise.all(Array.from({ length: Number(process.env.RECORD_JOBS ?? 3) }, async () => {
    while (queue.length) {
      const take = queue.shift();
      const t0 = Date.now();
      try {
        const m = await runTake(browser, take);
        console.log(`${take.id}: ${m.frames} frames @${m.fps} Hz, ${m.marks.length} marks, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
      } catch (e) {
        console.log(`${take.id}: FAILED ${e.stack.split("\n").slice(0, 3).join(" | ")}`);
      }
    }
  }));
} finally {
  await browser.close();
}
