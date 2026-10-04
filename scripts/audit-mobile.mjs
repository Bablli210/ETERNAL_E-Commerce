// Mobile audit capture: first screen + full page at 390x844, plus metrics per page.
// usage: node scripts/audit-mobile.mjs <baseUrl> <outDir>  (run against `npm run start`)
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3100";
const OUT = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });
const exe = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const pages = [
  ["home", "/"], ["shop", "/shop"], ["shop-her", "/shop/her"], ["shop-bestsellers", "/shop/bestsellers"],
  ["pdp-wayne", "/products/wayne"], ["pdp-aurora", "/products/aurora"], ["pdp-mystery-box", "/products/mystery-box"],
  ["finder", "/finder"], ["tales", "/tales"], ["tale-wayne", "/tales/wayne"], ["help", "/help"],
  ["404", "/does-not-exist"],
];

const metricsJs = () => {
  const vw = window.innerWidth;
  const small = [];
  for (const el of document.querySelectorAll("a, button, input, select, summary, [role=button]")) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width === 0 || r.height === 0 || cs.visibility === "hidden" || cs.display === "none") continue;
    if (r.width < 44 || r.height < 44) small.push(`${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  const overflow = [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); return r.right > vw + 1 && getComputedStyle(e).position !== "fixed"; }).slice(0, 8).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 60)}`);
  const brackets = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const t = w.currentNode.nodeValue; const m = t.match(/\[[^\]]{2,60}\]/g); if (m) brackets.push(...m); }
  const imgs = [...document.images];
  const placeholders = document.querySelectorAll("[data-slot], .image-slot").length;
  const h1 = [...document.querySelectorAll("h1")].map((h) => h.textContent.trim().slice(0, 80));
  const firstCta = [...document.querySelectorAll("a, button")].find((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight && /shop|add|bag|buy|discover|find/i.test(e.textContent); });
  return {
    title: document.title, h1, scrollHeight: document.documentElement.scrollHeight,
    smallTapTargets: small.length, smallTapSample: small.slice(0, 15),
    horizontalOverflow: overflow, brackets: [...new Set(brackets)],
    images: imgs.length, imagesNoAlt: imgs.filter((i) => !i.hasAttribute("alt")).length,
    slotPlaceholders: placeholders,
    firstScreenCta: firstCta ? firstCta.textContent.trim().slice(0, 60) : null,
  };
};

const browser = await chromium.launch({ executablePath: exe });
const report = {};
for (const [name, url] of pages) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22A3354 Instagram 350.0.0.0" });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("eternal.loaded", "1"); } catch {} });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  let bytes = 0, requests = 0;
  page.on("response", async (r) => { requests++; const l = Number(r.headers()["content-length"] || 0); bytes += l; });
  const t0 = Date.now();
  await page.goto(BASE + url, { waitUntil: "load" });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, `${name}-first.png`) });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(800);
  const m = await page.evaluate(metricsJs);
  const lcp = await page.evaluate(() => new Promise((res) => { let v = null; new PerformanceObserver((l) => { const e = l.getEntries(); v = e[e.length - 1]; }).observe({ type: "largest-contentful-paint", buffered: true }); setTimeout(() => res(v ? { t: Math.round(v.startTime), el: v.element ? v.element.tagName + "." + String(v.element.className).slice(0, 40) : null, url: v.url?.slice(-60) } : null), 300); }));
  await page.screenshot({ path: path.join(OUT, `${name}-full.png`), fullPage: true, scale: "css" });
  report[name] = { url, loadMs, requests, approxKB: Math.round(bytes / 1024), lcp, ...m, consoleErrors: errors.slice(0, 5) };
  await ctx.close();
}

// Interaction states
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { sessionStorage.setItem("eternal.loaded", "1"); } catch {} });
const page = await ctx.newPage();
const tryShot = async (name, fn) => { try { await fn(); await page.waitForTimeout(700); await page.screenshot({ path: path.join(OUT, `state-${name}.png`) }); report[`state-${name}`] = "ok"; } catch (e) { report[`state-${name}`] = "FAILED " + String(e).slice(0, 160); } };
await page.goto(BASE + "/", { waitUntil: "load" });
await tryShot("menu-open", async () => { await page.getByRole("button", { name: /menu/i }).first().click(); });
await page.goto(BASE + "/", { waitUntil: "load" });
await tryShot("search-open", async () => { await page.getByRole("button", { name: /search/i }).first().click(); });
await page.goto(BASE + "/products/wayne", { waitUntil: "load" });
await tryShot("pdp-scrolled", async () => { await page.evaluate(() => window.scrollTo(0, 1400)); });
await tryShot("pdp-added", async () => { await page.evaluate(() => window.scrollTo(0, 0)); await page.getByRole("button", { name: /add to bag/i }).first().click(); });
await page.goto(BASE + "/finder", { waitUntil: "load" });
await tryShot("finder-step1", async () => {});
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
await browser.close();
console.log("done", Object.keys(report).length);
