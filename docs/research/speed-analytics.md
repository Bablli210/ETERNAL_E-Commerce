# eternal: speed, Core Web Vitals, analytics and experimentation for mobile Instagram-ad traffic

**About the sources.** The WebSearch budget was already used up when this task started, so I ran no web searches. The network proxy also blocked most sites I tried: web.dev, thinkwithgoogle, deloitte, shopify.com, cxl, baymard, facebook, learn.microsoft.com, evanmiller and the httparchive site. I worked around this three ways:
- I read primary sources from where they are mirrored on GitHub: the web.dev source repo, the Next.js docs repo, the Chromium metrics changelog, the HTTP Archive Web Almanac repo, GrowthBook docs, Meta's capi-param-builder and Microsoft Clarity.
- I read shopify.dev through the Shopify docs search tool and Vercel's docs through the Vercel docs tool. That gave about 30 full-page or document reads and 9 docs searches.
- I audited the storefront code in `/home/user/ETERNAL_E-Commerce` (Next.js 16.3.5), so the advice points at real files.

Anything I could not re-read this session is marked **UNVERIFIED**.

---

## 1. Findings: speed and conversion evidence

### 1.1 Evidence table

| Study (year) | What changed | Business result | What it means for eternal |
|---|---|---|---|
| **Deloitte / 55 / Google, "Milliseconds Make Millions"** (data end of 2019, published 2020). 37 European and US brand sites, more than 30M sessions | Modelled effect of a 0.1 s mobile speed gain | **Retail:** product page to add-to-basket **+9.1%**, listing to product page **+3.2%**, spend per order **+9.2%**. **Luxury:** product page to add-to-basket **+40.1%**, the largest of any vertical | eternal sits in the premium/luxury band, where speed mattered most in this study. Every 100 ms on the product page counts. Note: this is a correlational model, not an A/B test |
| **Vodafone Italy** (web.dev, March 2021). A/B test, 50/50 split, about 34K visits per version, traffic from **paid display, search and social** | LCP **31% better**. Widgets rendered on the server, critical HTML rendered on the server, hero image resized, SVG/PNG optimised | **+8% sales**, +15% lead-to-visit, +11% cart-to-visit. DOMContentLoaded got 15% *worse*, yet sales still rose, so LCP is the metric that tracks money | Closest analogue to eternal: paid social traffic, a hero image, and a real A/B test |
| **Renault** (web.dev, 2021). 10M visits, 33 countries | Server-side rendering, code splitting, WebP plus responsive sizes, smaller Google Tag Manager (GTM) container, woff2 fonts with `swap`, **hero image preload** | 1 s faster LCP gave **−14 points of bounce** (when LCP < 1.6 s) and **+13% conversion** near 1 s LCP | The gains keep coming below 2.5 s. Aim for under 2 s on ad landing pages |
| **Swappie** (web.dev, September 2021) | LCP −55%, CLS −91%. Third-party audit, LCP image preloaded, LCP element rendered on the server | **+42% mobile revenue** | Third-party scripts and the hero image are the main levers |
| **Economic Times** (web.dev, December 2021) | LCP 4.5 s to 2.5 s, CLS 0.25 to 0.09 | **Bounce −43%** | — |
| **Lazy-loading the LCP image** (web.dev, 2021/22) | Pages that lazy-load images vs pages that do not | Median p75 LCP **3,546 ms with vs 2,922 ms without**. Disabling it in a lab test improved LCP 13–15% | Never lazy-load the first product image or the hero |
| **Mobify** (2016, cited on web.dev "why speed matters") | Per 100 ms faster | Home page **+1.11%** session conversion, checkout page **+1.55%** | The handoff to checkout matters too (see 2.6) |
| **Google/SOASTA mobile benchmarks** (2017) | Load time 1 s to 3 s | Bounce probability **+32%** (+90% at 5 s). **UNVERIFIED**: I could not fetch thinkwithgoogle this session | Directionally the same as the studies above |

