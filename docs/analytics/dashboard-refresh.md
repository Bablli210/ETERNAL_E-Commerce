Refresh the "eternal Performance" dashboard: pull today's figures from Shopify and Meta (and Vercel where noted) and write them into the dashboard's database. Work read-only everywhere except the final database write: never change anything in Shopify, Meta or Vercel.

## Facts
- Dashboard (Artifact): https://claude.ai/artifact/QGEytaxmLVZYt7XaxcknpN — its page reads the collection `dash`, one document per section (ids below). Write with the `ArtifactData` tool (load it with ToolSearch if needed).
- Shop: Shopify store "Eternal" (Shopify connector), currency EGP, timezone Africa/Cairo. Product lines come from product tags: `eterna` (for her), `eterno` (for him), `eternal` (unisex).
- Meta (Meta Ads connector): ad account 4200691606897130, pixel/dataset 28723169773968178 ("My Eternal"), business 1815764946526381. Every Meta call takes client_conversation_id (one random 20-character [A-Za-z0-9] id for the whole run) and client_model (your model id, when your context states one).
- Vercel (Vercel connector, optional): project prj_N9aLQK5MOR7o6w4jmzc0bNfeB09u, team team_g3Vp8KALUIxj5e8CrMms5LT6. Never decrypt environment values; read key names only.
- Periods are the last 7, 30 and 90 FULL days ending yesterday (Cairo): N days, today not included, so Shopify and Meta cover the same days (Meta's last_7d/last_30d/last_90d presets already end yesterday). "Previous period" = the N days just before. Today appears only in the daily rows, which the page shows apart as "today so far".
- Money is EGP as plain numbers (no symbols), rounded to 2 decimals. Ratios are plain numbers (0.231 = 23.1%). Use null for unknown, 0 only for a real zero.
- Never write customer names, emails, phones or addresses anywhere.

## Pull
Shopify (run-analytics-query uses ShopifyQL; FROM … SHOW …):
1. For N in 7, 30, 90: `FROM sales SHOW orders, gross_sales, discounts, returns, net_sales, total_sales, average_order_value SINCE -{N}d UNTIL -1d COMPARE TO previous_period` → current and previous values (N days ending yesterday; `UNTIL today` would add today and make N+1 days).
2. For N in 7, 30, 90: `FROM sales SHOW customers, new_customers, returning_customers, returning_customer_rate SINCE -{N}d UNTIL -1d`.
3. `FROM sales SHOW orders, net_sales TIMESERIES day SINCE -90d UNTIL today` → one row per day, 91 rows including today.
4. For N in 7, 30, 90: `FROM sales SHOW net_items_sold, net_sales, orders GROUP BY product_title ORDER BY net_sales DESC LIMIT 15 SINCE -{N}d UNTIL -1d`. Drop rows that are only a return (orders 0 and net ≤ 0); keep the top 12. Map each title to its line with one GraphQL read of product titles and tags (graphql_schema → validate_graphql_codeblocks → graphql_query, e.g. `products(first: 60) { nodes { title tags } }`).
5. For N in 7, 30, 90: `FROM sales SHOW orders, net_sales GROUP BY order_referrer_source, order_referrer_name SINCE -{N}d UNTIL -1d ORDER BY net_sales DESC`. Drop rows that are only a return (orders 0 and net ≤ 0).
6. `FROM sales SHOW orders, net_sales GROUP BY shipping_city ORDER BY net_sales DESC LIMIT 15 SINCE -89d UNTIL today` (cities are free text: merge obvious spellings of the same place, e.g. "6th of October", "October", "٦ اكتوبر"; keep the top 8).
7. `FROM sessions SHOW sessions, sessions_that_completed_checkout GROUP BY session_device_type SINCE -89d UNTIL today`.
8. `FROM sessions SHOW sessions GROUP BY utm_campaign, utm_source, utm_medium SINCE -30d UNTIL today` (only to learn whether any session carries a UTM).
9. GraphQL customer counts with customerSegmentMembers totalCount: all customers (`number_of_orders >= 0`), buyers (`number_of_orders >= 1`), repeat buyers (`number_of_orders >= 2`), email subscribers (`email_subscription_status = 'SUBSCRIBED'`), SMS subscribers (`sms_subscription_status = 'SUBSCRIBED'`).
10. GraphQL: the orders of the last 7 days with `app { name }` only, to see whether any came through the old "Lovable" app.

Meta:
11. `ads_get_ad_accounts` → account_status of 4200691606897130.
12. For each preset last_7d, last_30d, last_90d: `ads_get_ad_entities` level ad_account, fields amount_spent, impressions, reach, clicks, ctr, cpm, link_click, omni_landing_page_view, omni_add_to_cart, omni_initiated_checkout, omni_purchase, omni_purchase_values.
13. `ads_get_ad_entities` level ad_account, date_preset "maximum", time_increment "1", fields amount_spent, link_click, omni_landing_page_view, omni_add_to_cart, omni_purchase, omni_purchase_values → one row per day, today included (days without delivery are missing; treat as 0). Use it for the daily rows and to sum the previous-period ad figures (spend, purchases, purchase value) for the N days before each preset's range.
14. `ads_get_ad_entities` level campaign and level adset, date_preset last_30d, fields id, name, effective_status, daily_budget, amount_spent, omni_landing_page_view, omni_add_to_cart, omni_initiated_checkout, omni_purchase, omni_purchase_values, plus campaign_id on the adset level. Budgets come back in EGP: use them as they are. If an ad set row has no campaign id, match it to its campaign by name or by spend totals and say so in your summary.
15. `ads_get_dataset_details` (last browser and server event times), `ads_get_dataset_quality` (Event Match Quality per event), `ads_get_dataset_stats` aggregation "event" with event_source WEB_ONLY, then SERVER_ONLY, start_time = now − 27 days (unix seconds; 28 days back is refused) → add up PageView, ViewContent, AddToCart, InitiateCheckout, Purchase per source; and aggregation "host" for the last 7 days (which sites send events).
16. `ads_get_ad_account_custom_audiences` (limit 100) → names, approximate sizes, subtypes.
17. `ads_catalog_list_catalogs` with entity_id 1815764946526381 → whether a product catalog exists.

Vercel (skip quietly if the connector is missing):
18. `filter_project_envs` (key names only) → whether NEXT_PUBLIC_META_PIXEL_ID, NEXT_PUBLIC_GA4_ID, META_CAPI_TOKEN with NEXT_PUBLIC_META_CAPI, and NEXT_PUBLIC_VERCEL_ANALYTICS exist.
19. `count_pageviews` for the last 30 days → works, or fails with web_analytics_not_enabled.
20. `web_fetch_vercel_url` https://www.myeternal.net/ → served by Vercel (the new website) or still redirected by Cloudflare/Lovable (the old site).

If a call fails, retry it once (for Meta, retry with the window shortened by a day if the error says the range is too long); if it still fails, write what you have, mark that source not ok in `status.sources`, and say what failed in its note.

## Write: collection `dash`, nine documents
First `ArtifactData` list `dash` to learn each existing document's `version`. Then write all documents in ONE `batch` of `set` writes (each entry with `if_version` = that document's version when it exists, none when it does not). Easiest: write each document as a JSON file in a scratch folder and pass `file_path`.

