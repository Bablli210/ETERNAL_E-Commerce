// Replaces spans of a master with re-rendered parts, frame-exact. Frames are a pure
// function of time, so a fix to one moment only needs that moment rendered again.
//   node reel/showcase/tools/render.mjs --from 10.7 --to 13.6 --out reel/showcase/out/fix-master.mp4
//   node reel/showcase/tools/splice.mjs reel/showcase/out/eternal-showcase-master.mp4 10.7:reel/showcase/out/fix-master.mp4
// Each part starts at the given time (seconds); its own length decides how many frames it
// replaces. Writes the master back in place (high quality, one more generation).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [master, ...specs] = process.argv.slice(2);
if (!master || !specs.length) throw new Error("usage: splice.mjs master.mp4 <seconds>:<part.mp4> …");
const FPS = 30;
const frames = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", f]).toString().trim());
const total = frames(master);
const parts = specs.map((s) => {
  const i = s.indexOf(":");
  const file = path.resolve(s.slice(i + 1));
  const at = Math.round(Number(s.slice(0, i)) * FPS);
  return { file, at, n: frames(file) };
}).sort((a, b) => a.at - b.at);

// The master's kept runs between the parts.
const runs = [];
let cursor = 0;
parts.forEach((p, k) => {
  if (p.at < cursor) throw new Error(`parts overlap at frame ${p.at}`);
  if (p.at > cursor) runs.push({ src: 0, from: cursor, to: p.at });
  runs.push({ src: k + 1 });
  cursor = p.at + p.n;
});
if (cursor < total) runs.push({ src: 0, from: cursor, to: total });

const kept = runs.filter((r) => r.src === 0).length;
const chains = [`[0:v]split=${kept}${runs.filter((r) => r.src === 0).map((_, i) => `[m${i}]`).join("")}`];
let m = 0;
const labels = runs.map((r, i) => {
  if (r.src === 0) chains.push(`[m${m++}]trim=start_frame=${r.from}:end_frame=${r.to},setpts=PTS-STARTPTS[s${i}]`);
  else chains.push(`[${r.src}:v]setpts=PTS-STARTPTS[s${i}]`);
  return `[s${i}]`;
});
chains.push(`${labels.join("")}concat=n=${runs.length}:v=1:a=0[v]`);

const tmp = master.replace(/\.mp4$/, ".splice.mp4");
execFileSync("ffmpeg", [
  "-v", "error", "-y", "-i", master, ...parts.flatMap((p) => ["-i", p.file]),
  "-filter_complex", chains.join(";"), "-map", "[v]",
  "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-profile:v", "high", "-tune", "film", "-pix_fmt", "yuv420p",
  "-x264-params", "aq-mode=3:aq-strength=0.9:deblock=-1,-1", "-g", "60",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "iec61966-2-1", "-color_range", "tv",
  "-r", String(FPS), "-movflags", "+faststart", tmp,
]);
const out = frames(tmp);
if (out !== total) throw new Error(`spliced master has ${out} frames, expected ${total}`);
fs.renameSync(tmp, master);
console.log(`spliced ${parts.map((p) => `${p.n} frames at ${(p.at / FPS).toFixed(2)}s`).join(", ")} into ${path.relative(process.cwd(), master)} (${total} frames)`);
