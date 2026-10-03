# Research critique and verification

# Skeptical CRO review of the 9 eternal research reports

## 0. How this review was done

- **General web research was not possible.**
  - WebSearch refused my query because the session's 200-search budget was already used up.
  - WebFetch to baymard.com was blocked.
  - A probe of 30 hosts found that the egress proxy only lets through GitHub (raw and API) and the npm registry.
  - So the "6+ searches" were run against the sources that were reachable:
    - 13 shopify.dev documentation searches
    - 3 read-only Admin API queries against the live eternal store
    - Primary sources mirrored on GitHub: web.dev, w3c/wcag, the Lighthouse changelog, WebKit source and MDN
    - The npm registry
    - Local recomputation in Python, Node's ICU library and next/font's font metadata
    - The repo code
- **Labels used below:**
  - **VERIFIED (source):** I read the source myself or recomputed the figure.
  - **NOT VERIFIED:** I could not reach the source.
  - **WRONG / OUTDATED:** the claim conflicts with evidence I checked.
  - **[K]:** well-known published work cited from knowledge, not re-read here.
- **Live store facts** (Admin API, read-only):
  - Plan is **Grow, not Plus**.
  - `paymentSettings.supportedDigitalWallets = []`.
  - Primary domain is still `eternal-10199.myshopify.com`.
  - The only published locale is `en`.
  - The store ships to EG only.

---

## 1. Wrong, outdated or unsourced claims

### 1a. Spot-checks of the 8 most important figures

| # | Claim (report) | Verdict | Evidence / correction |
|---|---|---|---|
| 1 | "A site 0.1 s faster gets +8.4% retail conversion and +9.2% order value; luxury product page → add to basket +40.1%" (fundamentals, mobile-ux, speed, luxury) | **VERIFIED, with a caveat the reports leave out** | web.dev source (`GoogleChrome/web.dev/.../milliseconds-make-millions/index.md`). The gain only appeared when **four** metrics (First Meaningful Paint, Estimated Input Latency, page load, time to first byte) each improved by 0.1 s **on every page of the journey**. The study is correlational. web.dev itself warns that luxury progression rates "tend to be quite small". It is not a "per 0.1 s of LCP" rule, so do not use it to forecast. |
| 2 | Vodafone: 31% better LCP gave +8% sales, in an A/B test (speed, instagram, luxury) | **VERIFIED** | web.dev `blog/vodafone/index.md`: an A/B test, with the two versions "visually and functionally identical". |
| 3 | A/B sample sizes per arm (speed §4.1) | **VERIFIED** (recomputed, two-sided α 0.05, 80% power, identical to the report) | **This contradicts fundamentals R12.** At 1,000 orders a month (about 67k sessions at 1.5% conversion), a +10% lift on purchases needs about **14 weeks**, +20% needs about 3.7 weeks, and only lifts of 30% or more show up in 2 weeks. Revenue per session varies more than conversion rate, so it needs even longer. |
| 4 | A headless store's checkout must sit on the storefront's root domain, or cookies and consent do not carry over (instagram, speed) | **VERIFIED** | shopify.dev Customer Privacy API: "storefront on hydrogen.shop, checkout on example.com → consent will not be honored". **Live:** the primary domain is still `eternal-10199.myshopify.com`, and `lib/shopify/client.ts` defaults to it. |
| 5 | `_shopify_y` / `_shopify_s` are deprecated, so a custom headless store needs a Storefront API proxy (speed) | **VERIFIED** | shopify.dev, "Migrating analytics tracking for custom headless builds": "deprecated on April 30, 2026". The changelog of 4 Aug 2025 says themes stopped setting them on 1 Jan 2026. This makes **aov-cart F11 OUTDATED** (see §3). |
| 6 | Shop Pay depends on Shopify Payments; express wallets will not help (all reports) | **VERIFIED in practice** | shopify.dev: "Completing the full Shopify Payments sign-up is required" for Shop Pay Wallet. **The live store supports no digital wallets** (`supportedDigitalWallets: []`). "Shopify Payments is unavailable in Egypt" itself is NOT VERIFIED (the API scope was denied), but it does not matter today. The instagram report's case about Apple Pay being blocked by script injection: I could not locate the check in current WebKit source (PaymentSession and LocalFrame only check https and certificates), so that part is **NOT VERIFIED from source**. With no wallets on the store, it is also moot. |
| 7 | Post-purchase upsells will not work for most eternal orders (aov-cart F6) | **VERIFIED** | shopify.dev "About product offers": beta, and access must be requested. The page is not shown when "the initial purchase was made with … any payment method other than a credit card" or a wallet. Online Store channel only. So COD orders never see it. |
| 8 | Baymard: about 70% cart abandonment, and "extra costs too high" at 48% (trust, aov) vs 39% (instagram) vs 39–48% (fundamentals) | **NOT VERIFIED** (baymard.com blocked, no search budget) | The reports cannot agree on the number. It probably differs by survey edition and base. They do agree it ranks **#1**, so quote the rank, not a percentage. |

