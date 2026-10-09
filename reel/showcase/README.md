# eternal — the storefront showcase

A 30-second cinematic piece for a portfolio: one continuous camera move, no cuts,
through a 3D world built from the storefront's own material — the e∞ mark and the
logotypes (extruded from `components/ui`), a modelled 55 ml bottle with its real
label, the built pages on screens and phones, and the brand faces for every word.

**The film:** `out/eternal-showcase.mp4` (1920×1080, 30 fps, H.264, silent),
`out/eternal-showcase-web.mp4` (the same, lighter, for embedding with
`autoplay muted loop playsinline`) and `out/eternal-showcase-poster.jpg`.

## The sequence

| Time | Beat |
| --- | --- |
| 0.0 – 3.6 | The e∞ mark in gold, found by a passing band of light. *A perfume house from Cairo.* |
| 3.6 – 4.6 | The camera flies through the mark's eye… |
| 4.6 – 9.6 | …onto the bottle on wet stone, in golden light. *Some things are never meant to fade.* (a rack focus to the line, and back). Title: eternal, e-commerce storefront. |
| 9.6 – 13.6 | The home page powers on and scrolls: the first screen, three lines, where to start. |
| 13.6 – 20.6 | A lateral dolly along the shop, a product page and the scent finder. |
| 20.6 – 25.4 | Three phones: a product, the home page, the bag. *Made for the phone in your hand.* |
| 25.4 – 30.0 | The camera cranes up from the phones to the mark; the end card holds. |

`src/film.js` is the source of truth: the world's layout, the camera path (keyed
in time, C1-continuous, so the move never jolts), focus pulls, light cues and every
beat. Copy for the captions and cards is near the end of it.

## Rebuilding it

Needs Node with the repo's `node_modules` (`sharp`), `playwright-core` (link it into
`node_modules` if it is installed globally), ffmpeg and Chromium (`CHROMIUM_PATH` if it
is not at `/opt/pw-browsers/...`). WebGL runs on SwiftShader, so it renders the same on
any machine, GPU or not.

```
npm run build && npm run start                       # the storefront, for the captures
node reel/showcase/tools/capture.mjs                 # page captures → assets/site
node reel/showcase/tools/prepare.mjs                 # textures + brand paths → assets/tex, assets/brand.json
node reel/showcase/tools/render.mjs --draft          # quick check, 1 sub-frame per frame
node reel/showcase/tools/render.mjs                  # master, 5 sub-frames per frame (slow: about an hour per worker-pair)
node reel/showcase/tools/deliver.mjs                 # → eternal-showcase.mp4, -web.mp4, -poster.jpg
```

Shopify's image CDN is unreachable from the build environment, so `capture.mjs`
answers product-image requests with the same product's own photograph from
`public/images/products` (its notes still, else its lifestyle frame). Bracketed facts
still to confirm are hidden in the captures.

Checking work: `tools/preview.mjs --at 2,6.5,12` (full-size stills), `--sheet 24`
(a contact sheet), `--check 7.3` (determinism: the same pixels after painting other
frames). `tools/path.mjs` prints the camera's speed and turn rate for every second and
the largest frame-to-frame changes, so a jolt in the path shows up as a number before
anything is rendered. `tools/profile.mjs` times each render stage.

The master renders in chunks when a long run is not practical, then joins without
re-encoding:

```
node reel/showcase/tools/render.mjs --from 0 --to 10 --out reel/showcase/out/eternal-showcase-master-p1.mp4
node reel/showcase/tools/render.mjs --from 10 --to 20 --out reel/showcase/out/eternal-showcase-master-p2.mp4
node reel/showcase/tools/render.mjs --from 20 --to 30 --out reel/showcase/out/eternal-showcase-master-p3.mp4
printf "file '%s'\n" eternal-showcase-master-p1.mp4 eternal-showcase-master-p2.mp4 eternal-showcase-master-p3.mp4 > reel/showcase/out/parts.txt
ffmpeg -f concat -safe 0 -i reel/showcase/out/parts.txt -c copy -movflags +faststart reel/showcase/out/eternal-showcase-master.mp4
```

## How it is made

- **One rule:** every frame is a pure function of time (`pose(t)` in `src/film.js`),
  so frames render out of order, in parallel, and re-render identically.
- **Render pipeline** (`src/pipeline.js`): each frame averages several sub-frames
  across a 180° shutter (motion blur) with sub-pixel jitter (anti-aliasing). Each
  sub-frame is the scene plus a half-resolution bokeh depth of field; bloom and the
  grade (Khronos PBR Neutral tone mapping, so the page captures keep their colours,
  vignette, grain, a touch of lateral chromatic aberration) run once on the average.
- **Typography in the world** (`src/type3d.js`): each word or letter is a plane drawn
  in the brand faces at its true advance, so lines can rise word by word, arrive out of
  focus and catch a band of light without losing the face's spacing. Small type
  (captions, cards) is DOM over the canvas, for crispness (`src/hud.js`).
- **The bottle** (`src/brand3d.js`): lathed glass with a heavy base and transmission,
  the juice, a lacquered dome cap and a wrap label drawn from the real logotype paths.
- **The light**: a studio of softboxes for reflections (`src/atmos.js`), a key, a rim,
  a band of light that signs the mark at the start and comes to rest on it at the end,
  shafts and drifting motes that size their own bokeh.

## Deliberate choices

- **Silent**: it reads without sound. If a bed is added, one beatless ambient piece,
  mixed low, with a soft swell as the camera passes through the mark (3.6–4.6 s).
- **The Seasons is Fontspring's demo build**, as on the site (`app/fonts.ts`): licence
  the web/desktop font before publishing the film publicly, as for the site's launch.
- **Prices appear only where the site shows them** (the captured pages); no claim on
  screen that the site does not make.
