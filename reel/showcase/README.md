# eternal — storefront case study (Orbit)

A 30-second portfolio film of the storefront Orbit designed and built for eternal. There
is no CG and no stock: the real site, recorded frame by frame on desktop and on a phone,
plays in a browser window and a phone set on one Linen table. Only the camera moves, and
there are three hard cuts. Short numbered statements explain each part, over an original
score composed in code.

**The film**

| File | What it is for |
| --- | --- |
| `out/eternal-showcase.mp4` | 1920×1080, 30 fps, H.264 at 7.6 Mb/s with AAC 256 kb/s, under 30 MB. For the portfolio site, Behance and Vimeo. |
| `out/eternal-showcase-web.mp4` | The same at 3.2 Mb/s with AAC 160 kb/s, for embedding on a page. It has sound, so mute it if it autoplays. |
| `out/eternal-showcase-loop.mp4` | The web version fading to bare Linen over 29.6–29.967 s, so it loops into its first frame. |
| `out/eternal-showcase-poster.jpg` | The end card (frame 885), for thumbnails and `<video poster>`. |
| `out/eternal-showcase-poster-bag.jpg` | A still of the drawer and the sheet side by side (frame 594). |

Each MP4 carries the title, Orbit as artist and the credit line in its metadata. The posters
are converted from the video's BT.709 to BT.601 full range, as JPEG expects, so reds and
blues do not shift.

## The sequence (112.5 BPM: a beat is 16 frames, a bar 64)

| Time | Shot | On screen |
| --- | --- | --- |
| 0.0–2.1 | The camera starts inside the desktop on the site's own loader. Its curtain lifts on the hero film (Divina rising through pink drops), and the camera pulls back to both screens. The phone holds an Instagram-ad landing, pinned to the bottle the ad showed (Raw Seduction's still), its headline at rest from the first frame, as on every ad landing. | — |
| 2.1–4.3 | Title | ORBIT — CASE STUDY · *A storefront for eternal, a perfume house in Cairo.* |
| 4.3–8.5 | The phone holds the Instagram-ad first screen. The desktop scrolls to the three lines and clicks eterno. The phone taps its scent. | 01 — HOME · *Built phone-first: an Instagram ad lands on the bottle it showed.* |
| 8.5–12.8 | The camera follows the desktop into the eterno catalogue. A family chip re-flows the grid, then Raw Seduction, an Eternal Original, is clicked. | 02 — CATALOGUE · *Next.js in front. Shopify for stock and checkout.* · RE-FLOW · 320 MS |
| 12.8–17.1 | **Cut** to the phone on Raw Seduction. The sticky bar rises, a tap opens the bag sheet, and its suggestion (Enzo 1898) is added. | 03 — PRODUCT PAGE · *Product pages that sell on the first screen.* · *Add to bag follows you down the page.* |
| 17.1–21.3 | The camera pulls back. The desktop adds the same scent: the drawer beside the sheet, and both free-delivery meters fill. | 04 — BAG · *The bag: a drawer on desktop, a sheet on the phone.* · DRAWER · 320 MS |
| 21.3–23.5 | **Cut** to the scent finder on the phone: Her, Night. | 05 — SCENT FINDER · *Five questions, three matches.* |
| 23.5–25.6 | **Cut** to the desktop, which picks the finder up from a link carrying the phone's two answers and two more. It answers the last question, the mark composes, three matches arrive. | 05 — SCENT FINDER · *The answers live in the link.* |
| 25.6–30.0 | The camera pulls back to both screens, both on the three matches: off screen, the phone has opened the results link. | Designed and built by **Orbit** · services · NEXT.JS · SHOPIFY · VERCEL · *Brand marks, photography and film: eternal.* |

`storyboard.json` is the approved plan: shots, framings, type, the cue sheet and the
review checklist. `research.json` is the fact base every statement is checked against.

## How it is made

