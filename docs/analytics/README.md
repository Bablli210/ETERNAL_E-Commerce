# Analytics

## eternal Performance (team and client dashboard)

On the website at **/dashboard** (https://eternal-storefront.vercel.app/dashboard until
myeternal.net points at Vercel, then https://www.myeternal.net/dashboard). People sign in with
their own username and password; owners invite the team and clients from the People page.
It shows sales and customers from Shopify, advertising and pixel health from Meta, and the state of
the tracking that feeds both, read live with two read-only keys. Setup for the owner:
`dashboard-setup.md`.

- `app/dashboard/` holds the pages and the Server Actions (sign-in, setup, invites, people);
  `components/dashboard/` the figures' layout; `lib/dashboard/` the sources and sign-in:
  `shopify.ts` and `meta.ts` read the two APIs (each cached on its own schedule),
  `build.ts` turns them into the page's sections, attention items and tracking checks,
  `read.ts` writes "This week's read" from the figures, `accounts.ts` / `session.ts` / `kdf.ts` /
  `throttle.ts` / `store.ts` handle accounts in the private Blob store.
- The shop's header, footer, cookie banner and visitor tracking never load on /dashboard
  (`components/chrome/ShopChrome.tsx`), and the pages are never indexed.
- For local work without the keys, `DASHBOARD_FIXTURE_DIR` renders the page from a folder of JSON
  files; accounts then live in the system temp folder. Never commit real figures: this repository
  is public.

### The earlier claude.ai page

https://claude.ai/artifact/QGEytaxmLVZYt7XaxcknpN still works while the keys are being set up.
`dashboard/template.html` (built with `python3 dashboard/build.py`) is that page, and
`dashboard-refresh.md` the morning procedure that fills its database from the Shopify, Meta and
Vercel connectors. Once the website dashboard has both keys, the morning refresh can stop.

## Where each number comes from

| Section | Source |
| --- | --- |
| Net sales, orders, average order, returning customers, what sells, where orders come from, cities | Shopify Analytics (ShopifyQL through the Admin API) |
| Ad spend, purchases from ads, return on ad spend, cost per purchase, campaigns | Meta Marketing API (ad account 4200691606897130) |
| Everything the website reported to Meta, match quality | Meta dataset 28723169773968178 |
| Customers, subscribers | Shopify customer segments |
| Tracking health | The live deployment's own settings, a request to myeternal.net, Meta, Shopify |

Periods are full days ending yesterday (Cairo), so Shopify and Meta cover the same days; today shows apart.
