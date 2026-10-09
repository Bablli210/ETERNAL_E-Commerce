# eternal — storefront case study (Orbit)

A 30-second portfolio film of the storefront Orbit designed and built for eternal. There
is no CG and no stock: the real site, recorded frame by frame on desktop and on a phone,
plays in a browser window and a phone set on one Linen table. Only the camera moves, and
there are three hard cuts. Short numbered statements explain each part, over an original
score composed in code.

**The film**

| File | What it is for |
| --- | --- |
| `out/eternal-showcase.mp4` | 1920×1080, 30 fps, H.264 at 7.2 Mb/s with AAC 256 kb/s, under 30 MB. For the portfolio site, Behance and Vimeo. |
| `out/eternal-showcase-web.mp4` | The same at 3.2 Mb/s, for embedding on a page. It has sound, so mute it if it autoplays. |
| `out/eternal-showcase-loop.mp4` | The web version fading to bare Linen at the end, so it loops into its first frame. |
| `out/eternal-showcase-poster.jpg` | Thumbnail and `<video poster>`. |
| `out/eternal-showcase-poster-bag.jpg` | A still of the drawer and the sheet side by side. |

## The sequence (112.5 BPM: a beat is 16 frames, a bar 64)

| Time | Shot | On screen |
| --- | --- | --- |
| 0.0–2.1 | The camera starts inside the desktop on the site's own loader. As its curtain lifts, the camera pulls back to both screens. | — |
| 2.1–4.3 | Title | ORBIT — CASE STUDY · *A storefront for eternal, a perfume house in Cairo.* |
| 4.3–8.5 | The phone holds the Instagram-ad first screen. The desktop scrolls to the three lines and clicks eterno. The phone taps its scent. | 01 — HOME · *Built phone-first, for shoppers arriving from Instagram ads.* |
| 8.5–12.8 | The camera follows the desktop into the eterno catalogue. A family chip re-flows the grid, then Raw Seduction is clicked. | 02 — CATALOGUE · *Next.js in front. Shopify for stock and checkout.* · RE-FLOW · 320 MS |
| 12.8–17.1 | **Cut** to the phone on Raw Seduction. The sticky bar rises, a tap opens the bag sheet. | 03 — PRODUCT PAGE · *Product pages that sell on the first screen.* · *Add to bag follows you down the page.* |
| 17.1–21.3 | The camera pulls back. The desktop adds the same scent: the drawer beside the sheet, and both free-delivery meters fill. | 04 — BAG · *One bag: a drawer on desktop, a sheet on the phone.* · DRAWER · 320 MS |
| 21.3–23.5 | **Cut** to the scent finder on the phone: Her, Night. | 05 — SCENT FINDER · *Five questions, three matches.* |
| 23.5–25.6 | **Cut** to the desktop opening the same link. It answers the last question, the mark composes, three matches arrive. | 05 — SCENT FINDER · *The answers live in the link.* |
| 25.6–30.0 | The camera pulls back to both screens. | Designed and built by **Orbit** · services · NEXT.JS · SHOPIFY · VERCEL · *Brand marks and photography: eternal.* |

`storyboard.json` is the approved plan: shots, framings, type, the cue sheet and the
review checklist. `research.json` is the fact base every statement is checked against.

## How it is made

- **Takes of the real site** (`tools/record.mjs`, `tools/takes.mjs`, `tools/vclock.mjs`).
  Each take is a fresh browser context (desktop 1440×900 at 2×, phone 390×844 at 3×)
  driven the way a visitor would use it: eased pointer glides, presses, taps and scrolls,
  timed in film seconds on the beat grid. The page runs on a virtual clock that owns its
  timers, `requestAnimationFrame`, `performance.now` and `Date.now`. The document timeline
  is held at rate 0, and every CSS animation and transition is stepped exactly 1/120 s per
  frame. Between frames the recorder waits, in real time with the clock stopped, for
  every request and in-view image. The site's own motion is therefore captured as it
  plays, with nothing popping in.
- **Logs.** Each frame logs:
  - the pointer and its computed cursor (arrow or hand);
  - the press;
  - the hovered control (to prove only the intended ones are touched);
  - the URL (for the path-only address pill);
  - on the phone, the colour of the page's top row (for the status bar).

  Checks run inside the takes: the meters read EGP 1,230, 980 and 260 away, the finder's
  answers land in the link, and `html[data-ad]` is never set.
