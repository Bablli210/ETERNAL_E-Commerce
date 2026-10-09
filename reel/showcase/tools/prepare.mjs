// Turns the page captures into textures the GPU can hold, and extracts the brand
// paths from the storefront's TypeScript, so the film draws the same mark and
// logotypes the site does.
//   node reel/showcase/tools/prepare.mjs
// Run after tools/capture.mjs. Writes reel/showcase/assets/tex/*.jpg and assets/brand.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const SHOW = path.join(here, "..");
const ROOT = path.join(SHOW, "..", "..");
const SITE = path.join(SHOW, "assets", "site");
const TEX = path.join(SHOW, "assets", "tex");
fs.mkdirSync(TEX, { recursive: true });

// 1. Textures. WebGL here holds at most 8192 px a side, and every texel costs memory in
// each render worker, so each capture is cut to what its shot shows: the first screen
// for still screens, a tall strip for the screens that scroll.
const MAX = 8192;
const textures = {
  "d-home": { w: 2048, tall: true },
  "d-shop": { w: 2048, tall: false },
  "d-pdp": { w: 2048, tall: false },
  "d-finder": { w: 2048, tall: false },
  "d-finder-done": { w: 2048, tall: false },
  "d-tale": { w: 2048, tall: false },
  "d-bag": { w: 2048, tall: false },
  "m-home": { w: 1024, tall: true },
  "m-pdp": { w: 1024, tall: true },
  "m-shop": { w: 1024, tall: true },
  "m-finder": { w: 1024, tall: false },
  "m-bag": { w: 1024, tall: false },
};
const sites = JSON.parse(fs.readFileSync(path.join(SITE, "manifest.json"), "utf8"));
const manifest = {};
for (const [name, spec] of Object.entries(textures)) {
  const src = path.join(SITE, `${name}.jpg`);
  if (!fs.existsSync(src)) throw new Error(`missing capture ${name}: run tools/capture.mjs`);
  const cap = sites[name];
  const scale = spec.w / cap.w;
  // A first screen: the capture's viewport height (900 css desktop, 844 phone).
  const screenH = Math.round((cap.css < 600 ? 844 : 900) * cap.dpr * scale);
  const fullH = Math.round(cap.h * scale);
  const h = spec.tall ? Math.min(fullH, MAX) : Math.min(screenH, fullH);
  const out = path.join(TEX, `${name}.jpg`);
  await sharp(src, { limitInputPixels: false })
    .resize({ width: spec.w, height: fullH, kernel: "lanczos3" })
    .extract({ left: 0, top: 0, width: spec.w, height: h })
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(out);
  // cssW/cssH: how much of the page (css px) the texture holds, for scrolling by css px.
  manifest[name] = { w: spec.w, h, screenH, cssW: cap.css, cssH: Math.round(h / scale / cap.dpr) };
  console.log(`tex ${name}: ${spec.w}x${h}`);
}
fs.writeFileSync(path.join(TEX, "manifest.json"), JSON.stringify(manifest, null, 1));

// 2. The brand paths, read from the storefront's source of truth.
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const str = (src, name) => {
  const m = src.match(new RegExp(`export const ${name}\\s*=\\s*\\n?\\s*"([^"]+)"`));
  if (!m) throw new Error(`could not read ${name}`);
  return m[1];
};
const markSrc = read("components/ui/mark-path.ts");
const logoSrc = read("components/ui/brand-paths.ts");
const boxSrc = read("components/ui/logo-box.ts");
const logos = {};
for (const m of logoSrc.matchAll(/(eterna|eterno|eternal):\s*"([^"]+)"/g)) logos[m[1]] = m[2];
const boxes = {};
for (const m of boxSrc.matchAll(/(eterna|eterno|eternal):\s*\{\s*w:\s*([\d.]+),\s*h:\s*([\d.]+)\s*\}/g)) boxes[m[1]] = { w: Number(m[2]), h: Number(m[3]) };
if (Object.keys(logos).length !== 3 || Object.keys(boxes).length !== 3) throw new Error("could not read the three logotypes");
const brand = {
  mark: { viewBox: str(markSrc, "MARK_VIEWBOX"), fill: str(markSrc, "MARK_FILL"), line: str(markSrc, "MARK_LINE") },
  logos,
  boxes,
};
fs.writeFileSync(path.join(SHOW, "assets", "brand.json"), JSON.stringify(brand));
console.log("brand.json: mark + eterna, eterno, eternal");
