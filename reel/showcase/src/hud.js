// The small type over the picture, set in the DOM so it stays crisp: section captions,
// the title card and the end card. Every style is set on every call (a pure function
// of time), so frames can be painted in any order.
import { tween, ease, clamp } from "./ease.js";

const el = (tag, cls, parent, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  parent?.append(e);
  return e;
};

export function logoSvg(brand, key, height) {
  const box = brand.boxes[key];
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${box.w} ${box.h}`);
  svg.setAttribute("height", String(height));
  svg.setAttribute("width", String((height * box.w) / box.h));
  svg.classList.add("logo");
  const p = document.createElementNS(ns, "path");
  p.setAttribute("d", brand.logos[key]);
  p.setAttribute("fill-rule", "evenodd");
  svg.append(p);
  return svg;
}

const set = (e, o, y = 0, extra = "") => {
  e.style.opacity = String(clamp(o));
  e.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)${extra}`;
  e.style.visibility = o > 0.001 ? "visible" : "hidden";
};

/** A section caption: "01 ——", a title that rises word by word out of a mask, one line of body. */
export function caption(root, { index, title, body }) {
  // A soft dark pool behind the lower left, so the type reads over a bright page.
  const scrim = el("div", "el scrim", root);
  const wrap = el("div", "el cap", root);
  const idx = el("div", "idx", wrap);
  el("span", null, idx, index);
  const rule = el("span", "rule", idx);
  const tl = el("div", "title", wrap);
  const words = title.split(" ").map((w, i, a) => el("span", null, tl, i < a.length - 1 ? `${w} ` : w));
  const bd = el("div", "body", wrap, body);
  return {
    pose(t, inAt, outAt) {
      const out = tween(t, outAt, 0.45, ease.exit);
      set(wrap, 1 - out, -out * 10);
      set(scrim, tween(t, inAt - 0.2, 0.8, ease.inOut) * (1 - tween(t, outAt, 0.6, ease.inOut)));
      set(idx, tween(t, inAt, 0.6), (1 - tween(t, inAt, 0.6)) * 12);
      rule.style.transform = `scaleX(${tween(t, inAt + 0.1, 0.9, ease.emphasized).toFixed(4)})`;
      words.forEach((w, i) => {
        const p = tween(t, inAt + 0.18 + i * 0.07, 0.9, ease.emphasized);
        w.style.transform = `translate3d(0, ${((1 - p) * 105).toFixed(2)}%, 0)`;
        w.style.opacity = String(clamp(p * 1.4));
      });
      const b = tween(t, inAt + 0.45, 0.8, ease.standard);
      set(bd, b, (1 - b) * 14);
    },
  };
}

/** The title card: the house logotype over two lines. */
export function titleCard(root, brand, { line, meta, top }) {
  const wrap = el("div", "el card", root);
  wrap.style.top = `${top}px`;
  const logo = el("div", null, wrap);
  logo.append(logoSvg(brand, "eternal", 92));
  const hair = el("span", "hair", wrap);
  hair.style.marginTop = "30px";
  const l1 = el("div", "line", wrap, line);
  l1.style.marginTop = "26px";
  const l2 = el("div", "meta", wrap, meta);
  l2.style.marginTop = "14px";
  return {
    pose(t, inAt, outAt) {
      const out = tween(t, outAt, 0.5, ease.exit);
      set(wrap, 1 - out, -out * 8);
      const p = tween(t, inAt, 1.2, ease.emphasized);
      set(logo, p, (1 - p) * 26);
      logo.style.filter = `blur(${((1 - p) * 10).toFixed(2)}px)`;
      hair.style.transform = `scaleX(${tween(t, inAt + 0.35, 0.9, ease.emphasized).toFixed(4)})`;
      const a = tween(t, inAt + 0.5, 0.8);
      set(l1, a, (1 - a) * 12);
      l1.style.letterSpacing = `${(0.3 + (1 - a) * 0.25).toFixed(3)}em`;
      const b = tween(t, inAt + 0.7, 0.8);
      set(l2, b, (1 - b) * 12);
    },
  };
}

/** The end card: logotype, what it is, who made it with what, where it lives. */
export function endCard(root, brand, { line, meta, stack, url, top }) {
  const wrap = el("div", "el card", root);
  wrap.style.top = `${top}px`;
  const logo = el("div", null, wrap);
  logo.append(logoSvg(brand, "eternal", 110));
  const l1 = el("div", "line", wrap, line);
  l1.style.marginTop = "40px";
  const hair = el("span", "hair", wrap);
  hair.style.marginTop = "34px";
  const l2 = el("div", "meta", wrap, meta);
  l2.style.marginTop = "30px";
  const l3 = el("div", "meta", wrap, stack);
  l3.style.marginTop = "10px";
  const l4 = el("div", "url", wrap, url);
  l4.style.marginTop = "44px";
  return {
    pose(t, inAt) {
      set(wrap, 1);
      const p = tween(t, inAt, 1.4, ease.emphasized);
      set(logo, p, (1 - p) * 30);
      logo.style.filter = `blur(${((1 - p) * 12).toFixed(2)}px)`;
      const parts = [l1, hair, l2, l3, l4];
      parts.forEach((e, i) => {
        const q = tween(t, inAt + 0.45 + i * 0.12, 0.9);
        if (e === hair) e.style.transform = `scaleX(${q.toFixed(4)})`;
        else set(e, q, (1 - q) * 12);
      });
    },
  };
}
