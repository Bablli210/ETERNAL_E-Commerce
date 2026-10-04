# eternal — storefront

The headless storefront for **eternal**, a Cairo house of eaux de parfum in three lines
(eterna for her, eterno for him, eternal for both). Built from the wireframes and design
direction in [`design/`](design/README.md): Next.js on Vercel in front of the existing
Shopify store, which stays the source of truth for products, prices, inventory and checkout.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) and **Tailwind CSS 4** with the design
  tokens from the direction sheet (Linen, Paper, Sand, Dune, Stone, Ash, Night, Golden hour,
  Deep sea) as `@theme` variables in `app/globals.css`.
- **Cormorant Garamond** for display and **Instrument Sans** for UI, via `next/font`.
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
  Product **metafields** in the `custom` namespace (`inspired_by`, `color_world`,
  `signature_line`, `story`, `top_notes`, `heart_notes`, `base_notes`, `notes_copy`,
  `longevity`, `sillage`, `season`, `occasion`, `time_of_day`, `scent_family`,
  `mood_words`, `comparison_note`) win over `content/scents.ts` whenever they exist, so the
  catalogue can move to metafields one field at a time.
- Lines, families and moods are derived from product **tags** (`eterna` / `eterno` /
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
| The home page, opening on the bottle the ad shows | `/?hero=<handle>` (vintage-vanilla, linen, mango-eclipse, neroli-code, raw-seduction); without it the home page opens on one of the five at random |
| A carousel of scents | `/shop?h=handle-a,handle-b,handle-c` (only those, in that order) |
| A line | `/shop/her`, `/shop/him`, `/shop/unisex` |
| "Find your scent" | `/finder` |
| Low-risk first order | `/products/mystery-box` |
| A search for an original | `/shop?q=<name>` |

Add `utm_source`, `utm_medium`, `utm_campaign` and `utm_content` to every ad link, and
`discount=CODE` when the ad carries a code. The campaign, Meta's click id (`_fbc`, set as a
first-party cookie by `proxy.ts`), the in-app flag and the finder's answers travel to
Shopify checkout as order attributes, and the code is applied at checkout.

**Measurement.** `lib/client/analytics.ts` sends view_item, select_item, add_to_cart,
begin_checkout (a custom `CheckoutClick` for Meta), search, the finder steps and Web Vitals
to the data layer, the Meta Pixel and GA4. Set `NEXT_PUBLIC_META_PIXEL_ID` and
`NEXT_PUBLIC_GA4_ID` to the same IDs Shopify's Facebook & Instagram and Google channels use,
so Purchase (fired by Shopify on checkout) joins the same funnel. `META_CAPI_TOKEN` with
`NEXT_PUBLIC_META_CAPI=1` adds server copies of ViewContent and AddToCart
(`app/api/meta`), deduplicated by event id. See `.env.example`.

## Routes

| Route | Board |
| --- | --- |
| `/` | Home — hero with the featured scent and its price, proof strip, the three lines side by side, where to start, try before you commit (mystery box, finder), moods, featured tale, house film |
| `/shop`, `/shop/[collection]` | Collection — one-row head (line banners on her/him/unisex), line and family chips, filter sheet, search by the original, 24 then all, mystery box tile, state in the URL (`?q=`, `?h=`, filters, sort). Collections: `her`, `him`, `unisex`, `bestsellers` ("Where to start"), `new`, six families, six moods |
| `/products/[handle]` | Product page — first screen with gallery, name and price, inspired-by, notes and Add to bag; sticky bar; promise list; how it differs, how it smells, wear it, FAQ, pairing, tale, you may also like, recently viewed |
| `/bag?items=<variant>:<qty>,…` | Rebuilds the bag from a link (retargeting, "send my bag") |
| `/finder` | Scent finder — five questions with the state in the URL, three matches with Add, the mystery box when 5 ml samples do not exist yet |
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

## Connecting the live Shopify store

1. In Shopify admin, add the **Headless** sales channel (or create a custom app with the
   `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory` and
   `unauthenticated_write_checkouts` scopes) and copy the **public Storefront API access
   token**.
2. In Vercel, set `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (and `SHOPIFY_STORE_DOMAIN` if the
   store domain changes). Redeploy.

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

- **5 ml sample variants** on every scent (a `Size` option with `55 ml` and `5 ml`). The
  cards, the buy box, the "add a sample too" box, the cart upsell and the finder's trio
  action all switch on automatically when a sample variant exists.
- **Line tags** on the seven products created on 19 August (Aurora, Bloom, Ciel, Mango
  Eclipse, Paradox, Smoked Aura, Ultra Smoke), plus family tags, descriptions and packshots.
- **Metafields** listed above, starting with `inspired_by`, `color_world` and `signature_line`.
- **`inspired_by`** for every scent: only 3 of 42 have it, and it is the strongest hook for
  ad visitors, search and the cards. **`custom.units_sold_30d`** from a daily job, the only
  source of the Bestseller badge (playbook 5.6).
- A **discovery set** product, if one is wanted; the mystery box already exists.
- Reviews (Judge.me), Arabic (Translate & Adapt), Shop Pay button, WhatsApp number.
