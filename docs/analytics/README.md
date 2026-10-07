# Analytics

## eternal Performance (team and client dashboard)

A private claude.ai page, https://claude.ai/artifact/QGEytaxmLVZYt7XaxcknpN, that shows sales and
customers from Shopify, advertising and pixel health from Meta, and the state of the tracking that
feeds both. Share it from the page's Share menu; viewers need to be signed in to claude.ai.

- `dashboard/template.html` is the page. `python3 dashboard/build.py` inlines the brand fonts and the
  eternal logotype from this repo and writes `dashboard/eternal-performance.html`, which is what gets
  published (republish to the same URL to update it).
- The page reads nine documents in its database (collection `dash`). `dashboard-refresh.md` is the exact
  procedure that fills them from Shopify, Meta and Vercel; a Claude session runs it every morning at about
  6:46 Cairo time. Nothing in Shopify, Meta or Vercel is changed by a refresh.

## Where each number comes from

| Section | Source |
| --- | --- |
| Net sales, orders, average order, returning customers, what sells, where orders come from, cities | Shopify Analytics (ShopifyQL) |
| Ad spend, purchases from ads, return on ad spend, cost per purchase, campaigns | Meta Ads Manager (ad account 4200691606897130) |
| Everything the website reported to Meta, match quality | Meta Events Manager (dataset 28723169773968178) |
| Customers, subscribers | Shopify customer segments |
| Tracking health | Vercel project settings (key names only), Meta, Shopify |

Periods are full days ending yesterday (Cairo), so Shopify and Meta cover the same days; today shows apart.
