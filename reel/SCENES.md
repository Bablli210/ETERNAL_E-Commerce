# Writing a scene

The reel is rendered frame by frame from `index.html`. Each scene is one file,
`scenes/<slug>.js`, registered with `R.scene(slug, { build, render, grain })`.
`timeline.js` places the scenes; the runtime composes them, handles the
transitions *between* scenes, and the tools render frames.

## The one rule: a scene is a pure function of time

`render(t, ctx)` must paint the same pixels for the same `t`, whatever was
rendered before — frames are rendered out of order and in parallel. So:

- Set **every** animated property on **every** call. Never "if (t > 2) show()":
  write `R.fade(el, R.tween(t, 2, 0.6))`, which also un-shows it at t < 2.
- No CSS `transition`/`animation`, no `setTimeout`, `requestAnimationFrame`,
  `Math.random()`, `Date`, no state carried between calls.
- `build(root, ctx)` runs once: create all DOM there. `render` only sets styles
  and (for the film) swaps frames. Return the film's promise from `render`.
- Check it: `node reel/tools/preview.mjs --solo <slug> --sheet 12 --check`
  prints `determinism: ok`, or which frames differ.

## Canvas and grid

1920 × 1080, 30 fps. Margins 120 px left/right; keep text inside x 120–1800,
y 96–984 (title-safe). Grid: 12 columns across 1680 px, 24 px gutter
(column = 118 px). The direction's asymmetry: text on 5 columns, image on 7.
`ctx.duration` is the scene's length on the timeline; `t` runs 0 → duration.

The runtime draws the transition **into** your scene (crossfade, light-wipe,
dip). Design the first 0.6 s so your scene reads well while it is being
revealed, and do not fade your whole scene out at the end — the next scene's
transition covers you. Hold your final state until `ctx.duration`.

## The brand, in code

Colours: `R.color.linen / paper / sand / dune / stone / ash / night / gold /
goldText / sea / blush (eterna) / slate (eterno) / bone (eternal)`.
Type roles (classes in `reel.css`, pass `role`): `display-xl` 128 px,
`display-l` 80, `display-m` 44, `signature` 40 italic, `body` 26, `eyebrow` 17
caps 0.14em, `caption` 19, `numeral` 96 tabular, `wordmark` 72, `mono` 19.
Override `size` when a moment needs it. Radius 0, hairlines not boxes, no
shadows. Golden hour is the only warm accent; Stone only at ≥ 24 px.

Motion (the spec): durations `R.dur.xs .12 · s .2 · m .32 · l .6 · xl 1.2`
seconds; easings `R.ease.standard` (most things), `R.ease.emphasized` (hero
words, big entrances), `R.ease.exit` (leaving), `R.ease.inOut` (long slow
pushes). Rise = 16 px (24 for display). Photos push ≤ 6–8 % over a shot.
Light moving across surfaces, never effects. The e∞ mark draws in one stroke
(`R.drawMark`), never spins. No bounce, shake, whip, zoom punch, glitch,
particles, flares.

## Toolkit (`lib.js`)

| Call | Does |
| --- | --- |
| `R.tween(t, start, dur, ease)` | eased 0→1 |
| `R.envelope(t, a, b, in, out)` | 0→1→0 window |
| `R.stagger(t, start, n, gap, dur, ease)` | array of progresses |
| `R.el(tag, {class, style, text, html, attrs}, parent)` | element |
| `R.box(parent, {x,y,w,h}, style)` | absolute div |
| `R.image(parent, "img/<name>.jpg", {x,y,w,h}, {fit, position})` | `{wrap, img}` |
| `R.push(img, p, from, to)` | slow push/pan `{scale,x,y}` |
| `R.text(parent, text, {role, x, y, w, color, align, size, …})` | text block |
| `R.splitWords(el)` / `R.splitChars(el)` | spans to animate |
| `R.rise(el, p, dist)` / `R.fade(el, p)` | the spec's rise / fade |
| `R.reveal(el, p, dir)` | hard clip reveal, dir left/right/up/down |
| `R.softReveal(el, p, angle, soft)` | soft mask reveal, like light |
| `R.lightBand(parent)` + `R.sweep(band, p)` | warm light passing |
| `R.hairline(parent, rect, color, origin)` + `R.drawLine(el, p)` | rules |
| `R.mark(parent, {x,y,width,color,stroke})` + `R.drawMark(m, p)` | e∞ mark |
| `R.svgEl(tag, attrs, parent)` + `R.drawPath(path, p)` | any SVG |
| `R.browser(parent, {x,y,w,h})` | `{frame, viewport}` minimal window |
| `R.phone(parent, {x,y,h})` | `{frame, screen, sw, sh}` |
| `R.capture(viewport, "<capture>", cssWidth)` | `{img, scale, scroll(yCss)}` |
| `R.film(parent, rect, {dir})` | `{img, at(t)}` hero film, 24 fps loop |

## Assets (`assets/manifest.json` has every size)

- `img/<name>.jpg` — the 52 photographs (≤ 2560 wide). See
  `review/assets-contact-sheet.jpg`.
- `film` (1920×1080) and `film-mobile` (1080×1880) — the hero film, 133
  frames at 24 fps, a seamless 5.54 s loop. Its frame 1 = `img/home-hero.jpg`.
- `site/<capture>.jpg` — the storefront. Desktop captures are 1440 css px wide
  at 2×, mobile 390 at 3×; pass the css width to `R.capture`. Section offsets
  (css px) for `scroll()` are in `review/site-sections.txt`.

Asset rules: the hero-film bottle is the only bottle in close-up; never
`og-image`, `house-founder`, the house page's founder band (css y 3119–3759),
`tale-mercury` (unless blurred to texture), `finder-time-both`,
`finder-who-either`. No faces. The captures' top 36 css px is a blank bar —
crop it. Product cards show colour worlds only (Shopify photos can't load
here): never present them as packshots. Never show bracketed placeholders.

## Checking your work

```
node reel/tools/preview.mjs --solo <slug> --sheet 12 --check   # overview + determinism
node reel/tools/preview.mjs --solo <slug> --at 0.5,3,6         # full-size stills
node reel/tools/preview.mjs --solo <slug> --strip 1,3,0.1      # motion, frame by frame
```

Look at every sheet you make. Full-size stills are the only honest check of
type, spacing and crops.