Further checks:

- **VERIFIED:**
  - WCAG 2.2 2.5.8 requires targets of at least 24×24 CSS px (w3c/wcag repo).
  - Arabic is not one of the languages Shopify provides for checkout and system messages (shopify.dev storefront locale files). The live store also has only `en` published.
  - Payment Customization Functions can only rename, reorder or hide methods, set payment terms and add review requirements. **They cannot add a COD fee** (shopify.dev).
  - Thank-you page extensions "can't directly mutate an order" (shopify.dev).
- **NOT VERIFIED:**
  - Spiegel's 270% / 380% / 190%
  - Meta's 50 events a week
  - Egypt's COD share and refusal rates
  - The Egypt CPM of $1.81
  - DataReportal's reach figures
  - Contentsquare and Triple Whale 2025–26 figures
  - The Shopify session-measurement change of 21–23 Sept 2026

### 1b. Other wrong or outdated claims

1. **instagram-traffic: "no pixel or UTM code in the repo at all" is WRONG as of commit `a3657ba` (2026-10-03 20:24 UTC).**
   - `components/analytics/Analytics.tsx` loads the Pixel and GA4 at `afterInteractive`.
   - `lib/client/attribution.ts` stores UTMs and `fbclid`.
   - `app/api/checkout/route.ts` passes an allow-listed set of them as cart attributes.
   - **Still missing:**
     - no first-party `_fbc` cookie (`fbclid` lives only in localStorage)
     - no Conversions API route
     - a likely **double InitiateCheckout**: `lib/client/analytics.ts:82` fires it on the checkout click, and Shopify's Meta channel pixel probably fires its own on checkout (UNVERIFIED).
2. **mobile-ux relies on outdated Lighthouse audits (OUTDATED).**
   - The report cites the 48 px `tap-targets` and the "60% of text ≥ 12 px" font-size audits from v9.6.8.
   - The Lighthouse changelog shows that **12.0 (2024-04-22)** replaced `tap-targets` with axe `target-size` (the WCAG 24 px rule).
   - **13.0 (2025-10-10)** removed the `font-size` audit.
   - The 44–48 px design targets still stand on Apple and Android grounds.
3. **fundamentals: the unit economics understate COD refusals.**
   - The table's arithmetic reproduces exactly: contribution margin of EGP 536 / 726 / 978.
   - But the allowance of **EGP 7.5 per order** for orders returned to origin (RTO) conflicts with the report's own 4–17% "placed but not delivered" range. A refused order costs about EGP 230 (two-way shipping, samples, packaging), and its ad cost is never recovered.
   - Recomputed for $100k a month at AOV 1,400 and EGP 8 per session:

