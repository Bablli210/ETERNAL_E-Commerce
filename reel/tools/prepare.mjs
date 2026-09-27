// Builds reel/assets from the storefront's own files. Run once before previewing
// or rendering, and again whenever an image, the hero film or a capture changes.
//   node reel/tools/prepare.mjs
// Needs ffmpeg on PATH (for the film frames) and sharp (already in node_modules).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const REEL = path.join(here, "..");
const ROOT = path.join(REEL, "..");
const A = path.join(REEL, "assets");
const mk = (d) => fs.mkdirSync(d, { recursive: true });

// 1. Photographs: at most 2560 px wide, which leaves room for a slow push at 1920.
mk(path.join(A, "img"));
const photos = fs.readdirSync(path.join(ROOT, "public/images")).filter((f) => /\.jpe?g$/i.test(f));
for (const f of photos) {
  const out = path.join(A, "img", f.replace(/\.jpeg$/i, ".jpg"));
  const src = path.join(ROOT, "public/images", f);
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs) continue;
  await sharp(src).resize({ width: 2560, withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
}
console.log(`img: ${photos.length}`);

// 2. The hero film as a frame sequence, so every rendered frame is exact.
for (const [name, dir] of [["home-hero", "film"], ["home-hero-mobile", "film-mobile"]]) {
  const src = path.join(ROOT, "public/videos", `${name}.webm`);
  const outDir = path.join(A, dir);
  if (!fs.existsSync(src)) continue;
  if (fs.existsSync(outDir) && fs.readdirSync(outDir).length > 100) { console.log(`${dir}: cached`); continue; }
  mk(outDir);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-q:v", "2", path.join(outDir, "%03d.jpg")]);
  console.log(`${dir}: ${fs.readdirSync(outDir).length} frames`);
}

// 3. Storefront captures (from tools/capture-site.mjs) as JPEG, which decode far faster than PNG.
const site = path.join(A, "site");
if (fs.existsSync(site)) {
  for (const f of fs.readdirSync(site).filter((x) => x.endsWith(".png"))) {
    const out = path.join(site, f.replace(/\.png$/, ".jpg"));
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(path.join(site, f)).mtimeMs) continue;
    const m = await sharp(path.join(site, f), { limitInputPixels: false }).metadata();
    await sharp(path.join(site, f), { limitInputPixels: false }).jpeg({ quality: 90, mozjpeg: true }).toFile(out);
    console.log(`site: ${f} ${m.width}x${m.height}`);
  }
}

// 4. A manifest the runtime and the scene authors read: every asset with its pixel size.
const manifest = {};
for (const sub of ["img", "site"]) {
  const d = path.join(A, sub);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith(".jpg") || x.endsWith(".webp"))) {
    const m = await sharp(path.join(d, f), { limitInputPixels: false }).metadata();
    manifest[`${sub}/${f}`] = { w: m.width, h: m.height };
  }
}
for (const dir of ["film", "film-mobile"]) {
  const d = path.join(A, dir);
  if (!fs.existsSync(d)) continue;
  const frames = fs.readdirSync(d).filter((x) => x.endsWith(".jpg")).sort();
  const m = await sharp(path.join(d, frames[0])).metadata();
  manifest[dir] = { frames: frames.length, fps: 24, w: m.width, h: m.height };
}
fs.writeFileSync(path.join(A, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`manifest: ${Object.keys(manifest).length} entries`);