### 1.2 Where the web stands today (HTTP Archive Web Almanac 2024, mobile)
- Only **43%** of mobile sites pass all three Core Web Vitals. 59% have good LCP, 74% good INP, 79% good CLS.
- The LCP element is an image on **73.3%** of mobile pages.
- **16%** of sites still lazy-load the LCP element. **66%** have at least one image with no size set. Only 15% use `fetchpriority=high` on the LCP image.
- The median page loads **22 third parties**. Google domains take five of the top ten, and facebook.com is the only non-Google domain in the top five.
- Shopify themes have kept consistently strong LCP pass rates since 2022. **A headless build does not inherit that.** eternal now owns its own performance.

### 1.3 Targets
Thresholds come from Google's `web-vitals` library. Measure at the **75th percentile, mobile only**.

| Metric | Google "good" | eternal target on ad landing pages (product page, mystery box, home) |
|---|---|---|
| LCP | ≤ 2.5 s (poor > 4.0 s) | **≤ 2.0 s** at p75, Egypt, mobile. Renault's gains continued below 1.6 s |
| INP (replaced FID in March 2024) | ≤ 200 ms (poor > 500 ms) | ≤ 150 ms on add-to-bag, size select, quiz steps and filter chips |
| CLS | ≤ 0.1 (poor > 0.25) | ≤ 0.05. No layout shift when the sticky add-to-bag, cookie banner, toast or shipping meter appears |

### 1.4 Ad quality and landing-page views (**UNVERIFIED**: I could not fetch Meta's documentation)
- Meta counts a **landing page view** only when the Pixel fires after the click. A visitor who leaves before the Pixel loads is a click with no landing page view and no `_fbc` cookie. Slow pages therefore lose optimisation signal as well as sales.
- What this means for eternal:
  - Keep the Pixel at `afterInteractive`, as it is now in `/home/user/ETERNAL_E-Commerce/components/analytics/Analytics.tsx`. **Never move it to `lazyOnload`.** That waits for every resource, including the hero video, and loses landing page views and the `fbclid` capture.
  - Make hydration fast, because `afterInteractive` waits for it.
- Track **landing page views ÷ link clicks** per ad in Ads Manager as a speed KPI and alert when it drops. I could not verify a benchmark ratio.

---

## 2. Mobile performance: what to change in eternal's code

### 2.1 The loading curtain is a deliberate ~0.5 s delay for every ad visitor (highest-value fix)
- **What it does now.** `MotionScript.tsx` sets `data-loading="1"` on the first page of every session. `app/motion.css` then keeps a full-screen Linen `.loader` up for 300 ms plus a 200 ms lift on mobile (600 + 400 ms on desktop). Every Instagram ad visitor is a first-session visitor.
- **Why it is hidden from the metrics.** Chrome's LCP does not account for one element covering another, so field and lab LCP will look fine while users stare at a curtain.
- **Evidence.** Deloitte's luxury figure is for 0.1 s. This curtain costs five times that.
- **Do this.** Skip the curtain when the URL carries `utm_*` or `fbclid`, or on any landing page other than `/`. Better still, remove it on mobile. It is a one-line change in `/home/user/ETERNAL_E-Commerce/components/motion/MotionScript.tsx`.

### 2.2 Product-card images only appear after JavaScript runs
- **What it does now.** `components/product/ProductImage.tsx` renders `<Image className="img-fade">` at `opacity: 0` and only adds `is-loaded` from React's `onLoad`. Since Chrome 86, LCP ignores paints at opacity 0.
- **Effect.** On collection pages, where the first cards are the LCP element on a phone, LCP becomes download time plus **hydration time** plus the fade. Hydration in the Instagram in-app browser on a mid-range Android is the slow part.
- **Do this.** When `priority` (or `preload`) is set, render the image fully visible with no fade class. Keep the fade only for images below the fold.
- The same rule applies to `[data-reveal]` (opacity 0 until an IntersectionObserver fires). Never use it above the fold on the product page or on ad landing pages.

### 2.3 Hero video vs a still on mobile data
- **What it does now (mostly right).**
  - `BackgroundVideo.tsx` renders the poster on the server through `next/image` with priority, so the LCP is the still.
  - The `<video>` mounts only after hydration, and only if motion is allowed and the visitor is not on Save-Data or 2G.
  - The mobile clip is **284 KB WebM / 860 KB MP4**, with `preload="auto"`.
