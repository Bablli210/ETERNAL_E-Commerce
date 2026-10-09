// Makes the delivery files from the rendered picture and the score.
//   node reel/showcase/tools/deliver.mjs [master.mp4] [score.wav]
// → out/eternal-showcase.mp4          1080p30 H.264 + AAC, for the portfolio site, Behance, Vimeo (under 30 MB)
//   out/eternal-showcase-web.mp4      lighter, for embedding on a page (with sound; mute it there if it autoplays)
//   out/eternal-showcase-loop.mp4     the web version that fades to bare Linen, so it loops into its first frame
//                                     (from out/eternal-showcase-loop-master.mp4, rendered with render.mjs --loop)
//   out/eternal-showcase-poster.jpg   the end card, for thumbnails and the <video poster>
//   out/eternal-showcase-poster-bag.jpg  the drawer and the sheet side by side
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "out");
const args = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && !(all[i - 1] ?? "").startsWith("--"));
const master = path.resolve(args[0] ?? path.join(OUT, "eternal-showcase-master.mp4"));
const score = path.resolve(args[1] ?? path.join(OUT, "score.wav"));
for (const f of [master, score]) if (!fs.existsSync(f)) throw new Error(`missing ${f}`);

const tags = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"];
const encode = (out, mbps, audioK, src = master) => {
  const log = path.join(OUT, ".segments", "pass");
  fs.mkdirSync(path.dirname(log), { recursive: true });
  const v = ["-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-tune", "film", "-pix_fmt", "yuv420p", "-b:v", `${mbps}M`, "-maxrate", `${(mbps * 1.8).toFixed(1)}M`, "-bufsize", `${mbps * 3}M`, "-x264-params", "aq-mode=3:aq-strength=0.8", "-g", "60", ...tags, "-passlogfile", log];
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, ...v, "-pass", "1", "-an", "-f", "mp4", "/dev/null"]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-i", score, "-map", "0:v", "-map", "1:a", ...v, "-pass", "2", "-c:a", "aac", "-b:a", `${audioK}k`, "-ar", "48000", "-shortest", "-movflags", "+faststart", out]);
  console.log(`${path.relative(process.cwd(), out)} · ${(fs.statSync(out).size / 1048576).toFixed(1)} MB`);
};

encode(path.join(OUT, "eternal-showcase.mp4"), 7.2, 256);
encode(path.join(OUT, "eternal-showcase-web.mp4"), 3.2, 160);
const loopMaster = path.join(OUT, "eternal-showcase-loop-master.mp4");
if (fs.existsSync(loopMaster)) encode(path.join(OUT, "eternal-showcase-loop.mp4"), 3.2, 160, loopMaster);
// Posters: frame 885 (the end card) and frame 594 (the drawer and the sheet, side by side).
const still = (frame, name) => {
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", master, "-vf", `select=eq(n\\,${frame}),scale=in_color_matrix=bt709:in_range=tv:out_range=pc`, "-frames:v", "1", "-q:v", "2", path.join(OUT, name)]);
  console.log(`out/${name}`);
};
still(885, "eternal-showcase-poster.jpg");
still(594, "eternal-showcase-poster-bag.jpg");
