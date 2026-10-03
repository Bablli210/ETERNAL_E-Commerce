# eternal: ecommerce conversion basics and what it takes to sell six figures a month

## How this was researched, and what could not be done

- **Full-page reads were not possible.** The session's network policy blocked every WebFetch request, so the "at least 6 full-page reads" requirement was not met. Blocked hosts: `www.shopify.com`, `baymard.com`, `www.nngroup.com`, `cxl.com`, `web.dev`, `www.dynamicyield.com`, `www.triplewhale.com`, `www.littledata.io`, `www.glossy.co`, `commonthreadco.com`, `mida-app.io`, `en.wikipedia.org`, `web.archive.org`. To allow them, edit the cloud environment's **Network access** setting: open the environment menu in the session title bar, choose Edit, then pick a broader level or add these hosts under Custom → Allowed domains. Steps: https://code.claude.com/docs/en/cloud-environments#network-access
- **What was done instead.** I ran 38 targeted WebSearch queries and used the text excerpts that search returns. Each figure below is credited to the source the excerpt named. None of them was checked against the full original page, so treat every number as a second-hand citation. **UNVERIFIED** marks anything that came from a single weak or vendor source, or where sources disagreed.
- **The Shopify article (task 1)** was rebuilt from six separate search excerpts of the same URL. That gives all 8 section headings and most of the tips under them. A few sub-points may be missing.

---

## 1. Shopify, "Ecommerce Website Optimization: 8 Ways to Boost Sales" (2025)

The article combines conversion advice (CRO) and search advice (SEO). Its starting point is that you find problems by **splitting the overall conversion rate into its steps**: add-to-cart rate and checkout rate. If add-to-cart is low, the cause is usually the user experience or the value proposition. If checkout is low, the cause is friction or cost.

| # | Shopify recommendation (as excerpted) | What eternal should do, and where |
|---|---|---|
| 1 | **Improve site speed.** Google recommends a load time under **2.5 s**. Check with Shopify's Web Performance Dashboard or Google PageSpeed Insights. Fixes: compress images, use a CDN, lazy-load anything below the fold. | **Product page and home hero.** Measure LCP inside Instagram's in-app browser on a mid-range Android phone over 4G, not on desktop Lighthouse. Paid traffic should land on product pages, not the home page. The home video hero shows a poster image first and loads the video only after LCP. Use `next/image` with AVIF/WebP and correct `sizes`, and lazy-load gallery images 2 and up. |
| 2 | **Optimize for mobile.** Use responsive templates. Shopify's related mobile guide adds: thumb-friendly navigation, add-to-cart and option buttons big enough to tap, a mobile menu shorter than the desktop one, and compressed images. | **Global header, buy box, sticky add-to-bag.** Tap targets at least 44–48 px. The sticky add-to-bag must not overlap the **WhatsApp float** (check at 360 px width). The mobile menu should show only the three lines, Bestsellers, Discovery/Mystery box and the Finder. |
| 3 | **Improve the checkout.** Offer several payment options, remove fields you don't need, allow guest checkout, and offer accelerated checkout such as Shop Pay (Shopify claims "up to 50%" higher conversion than guest checkout). | **Shopify checkout settings.** Guest checkout on, account creation off. Hide Company and optional fields. Make phone required, since the courier and COD confirmation need it. **Shop Pay and Shopify Payments are not available in Egypt** (secondary sources), so the accelerated-checkout lift will not apply. The gain has to come from a short form and familiar local payment methods (Paymob cards/Meeza, InstaPay, COD). |
| 4 | **Update metadata.** Title tags of 60 characters or fewer, meta descriptions up to 155, image alt text, and structured data for rich results (ratings, FAQ). | **Product page and collection `<head>`.** Template example: "{Scent} – inspired by {Original} \| eternal Cairo". Add Product JSON-LD with price and availability. Add review markup **only after real reviews exist** (brand rule). Use FAQ schema from the product page FAQ. |
| 5 | **Use A/B testing.** Change one variable, split traffic 50/50, run for at least two weeks. Examples: product images, one-step vs multi-step checkout, add-to-cart button copy. | Statistically valid tests need traffic: think hundreds of orders per variant. Until about 1,000+ orders a month, rely on heuristic reviews and qualitative research. A/B test only large changes, for example "land on product page vs land on quiz". |
| 6 | **Optimize content for search.** Keyword research, then pages and blog content that answer those queries. | **Story pages and inspired-by blocks.** Egyptian searches like "{original} alternative Egypt" and "best perfume for men Cairo" are long-term free traffic that lowers blended acquisition cost. Paid Instagram still drives the launch. |
| 7 | **Consider brand personality.** People buy brands that resonate with them. Excerpted examples: Kallo (playful, poetic copy) and Frank Body (cheeky slang for a young audience). This example may come from Shopify's linked product-page article: **UNVERIFIED** placement. | The "salt, stone and golden hour" voice belongs in the **first line of the product description and in Tales**. Above the fold, clarity beats poetry: say what it smells like and what it's inspired by. |
| 8 | **Improve product pages.** Clear descriptions that tie each feature to a benefit; several high-quality images, both close-up and lifestyle; transparent pricing to avoid surprise at checkout; reviews and testimonials; a strong call to action. | **Product page.** Gallery shows bottle, scale-in-hand and a mood or lifestyle shot. Buy box shows price, 5 ml sample option, delivered total and delivery date. Reviews are collected after purchase and shown only when real. |

