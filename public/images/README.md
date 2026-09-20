# Site images

Drop image files in here and the site picks them up. Nothing else is needed:
no code change, no import, no configuration. A slot with no file keeps showing
its labelled placeholder, so files can arrive in any order and in batches.

Names below are **without an extension**. Deliver `.jpg`, `.png`, `.webp` or
`.avif` — whichever you have. Next.js converts and resizes on the way out, so
put the full-size original here rather than a pre-shrunk copy.

Prompts and sizes for every one of these: see the image brief document.

## Product images — `public/images/products/`

Only needed for products whose images are not in Shopify. A Shopify product
image always wins over a local file of the same name.

| File | Used for |
| --- | --- |
| `products/<handle>` | Packshot, gallery frame 1, every card |
| `products/<handle>-2` | Gallery frame 2, the bottle in a scene |
| `products/<handle>-3` | Gallery frame 3, the notes flatlay |
| `products/<handle>-4` | Gallery frame 4, packaging |
| `products/<handle>-hover` | Card hover crossfade. Falls back to frame 2 |
| `products/<handle>-note-1` … `-note-3` | The three notes-pyramid stills |

`<handle>` is the Shopify product handle, the name in the product URL:
`shadow-of-the-sea`, not `Shadow of the Sea`.

## Home page

| File | Used for |
| --- | --- |
| `home-hero` | Hero background, 16:9. Also the poster for `videos/home-hero` |
| `home-hero-mobile` | Hero background on phones. Falls back to `home-hero`. Also the poster for `videos/home-hero-mobile` |
| `line-eterna`, `line-eterno`, `line-eternal` | The three line tiles |
| `finder-band` | Scent finder band |
| `tale-featured` | Featured tale still. Falls back to that scent's `tale-<slug>` |
| `mood-sea-air`, `mood-golden-hour`, `mood-after-dark`, `mood-fresh-linen`, `mood-warm-skin`, `mood-wild-garden` | The six mood tiles |
| `discovery-set` | Discovery set, home and every collection page |
| `mystery-box` | Mystery box card. A Shopify image for the product wins |
| `house-film-poster` | House film poster, home and the house page |

## Scent finder

One tile per answer, named `finder-<question>-<option>`:

```
finder-who-her            finder-who-him           finder-who-either      finder-who-any
finder-time-day           finder-time-night        finder-time-both
finder-mood-sea-air       finder-mood-golden-hour  finder-mood-after-dark
finder-mood-fresh-linen   finder-mood-warm-skin    finder-mood-wild-garden
finder-place-coast        finder-place-city        finder-place-garden    finder-place-kitchen
finder-strength-soft      finder-strength-present  finder-strength-loud
```

## Tales and the house

| File | Used for |
| --- | --- |
| `tale-<slug>` | Tale hero, its card on the tales index and the home teaser |
| `house-step-1`, `house-step-2`, `house-step-3` | How we compose |
| `house-founder` | Founder portrait |

Tale slugs: `shadow-of-the-sea`, `wayne`, `enzo-1898`, `forbidden-apple`, `mercury`.

## Sharing

| File | Used for |
| --- | --- |
| `og-image` | The 1200x630 card shown when a link is shared |

## Textures

`texture-wet-stone`, `texture-sand-ridges`, `texture-linen-weave`,
`texture-frosted-glass`, `texture-plaster`, `texture-sea-surface`.

Installed and available, not referenced by any section yet. The design
direction calls for them as section grounds at 20% opacity.
