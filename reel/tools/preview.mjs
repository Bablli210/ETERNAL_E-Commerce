// Renders stills from the reel so a scene can be checked without a full render.
//
//   node reel/tools/preview.mjs --solo <slug> --sheet 12       # 12 evenly spaced frames → contact sheet
//   node reel/tools/preview.mjs --solo <slug> --at 0,1.5,3     # specific local times, full-size JPGs
//   node reel/tools/preview.mjs --at 10,20 --sheet 0           # global times on the whole film
//   node reel/tools/preview.mjs --solo <slug> --strip 2,4,0.1  # every 0.1 s from 2 s to 4 s → contact sheet (motion check)
//   add --check to verify the scene is deterministic (same t twice → same pixels)
//   add --debug to draw the timecode and the title-safe area
//
// Output goes to reel/review/preview/ and the paths are printed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { serve, openReel, CHROMIUM } from "./serve.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REEL = path.join(here, "..");
const OUT = path.join(REEL, "review", "preview");
fs.mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(`--${k}`);
const solo = opt("solo");
const tag = solo ?? "film";

const server = await serve(REEL);
const browser = await chromium.launch({ executablePath: CHROMIUM });
try {
  const q = [solo ? `solo=${encodeURIComponent(solo)}` : "", flag("debug") ? "debug" : ""].filter(Boolean).join("&");
  const { page, errors } = await openReel(browser, server.url, q ? `?${q}` : "");
  const { duration } = await page.evaluate(() => ({ duration: window.__reel.duration }));
  const shot = async (t) => {
    await page.evaluate((x) => window.__reel.seek(x), t);
    return page.screenshot({ type: "png" });
  };

  let times = [];
  if (opt("at")) times = opt("at").split(",").map(Number);
  else if (opt("strip")) {
    const [a, b, step] = opt("strip").split(",").map(Number);
    for (let t = a; t <= b + 1e-9; t += step) times.push(+t.toFixed(4));
  } else {
    const n = Number(opt("sheet", 12));
    times = Array.from({ length: n }, (_, i) => +((duration * i) / Math.max(1, n - 1)).toFixed(3));
    times[times.length - 1] = Math.max(0, duration - 1 / 30);
  }

  const frames = [];
  for (const t of times) frames.push({ t, png: await shot(t) });

  if (flag("check")) {
    // Paint the frames again in reverse order: a pure scene gives identical pixels.
    let bad = 0;
    for (const f of [...frames].reverse()) {
      const again = await shot(f.t);
      const a = await sharp(f.png).raw().toBuffer();
      const b = await sharp(again).raw().toBuffer();
      let diff = 0;
      for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 2) diff++;
      if (diff > a.length * 0.0005) { bad++; console.log(`NOT DETERMINISTIC at t=${f.t}: ${diff} channel values differ`); }
    }
    console.log(bad ? `determinism: ${bad} frame(s) differ` : "determinism: ok");
  }

  if (opt("at") && !flag("sheet-only")) {
    for (const f of frames) {
      const p = path.join(OUT, `${tag}-${f.t.toFixed(2)}s.jpg`);
      await sharp(f.png).jpeg({ quality: 88 }).toFile(p);
      console.log(p);
    }
  } else {
    const cols = Number(opt("cols", frames.length > 16 ? 6 : 4));
    const W = 480, H = 270, L = 26;
    const rows = Math.ceil(frames.length / cols);
    const comps = [];
    for (const [i, f] of frames.entries()) {
      const x = (i % cols) * (W + 6), y = Math.floor(i / cols) * (H + L + 6);
      comps.push({ input: await sharp(f.png).resize(W, H).toBuffer(), left: x, top: y });
      const svg = `<svg width="${W}" height="${L}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111"/><text x="6" y="18" font-family="DejaVu Sans" font-size="15" fill="#ddd">${tag} t=${f.t.toFixed(2)}s</text></svg>`;
      comps.push({ input: Buffer.from(svg), left: x, top: y + H });
    }
    const p = path.join(OUT, `${tag}-sheet.jpg`);
    await sharp({ create: { width: cols * (W + 6), height: rows * (H + L + 6), channels: 3, background: "#000" } }).composite(comps).jpeg({ quality: 85 }).toFile(p);
    console.log(p);
  }
  if (errors.length) console.log("page errors:\n  " + errors.join("\n  "));
} finally {
  await browser.close();
  server.close();
}
