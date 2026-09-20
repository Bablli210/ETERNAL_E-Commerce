# Video slots

A slot plays a film only when **both** a clip and its poster exist, so the two
can never disagree:

| Where | Clip | Poster |
| --- | --- | --- |
| `public/videos/<name>.webm` and `<name>.mp4` | either one is enough | `public/images/<name>.*` |

`home-hero` and `home-hero-mobile` are the only slots wired up so far. Adding a
new one is `<Film name="…" label="…" />` in place of `<Figure />`.

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

- **Two formats, 8-bit.** `libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart`
  and `libvpx-vp9 -crf 28 -b:v 0`. Generators often hand back 10-bit HEVC,
  which Safari plays and most other browsers do not.
- **Budget.** 2.5 MB for a desktop hero across both formats, 1.5 MB for mobile.

## What the site does with them

`BackgroundVideo` never mounts a `<video>` at all under
`prefers-reduced-motion: reduce`, with the site's Motion switch off, or on a
metered or 2g connection — the poster simply stays. Each crop is also gated on
its own media query, so a visitor downloads the desktop clip or the mobile
clip, never both.
