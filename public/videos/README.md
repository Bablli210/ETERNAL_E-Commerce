# Video slots

A slot plays a film only when **both** a clip and its poster exist, so the two
can never disagree:

| Where | Clip | Poster |
| --- | --- | --- |
| `public/videos/<name>.webm` and `<name>.mp4` | either one is enough | `public/images/<name>.*` |

`home-hero` and `home-hero-mobile` are the only slots wired up so far. Adding a
new one is `<Film name="…" label="…" />` in place of `<Figure />`.

A clip named `<name>-intro` (`.webm` and/or `.mp4`), when there is one, plays
once before the loop: the loop buffers while it plays and takes over when it
ends. The intro may open on anything, but its **last** frame must be the loop's
first, so the hand-over cannot be seen.

## The hero film (Hyper Motion, October 2026)

From Drive, Videos / 02 HERO FILM — Hyper Motion (final): the 1920 web intro
(4.3 s, open sky to Divina's composed frame) and loop (18 s, through Enzo 1898
and Shadow of the Sea back to Divina), and the 3840 poster frame. The 4K master
is not used.

| File | What |
| --- | --- |
| `home-hero-intro`, `home-hero` | 1920 × 1080 for screens from 1024 px |
| `home-hero-mobile-intro`, `home-hero-mobile` | The centre 3:4 of the frame, for phones |

Desktop is VP9 at about 1 Mbit/s and HEVC at about 1.1 Mbit/s; phones VP9 and
HEVC at about 160 kbit/s, so each phone file stays near 400 KB.

## Rules the encoder follows

- **No audio track.** Every film is muted and decorative.
- **Frame one is the poster.** The film fades in over the still once it is
  really playing, so a mismatch shows as a pop. Export frame one to
  `public/images/<name>.jpg` at 120 KB or less.
- **Seamless.** The last frame has to flow into the first. Where a generated
  clip does not close, cross-fade the tail into the head:

  ```
  ffmpeg -i in.mp4 -filter_complex \
    "[0:v]trim=0:0.5,setpts=PTS-STARTPTS[head]; \
     [0:v]trim=0.5:5.54,setpts=PTS-STARTPTS[mid]; \
     [0:v]trim=5.54:6.04,setpts=PTS-STARTPTS[tail]; \
     [tail][head]xfade=transition=fade:duration=0.5:offset=0[blend]; \
     [blend][mid]concat=n=2:v=1,format=yuv420p[out]" -map "[out]" -an out.mp4
  ```

- **Two formats, 8-bit.** VP9 WebM, which Chrome, Android, Firefox and Edge
  take first, and an MP4 for Safari. The MP4 may be H.264 or 8-bit HEVC tagged
  `hvc1` (`libx265 … -tag:v hvc1 -pix_fmt yuv420p`): only browsers without WebM
  reach it, and every one of those plays HEVC. HEVC is about half the size of
  H.264 for the same picture, which is what keeps a long film inside the phone
  budget. Generators often hand back 10-bit HEVC, which Safari plays and most
  other browsers do not, so always re-encode to 8-bit.
- **Two-pass, by bitrate.** A detailed film re-encoded by CRF from an already
  compressed source comes out several times larger; two passes at a set
  bitrate keep the size known.
- **Budget.** About 3 MB per format for the desktop film (intro and loop), and
  about 400 KB per phone file.

## What the site does with them

`BackgroundVideo` never mounts a `<video>` at all under
`prefers-reduced-motion: reduce`, with the site's Motion switch off, or on a
metered or 2g connection — the poster simply stays. Each crop is also gated on
its own media query, so a visitor downloads the desktop clip or the mobile
clip, never both.

## Weight

Phones on mobile data are the audience, so the mobile clip stays under 400 KB
(playbook 7.1). `home-hero-mobile` is 720 px wide, H.264 CRF 22 (about 310 KB)
and VP9 WebM (about 280 KB); 720 px covers a 390 px phone at 2x without visible
loss.

```
ffmpeg -i master.mp4 -vf "scale=720:-2:flags=lanczos" -c:v libx264 -preset slow \
  -crf 22 -profile:v high -pix_fmt yuv420p -movflags +faststart -an home-hero-mobile.mp4
```