- **The compositor** (`index.html`, `src/`). This is plain DOM at 1920×1080, so shadows are
  real CSS shadows and type is the browser's own. Each frame is a pure function of time.
  - `camera.js`: five framings, four moves, three cuts; log-scale zoom with the centre
    coupled to it; a lean of 2° or less only while moving; never frozen.
  - `stage.js`: the generic browser window and phone, the cursor and touch marks.
  - `type.js`: the overlays, placed by baseline from the fonts' own metrics.
  - `edit.js`: the edit.
  - `tools/path.mjs` checks the camera before rendering: speed, lean, and continuity
    except at the cuts.
- **Render** (`tools/render.mjs`). While anything moves, each frame is three sub-frames
  (t − 8.3 ms, t, t + 8.3 ms, which are the takes' own 120 Hz frames) averaged 1:2:1,
  a 180° shutter that never reaches across a cut. A fine monochrome dither stops the
  Linen from banding. The output is tagged BT.709.
- **Score** (`music/`). It is composed in code with numpy and scipy:
  - instruments: FM e-piano, unison-saw pad, sub, a soft house kit and bells;
  - effects: convolution reverb, ping-pong delay and sidechain;
  - mastering: two-pass loudnorm to −14 LUFS with true peak at −1 dBTP or lower.

  `tools/cue.mjs` writes `music/cue.json` from the takes' logs. Each click and tap gets a
  quiet tick (about −30 dBFS) on its exact frame, panned to where that device is on
  screen. The bag sheet and the drawer each get a breath of air. Swells land on the cuts.

## Rebuilding it

You need:
- Node with the repo's `node_modules` (`sharp`, `playwright-core`);
- Python 3 with numpy and scipy;
- ffmpeg;
- Chromium (`CHROMIUM_PATH` if it is not at `/opt/pw-browsers/...`).

```
npm run build && npm run start                   # the storefront, on :3000
node reel/showcase/tools/record.mjs --probe      # quick low-res pass: check positions, hovers, checks
node reel/showcase/tools/record.mjs --force      # the takes, 120 Hz → assets/rec (about 5 min)
node reel/showcase/tools/same.mjs                # which frames repeat (motion blur only where needed)
node reel/showcase/tools/cue.mjs && python3 reel/showcase/music/score.py   # cue → score.wav
node reel/showcase/tools/path.mjs                # camera in spec?
node reel/showcase/tools/render.mjs --draft      # quick check
node reel/showcase/tools/render.mjs              # master (about 7 min)
node reel/showcase/tools/render.mjs --loop       # the loop variant's master
node reel/showcase/tools/deliver.mjs             # → the MP4s and posters
```

To check work:
- `tools/preview.mjs --at 2,9.6,19.8 --debug` makes stills with the camera readout.
- `--sheet 24` makes a contact sheet.
- `--check 9` tests determinism.

To fix one moment, render just that span and splice it into the master frame-exactly:

```
node reel/showcase/tools/render.mjs --from 10.7 --to 13.6 --out reel/showcase/out/fix-master.mp4
node reel/showcase/tools/splice.mjs reel/showcase/out/eternal-showcase-master.mp4 10.7:reel/showcase/out/fix-master.mp4
```

Shopify's image CDN is unreachable from the build environment. The recorder therefore
answers each packshot with one of the product's own local photographs, chosen per take,
so the desktop and the phone show the same still.

## Deliberate choices, and what to confirm before publishing

- **No other brand's name on screen.** The card line naming the fragrance a scent is
  inspired by is hidden in the captures. Everything else is the site as built.
- **No domain.** The address pill shows only the path and query, because the store is
  not yet live on its own domain.
- **Credit hygiene.** Orbit is credited for direction, wireframes, design system,
  motion, front-end and Shopify integration. *Brand marks and photography: eternal.*
- **To confirm:**
  - The Seasons (the client's serif, visible inside every capture) is Fontspring's
    evaluation build, as on the site. License it before the film is public.
  - Confirm the Fontshare licences for General Sans and Cabinet Grotesk cover video.
  - If Orbit has an SVG logo, it replaces the typeset signature at the same cap height
    (`src/type.js`).
