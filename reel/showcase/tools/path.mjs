// The camera path's speed, frame by frame: linear speed (world units/s) and turn rate
// (degrees/s), with the biggest frame-to-frame changes, so a jolt shows up as a number.
//   node reel/showcase/tools/path.mjs
import { chromium } from "playwright-core";
import { serve, openShowcase, CHROMIUM, CHROMIUM_ARGS } from "./serve.mjs";

const server = await serve();
const browser = await chromium.launch({ executablePath: CHROMIUM, args: CHROMIUM_ARGS });
try {
  const { page } = await openShowcase(browser, server.url);
  const rows = await page.evaluate(() => {
    const { fps, duration, probe } = window.__film;
    const out = [];
    for (let f = 0; f <= Math.round(duration * fps); f++) out.push(probe(f / fps));
    return out;
  });
  const fps = 30;
  const sp = [], tr = [];
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    sp.push(Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]) * fps);
    const dot = Math.min(1, a.d[0] * b.d[0] + a.d[1] * b.d[1] + a.d[2] * b.d[2]);
    tr.push((Math.acos(dot) * 180) / Math.PI * fps);
  }
  const line = [];
  for (let s = 0; s < 30; s++) {
    const seg = (arr) => Math.max(...arr.slice(s * fps, (s + 1) * fps));
    line.push(`${String(s).padStart(2)}s  speed ${seg(sp).toFixed(2).padStart(5)} u/s  turn ${seg(tr).toFixed(1).padStart(5)} °/s`);
  }
  console.log(line.join("\n"));
  const jerk = (arr) => arr.slice(1).map((v, i) => ({ f: i + 1, d: Math.abs(v - arr[i]) })).sort((x, y) => y.d - x.d).slice(0, 5);
  console.log("largest speed changes (u/s per frame):", jerk(sp).map((j) => `${(j.f / fps).toFixed(2)}s:${j.d.toFixed(3)}`).join("  "));
  console.log("largest turn changes (°/s per frame):", jerk(tr).map((j) => `${(j.f / fps).toFixed(2)}s:${j.d.toFixed(2)}`).join("  "));
} finally {
  await browser.close();
  server.close();
}