- **Takes of the real site** (`tools/record.mjs`, `tools/takes.mjs`, `tools/vclock.mjs`).
  Each take is a fresh browser context (desktop 1440×900, phone 390×844) driven the way a
  visitor would use it: eased pointer glides, presses, taps and scrolls, timed in film
  seconds on the beat grid. Scrolls ease on a sine, whose peak speed is half a cubic's, so
  they blur instead of strobing. Frames are captured at a true 2× on desktop and 3× on the
  phone: the CDP screenshot clip is scaled to the device pixel ratio, without which CDP
  returns 1× shots. The page runs on a virtual clock that owns its timers,
  `requestAnimationFrame`, `performance.now` and `Date.now`. The document timeline is held
  at rate 0, and every CSS animation and transition is stepped exactly one frame at a time:
  1/240 s in the two takes with fast scrolls (the desktop's opening take, `v2-d1`, and the
  phone's product page, `v2-p2`), and 1/120 s in the others. Between frames the recorder
  waits, in real time with the clock stopped, for every request and in-view image. The
  site's own motion is therefore captured as it plays, with nothing popping in.
- **The phone's ad landing.** The phone's first take (`v2-p1`) is a real Instagram-ad visit:
  `?hero=raw-seduction` pins the bottle the ad showed, and the link carries utm parameters,
  as Meta's ads do. The site therefore sets `html[data-ad]`, shows the headline at rest from
  its first frame with no word rise, and drops its brand-only sections, as it does for
  every ad landing.
- **Logs.** Each frame logs:
  - the pointer and its computed cursor (arrow or hand);
  - the press;
  - the hovered control (to prove only the intended ones are touched);
  - the URL (for the path-only address pill);
  - on the phone, the colour of the page's top row (for the status bar).

  Checks run inside the takes: the meters read EGP 1,220, 121 and 250 away (free delivery from
  EGP 2,190), the desktop lands on Raw Seduction, the finder's
  answers land in the link, and `html[data-ad]` is set only on the phone's ad landing.
- **The compositor** (`index.html`, `src/`). This is plain DOM at 1920×1080, so shadows are
  real CSS shadows and type is the browser's own. Each frame is a pure function of time.
  - `camera.js`: five framings, four moves, three cuts; log-scale zoom with the centre
    coupled to it; a lean of 2° or less only while moving; never frozen.
  - `stage.js`: the generic browser window and phone. Their screens cross-fade between
    recorded frames, and the cursor moves between its logged positions. The two-tone touch
    mark appears 150 ms before each tap, so it lands on the control and not on the page the
    tap opens.
  - `type.js`: the overlays, placed by baseline from the fonts' own metrics.
  - `edit.js`: the edit.
  - `tools/path.mjs` checks the camera before rendering: speed, lean, and continuity
    except at the cuts.
- **Render** (`tools/render.mjs`). The shutter is 180°: a frame gathers ±1/120 s. While
  anything moves, that span is sampled with 9 triangular-weighted taps, and the screens
  cross-fade between their recorded frames, so camera and page motion blur instead of
  strobing. A single sample applies at rest, or when a click or tap switches the page's
  state inside the shutter. Before frame 128 the desktop shows its take at the frame's own
  time, so the hero film's 24 fps frames never double-expose. No tap reaches across a cut,
  and frame 0 is bare Linen. A fine monochrome dither stops the Linen from banding. The
  output is tagged BT.709.
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
node reel/showcase/tools/record.mjs --force      # the takes, 240 Hz (v2-d1, v2-p2) and 120 Hz → assets/rec
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
so the desktop and the phone show the same still. The one difference is the finder's
results: on a phone they show each scent's notes still, as the site does on touch screens.

## Deliberate choices, and what to confirm before publishing

- **No other brand's name on screen.** Each "Inspired by <name>" line is hidden in the
  captures (`REDACT_INIT` in `tools/record.mjs` marks them). The house's own labels, such as
  "Eternal Original" and "Not inspired by another fragrance: only at eternal.", stay, as
  does everything else the site shows.
- **The hero film** plays on the recorder's clock like everything else: the page sees it
  playing, and each step seeks it to its 24 fps frame (`vc.media` in `tools/vclock.mjs`).
- **No domain.** The address pill shows only the path and query, because the store is
  not yet live on its own domain.
- **Credit hygiene.** Orbit is credited for direction, wireframes, design system,
  motion, front-end and Shopify integration. *Brand marks, photography and film: eternal.*
- **To confirm:**
  - The Seasons (the client's serif, visible inside every capture) is Fontspring's
    evaluation build, as on the site. License it before the film is public.
  - Confirm the Fontshare licences for General Sans and Cabinet Grotesk cover video.
  - If Orbit has an SVG logo, it replaces the typeset signature at the same cap height
    (`src/type.js`).
