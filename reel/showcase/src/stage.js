// The table the film is shot on: plain DOM at 1920×1080, so shadows are real CSS
// shadows and type is the browser's own. A browser window and a phone sit at fixed
// places on one Linen table (stage px); only the camera moves (camera.js). Recorded
// takes of the real site (assets/rec/<take>/) play in the screens frame by frame.
//
// Everything is a pure function of time: each pose() sets every style it owns.
import { clamp, lerp, ease } from "./ease.js";
import { DESK_SCALE, PHONE_SCALE } from "./geometry.js";

export { W, H, DESK_SCALE, PHONE_SCALE, BROWSER, PHONE, VIEWPORT } from "./geometry.js";

export function el(tag, cls, parent, style) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (style) Object.assign(e.style, style);
  parent?.append(e);
  return e;
}
export function svg(markup, parent) {
  const t = document.createElement("template");
  t.innerHTML = markup.trim();
  const s = t.content.firstElementChild;
  parent?.append(s);
  return s;
}

// ── Takes ────────────────────────────────────────────────────────────────────

const ROOT = new URLSearchParams(location.search).get("takes") === "probe" ? "assets/probe" : "assets/rec";

export async function loadTake(id) {
  const meta = await (await fetch(`${ROOT}/${id}/meta.json`)).json();
  // same[i]: frame i repeats frame i − 1 (tools/same.mjs); missing means assume motion.
  meta.same = await fetch(`${ROOT}/${id}/same.json`).then((r) => (r.ok ? r.json() : [])).catch(() => []);
  const pad = (i) => String(i).padStart(5, "0");
  meta.index = (t) => clamp(Math.round((t - meta.t0) * meta.fps), 0, meta.frames - 1);
  meta.src = (i, level) => `${ROOT}/${id}/${level === "full" && i < meta.full.frames ? "full" : "mid"}/${pad(i)}.jpg`;
  meta.at = (t) => meta.log[meta.index(t)];
  // The pointer appears where the take first moves it.
  meta.firstPointer = meta.log.find((e) => e.x !== undefined)?.t ?? Infinity;
  return meta;
}

/** A screen showing a take: one <img>, swapped per frame, decoded before the frame is shot. */
function screen(parent) {
  const img = el("img", "scr", parent);
  img.decoding = "sync";
  img.alt = "";
  let pending = null;
  return {
    show(src) {
      if (img.getAttribute("src") === src) return;
      img.setAttribute("src", src);
      pending = img.decode().catch(() => {});
    },
    ready: () => pending ?? Promise.resolve(),
  };
}

// ── The browser window ───────────────────────────────────────────────────────

const LOCK = `<svg viewBox="0 0 10 12" width="10" height="12" aria-hidden="true"><path d="M2.5 5V3.6a2.5 2.5 0 0 1 5 0V5" fill="none" stroke="#9e9382" stroke-width="1.2"/><rect x="1" y="5" width="8" height="6.4" rx="1.3" fill="#9e9382"/></svg>`;

export function browser(world) {
  const root = el("div", "browser", world);
  const bar = el("div", "bar", root);
  for (const x of [18, 36, 54]) el("i", "dot", bar, { left: `${x - 5}px` });
  const pill = el("div", "pill", bar);
  pill.innerHTML = `${LOCK}<span></span>`;
  const url = pill.querySelector("span");
  const view = el("div", "view", root);
  const scr = screen(view);
  const pointer = cursor(view);
  return {
    root,
    /** Show take `take` at film time t: the frame, its URL in the pill, the pointer. */
    pose(take, t, { level = "mid", pointerOn = true } = {}) {
      const i = take.index(t);
      scr.show(take.src(i, level));
      const e = take.log[i];
      const u = e.url ?? take.url;
      if (url.textContent !== u) url.textContent = u;
      const vis = pointerOn ? clamp((t - take.firstPointer) / 0.15) : 0;
      pointer.pose(e, vis);
    },
    ready: () => scr.ready(),
  };
}

