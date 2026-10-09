// The takes recorded for the film (tools/record.mjs): the real site, driven the way a
// visitor would use it. Every time is in film seconds on the 112.5 BPM grid (16 output
// frames to the beat, 64 to the bar): F(n) is output frame n at 30 fps. t0 is the film
// time of a take's first frame and `until` its last; the edit holds first and last frames.
// Selectors and timings come from the site's code (components/*, app/motion.css).
const F = (n) => n / 30;

const SHOP_CHIP = (name) => `[aria-label='Quick filters'] button:has-text('${name}')`;
const RAW = "article[data-card='raw-seduction']";
const ADD = "main form[action='/bag'] button[type=submit] >> nth=0";
const PLUS = "[data-bag-sheet] button[aria-label^='Increase quantity']";

export const TAKES = [
  // D1 · desktop, first visit: the loader's mark and curtain, the hero, down to the three
  // lines, the pointer reads eterno and clicks into its catalogue; there a family chip
  // re-flows the grid, the page runs down to Raw Seduction and the card is clicked.
  { id: "v2-d1", device: "desktop", url: "/?hero=raw-seduction", loader: true, t0: 0, until: 12.9, full: 2.2,
    // Cards show the bottle in a scene and cross-fade to the notes still; the product page opens on the notes still.
    routes: { default: ["-2", "-3", ""] },
    // The pointer stays off controls except the ones each moment is about: it waits in the
    // right margin, travels through clear Linen and the grid's gutters, and lands on target.
    timeline: [
      { at: F(128), do: "scroll", to: { sel: "h2:has-text('Three lines') >> visible=true", off: -110 }, dur: F(32), ease: "inOut" },
      { at: F(176), do: "move", to: [1392, 560] },
      { at: F(186), do: "glide", to: [540, 515], via: [[900, 534]], dur: F(22) },
      { at: F(238), do: "down" },
      { at: F(240), do: "up" },
      // On the eterno page the pointer is over the banner, clear of the search field and the chips.
      { at: F(270), do: "glide", to: [1046, 330], dur: F(18) },
      { at: F(288), do: "scroll", to: 420, dur: F(16), ease: "inOut" },
      { at: F(302), do: "glide", to: { sel: SHOP_CHIP("Woody") }, via: [[1046, 250], [900, 166], [760, 152], [380, 150]], dur: F(14) },
      { at: F(318), do: "down" },
      { at: F(320), do: "up" },
      { at: F(328), do: "check", note: "woody filter, 9 cards", fn: "() => location.search.includes('family=woody') && document.querySelectorAll('article[data-card]').length === 9 || [location.search, document.querySelectorAll('article[data-card]').length]" },
      { at: F(322), do: "glide", to: [720, 300], via: [[340, 150], [690, 152]], dur: F(14) },
      { at: F(336), do: "scroll", to: { sel: RAW, off: -250 }, dur: F(24), ease: "inOut" },
      { at: F(360), do: "glide", to: [608, 428], via: [[720, 392]], dur: F(10) },
      { at: F(374), do: "route", set: { "raw-seduction": ["-3"] } },
      { at: F(374), do: "down" },
      { at: F(376), do: "up" },
      { at: F(386), do: "check", note: "on raw seduction", fn: "() => location.pathname === '/products/raw-seduction' || location.pathname" },
    ] },

  // D3 · desktop product page, fresh with an empty bag: Add to bag, the drawer, +1 fills the meter.
  { id: "v2-d3", device: "desktop", url: "/products/raw-seduction", t0: F(512), until: 21.4, warm: 4.333,
    routes: { "raw-seduction": ["-3"] },
    setup: [{ do: "move", to: [480, 650] }],
    timeline: [
      { at: F(528), do: "glide", to: { sel: ADD, dx: 60 }, via: [[700, 420]], dur: F(21) },
      { at: F(558), do: "down" },
      { at: F(560), do: "up" },
      { at: F(585), do: "check", note: "drawer: bag (1), 1,230 away", fn: "() => /Your bag \\(1\\)/.test(document.body.innerText) && /1,230 away/.test(document.body.innerText)" },
      { at: F(597), do: "glide", to: { sel: PLUS }, via: [[1300, 300]], dur: F(9) },
      { at: F(606), do: "down" },
      { at: F(608), do: "up" },
      { at: F(636), do: "check", note: "desktop meter: 260 away", fn: "() => /260 away/.test(document.body.innerText) && /1,940/.test(document.body.innerText)" },
    ] },

  // D4 · desktop finder, opened from the link the phone started: the last answer, composing, three matches.
  { id: "v2-d4", device: "desktop", url: "/finder?who=her&time=night&notes=gourmand&place=paris-cafe&q=5", t0: F(704), until: 26.2,
    routes: { mystique: ["-2"], "vanilla-blanche": ["-3"], paradox: [""] },
    setup: [{ do: "move", to: { sel: "a.tile:has-text('Arm')" } }, { do: "advance", ms: 400 }],
    timeline: [
      { at: F(718), do: "down" },
      { at: F(720), do: "up" },
      { at: F(729), do: "glide", to: [1400, 520], dur: F(12) },
      { at: 25.2, do: "check", note: "three matches", fn: "() => /Three to start with/.test(document.body.innerText) && location.search.includes('strength=present') || location.search" },
    ] },

  // P1 · phone, the Instagram-ad first screen: the headline rises, the marquee runs, then a tap on the hero's scent.
  { id: "v2-p1", device: "phone", url: "/?hero=raw-seduction", t0: 1.0, until: 9.6,
    routes: { "raw-seduction": ["-3"] },
    timeline: [
      { at: F(248), do: "tap", target: "#hero a[data-card]" },
      { at: 9.5, do: "check", note: "phone on raw seduction", fn: "() => location.pathname === '/products/raw-seduction' || location.pathname" },
    ] },

  // P2 · phone product page: down the page, the sticky bar rises, a tap, the bag sheet, the Mystery Box added.
  { id: "v2-p2", device: "phone", url: "/products/raw-seduction", t0: F(384), until: 21.4, warm: 4.333,
    routes: { "raw-seduction": ["-3"] },
    watch: "() => !!document.querySelector('.pdp-bar')",
    timeline: [
      { at: F(416), do: "scroll", to: 640, cross: { y: 589, at: F(448) }, ease: "inOut" },
      { at: F(464), do: "tap", target: ".pdp-bar button[type=submit]" },
      { at: F(490), do: "check", note: "sheet: 1,230 away", fn: "() => /1,230 away/.test(document.body.innerText)" },
      { at: F(592), do: "tap", target: "[data-bag-sheet] section[aria-label='A suggestion'] button:has-text('Add')" },
      { at: F(630), do: "check", note: "phone meter: 980 away", fn: "() => /980 away/.test(document.body.innerText)" },
    ] },

  // P3 · phone finder: Her, then Night; the answers go into the link.
  { id: "v2-p3", device: "phone", url: "/finder", t0: F(640), until: 23.8,
    timeline: [
      { at: F(656), do: "tap", target: "a.tile:has-text('Her')" },
      { at: F(688), do: "tap", target: "a.tile:has-text('Night')" },
      { at: 23.7, do: "check", note: "answers in the link", fn: "() => location.search === '?who=her&time=night&q=3' || location.search" },
    ] },
];
