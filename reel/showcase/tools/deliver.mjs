// Makes the delivery files from a rendered master.
//   node reel/showcase/tools/deliver.mjs [master.mp4]
// → out/eternal-showcase.mp4       1080p30 H.264, high quality, for the portfolio site and Behance/Vimeo uploads
//   out/eternal-showcase-web.mp4   the same at a lighter bitrate, for embedding on a page (autoplay, loop)
//   out/eternal-showcase-poster.jpg  a still for thumbnails and the <video poster>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "out");
const master = path.resolve(process.argv[2] ?? path.join(OUT, "eternal-showcase-master.mp4"));
if (!fs.existsSync(master)) throw new Error(`no master at ${master}: run tools/render.mjs first`);

const tags = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "iec61966-2-1", "-color_range", "tv"];
const encode = (out, mbps, preset = "slow") => {
  // Two passes at a target bitrate: the grain and the soft glows get bits where they need them.
  const log = path.join(OUT, ".segments", "pass");
  fs.mkdirSync(path.dirname(log), { recursive: true });
  const common = ["-c:v", "libx264", "-preset", preset, "-profile:v", "high", "-tune", "film", "-pix_fmt", "yuv420p", "-b:v", `${mbps}M`, "-maxrate", `${(mbps * 1.6).toFixed(1)}M`, "-bufsize", `${mbps * 3}M`, "-x264-params", "aq-mode=3:aq-strength=0.9:deblock=-1,-1", "-g", "60", ...tags, "-passlogfile", log];
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", master, ...common, "-pass", "1", "-an", "-f", "mp4", "/dev/null"]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", master, ...common, "-pass", "2", "-an", "-movflags", "+faststart", out]);
  console.log(`${path.relative(process.cwd(), out)} · ${(fs.statSync(out).size / 1048576).toFixed(1)} MB`);
};

encode(path.join(OUT, "eternal-showcase.mp4"), 9);
encode(path.join(OUT, "eternal-showcase-web.mp4"), 3.5);
// The home page on its screen: the moment that says "this is a storefront" at a glance.
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "12.4", "-i", master, "-frames:v", "1", "-q:v", "2", path.join(OUT, "eternal-showcase-poster.jpg")]);
console.log("out/eternal-showcase-poster.jpg");
