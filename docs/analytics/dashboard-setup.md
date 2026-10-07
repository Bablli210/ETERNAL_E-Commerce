# Team dashboard: setup

The dashboard lives on the website at **/dashboard**: today
https://eternal-storefront.vercel.app/dashboard, and https://www.myeternal.net/dashboard once
myeternal.net points at Vercel (everyone signs in once more there; the sign-in does not carry
over between addresses). Never send people the long `…-bablli-claude.vercel.app` addresses or
preview links: those ask for a Vercel login only the owner has.

It reads Shopify and Meta live with two **read-only** keys and keeps its accounts in a private
Vercel Blob store (`eternal-dashboard`, already connected to the project). Nobody's email
address is asked for or stored: people have a username, and invites are links you send by hand.

## 1. Check the address is open (1 minute)

Open https://eternal-storefront.vercel.app/ in a private window that is not signed in to
Vercel. If the shop appears, nothing to change. If a Vercel login appears instead, either
move the domain first (step 6), or in Vercel → eternal-storefront → Settings → Deployment
Protection choose the option that keeps production domains public. Never turn protection off.

## 2. Create the owner account

1. Open https://eternal-storefront.vercel.app/dashboard/setup.
2. Enter the one-time setup code you were given, your first name, a username (not an email
   address) and a password of at least 15 characters (a short sentence works well).
3. The code works once. Afterwards, in Vercel → Settings → Environment Variables, delete
   `DASHBOARD_SETUP_CODE` and redeploy; /dashboard/setup then disappears. If every owner is ever
   locked out, set a new code, redeploy, and use it with an existing owner's username to set a new
   password.

## 3. Invite the team and clients

On **People** (owners only): type the person's first name, choose what they can do, and
make the link. It is shown once, works once and expires in 7 days; copy it or use "Send on
WhatsApp", and send it privately. They choose their own username and password.

| Role | Sees | Can |
| --- | --- | --- |
| Client | every section of the figures | read |
| Team | the same | read, refresh the figures |
| Owner | the same, plus source checks | everything, including People |

Forgotten password: on People, "Make a reset link" (works once, 24 hours). Owners re-sign-in
every 12 hours before changing people.

## 4. Connect Shopify (read-only key, about 15 minutes)

1. Sign in to the eternal Shopify admin **as the store owner** (not an agency or collaborator
   account) and go to Settings → Apps → Develop apps → **Build apps in Dev Dashboard**. Starting
   from the store puts the app in the store's own organization, which the key needs.
2. Create app → Start from Dev Dashboard → name it "eternal dashboard (read-only)".
3. Versions → create a version. Scopes: `read_reports`, `read_products`, `read_customers`,
   `read_orders` (and, for the product-sync check, `read_publications` and
   `read_product_listings`). Nothing that starts with "write". Release.
4. Install app → choose the eternal store → check the list says read access only → Install.
5. Settings → Credentials: copy the Client ID and Client secret (treat the secret like a
   password; never paste it into a chat or email).
6. In Vercel → eternal-storefront → Settings → Environment Variables, add for Production:
   `SHOPIFY_ADMIN_SHOP` = `5zbbma-jm.myshopify.com`, `SHOPIFY_ADMIN_CLIENT_ID`,
   `SHOPIFY_ADMIN_CLIENT_SECRET` (mark it Sensitive), `SHOPIFY_ADMIN_API_VERSION` = `2026-10`.
   Redeploy.
7. Open /dashboard as an owner: the "Owner details" panel at the bottom shows whether Shopify
   answered and which scopes it granted. "wrong organization" means the app was made from an
   agency account (repeat from step 1 as the owner). "Access denied … customer data" means
   Shopify withheld analytics: the dashboard falls back to figures rebuilt from orders (last 60
   days); on the app's Home choose Custom distribution if offered, reinstall, and if it persists
   contact Shopify Support with the request ID shown.

To stop access, uninstall the app; if the secret leaks, Dev Dashboard → the app → Settings →
Credentials → Rotate, put the new secret in Vercel, redeploy, then revoke the old one.

## 5. Connect Meta (read-only key, about 15 minutes)

As an admin of the Eternal Fragrance business portfolio:

1. developers.facebook.com/apps → Create app → name "eternal dashboard reader" → use case
   "Measure ad performance data with Marketing API" (or type Other → Business) → portfolio
   Eternal Fragrance. Do not publish it or request App Review.
2. business.facebook.com → Settings → Users → System users → Add → "eternal-dashboard-read",
   role **Employee** (never Admin). If Meta says the system-user limit is reached, stop and ask:
   do not delete or reuse an existing one (Shopify's connection may depend on it).
3. Assign assets **before** making the key: ad account ETERNAL AD ACCOUNT (4200691606897130) →
   partial access, **View performance** only; dataset My Eternal (28723169773968178) → partial
   access, **Use events dataset** only. Nothing else.
4. Generate token → app "eternal dashboard reader" → expiry **Never** (if only 60 days is offered,
   take it and set a reminder) → permission **ads_read** only. Adding business_management also
   shows event match quality, but it is a read-and-write permission; leave it off unless you want
   that figure. Never tick ads_management or catalog_management.
5. Copy the key once into Vercel as `META_ACCESS_TOKEN` (Production, Sensitive) and redeploy.
6. To revoke: Settings → System users → eternal-dashboard-read → Revoke tokens. After any change
   to its assets, make a new key and replace it.

## 6. When the domain moves

Point myeternal.net and www at Vercel (the records are under Vercel → eternal-storefront →
Settings → Domains). Within 15 minutes the dashboard's "myeternal.net shows the new website"
check turns green. Then send everyone https://www.myeternal.net/dashboard.

## Optional: limit sign-in attempts at the edge

The site already slows repeated wrong passwords. For an extra wall in front of it: Vercel →
eternal-storefront → Firewall → Rules → New rule "Dashboard sign-in limit": if Method is POST
and Path starts with `/dashboard`, OR Method is POST and Header `next-action` exists → Rate limit,
fixed window 10 minutes, 20 requests, by IP, action 429. Save, then Publish.

## How the figures are read

- Shopify: ShopifyQL through the Admin API, whole Cairo days, cached for 10 minutes.
- Meta: Marketing API v26.0; ad figures cached 10 minutes, pixel counts an hour, audiences and
  match quality 6 hours, one request at a time to stay inside Meta's limits for new apps.
- "Refresh" (owners and team) fetches Shopify and Meta's ad figures again, at most every
  5 minutes.
- Nothing the dashboard does can change anything in Shopify, Meta or Vercel.
