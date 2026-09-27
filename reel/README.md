# eternal — the direction film

A 94.7-second film that presents the brand and storefront direction — *Salt,
stone and golden hour.* — to the client. It is built from the storefront's
own material (fonts, colour and motion tokens, photographs, the hero film and
captures of the built pages) and rendered frame by frame to MP4.

**The film:** `out/eternal-direction.mp4` (1080p, 30 fps, silent, ~57 MB) and
`out/eternal-direction-poster.jpg` (the end card, for decks and thumbnails).

## Scenes

| # | Scene | Global time |
| --- | --- | --- |
| 01 | First light — the e∞ mark, then the hero film; "Salt, stone and golden hour." | 0.0 – 8.2 |
| 02 | The direction, applied — the real homepage over the same moving water | 7.0 – 15.0 |
| 03 | Four principles — quiet luxury, matière, golden hour, one story per bottle | 14.4 – 35.0 |
| 04 | One story per bottle — Wayne's tale in its colour world, then Shadow of the Sea | 33.8 – 47.1 |
| 05 | Three lines, one house — eterna, eterno, eternal | 45.9 – 55.3 |
| 06 | Colour — the 70/20/6/4 ratio, the palette, the ten colour worlds | 54.7 – 64.7 |
| 07 | Typography — Cormorant Garamond and Instrument Sans in brand lines | 64.1 – 70.3 |
| 08 | Motion — two rules from the motion map, each demonstrated | 69.7 – 75.7 |
| 09 | The storefront — Tales and Shop by mood on desktop | 75.1 – 82.7 |
| 10 | The storefront — two phones | 82.1 – 89.5 |
| 11 | Never meant to fade — the wordmark and tagline over the film; the end card | 88.3 – 94.7 |

`scenes/*.js` are the source of truth. `storyboard.json` is the plan the
scenes were built from; two review rounds refined the scenes since, so treat
it as intent, not as a spec.

## Rebuilding it

Needs Node (the repo's `node_modules`, including `sharp` and
`playwright-core`), ffmpeg, and Chromium (set `CHROMIUM_PATH` if it is not at
`/opt/pw-browsers/...`).

```
npm run build && npm run start                  # the storefront, for captures
node reel/tools/capture-site.mjs                # page captures → assets/site
node reel/tools/capture-hero-clear.mjs          # home hero with the film area clear
node reel/tools/prepare.mjs                     # photos, film frames, manifest
node reel/tools/timeline.mjs                    # timeline.js from storyboard.json (checks the arithmetic)
node reel/tools/render.mjs --crf 15 --out reel/out/eternal-direction-master.mp4
node reel/tools/deliver.mjs reel/out/eternal-direction-master.mp4   # → eternal-direction.mp4 + poster
```

Checking a scene while you work on it: see `SCENES.md` (the contract every
scene follows) and `tools/preview.mjs` (stills, contact sheets, frame strips
and a shuffled-order determinism check). `tools/sheets.mjs` cuts contact
sheets from an encoded MP4.

## Deliberate choices

- **No prices, no offers, no unconfirmed facts** on screen: bracketed facts
  are hidden in the captures, and product cards appear only as colour worlds
  (Shopify's image CDN is unreachable from the build environment, so the
  captures cannot show the Shopify packshots).
- **No Arabic specimen**: the only Arabic copy on the boards is an unreviewed
  placeholder.
- **Colour worlds are labelled** "from the packshot" or "proposed", as on the
  direction board.
- **The e∞ mark** is the one printed on the eterno label, shared with the
  storefront's `components/ui/Wordmark.tsx`.
- **Silent by design**: every idea reads without sound. If a bed is added,
  one beatless ambient piece, mixed low, nothing synced to cuts.

## Review record

`review/critique-round1.json` holds the first review round (four critics,
49 findings) and what was done about each. Contact sheets and previews are
regenerated into `review/sheets` and `review/preview` (not committed).
