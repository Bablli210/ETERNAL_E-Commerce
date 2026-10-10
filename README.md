# eternal — storefront

The headless storefront for **eternal**, a Cairo house of eau de parfum in three lines
(eterna for her, eterno for him, eternal for both). Built from the wireframes and design
direction in [`design/`](design/README.md): Next.js on Vercel in front of the existing
Shopify store, which stays the source of truth for products, prices, inventory and checkout.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) and **Tailwind CSS 4** with the design
  tokens from the direction sheet (Linen, Paper, Sand, Dune, Stone, Ash, Night, Golden hour,
  Deep sea) as `@theme` variables in `app/globals.css`.
- The brand kit's faces, self-hosted through `next/font` (`app/fonts.ts`): **The Seasons** for
  titles and names, **Cabinet Grotesk** for subtitles and **General Sans** for body text. The
  line logotypes (as titles) and the house wordmark are the kit's, drawn as SVG (`LineName`, `Wordmark`).
- **Shopify Storefront API** for the catalogue and checkout, with a committed snapshot of
  the live catalogue as a fallback so the site builds and deploys without any credentials.

## How data flows

```
Shopify products ──(Storefront API, when a token is set)──┐
                                                         ├─▶ lib/catalogue.ts ─▶ pages
content/catalogue.snapshot.json ──(fallback)─────────────┘        ▲
content/scents.ts  (colour worlds, inspired-by, tales, notes) ────┘
```

- `lib/catalogue.ts` merges Shopify product data with the editorial layer in `content/`.
  Product **metafields** in the `custom` namespace (`color_world`,
  `signature_line`, `story`, `top_notes`, `heart_notes`, `base_notes`, `notes_copy`,
  `longevity`, `sillage`, `season`, `occasion`, `time_of_day`, `scent_family`,
  `mood_words`, `comparison_note`) win over `content/scents.ts` whenever they exist, so the
  catalogue can move to metafields one field at a time.
- Each scent's line, its original ("House Original") and whether it is one of the Eternal Originals come
  from the owner's approved sheet in `content/scents.ts`, which wins over Shopify tags and the
  `inspired_by` metafield. A scent marked `inactive` there (Ultra Smoke) stays off the site.
- Families and moods are derived from product **tags** (`eterna` / `eterno` /
  `for her` / `for him` / `unisex`, and `aquatic`, `woody`, `amber`, …) as mapped in
  `content/taxonomy.ts`.
- The **bag** is client-side (localStorage). **Checkout** posts the bag to
  `app/api/checkout/route.ts`, which creates a Storefront cart and redirects to its
  `checkoutUrl` when a token is configured, or falls back to a Shopify cart permalink
  (`https://<store>/cart/<variant>:<qty>,…`) which needs no credentials.
- Facts the owner has not confirmed (delivery time, returns, COD fee, offers, WhatsApp
  number, company details) stay in `[square brackets]` in `content/site.ts` and
  `content/house.ts`. `lib/facts.ts` reads a bracketed value as missing, so the line, chip
  or section that needs it renders nothing: customers never see a placeholder. Replace the
  bracketed text with the confirmed wording and it switches on everywhere.
  `/launch-checklist` (unlinked, noindex) lists every fact, tale, image and product field
  still waiting, and `npm run build` warns if a bracket reaches a prerendered page
  (`STRICT_PLACEHOLDERS=1` makes it fail, for the launch build).

## Built for Instagram ad traffic

The plan of record is [`docs/cro-playbook.md`](docs/cro-playbook.md), with the research
behind it in `docs/research/`. In short: most visitors arrive from an Instagram ad, on a
phone, inside Instagram's browser, so every landing page sells on its first screen.

| Ad | Link it to |
| --- | --- |
| One scent | `/products/<handle>` |
| The home page, opening on the bottle the ad shows | `/?hero=<handle>` (vintage-vanilla, linen, mango-eclipse, neroli-code, raw-seduction); without it the home page opens on the hero film (`videos/home-hero`) |
| A carousel of scents | `/shop?h=handle-a,handle-b,handle-c` (only those, in that order) |
| A line | `/shop/her`, `/shop/him`, `/shop/unisex` |
| "Find your scent" | `/finder` |
| Low-risk first order | `/products/mystery-box` |
| A search for an original | `/shop?q=<name>` |

