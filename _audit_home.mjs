import { chromium } from "playwright-core";
import fs from "node:fs";

const OUT = "/tmp/claude-0/-home-user-ETERNAL-E-Commerce/3e1a8386-f72a-5cc5-8f04-42e568424f65/scratchpad/audit/agents/home";
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3100";

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0 (iPhone15,2; iOS 17_5; en_US; en; scale=3.00; 1179x2556; 600000000)",
});
await ctx.addInitScript(() => {
  try { sessionStorage.setItem("eternal.loaded", "1"); } catch {}
});
const page = await ctx.newPage();
const failed = [];
page.on("requestfailed", (r) => failed.push(["failed", r.url(), r.failure()?.errorText]));
page.on("response", (r) => { if (r.status() >= 400) failed.push([r.status(), r.url()]); });
const consoleMsgs = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") consoleMsgs.push(m.type() + ": " + m.text()); });

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const result = {};
result.scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
result.screens = result.scrollHeight / 844;

// Sections
result.sections = await page.evaluate(() => {
  const main = document.querySelector("main") || document.body;
  const secs = [...document.querySelectorAll("main > section, main > div > section, section")].filter((s) => !s.closest("footer") && !s.parentElement.closest("section"));
  return secs.map((s) => {
    const r = s.getBoundingClientRect();
    const h2 = s.querySelector("h1,h2");
    return { id: s.id, cls: s.className.slice(0, 60), top: Math.round(r.top + scrollY), height: Math.round(r.height), screensFromTop: +((r.top + scrollY) / 844).toFixed(2), heightScreens: +(r.height / 844).toFixed(2), heading: h2 ? h2.textContent.trim().slice(0, 60) : null };
  });
});
result.footer = await page.evaluate(() => { const f = document.querySelector("footer"); if (!f) return null; const r = f.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), height: Math.round(r.height) }; });

// First product card with price + add to bag
result.firstCard = await page.evaluate(() => {
  const card = document.querySelector("[data-card]");
  if (!card) return null;
  const r = card.getBoundingClientRect();
  const btn = [...card.querySelectorAll("button")].find((b) => /add/i.test(b.textContent));
  const br = btn?.getBoundingClientRect();
  const price = card.querySelector(".tnum");
  const pr = price?.getBoundingClientRect();
  return {
    handle: card.dataset.card,
    cardTop: Math.round(r.top + scrollY),
    priceTop: pr ? Math.round(pr.top + scrollY) : null,
    priceText: price?.textContent,
    addBtnTop: br ? Math.round(br.top + scrollY) : null,
    addBtnBottom: br ? Math.round(br.bottom + scrollY) : null,
    addBtnText: btn?.textContent,
  };
});
// Any price at all earlier than the first card?
result.firstPriceAnywhere = await page.evaluate(() => {
  const els = [...document.querySelectorAll("main *")].filter((e) => e.children.length === 0 && /EGP|E£|LE\s?\d/.test(e.textContent));
  return els.slice(0, 5).map((e) => ({ text: e.textContent.trim().slice(0, 60), top: Math.round(e.getBoundingClientRect().top + scrollY) }));
});

// Links/buttons in main
result.interactive = await page.evaluate(() => {
  const els = [...document.querySelectorAll("main a, main button, body > div a, body > div button")].filter((e) => !e.closest("header") && !e.closest("footer"));
  const seen = new Set();
  return els.filter((e) => { if (seen.has(e)) return false; seen.add(e); return true; }).map((e) => {
    const r = e.getBoundingClientRect();
    return { tag: e.tagName, text: (e.getAttribute("aria-label") || e.textContent).trim().replace(/\s+/g, " ").slice(0, 70), href: e.getAttribute("href"), top: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0 };
  });
});

// Images
result.images = await page.evaluate(() => {
  return [...document.querySelectorAll("main img")].map((img) => {
    const r = img.getBoundingClientRect();
    let src = img.currentSrc || img.src;
    try { const u = new URL(src); if (u.pathname.startsWith("/_next/image")) src = decodeURIComponent(u.searchParams.get("url")) + " w=" + u.searchParams.get("w"); } catch {}
    return { src, alt: img.alt, natural: img.naturalWidth + "x" + img.naturalHeight, rendered: Math.round(r.width) + "x" + Math.round(r.height), top: Math.round(r.top + scrollY), complete: img.complete, ok: img.naturalWidth > 0, objectPosition: getComputedStyle(img).objectPosition, sizes: img.sizes };
  });
});
result.placeholders = await page.evaluate(() => [...document.querySelectorAll(".slot")].map((s) => ({ label: s.getAttribute("aria-label"), top: Math.round(s.getBoundingClientRect().top + scrollY) })));

// Video state
result.video = await page.evaluate(() => {
  return [...document.querySelectorAll("video")].map((v) => ({ currentSrc: v.currentSrc, paused: v.paused, readyState: v.readyState, cls: v.className, w: v.videoWidth, h: v.videoHeight, rendered: v.getBoundingClientRect().width + "x" + v.getBoundingClientRect().height, opacity: getComputedStyle(v).opacity }));
});

// First screen screenshot
await page.screenshot({ path: `${OUT}/home-first.png` });

// Section screenshots by scrolling to each section top
for (const [i, s] of result.sections.entries()) {
  await page.evaluate((y) => window.scrollTo(0, y), s.top);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/sec-${String(i).padStart(2, "0")}-a.png` });
  if (s.height > 844) {
    await page.evaluate((y) => window.scrollTo(0, y), s.top + 760);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/sec-${String(i).padStart(2, "0")}-b.png` });
  }
  if (s.height > 1600) {
    await page.evaluate((y) => window.scrollTo(0, y), s.top + 1520);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/sec-${String(i).padStart(2, "0")}-c.png` });
  }
  if (s.height > 2400) {
    await page.evaluate((y) => window.scrollTo(0, y), s.top + 2280);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/sec-${String(i).padStart(2, "0")}-d.png` });
  }
}
// sticky bar state
result.sticky = await page.evaluate(() => {
  const bar = [...document.querySelectorAll("div.fixed")].find((d) => d.className.includes("bar-enter"));
  if (!bar) return null;
  const r = bar.getBoundingClientRect();
  return { top: r.top, height: r.height, links: [...bar.querySelectorAll("a")].map((a) => [a.textContent, a.getAttribute("href")]) };
});
// End of page
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/home-bottom.png` });

result.video2 = await page.evaluate(() => [...document.querySelectorAll("video")].map((v) => ({ currentSrc: v.currentSrc, paused: v.paused, readyState: v.readyState, cls: v.className })));
result.failed = failed;
result.console = consoleMsgs;
fs.writeFileSync(`${OUT}/home-metrics.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ...result, interactive: undefined, images: undefined }, null, 1));
await browser.close();