- **Rules from the sources.**
  - Since Chrome 116 a video's first frame can be an LCP candidate. Keep the poster pixel-identical to the first frame and in the same box (already done), so the video never becomes a later, larger LCP entry.
  - Next.js docs: use `muted` + `playsInline` + `poster` with `preload="none"`, and set dimensions or an aspect ratio.
- **Do this.**
  1. **No video above the fold on ad landing pages (product page, mystery box).** Use the still and spend the bytes on the gallery image.
  2. On home, start the clip only after LCP and idle: mount after `load` or `requestIdleCallback`, with `preload="none"` until then. Also skip it on `effectiveType === "3g"`.
  3. Re-encode the mobile MP4 to ≤ 400 KB. Safari/WebKit will usually take the MP4, which is three times the WebM. **UNVERIFIED** which source Instagram's iOS webview picks.
  4. Do not A/B test video vs still at this traffic level. Ship still-first on ad landing pages.

### 2.4 Images
- **Formats.** `/home/user/ETERNAL_E-Commerce/next.config.ts` has no `formats`, so only WebP is served.
  - Add `images.formats: ['image/avif','image/webp']`. The web.dev 2023 AVIF post cites imgix: AVIF about **35% smaller than WebP**.
  - Next.js docs: AVIF is about 20% smaller and about 50% slower to encode the first time, then cached. That is fine for 43 SKUs.
  - Also set a long `minimumCacheTTL` and a trimmed `deviceSizes` list (for example 390, 640, 828, 1080, 1200, 1920) so there are fewer variants to encode cold.
- **Next 16 deprecated `priority` in favour of `preload`.** The code uses `priority` in Figure, Film, BackgroundVideo, Gallery, ProductCard and the tales hero.
  - Migrate, and put `preload` on **one** LCP image per page. web.dev: use `fetchpriority=high` on only one or two elements.
  - `CollectionGrid.tsx` sets priority on the first **4** cards. Make that 2 (the first row on a phone) and use `loading="eager"` for cards 3–4.
- **Source files.** `/public/images` holds 95 MB of JPGs, several around 1.7 MB each. Visitors get re-encoded versions, but the first request after each deploy pays the encode cost. Pre-shrink sources to ≤ 2560 px and about 300–500 KB.
- `sizes` is already correct on the gallery (`(min-width:1024px) 55vw, 100vw`) and the hero (`100vw`).

### 2.5 Fonts
- `next/font` self-hosts the files and preloads them by default. It uses `display: swap` and a size-adjusted fallback (`adjustFontFallback`), so it does not cause layout shift.
- **What it loads now.** `app/layout.tsx` loads Cormorant Garamond in 3 weights × 2 styles plus Instrument Sans in 3 weights. That is up to 9 font files competing with the LCP image.
- **Do this.**
  - Drop any weight or italic the design does not use.
  - Use variable axes where available. **UNVERIFIED** whether both families are variable on Google Fonts.
  - Set `preload: false` on everything except the face used for the hero H1 and buy-box text.
  - web.dev: WOFF2 only, subset to Latin (already done). `font-display: optional` is the fastest choice if the brand can accept a fallback on a cold first view.

### 2.6 Third-party scripts
- **Why they cost.** web.dev: third parties add DNS, connection and redirect round trips. A/B-testing scripts delay content "even when asynchronous". Avoid duplicate tools such as two tag managers or two analytics stacks.
- **Rules for eternal.**
  - Pick **one** tag path: direct `gtag` plus Pixel (current) **or** GTM, never both.
  - Pixel and GA4 at `afterInteractive`. Clarity, and any reviews or chat, at **`lazyOnload`**.
  - The **WhatsApp float is a plain `wa.me` link with zero third-party JS.** Keep it that way and do not install a chat SDK. tawk.to is the web's top "customer success" third party.
  - Reviews: render them on the server from Shopify metafields or a reviews API, not a widget script.
  - No client-side A/B tool with an anti-flicker snippet.
  - The `worker`/Partytown strategy **does not work with the App Router**, per the Next.js Script docs.
- **Budget.** A rule of thumb (mine, not from a source): at most about 100 KB compressed of third-party JS on ad landing pages. Fail the build if it grows.