`status`: { updatedAt: ISO time now, sources: [ {label:"Shopify", ok, note:"orders and customers"}, {label:"Meta", ok, note:"ads and pixel"}, {label:"New website", ok: pixel live on the new site, note:"tracking on" | "tracking off"}, {label:"Google Analytics", ok: GA4 key present or null, note:"connected" | "not connected"} ], attention: [ {level:"critical"|"warning"|"info", title, detail, owner} ] }
Attention, only when true, most urgent first, plain words, each detail one or two sentences saying what to do:
- account_status not ACTIVE → critical "Meta ad account payment overdue" (ads stop if unpaid; new audiences can't be created; pay in Ads Manager > Billing & payments; owner "Seif").
- Any order in the last 7 days through the "Lovable" app → warning "Sales still run through the old site" (myeternal.net still points to the old Lovable site; the new website's tracking only counts once the domain is switched; owner "Seif + web team").
- No Meta catalog → warning "Meta has no product catalog" (turn on catalog sync in Shopify's Facebook & Instagram app, so ads can show the exact scent someone viewed; owner "Seif (Shopify admin)").
- 30-day ad spend > 1,000 and ROAS < 1 → warning "Ads are bringing back less than they cost" (cite spend, purchase value, ROAS).
- 7-day ad spend > 1,000 and 0 ad purchases in those 7 full days → warning "No purchases from ads in the last 7 days" (if Meta credits a purchase today, say so in the detail).
- Purchase Event Match Quality < 6 → info "Meta matches few purchases to people" (Shopify's Facebook & Instagram app: data sharing set to Maximum).

`periods`: { "7": P, "30": P, "90": P } where P = { range: {from:"YYYY-MM-DD", to:"YYYY-MM-DD"} (the N days, ending yesterday), sales: {net, total, gross, discounts, returns, orders, aov}, prev: {net, orders, aov}, customers: {customers, newCustomers, returning, returningRate}, ads: {spend, impressions, reach, linkClicks, lpv, atc, ic, purchases, purchaseValue, roas, cpa, ctr, cpm}, adsPrev: {spend, purchases, purchaseValue, roas, cpa} }. roas = purchaseValue / spend (null when spend is 0); cpa = spend / purchases (null when 0 purchases); ctr as a ratio.

`daily`: { days: [ {d:"YYYY-MM-DD", net, orders, spend, purchases, lpv, atc} ] } — exactly 91 days, the last 90 full days plus today, oldest first, every day present (0 when nothing happened). Dates are Cairo dates.

`products`: { "7": [R], "30": [R], "90": [R] } where R = {title, line: "eterna"|"eterno"|"eternal"|null, units, orders, net}, best first, at most 12.

`sources`: { "7": [S], "30": [S], "90": [S], note } where S = {source, orders, net}. Labels: instagram → "Instagram", facebook → "Facebook", myeternal → "myeternal.net (old site)", eternal-storefront or www.myeternal.net → "New website", google → "Google", blank → "Direct or unknown", anything else by its name. Merge rows with the same label. note: when no session in 30 days carries a UTM, "Shopify sees only the site a buyer came from, not the ad or campaign. Campaign tags on every ad link fix this." — otherwise omit.

`campaigns`: { period: "Last 30 days", rows: [ {id, name, level:"campaign"|"adset", status:"Active"|"Paused"|other in plain words, budgetDay, spend, lpv, atc, ic, purchases, value, roas, cpa} ] } — campaigns with spend in the period or active, each followed by its ad sets that spent or are active; biggest spend first.

`audience`: { customers, buyers, repeatBuyers, emailSubscribed, smsSubscribed, cities: [{name, orders, net}], devices: [{name, sessions, completed}], metaAudiences: [{name, size, kind}] } — audience name without the "ETERNAL | " prefix; size in words ("about 1,000", "fewer than 1,000", "building"); kind "website" | "engagement" | "lookalike" | "customer list".

`tracking`: { items: [ {label, status:"ok"|"partial"|"missing"|"blocked", detail, action, owner} ], pixel: { windowDays: 28, lastBrowser, lastServer, hosts: [...], events: [ {name, label, browser, server, emq} ] } }
Items, in this order, each judged from what you pulled today:
1. "Ad account in good standing" — ok when ACTIVE, else blocked.
2. "myeternal.net shows the new website" — ok when www.myeternal.net is served by Vercel, else missing.
3. "Meta pixel on the new website" — ok when the 7-day host list includes eternal-storefront.vercel.app or www.myeternal.net; partial when the pixel key exists on Vercel but no events arrived yet; else missing.
4. "Meta server events from the new website" — ok when META_CAPI_TOKEN and NEXT_PUBLIC_META_CAPI exist on Vercel, else missing (action: "Create a Conversions API token in Events Manager and add it to Vercel").
5. "Shopify checkout sends purchases to Meta" — ok when browser Purchase > 0 and Purchase EMQ ≥ 6; partial when only server Purchase arrives or EMQ < 6; missing when no Purchase at all.
6. "Meta product catalog from Shopify" — ok when a catalog exists, else missing.
7. "Google Analytics 4" — ok when NEXT_PUBLIC_GA4_ID exists, else missing (action: "Connect a GA4 property in Shopify's Google & YouTube app and add the same G- ID to Vercel").
8. "Website visits (Vercel Analytics)" — ok when page views come back, else missing (action: "Vercel > eternal-storefront > Analytics > Enable, then set NEXT_PUBLIC_VERCEL_ANALYTICS=1").
9. "Campaign tags on ad links" — ok when sessions carry UTMs, else missing (action: "In Ads Manager add URL parameters: utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}").
Event labels: PageView "Page viewed", ViewContent "Scent viewed", AddToCart "Added to bag", InitiateCheckout "Checkout started", Purchase "Purchase".

`notes`: { headline: "This week's read", weekOf: today's date, items: [ {kind:"risk"|"win"|"next", title, body} ] } — rewrite only on Mondays (Cairo) or when the document does not exist yet; on other days leave the existing notes document out of the batch. 3 to 5 items grounded in today's figures (cite the numbers), plain language for a founder and a client, each body at most 45 words, at least one "next" with one concrete action. Quote sales in Shopify's amounts; when you cite what Meta credits to its ads, say "Meta credits" so the two are never confused, and never give one sale two different values.

After the batch, `ArtifactData` list `dash` once and check all nine documents exist (eight on days the notes are left alone, plus the existing notes) with today's updatedAt. Finish with a three-line summary: what changed most since the last refresh, anything that failed, and any new attention item.