---

## 2. Conversion basics and benchmarks

### 2.1 The funnel and benchmark rates for each step

| Step | General / Shopify | Mobile | Beauty / fragrance | Paid social |
|---|---|---|---|---|
| Session → add to cart | Median Shopify ATC ~6.5%, top 20% >12% (Littledata, as cited). 5.95% median across 21 Shopify stores, Q2 2026 (dtcpages). Global ATC 7.9% in Aug 2023 (Shopify blog excerpt). | No reliable per-step mobile figure found: **UNVERIFIED** | Beauty & personal care ATC **8.85–10.14%** (benchmark roundups) | Not found |
| Add to cart → reached checkout | 5.95% ATC fell to **4.46% reached checkout**, about 25% lost (21 stores, Q2 2026) | — | — | — |
| Checkout → purchase | **65.1% median** checkout completion (16 DTC Shopify stores). Other sources say 25–40%; the definitions differ. | — | — | — |
| Cart abandonment | **70.22%** average across ~50 studies (Baymard, 2025) | **~80% mobile vs ~66% desktop** (as cited from Baymard) | Beauty **~81.7–82.5%**, among the highest (roundups) | — |
| **Overall conversion rate (orders / sessions)** | Shopify average **1.4%**; top 20% ≥3.2%; top 10% ≥4.7% (Littledata, 2,800 stores. A 421-store version gives 2.6% / 3.4%.) | **Mobile 2.03% vs desktop 3.81%**; mobile is **75.9%** of retail traffic (Contentsquare 2025 Benchmark) | Beauty median **3.16%**, upper quartile 4.93% (roundup, primary source unclear: **UNVERIFIED**). IRP Health & Wellbeing 2.27% (Jun 2025) → 2.58% (Jun 2026). Fragrance retailers 1.0–3.0% (Grips Intelligence *estimates* for perfumania.com / fragrancemarket.com: **UNVERIFIED**) | **Paid channels 1.7% vs unpaid 2.4%** (Contentsquare 2025). Paid social **0.8–1.2%** (Littledata 2023, as cited). Meta median CVR **1.53%** (Triple Whale, Aug 2025–Jul 2026) |

Other findings that matter for eternal:

- **Paid traffic is getting more expensive and worse.** Contentsquare 2025: cost per visit **rose 9%** in 2024 while conversion **fell 6.1%** year on year. Paid-social traffic grew 8.9%, but conversions from it fell 11.9%. Sites that relied more on paid social saw +9.2% bounce, −8.7% page views and −10.6% conversion.
- **Why carts are abandoned** (Baymard, as cited, base excludes "just browsing"): extra costs too high ~39–48% depending on year and base; forced account creation ~18–26%; checkout too long or complicated ~17–18%. Baymard: the average US checkout shows **23.48 form elements**, while 12–14 is achievable (7–8 actual fields). Better checkout design is worth up to **+35.26%** conversion for large sites.
- **Shipping cost on the product page.** **64%** of Baymard test users looked for shipping cost on the product page before adding to cart, and **43%** of sites don't show it.
- **Speed.** Google/Deloitte "Milliseconds Make Millions" (2020, 30M+ mobile sessions): **0.1 s faster gave retail +8.4% conversions and +9.2% AOV**. Think with Google: **53%** of mobile visits are abandoned when load takes over 3 s (2016 data). Bounce probability rises **32%** as load goes from 1 s to 3 s (2017).
- **Instagram's in-app browser.** Advertisers report landing-page views per link click falling to **20–50% on iOS** (advertiser and press reports: **UNVERIFIED**). In-app browsers lose autofill, saved logins and Apple Pay; one vendor claims "up to 25%" of conversions are lost (**UNVERIFIED**, vendor claim). Meta ended native Checkout on FB/IG Shops on **4 Sept 2025**, so every ad sale now finishes on the brand's own site.
- **Analytics change (very recent).** Shopify changed how sessions are measured on **21–23 Sept 2026**: identified bots are filtered out, and cart-link sessions with no pageview are counted. Conversion rate may jump with no real change in sales. Do not compare pre- and post-change conversion rates directly.