| Conversion | Refused share of placed orders | Ad spend | RTO cost | Contribution | Delivered MER |
|---|---|---|---|---|---|
| 1.8% | 0% (report) | 1.24M | 0 | **1.32M** | 3.94 |
| 1.8% | 12% | 1.41M | 0.11M | **1.04M** | 3.46 |
| 1.8% | 21% | 1.58M | 0.21M | **0.78M** | 3.11 |
| 1.2% | 21% | 2.36M | 0.21M | **≈ 0 (−0.01M)** | 2.07 |

   - Refusals cut the headline scenario by 21–41%. COD control is a profit lever on the scale of conversion rate, and fundamentals does not rank it at all.
   - The same report also says break-even ROAS is "~1.7 at 59% CM", but its table says 1.93. One is on a net basis, the other on gross. Use **1.93**, because Meta reports gross revenue.
4. **egypt-mena: "the box becomes a natural top-up" at a EGP 1,750 threshold is WRONG for 40 of 42 bottles.**
   - In `content/catalogue.snapshot.json` only the two EGP 1,560 bottles clear 1,750 with the EGP 250 box. 1,499 + 250 = 1,749 misses by one pound.
5. **"43 scents" may be false.**
   - The snapshot (2026-09-18) holds **42 bottles plus the mystery box**, 43 products in all.
   - `site.scentCount: 43` feeds the copy. Confirm the count before "43 eaux de parfum" goes into the proof strip (honesty rule).
6. **Dossier "$100M annualised (Sacra)" is presented as fact in fundamentals' LIFT table.**
   - Other reports cite "about $60M US sales 2025 (YipitData)". These are different measures and neither is verified. Keep the pattern, drop the numbers.
7. **The date Meta ended native checkout (4 Sept vs "August" 2025) does not matter.** Native IG/FB checkout was US-only [K], so Egyptian shops never had it.
8. **Shopify's Sept 2026 session-measurement change** is NOT VERIFIED, and moot: eternal has no history from before the change.
9. **The loader timing differs between reports (~500 ms, 520 ms, 300 + 200 ms).**
   - In the code, mobile waits 300 ms and then plays a 200 ms curtain, about 500 ms. Desktop is 600 + 400 = **1,000 ms**.
   - It is keyed on `sessionStorage` and skipped under `prefers-reduced-motion`.
10. **speed's "UNVERIFIED whether both fonts are variable" is now VERIFIED.** next/font's metadata lists `variable` for both Cormorant Garamond and Instrument Sans.
11. **Vendor or unsourced numbers to keep out of any plan or deck:**
    - Octane's 7.1% vs 2.3%; TheScentNest +22% ROAS
    - "Up to 25% of conversions lost in in-app browsers"; "+5–15%" for sticky bars
    - Shop Pay "50%"; Unbounce "212%"
    - Henry Rose "high double-digit"; Alt "seven figures"; Yotpo 48×; Pixated 3.2×
    - Landing-page views ÷ clicks "≥ 80%"
    - "58% add items for free shipping", which is US data from about 2015

---

## 2. Gaps no report covered, researched here

### 2.1 Arabic and right-to-left text

- **Checkout:**
  - Arabic is not among Shopify's provided checkout languages (VERIFIED), so every checkout string would have to be translated by hand in the Language Editor.
  - The store has only `en` published (VERIFIED live).
  - Whether Shopify's hosted checkout lays itself out right-to-left is NOT VERIFIED. Test on a phone before enabling `ar`.
- **Fonts:**
  - Neither brand font has an Arabic subset (VERIFIED in next/font data). Any Arabic line falls back to system fonts, which look different on iOS and Android.
  - next/font options that do have `arabic` subsets: **Markazi Text** (a serif that pairs with Cormorant), **IBM Plex Sans Arabic**, **Readex Pro** and **Alexandria** (sans).
  - Load one with `subsets:['arabic']` and `preload:false`, only where Arabic appears.
