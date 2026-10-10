// Orbit's overlays: numbered labels and short statements on clean Linen, in General Sans
// and Cabinet Grotesk. Lines are placed by their baselines (measured from the fonts'
// own metrics), rise in with the site's ease-emphasized and leave before the camera or a
// cut crosses their zone.
import { clamp, ease } from "./ease.js";
import { el } from "./stage.js";

const metrics = new Map();
/** Distance from the top of a line box to its baseline, and the cap height, for a CSS font and line height. */
function measure(font, size, lineHeight) {
  const key = `${font}|${size}|${lineHeight}`;
  if (metrics.has(key)) return metrics.get(key);
  const ctx = (measure.ctx ??= document.createElement("canvas").getContext("2d"));
  ctx.font = `400 ${size}px ${font}`;
  const m = ctx.measureText("H");
  const content = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
  const out = { base: (lineHeight - content) / 2 + m.fontBoundingBoxAscent, cap: m.actualBoundingBoxAscent };
  metrics.set(key, out);
  return out;
}
const SANS = "'General Sans'", SUB = "'Cabinet Grotesk'";

/**
 * A line of type that rises in at `at` and leaves by `out`.
 * rise: px it travels in; dur: seconds of the rise; easeIn.
 */
function line(layer, cls, html, { x, baseline, capTop, font, size, lh, at, out, rise = 16, dur = 0.6, easeIn = ease.emphasized, align = "left" }) {
  const e = el("div", `type ${cls}`, layer);
  e.innerHTML = html;
  const m = measure(font, size, lh);
  const top = baseline !== undefined ? baseline - m.base : capTop - (m.base - m.cap);
  e.style.top = `${top.toFixed(2)}px`;
  e.style.left = `${x}px`;
  if (align === "right") e.style.transform = "translateX(-100%)";
  const anchor = align === "right" ? "translateX(-100%) " : "";
  return {
    e,
    width: () => e.getBoundingClientRect().width,
    pose(t) {
      const pin = easeIn(clamp((t - at) / dur));
      const pout = ease.standard(clamp((t - (out - 0.2)) / 0.2));
      const o = Math.min(pin, 1 - pout);
      if (o <= 0) { e.style.visibility = "hidden"; return; }
      e.style.visibility = "visible";
      e.style.opacity = o.toFixed(4);
      e.style.transform = `${anchor}translateY(${((1 - pin) * rise - pout * 8).toFixed(2)}px)`;
    },
  };
}

// Positions from storyboard.json type_system: label cap-top, then the first statement baseline `gap` below it.
const ZONES = {
  band: { x: 120, capTop: 84, gap: 76, measure: 1130 },
  left: { x: 120, centre: 540, gap: 80, measure: 490 },
  right: { x: 700, capTop: 300, gap: 90, measure: 1020 },
};
const STEP = 0.08; // stagger
const LABEL = { font: SUB, size: 20, lh: 20 };
const STATEMENT = { font: SANS, size: 56, lh: 62 };

/** A numbered block: label, statement lines, and an optional line synced to an event. */
export function block(layer, { zone, at, out, num, label, lines, synced }) {
  const z = ZONES[zone];
  const gap = z.gap; // label cap-top → first baseline
  const cap = z.capTop ?? z.centre - (gap + (lines.length - 1) * 62) / 2;
  const items = [];
  const lab = num ? `<b>${num}</b> — ${label}` : label;
  items.push(line(layer, "t-label", lab, { x: z.x, capTop: cap, ...LABEL, at, out }));
  lines.forEach((text, i) => items.push(line(layer, "t-statement", text, { x: z.x, baseline: cap + gap + i * 62, ...STATEMENT, at: at + STEP * (i + 1), out })));
  if (synced) items.push(line(layer, "t-synced", `<i></i>${synced.text}`, { x: z.x, baseline: cap + gap + (lines.length - 1) * 62 + 80, font: SANS, size: 30, lh: 40, at: synced.at, out }));
  // Every statement line must fit its column at 56 px; if one does not, the whole statement drops to 52.
  const st = items.filter((i) => i.e.classList.contains("t-statement"));
  if (st.some((i) => i.width() > z.measure)) for (const i of st) i.e.style.fontSize = "52px";
  const over = st.filter((i) => i.width() > z.measure);
  if (over.length) throw new Error(`overlay line too long for its column: ${over.map((i) => i.e.textContent).join(" | ")}`);
  return { pose: (t) => items.forEach((i) => i.pose(t)) };
}

/** A motion chip (two in the film), on the first frame of the animation it names. */
export function chip(layer, { text, at, out, x, y, align = "left" }) {
  const c = line(layer, "t-chip", text, { x, capTop: y, font: SUB, size: 18, lh: 18, at, out, rise: 4, dur: 0.2, easeIn: ease.standard, align });
  c.e.style.top = `${y}px`;
  return c;
}

/** The end card: credit column on the left of the wide shot. */
export function endCard(layer, at) {
  const x = 120;
  const items = [
    line(layer, "t-label", "Case study — eternal, Cairo", { x, capTop: 330, ...LABEL, at: at.label, out: 99 }),
    line(layer, "t-credit", "Designed and built by", { x, baseline: 410, font: SANS, size: 40, lh: 48, at: at.label + STEP, out: 99 }),
    line(layer, "t-signature", "Orbit", { x: x - 6, baseline: 548, font: SANS, size: 144, lh: 144, at: at.signature, out: 99, rise: 24 }),
    line(layer, "t-services", "Direction · Wireframes · Design system", { x, baseline: 650, font: SANS, size: 24, lh: 34, at: at.signature + 0.347, out: 99 }),
    line(layer, "t-services", "Motion · Front-end · Shopify integration", { x, baseline: 684, font: SANS, size: 24, lh: 34, at: at.signature + 0.347 + STEP / 2, out: 99 }),
    line(layer, "t-stack", "Next.js · Shopify · Vercel", { x, baseline: 730, font: SUB, size: 18, lh: 18, at: at.signature + 0.427, out: 99 }),
    line(layer, "t-fine", "Brand marks, photography and film: eternal.", { x, baseline: 790, font: SANS, size: 16, lh: 16, at: at.signature + 0.507, out: 99 }),
  ];
  const rule = el("div", "rule", layer, { left: `${x}px`, top: "600px", width: "480px" });
  const ruleAt = at.signature + 0.267;
  return {
    pose(t) {
      items.forEach((i) => i.pose(t));
      const p = ease.emphasized(clamp((t - ruleAt) / 0.6));
      rule.style.opacity = p.toFixed(4);
      rule.style.transform = `translateY(${((1 - p) * 16).toFixed(2)}px)`;
    },
  };
}