### 2.2 The money metrics

| Metric | Definition | Note for eternal |
|---|---|---|
| **AOV** | Revenue ÷ orders | Main levers are the price mix (EGP 885–1,560), bundles, the free-shipping threshold and sample add-ons |
| **CAC / CPA** | Ad spend ÷ new customers (or orders) | **CAC = cost per paid session ÷ conversion rate.** This identity is why CRO matters so much |
| **ROAS** | Attributed revenue ÷ ad spend | Triple Whale (Aug 2025–Jul 2026): Meta **beauty median ROAS 1.54, CPA $39.31**; all industries ROAS 1.88, CPM $15.06 |
| **MER** | Total revenue ÷ total ad spend | Common Thread Collective's acquisition MER (aMER) = new-customer revenue ÷ ad spend. More robust than platform ROAS after iOS 14 and with COD |
| **Contribution margin (CM)** | Net revenue − COGS − packaging − shipping − payment fees − returns/RTO − marketing | CTC's "first-order profitability": the first order should cover its variable costs including CAC |
| **Break-even ROAS** | **1 ÷ CM% before ads** | At ~59% CM, break-even ROAS is ~1.7 |
| **LTV** | Contribution from a customer over 12–24 months | Beauty 12-month repeat rate 21–35% (roundups: **UNVERIFIED**). Do not budget on LTV until eternal has 6+ months of its own cohort data |

### 2.3 How conversion improvements multiply ad spend

**ROAS = (conversion rate × AOV) ÷ cost per session.** That is, revenue per session divided by what a session costs. Each improvement multiplies the others:

1. **Cheaper customers.** Moving conversion from 1.2% to 1.8% cuts CAC by 33% at the same CPC. A fixed budget buys 50% more orders.
2. **The Meta auction rewards it.** Meta's documented auction is **total value = bid × estimated action rate × ad quality**. A site that converts better raises the estimated action rate, so it wins impressions at the same bid. The mechanism is documented; the size of the effect is **UNVERIFIED**.
3. **Faster learning.** An ad set needs about **50 optimization events per week** to leave Meta's learning phase. More purchases per week gets you to stable, cheaper delivery sooner.
4. **AOV multiplies the result.** 1.2% × EGP 1,400 ÷ EGP 10 per session = ROAS 1.68. 1.8% × EGP 1,600 ÷ EGP 10 = ROAS 2.88, which is **+71%**.
5. **Better measurement feeds the algorithm.** On a headless Next.js + Shopify setup, native pixel events are lost. Without browser pixel plus Conversions API, deduplicated on a shared `event_id`, Meta optimizes on incomplete purchase data.

---

## 3. Unit economics for eternal

