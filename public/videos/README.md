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
ends (or at once if the intro cannot play). Its **last** frame must be the
loop's first, so that hand-over cannot be seen. Its first frame need not be the
poster: the hero film's intro opens on an empty sky, so once the page is idle
the poster (Divina composed) dissolves into the sky over 1.2 s and the bottle
rises back into place. That is deliberate; for a slot that should never leave
its poster, leave the intro out and the loop starts on the poster's frame.

## The hero film (Hyper Motion, October 2026)

From the owner's 2560 master, `ETERNAL_HERO_FILM_full_2560.mp4` (2560 × 1440, 24 fps, 615 frames, 25.6 s): open
sky to Divina's composed frame, then Enzo 1898, Vintage Vanilla and Shadow of the Sea and back to Divina. It is cut
in two at frame 120 (5.0 s), where Divina holds still: the intro is frames 0–119 and the loop frames 120–614, whose
last frame is all but identical to its first, so the loop closes without a seam. The poster is frame 120.

| File | What |
| --- | --- |
| `home-hero-intro`, `home-hero` | The full 2560 × 1440 frame, for screens from 1024 px |
| `home-hero-mobile-intro`, `home-hero-mobile` | The centre 3:4 of the frame at full resolution, 1080 × 1440, for phones |

Desktop is VP9 at 4 Mbit/s and HEVC at 4.4 Mbit/s (intro and loop together about 12.7 MB and 14.1 MB); phones VP9
at 1.2 Mbit/s and HEVC at 1.3 Mbit/s (about 3.8 MB and 4.2 MB), at the owner's request for the full resolution.

## Rules the encoder follows

- **No audio track.** Every film is muted and decorative.
- **Frame one is the poster.** The film fades in over the still once it is
  really playing, so a mismatch shows as a pop. Export frame one to
  `public/images/<name>.jpg` at the film's own size: the image optimiser
  serves each screen the size it needs.
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
- **Budget.** The hero film is the exception the owner chose (see above): about
  13 MB per format on a desktop and 4 MB on a phone. Other films: about 3 MB
  per format on a desktop and 400 KB per phone file.

## What the site does with them

`BackgroundVideo` never mounts a `<video>` at all under
`prefers-reduced-motion: reduce` or with the site's Motion switch off — the
poster simply stays. A data saver or a slow connection does not hold it back;
the clips start once the page is idle. A refused autoplay (iOS Low Power Mode,
some in-app browsers) starts at the visitor's next tap, and a film paused by an
app switch or by scrolling away plays on when it is back in sight. Each crop is
also gated on its own media query, so a visitor downloads the desktop clip or
the mobile clip, never both.

## Weight and how the files were made

Two passes at a set bitrate from the master, cut by frame, no audio:

```
SRC=ETERNAL_HERO_FILM_full_2560.mp4
INTRO="trim=start_frame=0:end_frame=120,setpts=PTS-STARTPTS"
LOOP="trim=start_frame=120,setpts=PTS-STARTPTS"
# phone: add ",crop=1080:1440" to the filter, -tile-columns 1, 1200k (VP9) and 1300k (HEVC)
ffmpeg -i $SRC -vf "$LOOP" -c:v libvpx-vp9 -b:v 4000k -pass 1 -row-mt 1 -tile-columns 2 -cpu-used 4 -an -f null /dev/null
ffmpeg -i $SRC -vf "$LOOP" -c:v libvpx-vp9 -b:v 4000k -pass 2 -row-mt 1 -tile-columns 2 -cpu-used 2 \
  -auto-alt-ref 1 -lag-in-frames 25 -pix_fmt yuv420p -an home-hero.webm
ffmpeg -i $SRC -vf "$LOOP" -c:v libx265 -preset slow -b:v 4400k -x265-params pass=1 -pix_fmt yuv420p -an -f null /dev/null
ffmpeg -i $SRC -vf "$LOOP" -c:v libx265 -preset slow -b:v 4400k -x265-params pass=2 \
  -tag:v hvc1 -pix_fmt yuv420p -movflags +faststart -an home-hero.mp4
```

The intros are the same with `$INTRO`. The posters are frame 120: `public/images/home-hero` at 2560 × 1440 and
`home-hero-mobile`, its centre 1080 × 1440.
