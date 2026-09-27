// Renders the whole reel, frame by frame, to MP4.
//
//   node reel/tools/render.mjs                       # → reel/out/eternal-direction.mp4
//   node reel/tools/render.mjs --workers 3 --from 20 --to 35 --out reel/out/part.mp4
//   node reel/tools/render.mjs --half                # 960x540 draft, much faster
//
// Each worker opens its own page, paints a contiguous run of frames and pipes
// them straight into its own ffmpeg (no frames on disk). The segments are then
// joined without re-encoding. Colour is converted with the BT.709 matrix and
// tagged as such, so the brand colours survive the trip from sRGB to video.
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { serve, openReel, CHROMIUM } from "./serve.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REEL = path.join(here, "..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(`--${k}`);

const WORKERS = Number(opt("workers", 3));
const OUTFILE = path.resolve(opt("out", path.join(REEL, "out", flag("half") ? "eternal-direction-draft.mp4" : "eternal-direction.mp4")));
const CRF = opt("crf", flag("half") ? "23" : "16");
const half = flag("half");
const tmp = path.join(REEL, "out", ".segments");
fs.mkdirSync(tmp, { recursive: true });
for (const f of fs.readdirSync(tmp)) fs.unlinkSync(path.join(tmp, f));

const server = await serve(REEL);
const browser = await chromium.launch({ executablePath: CHROMIUM });
const t0 = Date.now();
try {
  const probe = await openReel(browser, server.url);
  const { duration, fps } = await probe.page.evaluate(() => ({ duration: window.__reel.duration, fps: window.__reel.fps }));
  await probe.page.close();
  const from = Number(opt("from", 0));
  const to = Math.min(Number(opt("to", duration)), duration);
  const first = Math.round(from * fps);
  const last = Math.round(to * fps) - 1;
  const total = last - first + 1;
  const per = Math.ceil(total / WORKERS);
  console.log(`rendering ${total} frames (${from}s–${to}s at ${fps} fps) with ${WORKERS} workers → ${path.relative(process.cwd(), OUTFILE)}`);

  let done = 0;
  const tick = setInterval(() => {
    const el = (Date.now() - t0) / 1000;
    process.stdout.write(`  ${done}/${total} frames · ${(done / el).toFixed(1)} fps · ${el.toFixed(0)}s\n`);
  }, 15000);

  const segments = [];
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const a = first + w * per;
    const b = Math.min(last, a + per - 1);
    if (a > b) return;
    const seg = path.join(tmp, `seg-${String(w).padStart(2, "0")}.mp4`);
    segments[w] = seg;
    const { page } = await openReel(browser, server.url);
    const cdp = await page.context().newCDPSession(page);
    const ff = spawn("ffmpeg", [
      "-v", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
      "-vf", `${half ? "scale=960:540:flags=lanczos," : ""}scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`,
      "-c:v", "libx264", "-preset", half ? "veryfast" : "slow", "-crf", CRF, "-profile:v", "high", "-tune", "film",
      // aq-mode 3 spends bits on dark, flat areas (the fog, the night water), where x264 would otherwise posterise.
      "-x264-params", "aq-mode=3:aq-strength=0.9:deblock=-1,-1",
      "-g", String(fps * 2), "-bf", "2",
      // The pixels are sRGB browser paint: tag the transfer as sRGB so QuickTime/Keynote do not lift the blacks.
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "iec61966-2-1", "-color_range", "tv",
      "-r", String(fps), seg,
    ], { stdio: ["pipe", "inherit", "inherit"] });
    const closed = new Promise((ok, fail) => ff.on("close", (c) => (c === 0 ? ok() : fail(new Error(`ffmpeg exited ${c}`)))));
    for (let f = a; f <= b; f++) {
      await page.evaluate((t) => window.__reel.seek(t), f / fps);
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true });
      const buf = Buffer.from(data, "base64");
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
      done++;
    }
    ff.stdin.end();
    await closed;
    await page.close();
  }));
  clearInterval(tick);

  fs.mkdirSync(path.dirname(OUTFILE), { recursive: true });
  const list = path.join(tmp, "list.txt");
  fs.writeFileSync(list, segments.filter(Boolean).map((s) => `file '${s}'`).join("\n"));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", OUTFILE]);
  const mb = (fs.statSync(OUTFILE).size / 1048576).toFixed(1);
  console.log(`done: ${OUTFILE} · ${mb} MB · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
} finally {
  await browser.close();
  server.close();
}