**Assumptions** (to replace with the owner's real numbers):
- FX: EGP 49 per USD.
- COGS (juice, bottle, box): **22% of price**. **UNVERIFIED**; owner must supply.
- Two free 5 ml samples: EGP 40 per order. Insert and packaging: EGP 30. Shipping: EGP 80 per order. **UNVERIFIED**, depends on courier quote.
- Payment fees: 3% (Paymob is quoted at 2.5–2.95%).
- RTO allowance: EGP 7.5 per order.
- **VAT:** if prices include 14% VAT, net revenue is price ÷ 1.14. Confirm registration status with an accountant (**UNVERIFIED**).

### 3.1 What "six figures a month" means

| Target | EGP / month | USD / month |
|---|---|---|
| Six figures in EGP (minimum) | 100,000 | ~$2,000 |
| Milestone A | 1,000,000 | ~$20,400 |
| Milestone B | 2,500,000 | ~$51,000 |
| **Six figures in USD** | **~4,800,000–5,000,000** (4.9M used below) | **$100,000** |

Six figures in EGP is a launch-month goal. Six figures in USD is the real target, and it is about **50 times** larger.

### 3.2 Orders needed per month

| AOV (EGP / USD) | EGP 1M | EGP 2.5M | **$100k (EGP 4.9M)** |
|---|---|---|---|
| 1,100 / $22 (one bottle) | 909 | 2,273 | **4,455** |
| 1,400 / $29 (bottle + add-on) | 714 | 1,786 | **3,500** |
| 1,800 / $37 (bundle-heavy) | 556 | 1,389 | **2,722** |

That is **about 90–150 delivered orders a day**. With COD refusals of 12–30% of COD orders (vendor blogs: **UNVERIFIED**) and a COD share of 34–55% (sources disagree; value vs count), **4–17% more orders must be placed than delivered**.

### 3.3 Sessions needed for $100k a month

| AOV | CVR 0.8% (weak start) | 1.2% (paid-social typical) | 1.8% (good) | 2.5% (excellent) |
|---|---|---|---|---|
| 1,100 | 556,818 | 371,212 | 247,475 | 178,182 |
| **1,400** | 437,500 | **291,667** | **194,444** | 140,000 |
| 1,800 | 340,278 | 226,852 | 151,235 | 108,889 |

Is there enough reach? Egypt had **96.3M internet users** and **20.1M Instagram ad-reach users** in January 2025 (DataReportal). About 150–300k sessions a month is plausible. The premium Cairo/Alexandria audience is much smaller, though, so ad-creative fatigue and frequency will become the limit before money does (judgement, not data).

### 3.4 Instagram costs in Egypt

- **CPM:** Lebesgue ecommerce benchmark gives **$1.81 for Egypt**, "very low" (US $16.08). Other sources give $2.30–3.80 and IG $2.00–3.50.
- **CPC:** Estimates range from **$0.08 to $0.34**, or EGP 0.40–2.50 for consumer categories. One agency (Digitology) gives IG **$0.70–2.00**, which is out of line with the CPM data. Sources disagree: **UNVERIFIED**.
- **Planning figure: EGP 8–12 per paid landing session ($0.16–0.24).** This is CPC grossed up for loss between link click and landing-page view, and for premium targeting.

**CAC (EGP) = cost per session ÷ conversion rate:**

| Cost per session | 0.8% | 1.2% | 1.8% | 2.5% |
|---|---|---|---|---|
| EGP 5 | 625 | 417 | 278 | 200 |
| **EGP 10** | 1,250 | **833** | **556** | 400 |
| EGP 15 | 1,875 | 1,250 | 833 | 600 |

### 3.5 Contribution margin and break-even

| AOV | Net of VAT | CM before ads | CM % | Break-even ROAS (on gross price) |
|---|---|---|---|---|
| 1,100 | 965 | 536 | 55.6% | 2.05 |
| 1,400 | 1,228 | 726 | 59.1% | 1.93 |
| 1,800 | 1,579 | 978 | 61.9% | 1.84 |

Without VAT, break-even ROAS falls to ~1.5–1.65.

### 3.6 Full scenario at $100k a month (80% of sessions paid, VAT-inclusive)

| AOV | CVR | EGP/session | Ad spend / month | MER | Contribution after ads |
|---|---|---|---|---|---|
| 1,100 | 1.2% | 12 | EGP 3.56M ($72.7k) | 1.38 | **−EGP 1.17M (loss)** |
| 1,400 | 0.8% | 8 | EGP 2.80M ($57.1k) | 1.75 | −EGP 0.26M |
| 1,400 | 1.2% | 8 | EGP 1.87M ($38.1k) | 2.62 | +EGP 0.67M ($13.7k) |
| **1,400** | **1.8%** | **8** | **EGP 1.24M ($25.4k)** | **3.94** | **+EGP 1.30M ($26.4k)** |
| 1,400 | 2.5% | 8 | EGP 0.90M ($18.3k) | 5.47 | +EGP 1.64M ($33.6k) |
| 1,800 | 1.8% | 12 | EGP 1.45M ($29.6k) | 3.37 | +EGP 1.21M ($24.7k) |

**Takeaways:**
- At paid-social-typical conversion (0.8–1.2%) with single-bottle AOV, **$100k a month loses money or barely breaks even**.
- Lifting conversion from 1.2% to 1.8% at AOV 1,400 **almost doubles contribution** (EGP 0.67M → 1.30M) with the same revenue.
- **The working target: conversion ≥1.8%, AOV ≥EGP 1,400, MER ≥3.**
- **Mystery box (EGP 250) as the first order:** at any realistic CAC (EGP 400+) it loses money unless it converts to a bottle. Run it as a **credit-back trial funnel**, not as the main ad offer (see recommendation R4).

---

## 4. Research and prioritisation methods

**Hierarchy of optimization** (Bryan Eisenberg, modelled on Maslow): **Functional → Accessible → Usable → Intuitive → Persuasive.** Fix lower levels before polishing persuasion. For eternal:
- **Functional:** checkout, payment and COD work inside the IG/FB in-app browsers on iOS and Android. Cart survives the jump from the headless site to Shopify checkout. Pixel and CAPI fire.
- **Accessible:** loads fast on 4G and mid-range Android; contrast; alt text; Arabic-friendly numerals and address input.
- **Usable:** tap sizes; sticky add-to-bag not covered by the WhatsApp float; size and sample choice obvious.
- **Intuitive:** "inspired by" and the 5 ml credit understood in 5 seconds.
- **Persuasive:** story, honest proof, offers.

**LIFT model** (Chris Goward, WiderFunnel, 2009). Value proposition is the engine; relevance and clarity add; anxiety and distraction subtract; urgency adds. Applied to the **product page as ad landing page**:

| LIFT factor | eternal product page |
|---|---|
| **Value proposition** | One line above the fold: "Inspired by {Original}. Made in Cairo. 55 ml EDP, EGP X." Plus the honest "how it differs" note. Dossier grew to about **$100M annualized revenue in 2025** (Sacra) by naming the original openly ("Impressions") and later adding Originals. |
| **Relevance** | Ad-to-page match: the ad for scent X lands on scent X's page, same visual, same words. The quiz ad lands on the quiz. |
| **Clarity** | Notes pyramid in plain words ("smells like: salt air, fig, warm wood"); one main call to action; price and delivered total visible. |
| **Anxiety** (biggest for fragrance) | Blind buying: ~80% of respondents say testing before buying is a must, and only 15–30% will blind-buy (Highsnobiety State of Fragrance 2024, as cited: **UNVERIFIED** detail). Answer with the **5 ml sample credit**, longevity facts, COD, a WhatsApp human, and a returns policy shown next to the button. |
| **Distraction** | For ad landers: Tales, recently viewed and pairings go **below** the buy box. Avoid pop-ups on first view in the in-app browser. |
| **Urgency** (honest only) | Real delivery cut-offs ("Order by Thu for delivery before Eid / Mother's Day, 21 March") and real limited batches only when true. No timers, no fake stock. |

**Prioritisation**
- **ICE** (Sean Ellis): Impact × Confidence × Ease.
- **PIE** (Goward): Potential × Importance (value of the page's traffic) × Ease.
- **PXL** (Peep Laja, CXL): binary questions such as above the fold, noticeable in 5 s, backed by user research or analytics, high-traffic page, plus ease. Less subjective.
- Use **ICE now** while data is thin, and switch to **PXL** once Clarity recordings and funnel data exist.

**Research toolkit for this stage** (standard practice; no statistics claimed):
- Shopify + GA4 funnel by device and browser, with an "Instagram webview" segment.
- Microsoft Clarity recordings and heatmaps.
- A 5-second test of the product page above the fold.
- Five moderated tests where people tap a real IG ad on their own phone.
- A post-purchase one-question survey: "What almost stopped you?"
- Tagging WhatsApp chat questions; each frequent question becomes a product-page FAQ item.

---

## 5. Recommendations ranked by expected impact

| # | Recommendation | Page / element | Evidence | ICE (1–10) |
|---|---|---|---|---|
| **R1** | **Make the product page the ad landing page, built for the in-app browser.** LCP ≤2.5 s on mid-range Android 4G inside the IG webview. Hero image preloaded, video poster first, no blocking fonts or scripts. Track landing-page views ÷ link clicks weekly as a speed alarm. | Product page, home hero, `next/image`, script budget | Deloitte 0.1 s → +8.4% conversion; Google 53% abandon after 3 s; LPV/click gap reports | 9·8·7 |
| **R2** | **Fix measurement before scaling spend.** Meta Pixel in Next.js plus Conversions API from server routes, with Shopify checkout Purchase via a custom web pixel or server webhook, deduplicated on `event_id`. Add GA4 funnel events. Annotate the 21–23 Sept 2026 Shopify session change. | Site-wide, checkout | 50-events-per-week learning rule; headless setups lose native events | 9·9·6 |
| **R3** | **No price surprises.** Show delivered total, delivery date and the COD fee in the **buy box and cart drawer**. Add an honest free-shipping progress bar in the cart drawer once the threshold is confirmed. | Buy box, cart drawer | Extra costs are the #1 abandonment reason (~39–48%); 64% look for shipping on the product page | 9·9·8 |
| **R4** | **Reverse the risk of blind buying.** Make the 5 ml sample variant ("price credited on a full bottle") the **second option in the buy box**. Tell the mystery box story as "try 3, the EGP 250 comes back on your bottle". Send the credit code by WhatsApp or email with sample orders. | Buy box, mystery box product page, post-purchase flow | Henry Rose: 5×2 ml set plus $20 credit, "high double-digit" conversion to full size, #1 bestseller; Phlur and Arquiste ($40 sample, $40 off full size) do the same | 9·8·6 |
| **R5** | **Shorten checkout to Egyptian essentials.** Guest only; fields: phone, name, governorate/city, address, building/floor. Payment logos (Visa/MC, Meeza, InstaPay if confirmed, COD + fee) shown **on the product page** too. WhatsApp order confirmation for COD to cut refusals. | Shopify checkout settings, buy box trust row | Baymard 23.48 → 12–14 elements, +35% potential; account creation 18–26%; Egypt RTO 25–35% (**UNVERIFIED**) | 8·8·7 |
| **R6** | **Value proposition and clarity above the fold.** "Inspired by {Original}" plus price plus a plain-words scent line plus the honest difference note, all within the first screen at 360 px. The pyramid goes below. | Product page above the fold | LIFT value prop and clarity; Dossier's growth on open comparison | 8·7·9 |
| **R7** | **AOV ladder.** Set the free-shipping threshold so that "one bottle plus mystery box" or "one bottle plus a sample" clears it (heuristic: 15–30% above AOV). Offer a "pair of two" bundle (eterna + eterno gifting) and a one-tap mystery box add-on in the cart drawer. | Cart drawer, pairings block, bundle product page | 58% add items to qualify (Deloitte as cited: **UNVERIFIED**); AOV multiplies ROAS directly | 7·7·8 |
| **R8** | **Cut distraction for ad traffic.** On product pages, move Tales and recently viewed below FAQ. Make sure the WhatsApp float hides when the sticky add-to-bag is visible, or sits above it. No exit or welcome pop-up in the in-app browser. | Product page layout, WhatsApp float | LIFT distraction; Contentsquare paid-social bounce +9.2% | 7·7·9 |
| **R9** | **Quiz as a relevance engine.** Five questions or fewer, result page with 1–3 scents, buy box and sample-first button inline. Run it as its own ad destination for "don't know what to pick" audiences. | Scent-finder quiz | LIFT relevance; fragrance choice anxiety | 6·6·7 |
| **R10** | **Honest proof that grows.** Collect reviews 7–14 days after delivery by WhatsApp/email; show only real ones. Until then, the proof strip uses verifiable facts (made in Cairo, EDP concentration, 43 scents, COD available). | Proof strip, product page reviews block | Shopify article #8; brand rules | 6·6·8 |
| **R11** | **Retention for LTV.** Post-purchase flow at day 3 (how to wear), day 10 (review), day 45–60 (sample-to-bottle credit reminder), day 90 (re-order or new line). | Email/WhatsApp, account | Beauty 12-month repeat 21–35% (**UNVERIFIED**) | 6·5·7 |
| **R12** | **Testing cadence.** Below ~1,000 orders a month: heuristic plus qualitative research, and ship the clear fixes. Above that: one A/B test at a time on the product page, run for at least 2 weeks, judged on revenue per session rather than conversion rate alone. | Whole site | Shopify article #5; PIE/PXL | 5·7·6 |

**North-star KPIs to track weekly:**
- Revenue per paid session (target ≥ EGP 25 = 1.8% × 1,400)
- MER (≥3)
- Landing-page views ÷ link clicks
- Product page → add to cart (beauty benchmark ~9%)
- Checkout completion (≥65%)
- COD refusal rate
- Sample-to-bottle credit redemption

---

## Sources

- https://www.shopify.com/blog/ecommerce-website-optimization (via search excerpts; fetch blocked)
- https://www.shopify.com/my/blog/mobile-optimization
- https://www.shopify.com/blog/expert-advice-improve-product-pages
- https://help.shopify.com/en/manual/reports-and-analytics/discrepancies/session-measurement-update
- https://commonthreadco.com/blogs/coachs-corner/shopify-analytics-changed-on-september-21-what-the-session-measurement-update-means-for-your-store
- https://baymard.com/lists/cart-abandonment-rate
- https://baymard.com/research-articles/current-state-of-checkout-ux
- https://baymard.com/blog/show-shipping-costs-on-product-pages
- https://contentsquare.com/guides/digital-experience-benchmark/conversions/
- https://contentsquare.com/press/2025-digital-experience-benchmarks/
- https://thewisemarketer.com/businesses-pay-more-for-digital-customers-in-2025-but-see-6-1-drop-in-conversions-as-user-frustration-persists/
- https://www.littledata.io/average-website-performance
- https://www.dtcpages.com/blog/ecommerce-conversion-rate-benchmarks-2026
- https://www.triplewhale.com/blog/facebook-ads-benchmarks
- https://www.triplewhale.com/blog/ecommerce-benchmarks
- https://www.wordstream.com/blog/facebook-ads-benchmarks-2025
- https://lebesgue.io/facebook-ads/facebook-cpm-by-country
- https://digitology.co/docs/digital-marketing-in-egypt/media-buying-costs-in-egypt-a-statistics-report/
- https://adcostly.com/facebook-ads-cost-in-egypt
- https://datareportal.com/reports/digital-2025-egypt
- https://www.mordorintelligence.com/industry-reports/egypt-ecommerce-market
- https://xpay.app/blog/payment-methods-egyptian-customers-prefer
- https://dukkanapp.net/en/blog/ecommerce-egypt-2026
- https://easysellapp.com/blogs/wiki/egypt-ecommerce-cod-market-entry-shopify-2026
- https://ecosire.com/blog/shopify-payment-gateways-by-country-2026
- https://web.dev/case-studies/milliseconds-make-millions
- https://www.thinkwithgoogle.com/_qs/documents/2340/bc22e_The_Need_for_Mobile_Speed_-_FINAL_1.pdf
- https://www.godatafeed.com/blog/meta-is-dropping-native-checkout-on-facebook-and-instagram
- https://www.meta.com/help/meta-pay/1896636927418202/
- https://www.adpage.io/en/post/meta-ads-klikken-vs-landingspaginaweergaven/
- https://www.rocketshiphq.com/how-meta-ad-auction-works/
- https://adlibrary.com/posts/meta-ads-learning-phase-50-events-guide
- https://commonthreadco.com/blogs/bridges/unlock-first-order-profitability
- https://commonthreadco.com/blogs/coachs-corner/marketing-efficiency-ratio-mer-ecommerce-rating
- https://community.shopify.com/t/does-a-headless-setup-next-js-frontend-shopify-backend-affect-pixel-tracking/581735
- https://www.glossy.co/beauty/dtc-brands-are-using-sampling-to-unlock-online-fragrance-sales/
- https://sacra.com/c/dossier/
- https://www.beautyindependent.com/american-pacific-group-dossier-dupe-business-deal/
- https://dossier.co/products/discovery-set
- https://www.highsnobiety.com/p/state-of-fragrance-trends/
- https://gripsintelligence.com/insights/retailers/fragrancemarket.com
- https://gripsintelligence.com/insights/retailers/perfumania.com
- https://www.conversion.com/framework/the-lift-model/
- https://www.mediapost.com/publications/article/77669/determining-what-matters-most-when-it-comes-to-on-.html
- https://cxl.com/blog/4-frameworks-help-prioritize-conduct-conversion-testing/
- https://growthmethod.com/ice-framework/
- https://www.metricuno.com/pie-framework
- https://capitaloneshopping.com/research/free-shipping-statistics/

The scenario model is at `/tmp/claude-0/-home-user-ETERNAL-E-Commerce/3e1a8386-f72a-5cc5-8f04-42e568424f65/scratchpad/econ.py`.
