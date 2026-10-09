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

From Drive, Videos / 02 HERO FILM — Hyper Motion (final): the 1920 web intro
(4.3 s, open sky to Divina's composed frame) and loop (18 s, through Enzo 1898
and Shadow of the Sea back to Divina), and the 3840 poster frame. The 4K master
is not used.

| File | What |
| --- | --- |
| `home-hero-intro`, `home-hero` | 1920 × 1080 for screens from 1024 px |
| `home-hero-mobile-intro`, `home-hero-mobile` | The centre 3:4 of the frame at its full 810 × 1080, for phones |

The 1920 web files are H.264 at only 2.2 Mbit/s and show an 8 px block grid in
the fast moments, so they are deblocked first (ffmpeg `spp`, which keeps the
label lettering sharp) and then encoded: desktop VP9 at 2.5 Mbit/s and HEVC at
2.8 Mbit/s, phones VP9 at 500 kbit/s and HEVC at 550 kbit/s. A sharper film
needs a better source than these web files: a higher-bitrate (or 2560) export
of the intro and the loop, delivered in pieces under about 6 MB each.

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
- **Budget.** About 7 MB per format for the desktop film (intro and loop), and
  about 1.4 MB for the phone's (intro and loop), at the owner's request for a
  sharper film; it was 3 MB and 500 KB.

## What the site does with them

`BackgroundVideo` never mounts a `<video>` at all under
`prefers-reduced-motion: reduce`, with the site's Motion switch off, or on a
metered or 2g connection — the poster simply stays. Each crop is also gated on
its own media query, so a visitor downloads the desktop clip or the mobile
clip, never both.

## Weight

Phones on mobile data are the audience (playbook 7.1). `home-hero-mobile` is
the loop at 810 × 1080 (the centre 3:4 of the frame, not scaled), VP9 about
1.1 MB and HEVC about 1.2 MB, and `home-hero-mobile-intro` adds about 270–300
KB. Desktop: `home-hero` about 5.6 MB (VP9) or 6.2 MB (HEVC), its intro about
1.3–1.5 MB. Deblock once, then two passes at a set bitrate:

```
ffmpeg -i loop-1920.mp4 -vf "spp=quality=4:qp=8" -c:v libx264 -preset veryfast -crf 4 -an loop-db.mkv
VF="crop=810:1080"
ffmpeg -i loop-db.mkv -vf "$VF" -c:v libvpx-vp9 -b:v 500k -pass 1 -row-mt 1 -cpu-used 4 -an -f null /dev/null
ffmpeg -i loop-db.mkv -vf "$VF" -c:v libvpx-vp9 -b:v 500k -pass 2 -row-mt 1 -cpu-used 1 \
  -auto-alt-ref 1 -lag-in-frames 25 -pix_fmt yuv420p -an home-hero-mobile.webm
ffmpeg -i loop-db.mkv -vf "$VF" -c:v libx265 -preset slow -b:v 550k -x265-params pass=1 -an -f null /dev/null
ffmpeg -i loop-db.mkv -vf "$VF" -c:v libx265 -preset slow -b:v 550k -x265-params pass=2 \
  -tag:v hvc1 -pix_fmt yuv420p -movflags +faststart -an home-hero-mobile.mp4
```

The desktop files are the same commands without the crop, at 2500k (VP9) and
2800k (HEVC); the intros the same again from the deblocked intro.
