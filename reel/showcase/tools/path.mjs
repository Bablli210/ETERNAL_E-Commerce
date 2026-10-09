// Checks the camera before anything is rendered: screen speed, lean, and that velocity is
// continuous everywhere except at the three cuts.
//   node reel/showcase/tools/path.mjs
import { camera, CUTS } from "../src/camera.js";

const FPS = 120, END = 30;
// The picture's speed: how fast table points under the frame's centre and corners move on screen.
const pts = [[960, 540], [0, 0], [1920, 0], [0, 1080], [1920, 1080]];
const table = (c, [x, y]) => [(x - 960) / c.k + c.cx, (y - 540) / c.k + c.cy];
const screen = (c, [x, y]) => [960 + c.k * (x - c.cx), 540 + c.k * (y - c.cy)];
const speedAt = (t, h = 1 / FPS) => {
  const a = camera(t), b = camera(t + h);
  return Math.max(...pts.map((p) => { const q = table(a, p), r = screen(b, q); return Math.hypot(r[0] - p[0], r[1] - p[1]) / h; }));
};
const isCut = (t, h) => CUTS.some((c) => t < c && t + h >= c);

let maxSpeed = 0, maxSpeedAt = 0, maxLean = 0, maxLeanAt = 0, worstJump = 0, worstJumpAt = 0;
let restLean = 0;
const perSecond = [];
for (let i = 0; i < END * FPS; i++) {
  const t = i / FPS;
  const c = camera(t);
  if (isCut(t, 1 / FPS) || isCut(t - 1 / FPS, 1 / FPS) || isCut(t + 1 / FPS, 1 / FPS)) continue;
  const v = speedAt(t);
  if (v > maxSpeed) { maxSpeed = v; maxSpeedAt = t; }
  if (Math.abs(c.lean) > maxLean) { maxLean = Math.abs(c.lean); maxLeanAt = t; }
  if (v < 20) restLean = Math.max(restLean, Math.abs(c.lean));
  // Acceleration in screen px/s²: a jump in velocity shows as a spike.
  const jump = Math.abs(speedAt(t + 1 / FPS) - v) * FPS;
  if (jump > worstJump) { worstJump = jump; worstJumpAt = t; }
  const s = Math.floor(t);
  perSecond[s] = Math.max(perSecond[s] ?? 0, v);
}
console.log("max picture speed per second (px/s):");
console.log(perSecond.map((v, s) => `${String(s).padStart(2)}s ${v.toFixed(0).padStart(5)} ${"#".repeat(Math.round(v / 40))}`).join("\n"));
console.log(`\nmax speed ${maxSpeed.toFixed(0)} px/s at ${maxSpeedAt.toFixed(3)} s (limit 1500)`);
console.log(`max lean ${maxLean.toFixed(2)}° at ${maxLeanAt.toFixed(3)} s (limit 2); lean while at rest ${restLean.toFixed(3)}°`);
console.log(`largest acceleration ${worstJump.toFixed(0)} px/s² at ${worstJump ? worstJumpAt.toFixed(3) : "-"} s (cuts excluded: ${CUTS.join(", ")})`);
const ok = maxSpeed <= 1500 && maxLean <= 2.0001 && restLean < 0.05;
console.log(ok ? "camera: ok" : "camera: OUT OF SPEC");
process.exitCode = ok ? 0 : 1;
