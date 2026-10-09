// Captures the storefront pages the showcase shows, from a running `npm run start`.
//   node reel/showcase/tools/capture.mjs [baseUrl] [only,these,names]
// Writes JPEGs to reel/showcase/assets/site/ and their sizes to manifest.json.
// Bracketed facts still to confirm are hidden for the capture only, as in the
// direction film: the showcase never shows a placeholder.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "assets", "site");
const BASE = process.argv[2] ?? "http://localhost:3000";
const ONLY = process.argv[3]?.split(",");
const exe = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
fs.mkdirSync(OUT, { recursive: true });

const BAG = "/bag?items=49293117128963:1,49293100384515:1,49293137674499:1";
const FINDER_DONE = "/finder?who=her&time=night&notes=gourmand,amber&place=paris-cafe&strength=present";
const D = { w: 1440, h: 900, dpr: 2 };
const M = { w: 390, h: 844, dpr: 3 };
const shots = [
  { name: "d-home", url: "/?hero=vintage-vanilla", ...D, full: true },
  { name: "d-shop", url: "/shop", ...D, full: true },
  { name: "d-pdp", url: "/products/vintage-vanilla", ...D, full: true },
  { name: "d-finder", url: "/finder?who=her&q=2", ...D, full: false },
  { name: "d-finder-done", url: FINDER_DONE, ...D, full: true },
  { name: "d-tale", url: "/tales/wayne", ...D, full: true },
  { name: "d-bag", url: BAG, ...D, full: false },
  { name: "m-home", url: "/?hero=raw-seduction", ...M, full: true },
  { name: "m-pdp", url: "/products/wayne", ...M, full: true },
  { name: "m-shop", url: "/shop/her", ...M, full: true },
  { name: "m-finder", url: "/finder?who=him&q=3", ...M, full: false },
  { name: "m-bag", url: BAG, ...M, full: false },
];

const hideBrackets = () => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  while (walker.nextNode()) if (/\[[^\]]+\]/.test(walker.currentNode.nodeValue)) hits.push(walker.currentNode);
  for (const node of hits) {
    const box = node.parentElement?.closest("li, p, span, a, button, dd, dt, div");
    if (box && box.textContent.trim().length <= 80) { box.style.visibility = "hidden"; continue; }
    const frag = document.createDocumentFragment();
    for (const part of node.nodeValue.split(/(\[[^\]]+\])/)) {
      if (/^\[[^\]]+\]$/.test(part)) { const s = document.createElement("span"); s.textContent = part; s.style.visibility = "hidden"; frag.append(s); }
      else frag.append(document.createTextNode(part));
    }
    node.replaceWith(frag);
  }
};

// Shopify's image CDN is unreachable from the build environment, so a card or gallery
// that waits on it shows an empty frame. Answer those requests with the same product's
// own photograph from public/images/products (its notes still, else its lifestyle
// frame), so every card shows its own bottle. The one product without a local photo
// keeps its empty frame, which the capture hides.
const ROOT = path.join(here, "..", "..", "..");
const LOCAL = path.join(ROOT, "public", "images", "products");
const snapshot = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalogue.snapshot.json"), "utf8"));
const handleOf = new Map();
for (const p of snapshot.products) for (const im of p.images ?? []) handleOf.set(im.url.split("?")[0], p.handle);
const localFor = (shopifyUrl) => {
  const handle = handleOf.get(shopifyUrl.split("?")[0]);
  if (!handle) return null;
  for (const s of ["-3", "-2", "", "-4"]) {
    const f = path.join(LOCAL, `${handle}${s}.jpg`);
    if (fs.existsSync(f)) return f;
  }
  return null;
};
const routeShopify = async (route) => {
  const u = new URL(route.request().url());
  const src = u.pathname === "/_next/image" ? u.searchParams.get("url") : u.href;
  const file = src && localFor(src);
  if (!file) return route.fulfill({ status: 404, body: "" });
  const w = Number(u.searchParams.get("w")) || 1200;
  const body = await sharp(file).resize({ width: Math.min(w, 2048), withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
  return route.fulfill({ status: 200, contentType: "image/jpeg", body });
};

const browser = await chromium.launch({ executablePath: exe });
const manifestFile = path.join(OUT, "manifest.json");
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : {};
for (const s of shots.filter((x) => !ONLY || ONLY.includes(x.name))) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dpr, reducedMotion: "reduce", isMobile: s.w < 600, hasTouch: s.w < 600 });
  // A visitor who has already answered the cookie question and seen the loader curtain.
  const host = new URL(BASE).hostname;
  await ctx.addCookies([{ name: "eternal_consent", value: `1.0.0.${Date.now()}`, domain: host, path: "/" }]);
  await ctx.addInitScript(() => { try { sessionStorage.setItem("eternal.loaded", "1"); } catch {} });
  await ctx.route(/\/_next\/image\?url=https%3A%2F%2Fcdn\.shopify\.com/, routeShopify);
  await ctx.route(/^https:\/\/cdn\.shopify\.com\//, routeShopify);
  const page = await ctx.newPage();
  await page.goto(BASE + s.url, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  await page.evaluate(hideBrackets);
  // The floating WhatsApp button and the house film's "[video to add]" control are not part of the pages shown.
  await page.addStyleTag({ content: "a[href*='wa.me'][class*='fixed'], [data-whatsapp-float], a[aria-label=\"Watch the house film\"] > span { visibility: hidden !important; }" });
  await page.evaluate(() => document.querySelectorAll("img").forEach((i) => { if (i.complete && i.naturalWidth === 0) i.style.visibility = "hidden"; }));
  await page.waitForTimeout(300);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  if (sw > s.w) console.log(`  note: ${s.name} is ${sw} css px wide at a ${s.w} px viewport; cropped to the viewport`);
  const full = await page.screenshot({ fullPage: s.full });
  const fm = await sharp(full, { limitInputPixels: false }).metadata();
  const png = fm.width > s.w * s.dpr ? await sharp(full, { limitInputPixels: false }).extract({ left: 0, top: 0, width: s.w * s.dpr, height: fm.height }).png().toBuffer() : full;
  const file = path.join(OUT, `${s.name}.jpg`);
  const meta = await sharp(png, { limitInputPixels: false }).metadata();
  await sharp(png, { limitInputPixels: false }).jpeg({ quality: 90, mozjpeg: true }).toFile(file);
  manifest[s.name] = { w: meta.width, h: meta.height, css: s.w, dpr: s.dpr };
  console.log(`${s.name}: ${meta.width}x${meta.height}`);
  await ctx.close();
}
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1));
await browser.close();
