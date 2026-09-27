// Makes the files that go to the client from a master render.
//   node reel/tools/deliver.mjs reel/out/eternal-direction-master.mp4 [--mbps 5]
// Writes, next to the master:
//   eternal-direction.mp4        1080p H.264 High, two-pass at the target bitrate, fast start
//   eternal-direction-poster.jpg the end card, for thumbnails and slide decks
// Two-pass puts the bits where the picture needs them (the grain, the fog, the
// water) and keeps the file small enough to email, attach or commit.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const master = path.resolve(args[0]);
const dir = path.dirname(master);
const out = path.join(dir, "eternal-direction.mp4");
const kbps = Math.round(Number(opt("mbps", 5)) * 1000);
const passlog = path.join(os.tmpdir(), `eternal-2pass-${process.pid}`);
const common = [
  "-c:v", "libx264", "-preset", "slower", "-profile:v", "high", "-level", "4.1", "-tune", "film",
  "-b:v", `${kbps}k`, "-maxrate", `${kbps * 3}k`, "-bufsize", `${kbps * 6}k`,
  "-x264-params", "aq-mode=3:aq-strength=0.9:deblock=-1,-1",
  "-pix_fmt", "yuv420p", "-g", "60", "-bf", "3",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "iec61966-2-1", "-color_range", "tv",
  "-passlogfile", passlog, "-an",
];
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", master, ...common, "-pass", "1", "-f", "mp4", os.devNull], { stdio: "inherit" });
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", master, ...common, "-pass", "2", "-movflags", "+faststart", out], { stdio: "inherit" });
for (const f of fs.readdirSync(os.tmpdir())) if (f.startsWith(path.basename(passlog))) fs.unlinkSync(path.join(os.tmpdir(), f));

const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).toString());
const poster = path.join(dir, "eternal-direction-poster.jpg");
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(Math.max(0, dur - 0.05)), "-i", master, "-frames:v", "1",
  "-vf", "scale=in_color_matrix=bt709:in_range=tv", "-q:v", "2", poster]);
const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(1);
console.log(`${out}  ${mb(out)} MB  ${dur.toFixed(2)} s`);
console.log(`${poster}  ${mb(poster)} MB`);