- **Numerals (VERIFIED, Node ICU 78.2):**
  - `ar-EG` formats 1,250 as `١٬٢٥٠٫٠٠ ج.م.‏` (Arabic-Indic digits plus RLM marks).
  - `ar-EG-u-nu-latn` formats it as `1,250.00 ج.م.‏`.
  - Use the `-u-nu-latn` form so Arabic lines match the Western digits at checkout and in `lib/format.ts`.
- **Bidirectional text:**
  - An Arabic line that contains "EGP 1,250" or "eterna" needs `<bdi>` or `dir="auto"` isolation, or the tokens reorder (VERIFIED, MDN).
  - Wrap Arabic fragments in `lang="ar" dir="rtl"`. The repo has `lang="en"` and no `dir` anywhere (VERIFIED), so screen readers would read Arabic with an English voice.
- **Scope:** do not mirror the whole site at launch.
  - Ship bilingual reassurance lines.
  - Give shipping rates and the COD method Arabic names.
  - Show an Arabic hero subline when the ad was in Arabic.
  - Test Arabic vs English creative at the ad level.

### 2.2 Accessibility

- **The bar is WCAG 2.2 AA.** Two criteria matter most here:
  - **2.5.8** (24×24, VERIFIED). All current controls pass, including the 36 px chips and `.btn-xs`.
  - **2.4.11 Focus Not Obscured**: a sticky footer must not hide the focused item (VERIFIED, w3c/wcag text). The sticky add-to-bag bar and the WhatsApp float need `scroll-padding-bottom` equal to the bar's height.
- **Contrast, computed from the `app/globals.css` tokens:**

