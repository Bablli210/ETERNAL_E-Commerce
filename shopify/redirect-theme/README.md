# Shopify redirect theme

The storefront is this Next.js site; Shopify only runs checkout, customer
accounts, the policy pages and the password page. Once the Online Store
password is off, Shopify's own theme would be a second, public storefront at
`checkout.myeternal.net` (and `myeternalfragrance.com`). The theme
**"Eternal redirect to storefront"** in Shopify (a copy of Horizon) prevents
that: every shopping page forwards to the same page on the storefront.

Two files differ from Horizon:

- `snippets/eternal-redirect.liquid` (kept here): maps the page to the storefront
  (product → `/products/<handle>`, collection → `/shop/...`, search → `/shop?q=`,
  cart → `/bag`, pages → `/help`, blog → `/tales`, home and 404 → `/`), keeps
  `utm_*`, `fbclid`, `gclid`, `ttclid` and `discount`, and marks the page noindex.
  Policies, accounts, the password page and the theme editor are left alone.
  Coming back to the home page from checkout ("Continue shopping") adds
  `?ordered=1`, which empties the bag on the storefront.
- `snippets/stylesheets.liquid`: one line added at the top,
  `{%- render 'eternal-redirect' -%}`, so the redirect runs before any styles load.

When the storefront moves to `www.myeternal.net`, change `eternal_site` in the
snippet (Online Store → Themes → … → Edit code) and save.
