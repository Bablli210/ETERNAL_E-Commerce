# mango eclipse — exploded

The campaign still (`public/images/hero-mango-eclipse.jpg`) taken apart. The cap
lifts off the glass along its axis, and the notes the bottle was shot with move
out around it: mango at the top, jasmine and rose at the heart, honey at the base.

| File | Size | For |
| --- | --- | --- |
| `out/mango-eclipse-exploded-4x5.jpg` | 1632 × 2040 | Instagram feed (4:5); the product page's notes still is 4:5 too |
| `out/mango-eclipse-exploded-4x5-clean.jpg` | 1632 × 2040 | The same without labels, for a caption or overlay to carry the words |
| `out/mango-eclipse-exploded-16x9.jpg` | 2400 × 1350 | The still's own frame: landscape posts, a home hero |
| `out/mango-eclipse-exploded-16x9-clean.jpg` | 2400 × 1350 | The same without labels |

**The notes are not confirmed.** Mango Eclipse has no notes in Shopify or in
`content/scents.ts` yet. This pyramid (mango; jasmine and rose; honey) is read off
the campaign still and the notes sculpture (`products/mango-eclipse-3`), not from
the formula. Confirm it before the image goes on the product page or in an ad.
Each label is one line in `index.html` (`labels`).

## How it is made

Every part is cut from the campaign still itself, so the light, grain and colour
all match. The backdrop is the still's purée, sampled (`#dc7c04`).

- `parts.py` cuts the parts into `parts/`. BiRefNet (through rembg) masks each
  crop. The mango half runs off the still's edge, so it is cut along one of its
  own grooves, and the loose cubes are cells of the groove grid. The bottle is
  stood upright (it lies at 8.5° in the still) and split at the shoulder into
  cap and glass.
- `index.html` lays the parts out, one table per format (`portrait`, `wide`):
  each part's centre, width, rotation and how far it floats, which sets its
  shadow. Then the leader lines and labels. `?clean` hides the words.
- `render.sh` renders it with headless Chromium. With no arguments it writes
  the four finals to `out/`.

```
pip install "rembg[cpu]" opencv-python-headless pillow numpy
python3 parts.py      # ~6 min on CPU; downloads BiRefNet (~1 GB) on first run
./render.sh           # out/*.jpg
./render.sh portrait 1 /tmp/look.png   # one quick PNG while adjusting the layout
```

The fonts are the storefront's own, from `reel/fonts`.
