// Captures the storefront pages the reel shows, from a running `npm run start`.
// Usage: node reel/tools/capture-site.mjs [baseUrl]
// Bracketed facts still to confirm (e.g. "[Delivery time]") are hidden for the
// capture only — the reel shows the direction, not unconfirmed claims.
import { chromium } from "playwright-core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "assets", "site");
const BASE = process.argv[2] ?? "http://localhost:3000";
const ONLY = process.argv[3]?.split(",");
const exe = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const shots = [
  { name: "home-desktop", url: "/", w: 1440, h: 900, full: true },
  { name: "home-mobile", url: "/", w: 390, h: 844, full: true, dpr: 3 },
  { name: "shop-desktop", url: "/shop", w: 1440, h: 900, full: true },
  { name: "pdp-desktop", url: "/products/wayne", w: 1440, h: 900, full: false },
  { name: "pdp-mobile", url: "/products/wayne", w: 390, h: 844, full: false, dpr: 3 },
  { name: "finder-desktop", url: "/finder", w: 1440, h: 900, full: true },
  { name: "finder-mobile", url: "/finder", w: 390, h: 844, full: true, dpr: 3 },
  { name: "tales-desktop", url: "/tales", w: 1440, h: 900, full: true },
  { name: "tale-desktop", url: "/tales/wayne", w: 1440, h: 900, full: true },
  { name: "house-desktop", url: "/house", w: 1440, h: 900, full: true },
];

const hideBrackets = () => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  while (walker.nextNode()) if (/\[[^\]]+\]/.test(walker.currentNode.nodeValue)) hits.push(walker.currentNode);
  for (const node of hits) {
    // Hide the small element that holds the placeholder (a list item, a short
    // paragraph, a chip). Never a large container: that blanks the page.
    const box = node.parentElement?.closest("li, p, span, a, button, dd, dt, div");
    if (box && box.textContent.trim().length <= 80) { box.style.visibility = "hidden"; continue; }
    // Otherwise hide just the bracketed words in place.
    const frag = document.createDocumentFragment();
    for (const part of node.nodeValue.split(/(\[[^\]]+\])/)) {
      if (/^\[[^\]]+\]$/.test(part)) { const s = document.createElement("span"); s.textContent = part; s.style.visibility = "hidden"; frag.append(s); }
      else frag.append(document.createTextNode(part));
    }
    node.replaceWith(frag);
  }
};

const browser = await chromium.launch({ executablePath: exe });
for (const s of shots.filter((x) => !ONLY || ONLY.includes(x.name))) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dpr ?? 2, reducedMotion: "reduce" });
  // Skip the once-per-session loader curtain.
  await ctx.addInitScript(() => { try { sessionStorage.setItem("eternal.loaded", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(BASE + s.url, { waitUntil: "networkidle" });
  // Scroll through so lazy images load, then back to the top.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  await page.evaluate(hideBrackets);
  // Product photos come from Shopify's CDN, which this environment cannot reach.
  // Hide the broken image so the card shows its colour world instead of a broken icon.
  await page.evaluate(() => document.querySelectorAll("img").forEach((i) => { if (i.complete && i.naturalWidth === 0) i.style.visibility = "hidden"; }));
  await page.screenshot({ path: path.join(OUT, `${s.name}.png`), fullPage: s.full });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`${s.name}: ${s.w}x${h} @${s.dpr ?? 2}x`);
  await ctx.close();
}
await browser.close();