### 2.7 Next.js-specific techniques
- **Rendering is already good.** Pages use ISR (`revalidate = 300`), so HTML comes from the CDN.
- **Function region.** Pin the region for `/api/checkout` and any dynamic render to **`fra1`** in `vercel.json`. Frankfurt is far closer to Cairo than a US-East default. **UNVERIFIED** what this project's current default is.
- **Checkout handoff is 2 hops today.** The browser calls `/api/checkout`, that calls Shopify's `cartCreate`, then the browser redirects (`CartProvider.tsx`).
  - Create the Shopify cart on **first add-to-bag** and keep it in sync (`cartLinesAdd` / `cartLinesUpdate`). Then the Checkout button is a plain link to a `checkoutUrl` that already exists.
  - Call `ReactDOM.preconnect(checkoutOrigin)` when the cart drawer opens. React docs: this helps only for cross-origin hosts, and the checkout domain is one.
- **Partial prerendering (`cacheComponents` in Next 16).** A static shell plus streamed `<Suspense>` holes. Use it when per-request content arrives: a geo-based shipping threshold, a logged-in state, a server-side cart count. It is not urgent while the pages are pure ISR.
- **Measure real users.** Use the `web-vitals` attribution build or `useReportWebVitals`, sending to GA4 with the `delta` value. Add Vercel Speed Insights for p75 by route and country.

### 2.8 INP and CLS hot spots to watch
- **INP.** Cart drawer open, quiz step transitions, filter chips re-rendering 43 cards (wrap the update in `startTransition`), gallery swipe, size select.
- **CLS.** The sticky add-to-bag must overlay (`position: fixed`) and never push content. Same for the toast and any cookie banner. The free-shipping meter must reserve its height before data arrives.

---

## 3. Measurement

### 3.1 Event taxonomy
The code already has a central `track()` in `/home/user/ETERNAL_E-Commerce/lib/client/analytics.ts`, sending to the data layer, GA4 and the Pixel with an `eventID`. The table shows what exists and what to add.

| Funnel step | GA4 event | Meta event | Where | Key parameters | Status |
|---|---|---|---|---|---|
| Landing | page_view | PageView | all pages | page_type, line, in_app_browser (`instagram`/`facebook`/`none` from the user agent) | exists; **add the dimensions** |
| List seen | view_item_list | — | collections, bestsellers, quiz results | item_list_name | exists |
| Card tap | **select_item** | — | product card | item_list_name, index | **add** |
| Product view | view_item | ViewContent | product page | items, value, `inspired_by: yes/no` | exists |
| Add | add_to_cart | AddToCart | buy box, sticky bar, pairings, quiz, mystery box | **`source`**: pdp / sticky / pairing / quiz / mystery_box / drawer; **`size`**: 55ml / 5ml | exists; **add source and size** |
| Sample attach | **sample_attach** | trackCustom SampleAttach | 5 ml variant add; "choose your 2 free samples" | sample_type (paid_5ml / free_pick / mystery_box), scent ids | **add** |
| Cart | view_cart, remove_from_cart | ViewCart (custom) | drawer | — | exists |
| Checkout click | begin_checkout | InitiateCheckout | drawer button | items, value | exists. **Double-counting risk:** Shopify's Facebook & Instagram and Google & YouTube channels probably fire their own checkout-start events on the hosted checkout (**UNVERIFIED**). Check in Meta Events Manager → Test Events and GA4 DebugView. If they do, rename the site-side event to `checkout_click` |
| Checkout steps | add_shipping_info, add_payment_info | AddPaymentInfo | Shopify checkout | payment_type (card / Meeza / COD / InstaPay) | through Shopify's channels or a Custom Pixel (`checkout_started`, `checkout_completed`) |
| Order | purchase | Purchase | Shopify checkout | transaction_id (GA4 de-duplicates on it), value, cod_fee | through Shopify's channels; never also fired from the storefront |
| Quiz | finder_start, **finder_step** (q_index, answer), finder_complete, **finder_result_click** | FinderStart / FinderComplete | /finder | answers, matches | start and complete exist; **add step and result_click** for per-question drop-off |
| Content engagement | **notes_open, inspired_by_open, faq_open (question id), gallery_swipe** | — | product page | — | **add** |
| Help | generate_lead (method: whatsapp) | Lead | WhatsApp float | page_type | exists |
| Errors | **checkout_error**, **oos_view** | — | drawer, product page | message | **add**. The error state exists but is not tracked |
| Speed | **LCP / INP / CLS** | — | all pages | value, delta, metric_id, page_type, in_app_browser | **add** |

