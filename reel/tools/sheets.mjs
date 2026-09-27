// Contact sheets from a rendered MP4, so the film can be reviewed as it will be seen
// (after encoding), not as the browser paints it.
//   node reel/tools/sheets.mjs reel/out/eternal-direction.mp4 [--fps 2] [--per 48] [--from 0 --to 95]
//   node reel/tools/sheets.mjs <mp4> --at 12.5,40,88   # full-size frames from the MP4 at those times
// Output: reel/review/sheets/<name>-NN.jpg (or <name>-<t>s.jpg for --at)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "review", "sheets");
fs.mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const src = path.resolve(args[0]);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const name = path.basename(src, ".mp4");
const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).toString().trim());

const frameAt = (t, w = 1920, h = 1080) => execFileSync("ffmpeg", ["-v", "error", "-ss", String(t), "-i", src, "-frames:v", "1",
  "-vf", `scale=${w}:${h}:in_color_matrix=bt709:in_range=tv,format=rgb24`, "-f", "rawvideo", "-"], { maxBuffer: 1 << 26 });

if (opt("at")) {
  for (const t of opt("at").split(",").map(Number)) {
    const p = path.join(OUT, `${name}-${t.toFixed(2)}s.jpg`);
    await sharp(frameAt(t), { raw: { width: 1920, height: 1080, channels: 3 } }).jpeg({ quality: 92 }).toFile(p);
    console.log(p);
  }
  process.exit(0);
}

const fps = Number(opt("fps", 2)), per = Number(opt("per", 48));
const from = Number(opt("from", 0)), to = Math.min(Number(opt("to", dur)), dur - 0.02);
const times = [];
for (let t = from; t <= to + 1e-9; t += 1 / fps) times.push(+t.toFixed(3));
const W = 480, H = 270, L = 24, cols = 6;
let sheet = 0;
for (let i = 0; i < times.length; i += per) {
  const chunk = times.slice(i, i + per);
  const comps = [];
  for (const [k, t] of chunk.entries()) {
    const x = (k % cols) * (W + 4), y = Math.floor(k / cols) * (H + L + 4);
    comps.push({ input: await sharp(frameAt(t, W, H), { raw: { width: W, height: H, channels: 3 } }).png().toBuffer(), left: x, top: y });
    comps.push({ input: Buffer.from(`<svg width="${W}" height="${L}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111"/><text x="6" y="17" font-family="DejaVu Sans" font-size="14" fill="#ddd">t=${t.toFixed(2)}s</text></svg>`), left: x, top: y + H });
  }
  const rows = Math.ceil(chunk.length / cols);
  const p = path.join(OUT, `${name}-${String(++sheet).padStart(2, "0")}.jpg`);
  await sharp({ create: { width: cols * (W + 4), height: rows * (H + L + 4), channels: 3, background: "#000" } }).composite(comps).jpeg({ quality: 84 }).toFile(p);
  console.log(`${p}  (${chunk[0].toFixed(1)}–${chunk[chunk.length - 1].toFixed(1)}s)`);
}
