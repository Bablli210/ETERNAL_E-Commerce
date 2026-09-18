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
- Facts the boards mark in `[square brackets]` (delivery time, returns, offers, WhatsApp
  number, free-shipping threshold) live in `content/site.ts` and render as written until
  they are confirmed.

## Routes

| Route | Board |
| --- | --- |
| `/` | Home — hero, proof strip, three lines, bestsellers, finder entry, featured tale, moods, discovery set and mystery box, house film, tales |
| `/shop`, `/shop/[collection]` | Collection — family chips, search by the original, filters, load more, discovery band, FAQ. Collections: `her`, `him`, `unisex`, `bestsellers`, `new`, six families, six moods |
| `/products/[handle]` | Product page — gallery, buy box with sticky add-to-bag bar, notes pyramid, tale excerpt, wear it, inspired-by, FAQ, pair, you may also like, recently viewed |
| `/finder` | Scent finder — five questions, tag-overlap ranking, three matches, shareable results |
| `/tales`, `/tales/[slug]` | Tales — reading column with the sticky shoppable card |
| `/house` | The house — manifesto, film, how we compose, founder note |
| `/help` | Delivery, returns, tracking, FAQ |

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

## What the boards need from Shopify next

- **5 ml sample variants** on every scent (a `Size` option with `55 ml` and `5 ml`). The
  cards, the buy box, the "add a sample too" box, the cart upsell and the finder's trio
  action all switch on automatically when a sample variant exists.
- **Line tags** on the seven products created on 19 August (Aurora, Bloom, Ciel, Mango
  Eclipse, Paradox, Smoked Aura, Ultra Smoke), plus family tags, descriptions and packshots.
- **Metafields** listed above, starting with `inspired_by`, `color_world` and `signature_line`.
- A **discovery set** product; the mystery box already exists.
- Reviews (Judge.me), Arabic (Translate & Adapt), Shop Pay button, WhatsApp number.