### 3.2 GA4, Meta Pixel and Conversions API with Shopify's hosted checkout (headless)
1. **Put checkout on the same root domain** (for example `checkout.<domain>`). Shopify's docs say checkout must sit "within the same root domain as the storefront so that it can read cookies set on the storefront domain". Their example: storefront on `hydrogen.shop` with checkout on `example.com` does not work. The same logic carries `_fbp`/`_fbc`/`_ga` from the ad landing page to the Purchase event. Meta's Parameter Builder also sets cookies on the root domain (eTLD+1). Check it by clearing cookies, landing with `?fbclid=test`, then confirming `_fbc` and `_ga` have the same values on checkout.
2. **Purchase is the event Meta optimises on.** Let Shopify's Facebook & Instagram app (data sharing set to "Maximum", which is Pixel plus Conversions API) and the Google & YouTube app own the checkout and purchase events. Meta de-duplicates browser and server events on matching `event_name` + `event_id` (**UNVERIFIED** wording, as Meta's docs were blocked).
3. **Conversions API for storefront events.** Add a route handler such as `/api/meta` that re-sends ViewContent and AddToCart server-side with the **same `eventID`** the browser already generates. Send `fbp`, `fbc`, IP, user agent and `event_source_url`. Meta's `capi-param-builder` Node SDK builds `fbc` from `fbclid` and picks the cookie domain. This matters less than Purchase, so do it after items 1–2.
4. **Pass more through cart attributes.** `lib/client/attribution.ts` already sends UTMs, `fbclid` and `landing_page` to checkout, which is good. Add `_fbp`, `_fbc`, the GA client id (from `_ga`), `in_app`, `quiz_profile` and **`exp_<id>=<arm>`** to the `ATTRIBUTE_KEYS` allow-list in `/home/user/ETERNAL_E-Commerce/app/api/checkout/route.ts`. Every order then carries its campaign and experiment arm, which gives order-level ground truth.
5. **Shopify Analytics will be blind without a cookie migration.** Shopify deprecated `_shopify_y`/`_shopify_s` on **30 April 2026**. Custom headless builds need a Storefront API proxy on the storefront domain, plus `hydrogen-react`'s `useShopifyCookies({fetchTrackingValues: true})` and `sendShopifyAnalytics`. The repo has none of this. Without it, Shopify's own sessions and conversion reports will not see the storefront.
6. **Consent.** If a banner is needed, use the Customer Privacy API with `headlessStorefront: true`, `checkoutRootDomain` and `storefrontRootDomain`. **UNVERIFIED** what Egypt's Personal Data Protection Law (No. 151/2020) requires for cookies.
7. **Cash on delivery inflates ROAS.** Purchase fires when the order is placed, but refused deliveries never pay. Report **delivered revenue ÷ spend** weekly from Shopify fulfilment and financial status. Consider feeding refusals back to Meta. **UNVERIFIED**: Egypt's COD share and refusal rates (no source fetched).
8. **Instagram in-app browser** (**UNVERIFIED** details). Its cookies and localStorage live inside the app's webview. A visitor who reopens the link in Safari or Chrome loses the bag and the attribution. Keep the cart server-side (Shopify cart id, item 2.7), offer "send my bag to WhatsApp" with the cart link, and never force "open in browser".

### 3.3 Dashboards and session recording
- **GA4 funnel exploration.** Ad session → view_item → add_to_cart → begin_checkout → purchase. Break it down by `utm_content` (creative), landing `page_type`, `line`, `in_app_browser` and device. Build a second funnel for the quiz: finder_start → each finder_step → finder_complete → add_to_cart with source=quiz.
- **Weekly owner sheet** (Looker Studio or Shopify):
  - spend, landing page views ÷ clicks, sessions
  - add-to-cart rate, checkout rate, orders, conversion rate, average order value
  - **sample attach rate**
  - **5 ml / mystery box → full bottle within 30/60 days** (cohort)
  - COD share, delivered rate, delivered ROAS