Add `utm_source`, `utm_medium`, `utm_campaign` and `utm_content` to every ad link, and
`discount=CODE` when the ad carries a code. The campaign, Meta's click id (`_fbc`, set as a
first-party cookie by `proxy.ts` or `app/api/consent` once the visitor says yes to marketing),
the in-app flag and the finder's answers travel to Shopify checkout as order attributes, and
the code is applied at checkout.

**Measurement.** `lib/client/analytics.ts` sends view_item, select_item, add_to_cart, the
bag's Checkout tap (`checkout_click` for GA4, a custom `CheckoutClick` for Meta), search, the
finder steps and Web Vitals to the data layer, the Meta Pixel and GA4. Meta content ids follow
the Facebook & Instagram catalogue format (`shopify_EG_<product>_<variant>`); GA4 item ids are
the variant ids until a real Shopify purchase in GA4 DebugView shows which id the Google
channel sends. Set `NEXT_PUBLIC_META_PIXEL_ID` and `NEXT_PUBLIC_GA4_ID` to the same IDs
Shopify's Facebook & Instagram and Google channels use, so begin_checkout and Purchase (fired
by Shopify on checkout) join the same funnel. `META_CAPI_TOKEN` with `NEXT_PUBLIC_META_CAPI=1`
adds server copies of ViewContent and AddToCart (`app/api/meta`), deduplicated by event id.
The checkout link carries the campaign, so Shopify's own reports see it too. See `.env.example`.

**Consent.** Nothing that identifies a visitor goes to Meta or Google from the site before they say yes
(`components/analytics/ConsentBanner.tsx`, `lib/consent.ts`): analytics loads GA4 and Vercel
Web Analytics, marketing loads the pixel, its Conversions API copy, Google's ad signals and
the ad click ids on the order. Events from before the answer wait in the page and go out on a
yes. The choice is kept 180 days in `eternal_consent`, set again by `app/api/consent` so Safari
keeps it. Shopify's checkout follows the same choice through its Customer Privacy API once
`SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_CHECKOUT_DOMAIN` and `COOKIE_DOMAIN` are set and
checkout runs on a subdomain of the site's root domain (the launch checklist shows it).

## Routes

| Route | Board |
| --- | --- |
| `/` | Home — the hero film (or the campaign still an ad pins) with its scent and price, proof strip, the three lines side by side, where to start, the Eternal Originals, try before you commit (mystery box, finder), shop by scent, shop by occasion, featured tale, more tales |
| `/shop`, `/shop/[collection]` | Collection — one-row head (line banners on her/him/unisex), line and family chips, filter sheet, search by the original, 24 then all, mystery box tile, state in the URL (`?q=`, `?h=`, filters, sort). Collections: `her`, `him`, `unisex`, `bestsellers` ("Where to start"), `new`, `originals` (the Eternal Originals), six families, and five occasions (`date`, `everyday`, `event`, `outdoors`, `beach-side`) once `occasionsLive` is set in `content/occasions.ts` |
| `/products/[handle]` | Product page — first screen with gallery, name and price, inspired-by, notes and Add to bag; sticky bar; promise list; how it differs, how it smells, wear it, FAQ, pairing, tale, you may also like, recently viewed |
| `/bag?items=<variant>:<qty>,…` | Rebuilds the bag from a link (retargeting, "send my bag") |
| `/finder` | Scent finder — five questions with the state in the URL, three matches with Add, and the mystery box as the way to try them |
| `/tales`, `/tales/[slug]` | Tales — published (complete) tales only, each ending with its scent |
| `/house` | The house — manifesto, film, how we compose, founder note once confirmed |
| `/help` | Delivery, cash on delivery, payments, returns, tracking, WhatsApp, policies |
| `/launch-checklist` | Everything still waiting on the owner (unlinked, noindex) |

## Running locally

```bash
npm install
cp .env.example .env.local   # optional: add a Storefront API token
npm run dev
```

`npm run build` must pass before pushing; `npm run lint` and `npm run typecheck` run the
same checks Vercel does.

