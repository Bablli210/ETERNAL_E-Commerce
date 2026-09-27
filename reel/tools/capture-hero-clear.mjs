// The home hero's first screen with the film area left transparent, so the reel
// can run the real hero film underneath the real page (scene "already-applied").
// Usage (with the storefront running): node reel/tools/capture-hero-clear.mjs [baseUrl]
// Writes reel/assets/site/home-desktop-hero-clear.webp — 2880x1800 (1440x900 css @2x), with alpha.
// Removed for the capture only: the hero video/poster and the backgrounds behind them
// (the reel supplies the film), bracketed placeholders, and the hero eyebrow, which
// names Shadow of the Sea above the Wayne bottle (flagged to the site team).
// The site's own scrim, header, headline, body line and buttons are untouched.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "assets", "site", "home-desktop-hero-clear.webp");
const BASE = process.argv[2] ?? "http://localhost:3000";
const exe = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
await ctx.addInitScript(() => { try { sessionStorage.setItem("eternal.loaded", "1"); } catch {} });
const page = await ctx.newPage();
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.evaluate(() => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  while (walker.nextNode()) if (/\[[^\]]+\]/.test(walker.currentNode.nodeValue)) hits.push(walker.currentNode);
  for (const node of hits) {
    const box = node.parentElement?.closest("li, p, span, a, button, dd, dt, div");
    if (box && box.textContent.trim().length <= 80) box.style.visibility = "hidden";
  }
  const hero = document.getElementById("hero");
  hero.querySelectorAll(".hero-film video, .hero-film img, .hero-film picture").forEach((e) => (e.style.visibility = "hidden"));
  hero.style.backgroundColor = "transparent";
  hero.querySelectorAll(".hero-film *").forEach((e) => { if (!/bg-gradient/.test(e.className)) e.style.backgroundColor = "transparent"; });
  document.documentElement.style.background = "transparent";
  document.body.style.background = "transparent";
  const eyebrow = hero.querySelector(".hero-drift > *:first-child");
  if (eyebrow) eyebrow.style.visibility = "hidden";
});
const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: 1440, height: 900 } });
await sharp(png).webp({ lossless: true }).toFile(OUT);
console.log(`home-desktop-hero-clear.webp: 1440x900 @2x, alpha`);
await browser.close();