- **Speed dashboard.** Vercel Speed Insights (p75 by route and country) plus GA4 web-vitals events split by `in_app_browser`.
- **Session recording: Microsoft Clarity.**
  - It is open source and masks sensitive data before upload (per its GitHub README). Its free tier and traffic limits are **UNVERIFIED**; Hotjar's free plan caps sessions (**UNVERIFIED**).
  - Load it at `lazyOnload`.
  - Each week, watch about 20 recordings of ad sessions that left from the product page, plus quiz drop-offs.
  - Look for rage or dead taps on the notes pyramid, size selector, sticky add-to-bag and "inspired by".
  - It will not record Shopify's hosted checkout (**UNVERIFIED**), so checkout is visible only through events.

---

## 4. A/B testing at low traffic

### 4.1 Sample-size math
Computed with a standard two-proportion test: two-sided α = 0.05, **80% power** (GrowthBook's default). Figures are **sessions per arm**.

| Baseline rate | +10% relative | +20% | +30% | +50% |
|---|---|---|---|---|
| 1.0% (purchase) | 163,095 | 42,693 | 19,827 | 7,750 |
| 1.5% (purchase) | 108,153 | 28,304 | 13,141 | 5,134 |
| 2.0% (purchase) | 80,682 | 21,109 | 9,798 | 3,826 |
| 6% (add to cart) | 25,740 | 6,719 | 3,112 | 1,209 |
| 30% (quiz completion, or product page → add to cart among engaged) | 3,763 | 963 | 437 | 163 |

### 4.2 What "six figures" means in traffic
These use assumptions, not sourced data: average order value about EGP 1,300 and 1.5% conversion.
- **EGP 100,000 a month** is about 77 orders, or about 5,100 sessions. A purchase-level test at +20% would take **about 11 months**, so it is impossible. An add-to-cart test at +30% (about 6,200 sessions) takes about 5 weeks.
- **USD 100,000 a month** is roughly 3,700+ orders, or about 250,000 sessions (exchange rate of about 48–50 EGP per USD is **UNVERIFIED**). A purchase test at +20% fits in about 1–2 weeks.

### 4.3 Operating rules
1. **Under about 20K sessions a month: ship best practice, do not A/B test purchases.**
   - Speed fixes, clear price and size, delivery times and the returns line, tap targets and removing the curtain need no test. Watch before/after with guardrails.
   - Learn from Clarity, WhatsApp questions and a one-question post-purchase survey ("What almost stopped you?").
   - Test only big swings (≥ 30%) on micro-conversions: add-to-cart, quiz completion.
2. **Let Meta randomise.** Pair ad and landing page (offer A to page A, offer B to page B) and use Meta's A/B test tool, which splits the audience. Meta's spend creates the sample, and the outcome is real Purchases. **UNVERIFIED** specifics of Meta's tool.
3. **At about 20K–100K sessions a month,** run on-site tests on add-to-cart rate. From about 250K a month, test on purchases.
4. **Hygiene.**
   - Fix the metric and sample size in advance.
   - Run whole weeks (Egypt's weekend is Friday–Saturday).
   - Do not peek, or use sequential testing (GrowthBook: peeking inflates false positives above 5%).
   - Run an A/A test first.
   - Stamp `exp_<id>=<arm>` into cart attributes.
   - Assign variants **on the server or edge** (Vercel Flags SDK `precompute`, which serves a static page per variant with no flicker). Never use a client-side tool with an anti-flicker snippet.

### 4.4 Test order
1. **Offer:** "2 free 5 ml samples with every order" vs "free shipping over X", run as Meta ad and landing pairs.
2. **Product-page buy box:** a sample-first "Try 5 ml, credited back on a bottle" button next to the 55 ml button vs bottle-only. Measure add-to-cart and orders.
3. **Cold-traffic destination:** product page vs quiz vs mystery box page, as an ad-level split.
4. **Do not test** hero video vs still, speed or curtain removal. Just ship them.

---

## 5. Recommendations ranked by expected impact

1. **Checkout on `checkout.<root domain>` plus Shopify's Facebook & Instagram app (Maximum data sharing) and Google & YouTube app owning checkout and purchase events. Remove duplicate InitiateCheckout / begin_checkout.** *Checkout domain and channel settings; `lib/client/analytics.ts`.* Meta optimises on Purchase, and broken attribution wastes every ad pound.
2. **Remove the first-visit curtain for ad landings and on mobile.** *`components/motion/MotionScript.tsx`, `app/motion.css`.* About 0.5 s saved for 100% of ad visitors.
3. **Make above-the-fold images independent of hydration.** No `img-fade` on preloaded images; no `data-reveal` above the fold. *`components/product/ProductImage.tsx`, `CollectionGrid.tsx`.*
4. **Still-first hero on ad landing pages.** Defer the home video until after LCP and idle with `preload="none"`, and re-encode the MP4 to ≤ 400 KB. *`components/home/Sections.tsx`, `BackgroundVideo.tsx`.*
5. **Faster checkout handoff.** Shopify cart created on first add, `preconnect` to checkout when the drawer opens, functions in `fra1`. *`CartProvider.tsx`, `app/api/checkout/route.ts`, `vercel.json`.*
6. **AVIF, `priority` → `preload` (one per page), trimmed fonts.** *`next.config.ts`, `app/layout.tsx`, Figure, Film, Gallery.*
7. **Shopify analytics cookie migration** (Storefront API proxy plus `hydrogen-react`). Otherwise Shopify's own reports stop seeing the storefront.
8. **Complete the event taxonomy:** `source` and `size` on add_to_cart, sample_attach, select_item, finder_step and result_click, errors, web-vitals RUM, `in_app_browser` dimension, experiment arms and `_fbp`/`_fbc`/`ga_cid` in cart attributes.
9. **Conversions API for ViewContent and AddToCart** with a shared `eventID` and `capi-param-builder`.
10. **Delivered-ROAS reporting** for COD orders.
11. **Clarity at `lazyOnload`** and a weekly review of 20 recordings.
12. **Third-party governance:** one tag path, no chat SDK, server-rendered reviews, a JS budget in CI.
13. **Experiment programme** run by traffic tier (section 4).

---

## 6. Checklist

**Before launch**
- [ ] Checkout domain = `checkout.<root>`. `_fbc`, `_fbp` and `_ga` have the same values on storefront and checkout (test with `?fbclid=test`).
- [ ] Shopify Facebook & Instagram app at Maximum data sharing; Google & YouTube app connected; purchase fires once in Meta Test Events and GA4 DebugView.
- [ ] Site-side InitiateCheckout / begin_checkout not duplicated by Shopify's checkout events.
- [ ] Curtain off for `utm_*` / `fbclid` landings and on mobile.
- [ ] No `img-fade` or `data-reveal` above the fold. Exactly one `preload` image per page. First-row product cards eager.
- [ ] `images.formats` includes AVIF; long `minimumCacheTTL`; trimmed `deviceSizes`; source JPGs ≤ 2560 px.
- [ ] Hero: product page and mystery box use a still. Home video deferred until after LCP and idle, `preload="none"`, mobile MP4 ≤ 400 KB.
- [ ] Fonts: unused weights and italics removed; only the hero and buy-box faces preloaded.
- [ ] Shopify cart created on first add; Checkout is a direct `checkoutUrl` link; `preconnect` to checkout when the drawer opens; functions in `fra1`.
- [ ] Pixel and GA4 `afterInteractive`; Clarity and any widgets `lazyOnload`; WhatsApp stays a plain link.
- [ ] Web-vitals attribution events into GA4; Vercel Speed Insights on.
- [ ] Lighthouse mobile on product page, collection and home, plus a real mid-range Android test inside the Instagram app on a throttled 4G connection: LCP ≤ 2.0 s, CLS ≤ 0.05.

**First 30 days**
- [ ] Event additions: `source`/`size` on add-to-cart, sample_attach, select_item, finder_step / result_click, checkout_error, in_app_browser dimension.
- [ ] Cart attributes: `_fbp`, `_fbc`, `ga_cid`, `in_app`, `quiz_profile`, `exp_*`.
- [ ] Shopify cookie migration (Storefront API proxy plus `useShopifyCookies`).
- [ ] GA4 funnels (ad → order, quiz) and the weekly owner sheet including delivered ROAS and sample-to-bottle cohorts.
- [ ] Clarity review routine; one-question post-purchase survey.
- [ ] Conversions API for ViewContent and AddToCart with a shared `eventID`.

**Ongoing**
- [ ] Weekly: p75 LCP / INP / CLS by page type and in-app browser; landing page views ÷ clicks per ad.
- [ ] Every new script needs a written owner and purpose, `lazyOnload` unless it is critical, and must fit the JS budget.
- [ ] Testing by traffic tier (section 4): Meta ad/landing splits first, then on-site add-to-cart tests, then purchase tests from about 250K sessions a month.

---

## Sources (read this session)
Pages marked "via GitHub" were read from their source repo because the live site was blocked.

- Vodafone case study: https://web.dev/case-studies/vodafone (via GitHub: https://raw.githubusercontent.com/GoogleChrome/web.dev/main/src/site/content/en/blog/vodafone/index.md)
- Renault: https://web.dev/case-studies/renault (via GitHub)
- Swappie: https://web.dev/case-studies/swappie (via GitHub)
- Economic Times: https://web.dev/case-studies/economic-times-cwv (via GitHub)
- Core Web Vitals business-impact roundup: https://web.dev/case-studies/vitals-business-impact (via GitHub)
- Milliseconds Make Millions summary: https://raw.githubusercontent.com/GoogleChrome/web.dev/main/src/site/content/en/blog/milliseconds-make-millions/index.md
- Optimize LCP: https://web.dev/articles/optimize-lcp (via GitHub)
- Lazy-loading the LCP image: https://web.dev/articles/lcp-lazy-loading (via GitHub)
- Font best practices: https://web.dev/articles/font-best-practices (via GitHub)
- Third-party JavaScript: https://web.dev/articles/third-party-javascript (via GitHub)
- AVIF updates 2023: https://web.dev/blog/avif-updates-2023 (via GitHub)
- Web Vitals: https://web.dev/articles/vitals (via GitHub)
- Why speed matters: https://web.dev/learn/performance/why-speed-matters (via GitHub)
- web-vitals library and thresholds: https://github.com/GoogleChrome/web-vitals
- Chromium LCP changelog: https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/lcp.md and `2023_08_lcp.md` (via the GitHub mirror)
- Web Almanac 2024: https://almanac.httparchive.org/en/2024/performance, /third-parties, /ecommerce (via GitHub: HTTPArchive/almanac.httparchive.org)
- Next.js docs (via GitHub, vercel/next.js): https://nextjs.org/docs/app/api-reference/components/image, /components/script, /components/font, https://nextjs.org/docs/app/guides/third-party-libraries, /guides/videos, /guides/analytics
- React `preconnect`: https://react.dev/reference/react-dom/preconnect (via GitHub)
- Vercel: https://vercel.com/docs/partial-prerendering, https://vercel.com/docs/flags/flags-sdk-reference, https://vercel.com/docs/flags/vercel-flags/cli/run-ab-test, https://vercel.com/docs/speed-insights, https://vercel.com/docs/functions/configuring-functions/region
- Shopify:
  - https://shopify.dev/docs/api/customer-privacy
  - https://shopify.dev/docs/storefronts/headless/hydrogen/analytics/validation
  - https://shopify.dev/docs/storefronts/headless/hydrogen/migrate/cookies-custom-setup
  - https://shopify.dev/docs/storefronts/headless/hydrogen/analytics/consent
  - https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage
  - https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed
  - https://shopify.dev/docs/storefronts/headless/developer-preview
- Meta Conversions API Parameter Builder: https://github.com/facebookincubator/capi-param-builder
- GrowthBook: https://docs.growthbook.io/statistics/power and https://docs.growthbook.io/statistics/sequential (via GitHub)
- Microsoft Clarity: https://github.com/microsoft/clarity

**Cited but UNVERIFIED this session (not re-read):**
- Think with Google / SOASTA 2017: https://www.thinkwithgoogle.com/marketing-strategies/app-and-mobile/page-load-time-statistics/
- Meta deduplication and landing page views: https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events
- GA4 ecommerce docs: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
- Clarity and Hotjar pricing
- Instagram in-app browser storage behaviour
- Egypt COD share and refusal rates
- Egypt PDPL cookie rules
- EGP/USD exchange rate
- This project's current Vercel default region
