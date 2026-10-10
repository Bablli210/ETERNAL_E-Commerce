// Renders the film frame by frame to MP4 (picture only; tools/deliver.mjs adds the score).
//
//   node reel/showcase/tools/render.mjs                    # → out/eternal-showcase-master.mp4
//   node reel/showcase/tools/render.mjs --draft            # no motion blur, faster encode
//   node reel/showcase/tools/render.mjs --loop             # the web-loop variant (fades to Linen)
//   node reel/showcase/tools/render.mjs --from 9 --to 14 --out reel/showcase/out/part-master.mp4
//
// While anything moves, a frame averages 9 sub-frames across a 180° shutter (±8.3 ms) with
// triangular weights: camera poses, and screens cross-faded between their recorded frames.
// One sample at rest or on a click; never across a cut (__film.subframes). Then a fine monochrome
// dither (σ 1.2/255, seeded per frame) so the
// Linen gradients never band. Frames are a pure function of time; workers split the range.
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { serve, openShowcase, CHROMIUM } from "./serve.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const SHOW = path.join(here, "..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(`--${k}`);
const draft = flag("draft");
const WORKERS = Number(opt("workers", 3));
const CRF = opt("crf", draft ? "20" : "14");
const loop = flag("loop");
const OUTFILE = path.resolve(opt("out", path.join(SHOW, "out", draft ? "eternal-showcase-draft.mp4" : loop ? "eternal-showcase-loop-master.mp4" : "eternal-showcase-master.mp4")));
const tmp = path.join(SHOW, "out", ".segments");
fs.mkdirSync(tmp, { recursive: true });
for (const f of fs.readdirSync(tmp)) fs.rmSync(path.join(tmp, f), { recursive: true, force: true });

/** A seeded generator (mulberry32), so the grain is the same on every render of a frame. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function frameBuffer(page, cdp, t, f, draft) {
  const shot = async () => (await sharp(Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true })).data, "base64")).removeAlpha().raw().toBuffer({ resolveWithObject: true }));
  const subs = draft ? [[t, 1]] : await page.evaluate((x) => window.__film.subframes(x), t);
  let acc = null, meta = null, total = 0;
  for (const [x, w, centre = t] of subs) {
    await page.evaluate(([y, c]) => window.__film.seek(y, c), [x, centre]);
    const { data, info } = await shot();
    meta = info;
    if (!acc) acc = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) acc[i] += data[i] * w;
    total += w;
  }
  // Monochrome dither, σ ≈ 1.2/255 (a sum of three uniforms, scaled), over the whole frame.
  const r = rng(0x5eed + f * 7919);
  const out = Buffer.alloc(acc.length);
  for (let i = 0; i < acc.length; i += 3) {
    const g = draft ? 0 : (r() + r() + r() - 1.5) * 2.4;
    for (let c = 0; c < 3; c++) out[i + c] = Math.max(0, Math.min(255, Math.round(acc[i + c] / total + g)));
  }
  return { buf: sharp(out, { raw: { width: meta.width, height: meta.height, channels: 3 } }).png({ compressionLevel: 1 }).toBuffer(), n: subs.length };
}

const server = await serve();
const browser = await chromium.launch({ executablePath: CHROMIUM });
const t0 = Date.now();
try {
  const query = loop ? "?loop" : "";
  const probe = await openShowcase(browser, server.url, query);
  const { duration, fps } = await probe.page.evaluate(() => ({ duration: window.__film.duration, fps: window.__film.fps }));
  await probe.page.close();
  const from = Number(opt("from", 0));
  const to = Math.min(Number(opt("to", duration)), duration);
  const first = Math.round(from * fps);
  const last = Math.round(to * fps) - 1;
  const total = last - first + 1;
  const per = Math.ceil(total / WORKERS);
  console.log(`rendering ${total} frames (${from}s–${to}s at ${fps} fps) with ${WORKERS} workers${draft ? ", draft" : ""} → ${path.relative(process.cwd(), OUTFILE)}`);
  let done = 0, shots = 0;
  const tick = setInterval(() => {
    const el = (Date.now() - t0) / 1000;
    const rate = done / el;
    process.stdout.write(`  ${done}/${total} frames · ${(rate * 60).toFixed(1)} frames/min · ~${rate > 0 ? ((total - done) / rate / 60).toFixed(0) : "?"} min left\n`);
  }, 60000);
  const segments = [];
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const a = first + w * per;
    const b = Math.min(last, a + per - 1);
    if (a > b) return;
    const seg = path.join(tmp, `seg-${String(w).padStart(2, "0")}.mp4`);
    segments[w] = seg;
    const { page } = await openShowcase(browser, server.url, query);
    const cdp = await page.context().newCDPSession(page);
    const ff = spawn("ffmpeg", [
      "-v", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
      "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
      "-c:v", "libx264", "-preset", draft ? "veryfast" : "slow", "-crf", CRF, "-profile:v", "high", "-tune", "film",
      "-x264-params", "aq-mode=3:aq-strength=0.8", "-g", String(fps * 2), "-bf", "2",
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
      "-r", String(fps), seg,
    ], { stdio: ["pipe", "inherit", "inherit"] });
    const closed = new Promise((ok, fail) => ff.on("close", (c) => (c === 0 ? ok() : fail(new Error(`ffmpeg exited ${c}`)))));
    for (let f = a; f <= b; f++) {
      const t = f / fps;
      const { buf, n } = await frameBuffer(page, cdp, t, f, draft);
      shots += n;
      if (!ff.stdin.write(await buf)) await new Promise((r) => ff.stdin.once("drain", r));
      done++;
    }
    ff.stdin.end();
    await closed;
    await page.close();
  }));
  clearInterval(tick);
  const list = path.join(tmp, "list.txt");
  fs.writeFileSync(list, segments.filter(Boolean).map((s) => `file '${s}'`).join("\n"));
  fs.mkdirSync(path.dirname(OUTFILE), { recursive: true });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", OUTFILE]);
  console.log(`done: ${OUTFILE} · ${(fs.statSync(OUTFILE).size / 1048576).toFixed(1)} MB · ${shots} sub-frames · ${((Date.now() - t0) / 60000).toFixed(1)} min`);
} finally {
  await browser.close();
  server.close();
}