## The house typefaces and logotypes

From the brand kit (*ETERNAL Logos and Fonts*), in `app/fonts.ts`:

- **The Seasons** — the primary face: titles, scent names, the originals, the tales. Regular, and
  its italic for the signature lines.
- **Cabinet Grotesk** — subtitles: the small capital labels and the lockup's tagline.
- **General Sans** — body text and the interface.

Each ships the one cut the site sets, and that face answers every weight the CSS asks for, so the
browser never fakes a bold. To give buttons and prices a heavier cut, add General Sans Medium or
Semibold (free from Fontshare) as a second `src` entry in `app/fonts.ts`.

**The Seasons is Fontspring's demo build** (`app/fonts/the-seasons/*-DEMO.woff2`): licensed for
evaluation only, and without curly quotes, dashes, `·`, `×` or accented letters, which Cormorant
draws in its place. Before launch, buy the web licence, replace the two files, update the paths and
set `SEASONS_IS_DEMO` to `false`. `/launch-checklist` shows it until then.

The line logotypes (eterna, eterno, eternal) and the house wordmark are the kit's logotypes, traced to
SVG in `components/ui/brand-paths.ts` and placed once per page by `BrandSprite`. `LineName` draws a
line's logotype where it stands as a title (Three lines on the home page, each line page's title);
beside its audience ("eterno · for him") a line's name is plain text (`LineLabel`). `Wordmark` and
`Logotype` draw the house mark. The icon (the e∞ mark) is in `components/ui/mark-path.ts`.

## Connecting the live Shopify store

1. In Shopify admin, add the **Headless** sales channel (or create a custom app with the
   `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory` and
   `unauthenticated_write_checkouts` scopes), publish every product to that channel, and
   copy its Storefront API tokens.
2. In Vercel, set `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` (the private `shpat_…` token, type
   Sensitive) and `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (the public token, used only if the
   private one is missing), plus `SHOPIFY_STORE_DOMAIN` (the store's myshopify.com
   address). Redeploy. `/launch-checklist` shows "Live catalogue from Shopify" once the
   site reads the store.

Without the token the site keeps running on the snapshot; refresh it by re-exporting the
products into `content/catalogue.snapshot.json`.

3. Point the order status page's **Continue shopping** link at `https://<site>/?ordered=1`:
   it empties the bag of the order just placed.
4. The footer's newsletter form posts through `/api/join` to the store's customer form, and
   only says "You're on the list" (and sends a Lead) when Shopify accepts the email. Send one
   test sign-up after launch and check it arrives as a subscriber tagged `newsletter`.
5. `/launch-checklist` shows which keys are set (pixel, GA4, Storefront token, checkout
   domain) and what is still missing.

## What the boards need from Shopify next

- Nothing on sizes. The house sells the 55 ml bottle only: a free 5 ml ships with every
  bottle (`site.freeSamples`), and the mystery box (three 5 ml, EGP 250) is the way to try
  before buying. No 5 ml variant is planned; the sample paths in the code (the buy box's
  size control, "add a sample too", the cart upsell, the finder's trio) stay dormant.
- The seven products created on 19 August (Aurora, Bloom, Ciel, Mango Eclipse, Paradox,
  Smoked Aura, Ultra Smoke) now carry line and family tags, SKUs, packshots and a one-line
  description read from their notes stills: **the owner should confirm those seven
  descriptions** against the perfumer's formulas.
- **Metafields** listed above, starting with `color_world` and `signature_line`. `inspired_by`
  is set on every scent from the owner's sheet (the five Eternal Originals carry none).
  **`custom.units_sold_30d`** from a daily job, the only source of the Bestseller badge
  (playbook 5.6).
- Optional tidying: the 35 older products sell through a `Default Title` variant and the
  eight newer ones through `Size: 55 ml`; the site labels both 55 ml, so nothing depends on
  it. Divina's SKU (`DIVINA-55`) does not follow the `ETRN-XXXX-55` pattern.
- A **discovery set** product, if one is wanted; the mystery box already exists.
- Reviews (Judge.me), Arabic (Translate & Adapt), Shop Pay button, WhatsApp number.
