# Team dashboard: setup

The dashboard lives on the website at **https://www.myeternal.net/admin** (the old /dashboard
addresses forward there). Never send people the long `…-bablli-claude.vercel.app` addresses or
preview links: those ask for a Vercel login only the owner has.

It reads five sources, each with its own **read-only** key, and every section that has no key yet
says so instead of showing zeros:

| Source | What it gives | Key |
| --- | --- | --- |
| Shopify | sales, customers, best sellers, orders on the road, delivery times, abandoned checkouts | step 4 |
| Meta | ad spend, return on ad spend, campaigns, pixel health | step 5 |
| Google Analytics 4 | visits, sources, landing pages, the checkout steps, each scent's views and adds, page speed | step 6 |
| Bosta | cash collected, delivery attempts, why deliveries stalled | step 7 |

Accounts live in a private Vercel Blob store (`eternal-dashboard`, already connected to the
project). Nobody's email address is asked for or stored: people have a username, and invites are
links you send by hand.

## 1. Set the one-time setup code

In Vercel → eternal-storefront → Settings → Environment Variables, add `DASHBOARD_SETUP_CODE`
(Production, Sensitive): 24 or more random characters. Redeploy (Deployments → the latest → ⋯ →
Redeploy).

## 2. Create the owner account

1. Open https://www.myeternal.net/admin/setup.
2. Enter the setup code, your first name, a username (not an email address) and a password of at
   least 15 characters (a short sentence works well).
3. The code works once. Afterwards, delete `DASHBOARD_SETUP_CODE` in Vercel and redeploy;
   /admin/setup then disappears. If every owner is ever locked out, set a new code, redeploy, and
   open /admin/setup: it shows "Owner recovery". Enter the code and an existing owner's username,
   leave the name empty, and set a new password. That signs the owner out everywhere else.

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
every 12 hours before changing people. Each phone or computer someone has signed in on is
remembered for 180 days (even after signing out), and keeps getting in while someone elsewhere
is guessing passwords; a person can change their password or sign out everywhere a few times a day.

## 4. Connect Shopify (read-only key, about 15 minutes)

1. Sign in to the eternal Shopify admin **as the store owner** (not an agency or collaborator
   account) and go to Settings → Apps → Develop apps → **Build apps in Dev Dashboard**. Starting
   from the store puts the app in the store's own organization, which the key needs.
2. Create app → Start from Dev Dashboard → name it "eternal dashboard (read-only)".
3. Versions → create a version. Scopes: `read_reports`, `read_products`, `read_customers`,
   `read_orders` (and, for the product-sync check, `read_publications` and
   `read_product_listings`). Nothing that starts with "write". `read_orders` also covers the
   delivery milestones and the abandoned checkouts. Release.
4. Install app → choose the eternal store → check the list says read access only → Install.
5. Settings → Credentials: copy the Client ID and Client secret (treat the secret like a
   password; never paste it into a chat or email).
6. In Vercel → eternal-storefront → Settings → Environment Variables, add for Production:
   `SHOPIFY_ADMIN_SHOP` = `5zbbma-jm.myshopify.com`, `SHOPIFY_ADMIN_CLIENT_ID`,
   `SHOPIFY_ADMIN_CLIENT_SECRET` (mark it Sensitive), `SHOPIFY_ADMIN_API_VERSION` = `2026-10`.
   Redeploy.
