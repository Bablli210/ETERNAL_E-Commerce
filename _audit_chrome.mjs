import { chromium } from "playwright-core";
const BASE = "http://localhost:3100";
const OUT = "/tmp/claude-0/-home-user-ETERNAL-E-Commerce/3e1a8386-f72a-5cc5-8f04-42e568424f65/scratchpad/audit/agents/chrome";
const mode = process.argv[2] || "measure";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
async function ctxPage(opts = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: opts.h || 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: opts.ua });
  if (!opts.noLoaded) await ctx.addInitScript(() => { try { sessionStorage.setItem("eternal.loaded", "1"); } catch {} });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  return { ctx, p };
}
const log = (...a) => console.log(...a);

if (mode === "measure") {
  for (const u of ["/", "/shop", "/products/wayne", "/help"]) {
    const { ctx, p } = await ctxPage();
    await p.goto(BASE + u, { waitUntil: "networkidle" });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const box = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
      return {
        ann: box(".ann"), header: box("header"), menuBtn: box('button[aria-label="Open menu"]'), logo: box('header a[aria-label="eternal — home"]'),
        search: box('button[aria-label="Search"]'), bag: box('button[aria-label^="Bag"]'),
        mainTop: box("main"),
      };
    });
    log(u, JSON.stringify(r));
    // scroll behaviour
    for (const y of [200, 600, 500]) {
      await p.evaluate((y) => window.scrollTo(0, y), y);
      await p.waitForTimeout(400);
      const s = await p.evaluate(() => { const w = document.querySelector("header").parentElement; return { tr: getComputedStyle(w).transform, annH: document.querySelector(".ann")?.getBoundingClientRect().height, hdr: document.querySelector("header").getBoundingClientRect().top }; });
      log("  scroll", y, JSON.stringify(s));
    }
    await ctx.close();
  }
}

if (mode === "shots") {
  const { ctx, p } = await ctxPage();
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/home-top.png`, clip: { x: 0, y: 0, width: 390, height: 260 } });
  await p.evaluate(() => window.scrollTo(0, 300));
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/home-scrolled300.png`, clip: { x: 0, y: 0, width: 390, height: 260 } });
  await p.goto(BASE + "/products/wayne", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/pdp-first.png` });
  await ctx.close();
}


if (mode === "menu") {
  const { ctx, p } = await ctxPage();
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  await p.tap('button[aria-label="Open menu"]');
  await p.waitForTimeout(500);
  const links = await p.$$eval('[role="dialog"][aria-label="Menu"] a, [role="dialog"][aria-label="Menu"] button', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { tag: e.tagName, text: (e.textContent || e.getAttribute("aria-label") || "").trim().replace(/\s+/g, " "), href: e.getAttribute("href"), box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }; }));
  log(JSON.stringify(links, null, 0));
  await p.screenshot({ path: `${OUT}/menu-open.png` });
  // focus check
  log("focused:", await p.evaluate(() => document.activeElement?.getAttribute("aria-label")));
  // tab trap check: press Tab 25 times and see whether focus leaves dialog
  const escaped = [];
  for (let i = 0; i < 25; i++) { await p.keyboard.press("Tab"); const inside = await p.evaluate(() => !!document.activeElement.closest('[role="dialog"]')); if (!inside) { escaped.push(i + ":" + (await p.evaluate(() => document.activeElement.tagName + " " + (document.activeElement.textContent || document.activeElement.getAttribute("aria-label") || "").trim().slice(0, 30)))); } }
  log("focus escaped dialog:", escaped.slice(0, 5));
  await ctx.close();
  // tap each link in a fresh menu
  for (const l of links.filter((x) => x.tag === "A")) {
    const { ctx, p } = await ctxPage();
    await p.goto(BASE + "/shop", { waitUntil: "networkidle" });
    await p.tap('button[aria-label="Open menu"]');
    await p.waitForTimeout(400);
    const loc = p.locator(`[role="dialog"][aria-label="Menu"] a[href="${l.href}"]`).first();
    await loc.tap();
    await p.waitForTimeout(1200);
    const st = await p.evaluate(() => ({ url: location.pathname + location.search + location.hash, h1: document.querySelector("h1")?.textContent?.trim().slice(0, 60), menuOpen: !!document.querySelector('[role="dialog"][aria-label="Menu"]'), bodyOverflow: document.body.style.overflow, scrollY: scrollY }));
    log("TAP", l.text, "->", JSON.stringify(st));
    await ctx.close();
  }
}

if (mode === "search") {
  const terms = process.argv.slice(3);
  for (const t of terms) {
    const { ctx, p } = await ctxPage();
    await p.goto(BASE + "/shop", { waitUntil: "networkidle" });
    await p.tap('button[aria-label="Search"]');
    await p.waitForTimeout(300);
    await p.fill('input[type="search"]', t);
    await p.waitForTimeout(400);
    const res = await p.$$eval('form[role="search"] ~ div li a', (els) => els.map((e) => (e.getAttribute("href") + " :: " + e.textContent.trim().replace(/\s+/g, " ")).slice(0, 110)));
    const eyebrow = await p.evaluate(() => [...document.querySelectorAll('form[role="search"] ~ div .eyebrow, form[role="search"] ~ div p')].map((e) => e.textContent.trim()).slice(0, 4));
    const overlay = await p.evaluate(() => { const f = document.querySelector('form[role="search"]').closest(".fade-enter"); const r = f.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight }; });
    log("SEARCH", JSON.stringify(t), JSON.stringify({ eyebrow, overlay }));
    res.forEach((r) => log("   ", r));
    await p.screenshot({ path: `${OUT}/search-${t.replace(/\W+/g, "_")}.png` });
    await ctx.close();
  }
}
await b.close();
