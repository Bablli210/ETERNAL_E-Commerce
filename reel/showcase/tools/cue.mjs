// Writes the score's cue (music/cue.json) from the recorded takes and the edit, so every
// interface sound lands on the frame of the click or tap it belongs to, panned to where
// that device is on screen at that moment.
//   node reel/showcase/tools/cue.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { camera } from "../src/camera.js";
import { VIEWPORT } from "../src/geometry.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const REC = path.join(here, "..", "assets", "rec");
const meta = (id) => JSON.parse(fs.readFileSync(path.join(REC, id, "meta.json"), "utf8"));
const round = (x) => Math.round(x * 10000) / 10000;

/** Pan for a point in a device's css space at film time t: where it is on screen, gently. */
function pan(device, x, y, t) {
  const v = VIEWPORT[device];
  const c = camera(t);
  const sx = 960 + c.k * (v.x + x * v.s - c.cx);
  return round(Math.max(-1, Math.min(1, (0.6 * (sx - 960)) / 960)));
}

const clicks = [], brushes = [];
for (const id of ["v2-d1", "v2-d3", "v2-d4"]) {
  for (const m of meta(id).marks) if (m.do === "up") clicks.push([round(m.at), pan("desktop", m.x, m.y, m.at), 1, `${id} click`]);
}
for (const id of ["v2-p1", "v2-p2", "v2-p3"]) {
  for (const m of meta(id).marks) if (m.do === "tap") clicks.push([round(m.at), pan("phone", m.x, m.y, m.at), 1, `${id} tap`]);
}
clicks.sort((a, b) => a[0] - b[0]);
// The air under the two panels: the bag sheet and the drawer, each 450 ms after its Add (the site's reveal timer).
const sheetTap = meta("v2-p2").marks.find((m) => m.do === "tap");
brushes.push([round(sheetTap.at + 0.45), pan("phone", 195, 600, sheetTap.at + 0.45), 1, "bag sheet"]);
const add = meta("v2-d3").marks.find((m) => m.do === "up");
brushes.push([round(add.at + 0.45), pan("desktop", 1210, 450, add.at + 0.45), 1, "drawer"]);

const BEAT = 60 / 112.5;
const finder = meta("v2-p3").marks.filter((m) => m.do === "tap");
const cue = {
  bpm: 112.5,
  sections: { keys_pads: [1, 2], groove_a: [3, 6], groove_b: [7, 10], lift: [11, 12], full: [13, 13], end: [14, 14] },
  swells: [3, 7, 11, 13, 14],
  pickups: [5, 7],
  rims: [14.9333], // the sticky bar rises on the bar-8 downbeat
  clicks,
  brushes,
  bells: [
    [0.6, "C6", 0.5, 0], // the curtain starts to lift
    // Each finder answer is answered by one note, as the next question slides in.
    ...finder.map((m, i) => [round(m.at + BEAT / 2), ["A5", "C6"][i], 0.42, pan("phone", m.x, m.y, m.at)]),
    // Composing your matches: sixteenths, then a dyad as the three matches land.
    ...["F5", "A5", "C6", "D6", "C6"].map((n, i) => [round(24.2667 + (i * BEAT) / 4), n, 0.26, 0.1]),
    [24.8833, "A5", 0.4, 0.12], [24.8833, "C6", 0.4, 0.12],
  ],
  air: [[0.45, 1.0]],
  felt: [[23.4667, "C5", 0.62]], // the handoff cut, phone → desktop
};
fs.writeFileSync(path.join(here, "..", "music", "cue.json"), JSON.stringify(cue, null, 1));
console.log(`cue: ${clicks.length} clicks, ${brushes.length} brushes, ${cue.bells.length} bells`);
for (const c of clicks) console.log(`  ${c[0].toFixed(3)}s  pan ${c[1] >= 0 ? "+" : ""}${c[1].toFixed(2)}  ${c[3]}`);