7. Open /admin as an owner: the "Owner details" panel at the bottom shows whether Shopify
   answered and which scopes it granted. "wrong organization" means the app was made from an
   agency account (repeat from step 1 as the owner). "Access denied … customer data" means
   Shopify withheld analytics: the dashboard falls back to figures rebuilt from orders (last 60
   days); on the app's Home choose Custom distribution if offered, reinstall, and if it persists
   contact Shopify Support with the request ID shown. The same protected-data level gives the
   delivery cities; without it only the city table is missing.

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
   that figure. Never tick ads_management or catalog_management. With this read-only key Meta
   refuses the event counts by site ("Website events" in Owner details reads "Not allowed with this
   key"); the dashboard then confirms the pixel from the ads' landing page views and adds to bag,
   and Google Analytics (step 6) covers the website's own visits and steps.
5. Copy the key once into Vercel as `META_ACCESS_TOKEN` (Production, Sensitive) and redeploy.
6. To revoke: Settings → System users → eternal-dashboard-read → Revoke tokens. After any change
   to its assets, make a new key and replace it.

## 6. Connect Google Analytics 4 (read-only, about 15 minutes)

Signed in with the Google account that owns the GA4 property "My Eternal":

1. https://console.cloud.google.com → project picker → **New project** → "eternal-dashboard".
2. APIs & Services → Library → search **Google Analytics Data API** → Enable.
3. IAM & Admin → Service accounts → **Create service account** → name "eternal-dashboard-read" →
   Create and continue → skip the roles → Done.
4. Open the new service account → Keys → Add key → Create new key → **JSON** → Create. A file
   downloads; it is a password, keep it private and never send it in a chat or email.
5. GA4 → Admin → Property → **Property access management** → + → Add users → paste the service
   account's email (ends in `iam.gserviceaccount.com`) → role **Viewer** only → Add. Untick
   "Notify new users".
6. GA4 → Admin → **Property details**: copy the Property ID (a number, not the G- id).
7. In Vercel add for Production: `GA4_PROPERTY_ID` = that number, and `GA4_SERVICE_ACCOUNT` =
   the whole contents of the JSON file (open it in Notepad, select all, paste; mark it
   Sensitive). Redeploy.
8. Optional, recommended: GA4 → Admin → **Custom definitions** → Create custom dimension, scope
   **Event**, twice: event parameter `in_app` (name "In-app browser") and `rating` (name "Page
   speed rating"). The website already sends both; once registered, the dashboard shows
   Instagram's in-app browser apart from others and how fast pages load for real visitors.
   Figures start from the day they are registered.

To stop access, remove the service account in Property access management, or delete its key.

## 7. Connect Bosta (read-only use, 5 minutes)

1. Bosta business dashboard → Settings → **API integration** → create an API key.
2. In Vercel add `BOSTA_API_KEY` (Production, Sensitive) and redeploy.
3. Open /admin as an owner: "Owner details" lists the fields Bosta sends. Delivery times,
   delivered sales and failed deliveries already come from Shopify (Bosta's Shopify app reports
   them back), so the dashboard works without this key; Bosta adds cash collected, attempts and
   exception reasons. The dashboard only reads: it never creates, edits or cancels a shipment.
4. To stop access, delete the key in Bosta.

## Optional: limit sign-in attempts at the edge

The site already slows repeated wrong passwords. For an extra wall in front of it: Vercel →
eternal-storefront → Firewall → Rules → New rule "Dashboard sign-in limit": if Method is POST
and Path starts with `/admin` → Rate limit, fixed window 10 minutes, 20 requests, by IP,
action 429. Save, then Publish. (The dashboard's forms post to their own page, so this covers
them and nothing in the shop.)

## How the figures are read

- Shopify: ShopifyQL through the Admin API, whole Cairo days, cached for 10 minutes. Orders on
  the road and abandoned checkouts: the last 60 days of orders (all an app may read), cached
  10 minutes.
- Meta: Marketing API v26.0; ad figures cached 10 minutes, pixel counts an hour, audiences and
  match quality 6 hours, one request at a time to stay inside Meta's limits for new apps.
- Google Analytics 4: Data API, whole days ending yesterday, cached 30 minutes.
- Bosta: the last 60 days of shipments, cached 15 minutes.
- What the figures say ("What to work on", each section's findings, "This week's read") is
  worked out by fixed rules in `lib/dashboard/insights.ts` and `lib/dashboard/read.ts`: no AI
  model, nothing stored, and a rule stays quiet until it has at least five cases to go on.
- "Refresh" (owners and team) fetches every source again, at most every 5 minutes.
- Nothing the dashboard does can change anything in Shopify, Meta, Google Analytics, Bosta or
  Vercel.