| Pair | Ratio | Status |
|---|---|---|
| night on linen | 15.77 | pass |
| ash on linen | 4.94 | pass (but used at **11 px** for the cart drawer's cost line) |
| gold-text on linen | 4.98 | pass |
| **ash on sand** | 4.06 | **fails** 4.5 for small text |
| **gold on linen** (20 px section numerals) | 3.11 | **fails** for normal-size text, unless treated as decorative |
| **stone on linen** (search placeholder) | 2.63 | **fails** |

- **Most expensive issue:** the most important cost information ("Shipping and COD fee calculated at checkout", `CartDrawer.tsx:213`) is set at 11 px in grey. Fix the size together with the copy.
- **Already fine:** `prefers-reduced-motion` turns off the loader and motion (VERIFIED).
- **Gallery:** the dots are `aria-hidden` and the gallery has no zoom or thumbnails, so its frames cannot be browsed except by swiping.
- **Egypt's disability law** (Law 10/2018) has no verified web standard [K]. The case here is conversion: glare outdoors, low-end Android phones, older gift buyers.

### 2.3 Instagram's in-app browser

- **Detection.**
  - The user agent carries `Instagram`, or `FBAN/FBAV` / `FB_IAB` for Facebook [K].
  - The maintained library `inapp-spy` (npm 5.0.10, VERIFIED registry) detects instagram, facebook, threads and whatsapp, and works server-side.
  - That means the loader skip and the ad-landing layout can be **rendered on the server**, with no flash. Test devices against inappdebugger.com.
- **Storage.**
  - Both the bag and the attribution live in localStorage (VERIFIED). Neither is shared with Safari or Chrome.
  - Shopify only sees a cart when Checkout is tapped, so an in-app session can never be recovered before checkout.
  - Fixes: `cartCreate` on the first add, and a server-set `_fbc` cookie in middleware.
- **Layout.**
  - The `viewport` export has no `viewportFit: "cover"`, and the repo uses no `safe-area` anywhere (VERIFIED), so the sticky bar can sit under the iOS home indicator.
  - The hero already uses `100svh`, which is good.
  - Log `innerHeight` by user agent to measure Instagram's toolbars.
- **Card payments.** An offsite gateway (Paymob) sends the buyer to a hosted page and then a bank one-time-password (3-D Secure) step.
  - If the buyer switches to the SMS app, iOS may reload the in-app browser (UNVERIFIED).
  - Make this a launch test case. Keep COD as the fallback, and recover with the abandoned-checkout `recoveryUrl` (VERIFIED in egypt-mena).
- **Do not force people out of Instagram.** Escape schemes such as `intent://` and `x-safari-https://` exist, but they lose the bag and attribution [K].

### 2.4 COD order-confirmation flow

**Platform facts (all VERIFIED):**
- Thank-you and Order-status extensions are available on **Grow**, the store's plan.
- Extensions cannot change the order, so a "confirm" button has to be a `wa.me` link or a call to eternal's own endpoint.
- Staff **can add items to an unpaid COD order** through order editing (`orderEditBegin` → add variant). That is the legitimate home for "add a 5 ml to this parcel?".
- Payment Customization can **hide** COD above or below a cart total, but **cannot charge a fee** for it.

**Flow:**
1. A COD order is created and tagged `cod-unconfirmed` (Shopify Flow; availability on Grow [K]).
2. Within about 5 minutes, send a WhatsApp utility template that restates the **exact delivered total**.
3. If there is no reply after 3 hours, call. Cancel at 24 hours. Pack confirmed orders only.
4. Utility templates must be non-promotional [K]. Make the upsell during the customer-initiated chat window or on the call.

**Feedback to Meta and measurement:**
- Send a CAPI custom event at confirmation (and ideally at delivery), and build a custom conversion on it.
- Optimise for it only once it reaches about 50 a week per ad set (threshold UNVERIFIED).
- Track each week: confirmation rate, refusal rate by campaign and governorate, and cost per *delivered* order.
- WhatsApp pricing for Egypt is NOT VERIFIED (Meta's docs were blocked).

### 2.5 Showing 43 SKUs without choice overload [K, not re-read]

**Evidence:**
- **Iyengar & Lepper 2000:** 24 jams vs 6. 60% vs 40% of passers-by stopped, but 3% vs 30% bought.
- **Scheibehenne, Greifeneder & Todd 2010** (meta-analysis, about 50 experiments): the mean effect is **about zero**, with large variation between studies.
- **Chernev, Böckenholt & Goodman 2015** (meta-analysis, 99 observations): overload is reliable when four things are present: a complex choice set, a hard decision, **uncertain preferences**, and a goal of minimising effort.
- **Chernev 2003:** people who already have an ideal point prefer **larger** assortments.
- **Mogilner, Rudnick & Iyengar 2008:** simply grouping options into categories raises satisfaction for people new to a field.

**What it means for eternal:**
- A cold Instagram visitor on a phone, unable to smell anything, meets all four conditions, so expect overload.
- A visitor from an "If you love X" ad already has an ideal point, so the full range works for them, provided search by the original is fast. `CollectionGrid.tsx` already has "Search by the original you love".

**Design:**
- Never land cold traffic on all 43.
- Split the entry:
  - Visitors who know the original: search or an A–Z list of originals.
  - Visitors who don't: line, then family chips with counts, then 4–6 "start here" picks per line.
  - Or the quiz: 3 results plus "try all 3 as 5 ml".
- Carousel ads land on `/shop?h=…`, filtered to exactly the advertised scents, in the ad's order.
- Treat the sample trio as the way out for anyone who can't decide.
- Once traffic allows, test "curated 6" against "full grid" on add-to-cart.

### 2.6 Legal and trademark risk in "inspired by" copy [K; needs Egyptian counsel]

- **EU:** *L'Oréal v Bellure* (CJEU C-487/07, 2009). Comparison lists that present smell-alikes as imitations of trademarked perfumes are unlawful comparative advertising and "take unfair advantage", even when nobody is confused.
- **US:** *Smith v. Chanel* (9th Cir. 1968) allows truthful "smells like" claims, which is the basis for Dossier-style practice.
- **Egypt:** IP Law 82/2002 protects marks and Consumer Protection Law 181/2018 bans misleading advertising. How these apply to "inspired by" wording is NOT VERIFIED.
- **The likelier risk is the platform, not a court.**
  - Meta removes ads and catalog items when a rights-holder files an IP report [K].
  - Shopify product titles sync into the Meta catalog through the Facebook & Instagram app.
  - So fundamentals' SEO template "{Scent} – inspired by {Original}" would **put a third-party mark into catalog titles and catalog ads**.
- **Rules:**
  - Keep original brand names out of product titles, handles, catalog titles, JSON-LD `name` and ad image text.
  - Use them on the page body only, with "our own composition · not affiliated".
  - Never write dupe, copy, replica, تقليد or هاي كوبي; in Arabic use مستوحى من ("inspired by").
  - Never show the original bottles or logos.
  - Test one ad set that names a brand before scaling (as the instagram report says).
  - Have counsel approve both the English and Arabic wording.

### 2.7 Other gaps

- **Grow plan limits:** no checkout extensions on the information, shipping or payment steps. Functions from public apps are allowed.
- **VAT and Egypt's e-receipt rules:** NOT VERIFIED, but they move break-even ROAS from about 1.65 (no VAT) to 1.93 (14% VAT included in price).
- **Egypt's data protection law (151/2020)** and WhatsApp opt-in: NOT VERIFIED.
- **Price endings:** egypt-mena recommends round endings, but the catalogue uses 1,099 / 1,199 / 1,499. Decide this before launch.

---

## 3. Contradictions between reports, and how they resolve

| Topic | Positions | Resolution (evidence) |
|---|---|---|
| Pixel and UTMs in the repo | instagram: none; speed and luxury: present | **Present** since `a3657ba`. The instagram report predates that commit. Still missing: `_fbc`, CAPI, and a fix for the duplicate InitiateCheckout (rename the site event to a custom `CheckoutClick`). |
| What drives the Bestseller badge | trust: Shopify's top-12 `BEST_SELLING`; luxury: hand-set `ed.bestseller` | **Both** (`lib/catalogue.ts:80-87, 255`): `BEST_SELLING` when the Storefront API is live, the hand-set flag on the snapshot. Neither is backed by sales at launch. Show the badge only for real 30-day units, and rename the home section until then. |
| Shopify analytics for a headless store | aov-cart F11: send events with `_shopify_y/_s`; speed: those cookies are deprecated | **speed** (VERIFIED: deprecated 30 Apr 2026). Use a Storefront API proxy plus `getTrackingValues`. |
| Free-shipping threshold | fundamentals: 15–30% above AOV; egypt-mena: 1,750; aov-cart: free on every bottle; fragrance-dtc: just above the average bottle | Price spread (VERIFIED): median 1,099, 35 of 42 bottles at 1,199 or less, 950 the most common price. At 1,750 the box closes the gap for only 2 bottles; at 1,350 a 950 bottle plus the box (1,200) still falls short. Extra costs are the #1 abandonment reason. **Launch with delivery included on any bottle** (the EGP 80 is already in the margin model); sample-only and box-only orders pay delivery. Get AOV from a value-add second bottle. Test 1,350 later. |
| COD fee | fundamentals, trust, aov-cart: show the fee; egypt-mena: no separate fee; luxury: "no COD fee" as a prepaid perk | A fee cannot be attached to a payment method natively (VERIFIED). **No separate COD fee at launch.** Reward prepaying with a non-price perk. If the owner insists, make it a named delivery rate and show the same number on the product page, in the cart and in WhatsApp. |
| Mystery box as the main cold offer | egypt-mena and luxury: yes; fundamentals and instagram: no | Box margin before ads is about **EGP 123** if the customer pays delivery and about 43 if delivery is free, against a CAC of EGP 400–800. It needs roughly 40% or more box-to-bottle conversion to break even. **Not the default.** Run it as its own ad set, judged on delivered CAC plus a 60-day box-to-bottle cohort; test a quiz-picked trio. |
| COD share | 34–55% / 45–70% / 60–70%+ | None verified, and the definitions differ (by value or count, all ecommerce or social). **Plan for 60–75% of first orders from cold Instagram traffic being COD**, and measure in week 1. |
| A/B testing threshold | fundamentals: above 1,000 orders a month, 2 weeks or more, judged on revenue per session; speed: by traffic tier | **speed**: its maths is VERIFIED (see §1a #3). Start with Meta ad-plus-landing splits, then add-to-cart tests, then purchase tests. |
| Abandonment "extra costs" % | 48 vs 39 | Not verified. Cite the **#1 rank**. |
| Egypt reach | 96.3M / 20.1M (2025 excerpt) vs 82M / 18–19M (memory of 2024) | Use the sourced 2025 figure with caution. Plans do not depend on it. |
| Dossier revenue | $100M annualised vs about $60M US | Different measures, both unverified. Drop both. |
| Landing-page views ÷ clicks | "20–50% on iOS" vs "aim for ≥ 80%" | Both unsourced. Set the baseline from week 1 and alert when it drops. |
| Credit-code expiry | 30 / 60 / 60–90 days | Pick **60 days** for every sample, box and credit message. |
| Risk reversal | 5 ml twin plus return of the sealed bottle (fragrance-dtc); first-bottle swap even if opened (trust); exchange of unopened bottles within 14 days (egypt-mena) | These stack, and the costs add up. Make one of the "two free samples" **the 5 ml of the bottle bought**, so "smell it before you open it" costs nothing extra. Then offer the swap once per phone number. Confirm the legal minimum window (NOT VERIFIED). |
| Pop-ups | aov-cart: a delayed bottom sheet is OK; others: none | Agreed on **no entry pop-up**. A delayed sheet is acceptable only away from the first screen of the product page. |
| Quiz as an ad destination | instagram: cites Octane; others: test it | Vendor data with self-selection bias. Run it as an ad-level split. |
| Stars | luxury: niche brands show none; trust and mobile-ux: show when real | Show stars once a scent has **5 or more real reviews** (Spiegel [K]). Label a house-wide rating as house-wide. |
| Hero video | mobile-ux: keep, poster first; speed: no video on ad landers | Compatible: a still image on the product page and mystery box page; the home video deferred until after LCP. |

**Repo files referenced:**
- `/home/user/ETERNAL_E-Commerce/lib/catalogue.ts`
- `/home/user/ETERNAL_E-Commerce/lib/client/analytics.ts`
- `/home/user/ETERNAL_E-Commerce/lib/client/attribution.ts`
- `/home/user/ETERNAL_E-Commerce/lib/shopify/client.ts`
- `/home/user/ETERNAL_E-Commerce/app/api/checkout/route.ts`
- `/home/user/ETERNAL_E-Commerce/app/layout.tsx`
- `/home/user/ETERNAL_E-Commerce/app/globals.css`
- `/home/user/ETERNAL_E-Commerce/app/motion.css`
- `/home/user/ETERNAL_E-Commerce/components/motion/MotionScript.tsx`
- `/home/user/ETERNAL_E-Commerce/components/product/BuyBox.tsx`
- `/home/user/ETERNAL_E-Commerce/components/product/Gallery.tsx`
- `/home/user/ETERNAL_E-Commerce/components/cart/CartDrawer.tsx`
- `/home/user/ETERNAL_E-Commerce/components/chrome/WhatsAppFloat.tsx`
- `/home/user/ETERNAL_E-Commerce/content/site.ts`
- `/home/user/ETERNAL_E-Commerce/content/catalogue.snapshot.json`
- `/home/user/ETERNAL_E-Commerce/lib/format.ts`
