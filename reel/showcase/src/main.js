// Boots the film and exposes window.__film for the preview and render tools:
//   await __film.seek(seconds)    // paint that exact moment
//   __film.duration, __film.fps, __film.samples(t) (motion-blur sub-frames wanted at t)
// URL params: ?t=<s> paints that moment on load; ?debug shows the timecode and camera;
// ?takes=probe plays the low-resolution probe takes; ?loop fades to Linen at the end.
import { createEdit, FPS, DURATION } from "./edit.js";

const params = new URLSearchParams(location.search);

async function boot() {
  const faces = ["400 40px 'General Sans'", "400 40px 'Cabinet Grotesk'"];
  await Promise.all(faces.map((f) => document.fonts.load(f, "AaBb09—·’…")));
  await document.fonts.ready;
  for (const f of faces) if (!document.fonts.check(f, "Aa")) throw new Error(`font did not load: ${f}`);

  const stage = document.getElementById("stage");
  const edit = await createEdit(stage);
  let dbg = null;
  if (params.has("debug")) { dbg = document.createElement("div"); dbg.id = "debug"; stage.append(dbg); }

  async function seek(t, centre = t) {
    const waits = edit.pose(t, centre);
    if (dbg) dbg.textContent = `${t.toFixed(3)}s  f${Math.round(t * FPS)}  ${edit.label(t)}`;
    await Promise.all(waits);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }

  await seek(Number(params.get("t") ?? 0));
  window.__film = { fps: FPS, duration: DURATION, seek, label: edit.label, samples: edit.samples, subframes: edit.subframes };
}

boot().catch((err) => {
  document.title = `ERROR: ${err.message}`;
  window.__filmError = err.message;
  console.error(err);
});
