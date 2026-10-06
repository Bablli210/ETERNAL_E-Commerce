# Site images

Drop image files in here and the site picks them up. Nothing else is needed:
no code change, no import, no configuration. A slot with no file shows
nothing to customers (a quiet surface in its colour, or the e∞ mark on a
product's colour world), so files can arrive in any order and in batches.

Names below are **without an extension**. Deliver `.jpg`, `.png`, `.webp` or
`.avif` — whichever you have. Next.js converts and resizes on the way out, so
put the full-size original here rather than a pre-shrunk copy.

Prompts and sizes for every one of these: see the image brief document.

## Product images — `public/images/products/`

Only needed for products whose images are not in Shopify. A Shopify product
image always wins over a local file of the same frame.

| File | Used for |
| --- | --- |
| `products/<handle>` | The packshot: gallery frame 1 and every product card |
| `products/<handle>-2` | Gallery frame 2, the lifestyle frame: the bottle in a scene |
| `products/<handle>-3` | Gallery frame 3, the notes sculpture: the bottle among its notes. Also the frame a card crossfades to on hover |
| `products/<handle>-4` | Gallery frame 4, the packaging |
| `products/<handle>-hover` | Only to override the card's hover frame (laptops and desktops). Without it the card uses `-3`, then frame 2 |

`<handle>` is the Shopify product handle, the name in the product URL:
`shadow-of-the-sea`, not `Shadow of the Sea`. A product with no packshot
yet shows its colour world and the e∞ mark on every card.

## Collection pages

| File | Used for |
| --- | --- |
| `collection-her`, `collection-him`, `collection-unisex` | The band at the top of `/shop/her`, `/shop/him` and `/shop/unisex`, behind the line's name and the search. 2400 × 1029 (7:3): keep the left half dark and empty for the type, the subject right of centre. It is about 160 px tall on a phone, so the subject must read small |

## Home page

| File | Used for |
| --- | --- |
| `home-hero` | The first hero film's poster (16:9), kept with `videos/home-hero`; the home page now opens on the campaign heroes below |
| `home-hero-mobile` | The phone crop of that poster, kept with `videos/home-hero-mobile` |
| `line-eterna`, `line-eterno`, `line-eternal` | The three line tiles |
| `family-fresh`, `family-woody`, `family-amber-spice`, `family-floral`, `family-gourmand`, `family-aquatic` | The six "Shop by scent" tiles (4:3). Until each exists the tile borrows an ingredient still: the mood stills below, and for woody the notes still of Raw Seduction |
| `finder-band` | Scent finder band |
| `tale-featured` | Featured tale still. Used when the tale has no `tale-<slug>-card` |
| `mood-sea-air`, `mood-golden-hour`, `mood-after-dark`, `mood-warm-skin`, `mood-wild-garden` | Stand-ins for the scent tiles (aquatic, fresh, amber & spice, gourmand, floral) until their `family-` stills exist. `mood-fresh-linen` is no longer shown |
| `mystery-box` | The wide mystery box still. "Try before you commit" falls back to it while the box has no packshot; `products/mystery-box` is that packshot, used there, in the collection grid and in the bag |
| `house-film-poster` | House film poster, on the home page |

## Campaign heroes

| File | Used for |
| --- | --- |
| `hero-<handle>` | A scent's wide campaign still (16:9 or wider), the home hero from 1024 px |
| `hero-<handle>-mobile` | The same still cut 1.2:1 around the bottle, the home hero on a phone |

The home page opens on one of these at random per visit; `?hero=<handle>`
pins one. The rotation is the list in `content/heroes.ts` (with each
still's background colour and alt text): add a still there and here to add it.
Installed for `vintage-vanilla`, `linen`, `mango-eclipse`, `neroli-code` and
`raw-seduction`.

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

## Tales

| File | Used for |
| --- | --- |
| `tale-<slug>` | The tale's wide still (7:3): its hero, its card on the tales index and its band on the product page |
| `tale-<slug>-card` | A 4:3 crop of the same still, 1600 × 1195, for the home page's featured tale and tales teaser. Falls back to `tale-<slug>` |

Tale slugs on the site: `shadow-of-the-sea`, `wayne`, `enzo-1898`,
`forbidden-apple`, `mercury`. Stills for `divina`, `hundred-whispers`,
`mystique`, `tonic-club` and `vintage-vanilla` are installed for the tales
still to be written.

## Sharing

| File | Used for |
| --- | --- |
| `og-image` | The 1200x630 card shown when a link is shared |

## Not placed yet

`discovery-set`, and the textures `texture-wet-stone`, `texture-sand-ridges`,
`texture-linen-weave`, `texture-frosted-glass`, `texture-plaster`,
`texture-sea-surface`. The design direction calls for the textures as section
grounds at 20% opacity.