// The pointer: an arrow or a hand, from the page's own computed cursor, in Night with a
// Linen outline; it moves exactly along the recorded mouse path and dips for the press.
const ARROW = `<path d="M1.5 1.5v17.3l4.4-4.1 2.9 6.6 2.9-1.2-2.9-6.5h6.2z" fill="#171614" stroke="#f3efe7" stroke-width="1.5" stroke-linejoin="round"/>`;
const HAND = `<path d="M9 1.6c1.1 0 1.9.9 1.9 2v6.1l.4-.1c1-.1 1.8.5 2 1.4l.1.3.4-.1c1-.1 1.8.5 2 1.4v.4l.4-.1c1-.1 1.9.7 1.9 1.7v4c0 3-2.4 5.4-5.4 5.4h-2c-1.8 0-3.5-.9-4.5-2.4L2.9 17c-.6-.9-.4-2.1.5-2.7.8-.6 1.9-.4 2.6.3l1.1 1.1V3.6c0-1.1.8-2 1.9-2z" fill="#171614" stroke="#f3efe7" stroke-width="1.5" stroke-linejoin="round"/>`;
function cursor(view) {
  const c = svg(`<svg class="cursor" viewBox="0 0 24 24" width="24" height="24"></svg>`, view);
  let shape = "";
  return {
    pose(e, vis) {
      if (!e || e.x === undefined || vis <= 0) { c.style.opacity = "0"; return; }
      const hand = e.cur === "pointer";
      const want = hand ? "hand" : "arrow";
      if (shape !== want) { c.innerHTML = hand ? HAND : ARROW; shape = want; }
      // Hotspots: the arrow's tip at (1.5, 1.5), the fingertip at (9, 1.6). Drawn a little larger than
      // life (35 css px rather than 24), so it reads at film size; it moves in the page's css space.
      const [hx, hy] = hand ? [9, 1.6] : [1.5, 1.5];
      const s = DESK_SCALE * 1.45 * (e.down ? 0.92 : 1);
      c.style.transformOrigin = `${hx}px ${hy}px`;
      c.style.transform = `translate(${(e.x * DESK_SCALE - hx).toFixed(2)}px, ${(e.y * DESK_SCALE - hy).toFixed(2)}px) scale(${s})`;
      c.style.opacity = String(vis);
    },
  };
}

// ── The phone ────────────────────────────────────────────────────────────────

const ICONS = (c) => `<svg viewBox="0 0 17 11" width="17" height="11"><g fill="${c}"><rect x="0" y="7" width="3" height="4" rx=".7"/><rect x="4.6" y="5" width="3" height="6" rx=".7"/><rect x="9.2" y="2.6" width="3" height="8.4" rx=".7"/><rect x="13.8" y="0" width="3" height="11" rx=".7"/></g></svg>
<svg viewBox="0 0 15 11" width="15" height="11"><g fill="${c}"><path d="M7.5 10.6 5.4 8.4a3 3 0 0 1 4.2 0z"/><path d="M3.6 6.6 2.3 5.3a7.4 7.4 0 0 1 10.4 0l-1.3 1.3a5.6 5.6 0 0 0-7.8 0z"/><path d="M1.3 4.3 0 3a10.6 10.6 0 0 1 15 0l-1.3 1.3a8.8 8.8 0 0 0-12.4 0z"/></g></svg>
<svg viewBox="0 0 26 12" width="25" height="12"><rect x=".6" y=".6" width="21.8" height="10.8" rx="3.2" fill="none" stroke="${c}" stroke-opacity=".4" stroke-width="1.1"/><rect x="2.4" y="2.4" width="16.4" height="7.2" rx="1.8" fill="${c}"/><path d="M23.6 4.2v3.6c.8-.3 1.4-1 1.4-1.8s-.6-1.5-1.4-1.8z" fill="${c}" fill-opacity=".45"/></svg>`;

export function phone(world) {
  const root = el("div", "phone", world, { transform: `scale(${PHONE_SCALE})` });
  el("div", "rim", root);
  const glass = el("div", "glass", root);
  const status = el("div", "status", glass);
  status.innerHTML = `<span class="time">10:08</span><span class="icons"></span>`;
  const time = status.querySelector(".time");
  const icons = status.querySelector(".icons");
  el("div", "cam", glass);
  const view = el("div", "view", glass);
  const scr = screen(view);
  const mark = el("div", "touch", view);
  let ink = "";
  return {
    root,
    /** Show take `take` at film time t: the frame, the status bar tinted from the page's top row, the touch marks. */
    pose(take, t) {
      const i = take.index(t);
      scr.show(take.src(i, "mid"));
      const top = take.log[i].top ?? [23, 22, 20];
      status.style.background = `rgb(${top.join(",")})`;
      const lum = (0.2126 * top[0] + 0.7152 * top[1] + 0.0722 * top[2]) / 255;
      const want = lum < 0.5 ? "#f3efe7" : "#171614";
      if (ink !== want) { ink = want; time.style.color = want; icons.innerHTML = ICONS(want); }
      // A tap: a soft Night disc on the logged point, in 2 frames before, out over 240 ms.
      let o = 0, s = 1, x = 0, y = 0;
      for (const m of take.marks) {
        if (m.do !== "tap") continue;
        const d = t - m.at;
        if (d < -0.067 || d > 0.34) continue;
        x = m.x; y = m.y;
        o = d < 0 ? clamp((d + 0.067) / 0.067) : 1 - ease.standard(clamp((d - 0.1) / 0.24));
        s = lerp(0.85, 1, ease.standard(clamp((d + 0.067) / 0.12)));
      }
      mark.style.opacity = String(o);
      mark.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
    },
    ready: () => scr.ready(),
  };
}
