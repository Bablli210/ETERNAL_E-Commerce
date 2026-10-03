# Mobile ecommerce UX research for eternal: product page and the path to purchase on a phone

## How this was researched, and how far to trust each number

- I ran about 40 web searches. I did 7 full-page reads of primary sources: Apple HIG Accessibility, Tab bars and Typography (the JSON sources), the Android Developers accessibility guide, Lighthouse PR #4550, the Lighthouse `tap-targets.js` source, and Rick Strahl's 2023 write-up on iOS input zoom.
- **Limitation:** the sandbox's network proxy blocked full-page fetches from baymard.com, nngroup.com, web.dev, smashingmagazine.com, w3.org, thinkwithgoogle.com, shopify.com, cxl.com, growthrock.co and others. So the Baymard, NN/g, Google and GrowthRock figures below come from search-engine extracts of those pages, not from my own read of them. Each claim carries a tag:
  - **[B-title]**: the number is in the Baymard article's own headline. High confidence.
  - **[B-extract]**: Baymard number taken from the search extract of the baymard.com page. Medium-high confidence; spot-check before quoting it publicly.
  - **[Read]**: I read the primary source in full.
  - **[2nd]**: a third party attributes this to Baymard, or it is a vendor claim. Treat as **UNVERIFIED**.
- I also read the current storefront code: `components/product/*`, `components/home/*`, `components/chrome/*` and `app/globals.css`. The "eternal today" notes refer to those files.

---

## 1. Findings

### 1.1 The landing moment: speed and Instagram's in-app browser

**Evidence**
- Google (2016): 53% of mobile visits are abandoned when a page takes more than 3 s to load. Going from 1 s to 3 s raises bounce probability by 32%. [extract, Marketing Dive / Google]
- Deloitte and Google, "Milliseconds Make Millions" (2020): 37 brands, about 30M sessions. A 0.1 s faster mobile site went with +8.4% retail conversion and +9.2% AOV, plus +9.1% PDP → add-to-basket progression. [extract, web.dev case study]
- Meta counts a "landing page view" only when the page actually loads after the click. Meta claims Instant Experience loads "up to 15x faster" than a mobile site. [2nd, UNVERIFIED]
- On iOS, Instagram opens links in a WKWebView. It starts with no cookies or saved logins, autofill is limited, and Apple Pay may not appear. [2nd; the Apple Pay behaviour is **UNVERIFIED**, test it on a real device]
- The claim that "about 40% of social clicks are lost" is a vendor claim. **UNVERIFIED.**

**eternal today**
- `MotionScript.tsx` + `Loader.tsx` show the brand curtain (about 500 ms on mobile) on the first page of every session.
- An Instagram ad click opens a fresh in-app browser session, so effectively every paid visitor waits for the curtain.

**What eternal should do**
- Skip the loader whenever the URL has `fbclid` or `utm_source`, or the route is `/products/*` or `/shop/*`. Keep it only for organic home visits.
- Set an LCP budget of ≤ 2.5 s on a mid-range Android over 4G for PDP and collection pages.
- Check the hero `BackgroundVideo` (`preload="auto"`). On mobile, use `preload="metadata"`, let the poster be the LCP element, and start the video after `load`. The poster-first approach is already in place, which is good.
- QA every release inside the Instagram app on iOS and Android, not only in Safari or Chrome.

### 1.2 Product image gallery

**Evidence**
- 56% of users' first action on a product page is to explore the images. [B-extract]
- 76% of mobile sites don't use thumbnails for additional images. [B-title] Dots only tell you how many images there are; thumbnails show what they are.
- A large US retailer saw a 1% conversion increase after replacing dots with thumbnails. [B-extract]
- If the thumbnail row is truncated, show a "truncation thumbnail" (for example "+3"). Otherwise users assume the visible set is all there is. [B-title, "Always Signpost Hidden Thumbnails"]
- 40% of mobile sites don't support pinch or double-tap on product images. [B-title] 25% lack enough resolution or zoom. [B-extract]
- 42% of users try to judge product size from the images. 28% of sites have no "in-scale" image [B-extract]; a 2026 figure of 37% is [2nd].
- Baymard lists 7 image types (cut-out plus 6 others), all of which help evaluation. 67% of product pages don't offer social media images. [B-extract]
- Video: 41% of test users watched product videos. 35% of sites embed video where users can't find it; the fix is to put it inside the gallery. [B-title / B-extract]

**eternal today**
- `Gallery.tsx` shows at most 4 frames.
- Mobile shows an 86vw, 4:5 swipe row with decorative bar "dots" (`aria-hidden`, not tappable).
- There is no tap-to-zoom and no thumbnails.

**What eternal should do (PDP `Gallery.tsx`)**
1. Add a tappable thumbnail strip under the main image: 56–64 px squares with an 8 px gap. Keep swipe on the main image. If there are more than 5 frames, show 5 thumbnails plus a "+N" tile.
2. Aim for 6–8 frames per scent, in this order:
   1. Bottle on its colour world (the cut-out).
   2. A 6–10 s loop of the spray or the "salt, stone, golden hour" scene, placed inside the gallery.
   3. The bottle in a hand (in-scale shot).
   4. The 55 ml bottle next to the 5 ml sample. This shows scale and also advertises the sample.
   5. A flat-lay of the notes.
   6. The box and packaging.
   7. A lifestyle frame.
   8. Later, real customer UGC from Instagram, with permission.
   - Never show the original designer's bottle or packaging.
3. Tapping an image opens a full-screen viewer with pinch and double-tap zoom. Serve source images at least 2048 px on the long side through `next/image`.

### 1.3 Above the fold: title, price, rating, CTA

**Evidence**
- 62% of mobile sites have "mediocre or worse" product page UX. [B-extract, 2026 benchmark]
- A common recommendation is to fit title, price, rating, key selector, CTA and a one-line delivery promise into the first viewport. Third parties attribute this to Baymard. **[2nd, UNVERIFIED as a Baymard guideline]**, but it matches the Baymard findings above.
- The Instagram in-app browser has its own top and bottom chrome, so the usable viewport on an iPhone is shorter than in Safari. **UNVERIFIED: measure it.**

**eternal today (375 px wide)**
- On a 375 px-wide phone, the page stacks: breadcrumb, then a 4:5 image about 400 px tall, then eyebrow, H1, signature and price. The price lands at or below the first fold.
- "Add to bag" is well below the fold.
- The sticky bar only appears after the main button has scrolled *above* the viewport (`top < 0`), so a visitor who lands from an ad sees neither CTA.

**What eternal should do (`app/products/[handle]/page.tsx`, `BuyBox.tsx`)**
- On mobile:
  - Hide the breadcrumb, or replace it with a single "← eterna · for her" link.
  - Cap the gallery height to about 55–60% of the viewport, using a 1:1 or 4:5 crop at about 78vw.
  - Put a compact row straight under the image: name, "Inspired by X", price, and the size toggle.
- Show the sticky buy bar from page load until the main button comes into view, and again after it leaves. That means `setSticky(!e.isIntersecting)` with no direction check.

### 1.4 Sticky add-to-cart bar

**Evidence**
- Baymard's tests found a sticky product summary plus buy button helpful on long product pages. [B-extract, "Responsive Upscaling"]
- "Use whitespace around it and avoid a full-width button" is attributed to Baymard. [2nd, UNVERIFIED]
- GrowthRock A/B test, supplement client:
  - Mobile drawer-style sticky button: +5.2% orders (98% significance) and +11.8% add-to-cart clicks.
  - Desktop: +7.9% orders (99% significance).
  - A plain "scroll back to the button" version showed no significant lift, so the design of the bar matters. [extract of growthrock.co]
- Vendor claims of "+5–15%" or "+8–15%". **UNVERIFIED.**

**eternal today**
- The bar is 68 px tall with a 44 px `btn-sm` and no safe-area padding.
- The WhatsApp float sits at `bottom-24` on the right.

**What eternal should do**
- Bar height about 64 px plus `env(safe-area-inset-bottom)`. Add `viewport-fit=cover` to the `viewport` export in `app/layout.tsx`.
- Make the button at least 48 px tall and label it with the price ("Add to bag · EGP 1,250").
- Include a compact 55 ml / 5 ml toggle so the variant choice can't be missed.
- Hide the bar while the cart drawer or the keyboard is open.
- Keep the WhatsApp float above the bar and 48 px square.

### 1.5 Variant and size selectors

**Evidence**
- Use buttons, not dropdowns, for size selection; in testing, dropdown size selectors were often overlooked. [B-title: "28% of desktop sites don't"]
- A 7 mm × 7 mm minimum hit area and 2 mm spacing for swatches. [2nd]
- "Buttons lift add-to-cart by 15–20%". **UNVERIFIED** vendor claim.

**eternal today:** two radio tiles, 60 px tall. This is correct.

**What eternal should do**
- Keep the tiles, labelled "55 ml bottle · EGP X" and "5 ml sample · EGP Y · credited back on a bottle [confirm]". Default to the bottle.
- Once the sample variant exists, put this exact toggle in the sticky bar too.
- Rename the "Add the sample too" checkbox as a try-first option once its terms are confirmed. Its rules are still marked `[confirm]` and should stay marked until then.

### 1.6 Long content: truncation, accordions vs tabs, subpages

**Evidence**
- Horizontal tabs: 27% of users missed content, against 8% with vertically collapsed sections. 28–29% of sites still use tabs. [B-title / B-extract]
- 26% of mobile sites put some product page content on subpages, which users overlook entirely. Baymard's alternative: expanded sections on short pages, collapsed sections on long ones. [B-extract]
- Truncation must be clearly signposted. [B-extract]
- 70% of sites get FAQ and community Q&A wrong. [B-title]

**eternal today:** the `.acc` accordion uses a 60 px summary row, which is good. Sections run notes, tale, wear-it, FAQ.

**What eternal should do (PDP section order on mobile)**
1. Buy box and promise block (see 1.7).
2. "How it differs from the original": the honest note, expanded. This is the main reason to buy.
3. Notes pyramid, expanded because it is visual.
4. "Wear it": season, time of day, longevity.
5. Tale excerpt, truncated to about 4 lines with a fade and an explicit "Read the full tale" link.
6. FAQ accordion, collapsed: longevity, originals, COD, returns.

No tabs, and no subpages for core content.

### 1.7 Shipping, returns and payment info near the CTA

**Evidence**
- 64% of users looked for shipping information on product pages, yet 43% of sites don't show estimated shipping costs there. [B-title: "Show Estimated Shipping Costs (43% Don't)"]
- 44% don't show or link the returns policy on the product page. [2nd]
- 37% give a shipping speed instead of a delivery date. [B-extract, checkout]

**eternal today:** a 12 px grey row of icons under the CTA: cash on delivery, delivery time, returns, WhatsApp.

**What eternal should do (in `BuyBox.tsx`, and repeated in the cart drawer)**
Turn the row into a 3–4 line promise block at 13–14 px in the text colour, not grey:
- "Arrives in X–Y days · Cairo & Giza next day [confirm]". Switch to "Arrives Tue 7 Oct" once cut-off rules are known.
- "Free delivery over EGP ___ [confirm]".
- "2 free 5 ml samples in every order [confirm]".
- "Pay by card, Meeza or cash on delivery (+EGP ___ fee) [confirm]".
- A returns line linking to the policy.

All of these are high-impact once confirmed. Until then, keep each one marked.

### 1.8 Ratings and reviews (within the brand's honesty rules)

**Evidence**
- 95% of users rely on reviews. 43% of sites lack a ratings distribution summary, and 39% of those that have one don't make it clickable. [B-extract]
- Always show the number of ratings in product list items. [B-title]

**What eternal should do**
- Collect real reviews from the first order: a post-delivery WhatsApp or email ask, with photo reviews encouraged, through a Shopify reviews app.
- Show stars under the title and on cards only once a scent has enough real reviews; the owner sets the threshold. Always show the count, as in "4.7 · 23 reviews".
- Until then, show no stars at all, and certainly not placeholder stars.
- The live low-stock line (`lowStock`, from real inventory) is acceptable only while it stays tied to live data.

### 1.9 Tap targets, type, thumb zone

**Evidence**
- Apple HIG: default control size 44×44 pt (minimum 28×28). Padding of about 12 pt around controls with a visible border, about 24 pt around those without. iOS text defaults to 17 pt, minimum 11 pt. Dynamic Type at Large: Body 17, Callout 16, Subheadline 15, Footnote 13, Caption 12/11. [Read]
- Android: minimum touch target 48×48 dp. [Read]
- Lighthouse's tap-target audit used `FINGER_SIZE_PX = 48`: "large enough (48x48px), and have enough space around them". [Read]
- Lighthouse font audit: more than 60% of text should be at least 12 px (relaxed from 16 px / 75% in PR #4550). [Read]
- iOS Safari zooms into any input whose rendered text is under 16 px. The fix is 16 px inputs; `maximum-scale=1` breaks pinch-zoom on Android. [Read]
- WCAG 2.2: 2.5.8 (AA) requires 24×24 CSS px; 2.5.5 (AAA) requires 44×44. (I could not fetch w3.org; the figures come from the WCAG text, cited below.)
- Baymard: minimum hit area 7×7 mm, which is about 44 pt. [B-extract]
- Hoober (2013, 1,333 observations): 49% of people use the phone one-handed, 36% cradle it, 15% use two hands. [extract]

**eternal today**
- Body text 15 px; eyebrow 11 px.
- `.chip` is 36 px tall and `.btn-xs` is 36 px.
- `.field` inputs are 14 px, and the collection search input is 13 px, so iOS zooms on focus.
- The trust row is 12 px.

**What eternal should do (`app/globals.css`)**
- Body text 16 px on mobile; captions at least 12 px.
- All `input`/`select`/`textarea` at least 16 px.
- `.chip`: at least 44 px hit area (36 px visual height plus padding is fine).
- Don't use `.btn-xs` for touch.
- Primary actions in the bottom third of the screen: sticky buy bar, the filter sheet's "Show N scents" button, the cart's checkout button.

### 1.10 Mobile navigation and search

**Evidence**
- NN/g (2016, 179 participants): hiding the main navigation cuts its discoverability almost in half and makes tasks slower and harder. [extract]
- Baymard: an app-style bottom tab bar and a hamburger menu performed "largely the same"; the tab bar's only edge was reaching some features without opening the menu. [B-extract]
- 33% of mobile sites don't make product categories the top-level navigation items. [B-title]
- 35% of mobile sites hide the search field by default; 21% have no submit button next to it; only 19% get autocomplete fully right; 72% of mobile sites lack scope suggestions in autocomplete. [B-extract / B-title]
- Apple HIG: tab bars are for navigation, not actions. Use single-word labels and keep the bar visible. [Read]

**What eternal should do**
- Don't add an app-style tab bar. It would compete with the sticky buy bar and adds little according to Baymard's data.
- Add a visible scrollable chip row under the header on home and shop: Her · Him · Unisex · Samples · Find your scent.
- Mobile menu top level: the three lines, Samples / mystery box, Scent finder, then Tales and House.
- Search is a major path here because shoppers search by the original's name. In `SearchOverlay.tsx` (input already 24 px, good):
  - Show "Popular originals" suggestions before the visitor types.
  - Add scope suggestions ("in eterna").
  - Add a visible submit button.
  - Make every "inspired by" name searchable.
- On `/shop`, show the search field itself, not just an icon.

### 1.11 Collection page layout

**Evidence**
- Load 15–30 products at a time on mobile, then show a "Load more" button. Users complained that pagination felt slow, and infinite scroll can be "downright harmful" on mobile. [B-extract]
- On mobile, put filters in a full-screen or bottom sheet. Commonly recommended alongside: an explicit "Show N results" apply button and a filter button that stays visible while scrolling. [2nd]
- Show applied filters as an overview of removable chips. [B-title]
- Only 50% of sites with visually driven products offer quick views. [B-extract]
- 64% of sites get at least one list-item design principle wrong (consistent attributes, scannable layout). [B-title]
- Two columns are the norm for visually driven products under 768 px. [2nd]

**eternal today**
- 2-column grid, which is good.
- `pageSize = 12` with "Show N more".
- Bottom sheet with "Show N scents", which is good.
- The sticky chip row has 36 px chips.
- Cards show two `btn-sm` buttons ("Add 55 ml" / "Try 5 ml").

**What eternal should do**
- Raise the mobile initial load to 24, then "Show all 19 more". With 43 scents, everything is reachable in one tap.
- Show applied-filter chips with "×" above the grid.
- Keep the filter button visible while scrolling.
- Card info always in the same order: line, name, "Inspired by", 3 notes, price, then rating count once real reviews exist.
- Keep quick-add, since a single-size bottle needs no option picker. Make the primary "Add" button full-width and 44 px, with "Try 5 ml" as a text link underneath. Two equal buttons in a 160 px card wrap and crowd.

### 1.12 Homepage patterns

**Evidence**
- Autorotating carousels: 52% of mobile sites autorotate their homepage carousel. Baymard says to avoid autorotation on mobile; users ignore it as "ads" and take unintended detours. [B-extract] NN/g: users ignore moving content; use 5 frames or fewer. [extract]
- Mobile users rely on the homepage to work out what the site sells. 33% of users would start by scrolling the homepage for a visually driven product. [B-extract]
- 58% of sites link homepage tiles to narrowed (scoped) lists that disorient users. Link to top-level categories or name the full scope in the tile text. [B-title]
- 55% of sites are missing subcategory thumbnails or have ones that are hard to interpret; images should be consistent and clearly show what the category holds. [B-extract]
- "Show at least 40% of product types on the homepage." [2nd, UNVERIFIED]

**eternal today**
- The hero is `min-h-[100svh]` with two CTAs.
- `LineTiles` stack as three full-width 4:5 tiles on mobile, about 1,250 px of scrolling.
- Bestsellers is a horizontal snap row of 72vw cards, so about 1.4 of 8 are visible.
- The home sticky bar (Shop / Find your scent) is good.

**What eternal should do**
- Hero at about 75–80svh on mobile, so the next section peeks into view. Content:
  - One line of positioning.
  - One concrete offer line, for example "43 eaux de parfum from EGP 885 · try any scent in 5 ml first [confirm]".
  - One primary CTA, "Shop the scents".
  - A secondary text link, "Find yours in 60 seconds".
- Line tiles as a 3-up row of compact 3:4 tiles (Her / Him / Unisex, with counts) inside the first or second screen. Each links to the full line, not a narrowed subset.
- Bestsellers as a 2×2 grid plus "See all", instead of a swipe row that hides 6 of 8. This is my judgement from the carousel evidence, not a direct Baymard test.
- No autorotating carousel anywhere on mobile.
- Instagram ads should link to the matching product page or a campaign collection, not the homepage. That is standard practice for matching the ad's message, not a statistic.

### 1.13 After "Add to bag": cart drawer and payments

**Evidence**
- The "Added to cart" confirmation should help users reach their next goal. On mobile, unrelated suggestions and promos make it hard to see the cart. [B-extract]
- Shop Pay's "up to 50% lift vs guest checkout" (2023, commissioned by Shopify) is irrelevant here. Shopify Payments, which Shop Pay depends on, is reportedly not available in Egypt. [2nd: **verify in admin**]
- Paymob reportedly supports Apple Pay and Google Pay in Egypt. [2nd, UNVERIFIED]
- Egypt's cash-on-delivery share is quoted anywhere from 45% to 70% of orders. **UNVERIFIED**; the sources disagree.

**What eternal should do (`CartDrawer.tsx`)**
- Show the line item, the subtotal, a free-delivery progress line [confirm], and "+ 2 free 5 ml samples" [confirm].
- A 52 px "Checkout" button, then "Continue shopping".
- At most one relevant add-on (the paired scent's 5 ml sample).
- Show payment logos (Visa / Mastercard / Meeza / COD) under the checkout button.

---

## 2. Spec sheet for mobile

| Element | Spec | Basis |
|---|---|---|
| Any tap target | ≥ 44×44 px; primary actions 48 px tall | Apple 44 pt [Read], Android 48 dp [Read], Lighthouse 48 px [Read] |
| Spacing between targets | ≥ 8 px between bordered controls; about 12 pt padding around bordered controls, about 24 pt around unbordered ones | Apple HIG [Read] |
| Body text | 16 px mobile (now 15) | iOS default 17 pt [Read]; Lighthouse floor 12 px [Read] |
| Captions, eyebrows | ≥ 12 px (eyebrow now 11) | Apple Caption 1 = 12 [Read] |
| Form inputs | ≥ 16 px (now 13–14) | iOS auto-zoom [Read] |
| PDP first viewport (about 375×600 in-app) | Image ≤ 60% of height; name, price and size toggle visible; buy action visible (inline or sticky) | 1.3 |
| Sticky buy bar | 64 px + safe-area inset; 48 px button with price; shown whenever the main CTA is off-screen | 1.4 |
| Gallery | 6–8 frames incl. in-scale and video; 56–64 px thumbnails; "+N" tile; pinch and double-tap zoom; ≥ 2048 px sources | 1.2 |
| Collection | 2 columns; 24 initial, then "Show all"; bottom-sheet filters with "Show N scents"; removable applied-filter chips | 1.11 |
| Hero | 75–80svh; 1 offer line; 1 primary CTA; poster image is the LCP element; no autorotation | 1.12 |
| Performance | LCP ≤ 2.5 s on 4G mid-range Android; no loader on ad landings | 1.1 |

---

## 3. Recommendations ranked by expected impact

1. **Fix the PDP first viewport and make the sticky buy bar always available** (`page.tsx`, `BuyBox.tsx`, `Gallery.tsx`). Paid traffic lands here; today neither the CTA nor the price is reliably visible on arrival. Evidence: GrowthRock +5.2% mobile orders; Baymard's 62% mediocre-or-worse benchmark. Effort: small.
2. **Remove load friction for ad visitors.** Skip the curtain on `fbclid`/UTM visits and PDP/shop routes, keep video off the critical path, and test inside Instagram. Evidence: Deloitte +8.4% per 0.1 s; Google 53% abandon after 3 s. Effort: small.
3. **Add the delivery, payment and samples promise block next to the CTA and in the cart**, as soon as the offers are confirmed. Evidence: Baymard 64% / 43%. Effort: small, but blocked on the owner's decisions.
4. **Rebuild the gallery**: thumbnails, "+N" tile, in-scale and 5 ml vs 55 ml shots, video in the gallery, zoom. Evidence: Baymard 56% / 76% / 42% / 40% / +1% retailer test. Effort: medium, including the photo shoot.
5. **Make search by the original's name a first-class path**: autocomplete with popular originals, scope suggestions, submit button, a visible field on `/shop`. Evidence: Baymard search figures. Effort: medium.
6. **Sweep tap targets and type sizes**: 16 px body and inputs, 44 px chips, no 36 px touch buttons. Evidence: Apple, Android, Lighthouse, iOS zoom. Effort: small.
7. **Collection page**: 24 initial items, applied-filter chips, filter button that stays visible, cleaner quick-add with "Try 5 ml" as a link, consistent card order. Evidence: Baymard 15–30 per load, 64% list-item errors. Effort: small.
8. **Homepage**: 75–80svh hero with an offer line, 3-up line tiles inside the first two screens, bestsellers as a 2×2 grid, no autorotation. Evidence: Baymard and NN/g carousel and category findings. Effort: small to medium. Lower rank because ads should mostly land on product pages.
9. **Real reviews programme**: post-delivery request from order 1; show stars and count only once real. Evidence: Baymard 95%. Effort: medium; impact grows over time.
10. **PDP content order**: honest "how it differs" note expanded, notes visual, tale truncated with a link, FAQ in accordions, no tabs or subpages. Evidence: Baymard 27% vs 8%, 26% subpages. Effort: small.
11. **Cart drawer focus**: one relevant add-on, payment logos, 52 px checkout button, sample and free-delivery lines [confirm]. Effort: small.

**Measure it:**
- Track PDP view → add to bag → checkout start, split by in-app browser vs. other browsers (user agent contains `Instagram`).
- A/B test items 1 and 4 first when traffic allows.

---

## 4. Sources

**Read in full**
- https://developer.apple.com/tutorials/data/design/human-interface-guidelines/accessibility.json
- https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json
- https://developer.apple.com/tutorials/data/design/human-interface-guidelines/tab-bars.json
- https://developer.android.com/guide/topics/ui/accessibility/apps
- https://github.com/GoogleChrome/lighthouse/blob/v9.6.8/lighthouse-core/audits/seo/tap-targets.js
- https://github.com/googlechrome/lighthouse/pull/4550
- https://github.com/RickStrahl/BlogPosts/blob/master/2023-04/Preventing%20iOS%20Safari%20Textbox%20Zooming/IosTextboxZoomingAndViewportSizing.md

**Search extracts: Baymard**
- https://baymard.com/blog/always-use-thumbnails-additional-images
- https://baymard.com/blog/truncating-product-gallery-thumbnails
- https://baymard.com/blog/mobile-image-gestures
- https://baymard.com/blog/ensure-sufficient-image-resolution-and-zoom
- https://baymard.com/blog/in-scale-product-images
- https://baymard.com/blog/ux-product-image-categories
- https://baymard.com/blog/embedding-product-page-videos
- https://baymard.com/blog/current-state-ecommerce-product-page-ux
- https://baymard.com/blog/mobile-ux-ecommerce
- https://baymard.com/blog/responsive-upscaling
- https://baymard.com/blog/use-buttons-for-size-selection
- https://baymard.com/blog/avoid-horizontal-tabs
- https://baymard.com/blog/avoid-using-subpages
- https://baymard.com/blog/product-page-faq-and-qa
- https://baymard.com/blog/show-shipping-costs-on-product-pages
- https://baymard.com/blog/user-ratings-distribution-summary
- https://baymard.com/blog/user-perception-of-product-ratings
- https://baymard.com/blog/number-of-items-loaded-by-default
- https://baymard.com/blog/how-to-design-applied-filters
- https://baymard.com/blog/current-state-product-list-and-filtering
- https://baymard.com/blog/mobile-desktop-quick-views
- https://baymard.com/blog/list-item-design-ecommerce
- https://baymard.com/blog/homepage-carousel
- https://baymard.com/learn/page-control-ui
- https://baymard.com/blog/main-navigation-product-categories
- https://baymard.com/blog/mobile-homepage-provide-full-scope
- https://baymard.com/blog/ecommerce-navigation-best-practice
- https://baymard.com/blog/ecommerce-category-page
- https://baymard.com/blog/mobile-ecommerce-search-and-navigation
- https://baymard.com/research-articles/mobile-search-submit-button
- https://baymard.com/blog/autocomplete-design
- https://baymard.com/blog/native-mobile-apps-launch
- https://baymard.com/blog/button-design
- https://baymard.com/ecommerce-design-examples/added-to-cart-confirmation

**Search extracts: other**
- https://www.nngroup.com/articles/hamburger-menus/
- https://www.nngroup.com/articles/designing-effective-carousels/
- https://www.smashingmagazine.com/2016/03/pagination-infinite-scrolling-load-more-buttons/
- https://web.dev/case-studies/milliseconds-make-millions
- https://www.marketingdive.com/news/google-53-of-mobile-users-abandon-sites-that-take-over-3-seconds-to-load/426070/
- https://growthrock.co/sticky-add-to-cart-button-example/
- https://alistapart.com/article/how-we-hold-our-gadgets/
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html (not fetched)
- https://krausefx.com/blog/ios-privacy-instagram-and-facebook-can-track-anything-you-do-on-any-website-in-their-in-app-browser
- https://www.shopify.com/blog/shop-pay-checkout
- https://www.byredo.com/us_en/c/perfume/personal-fragrances/categories/discovery-set
- https://www.whowhatwear.com/diptyque-perfume-discovery-set

**Lower-confidence sources (claims marked UNVERIFIED above)**
- https://easyappsecom.com/guides/sticky-add-to-cart-best-practices
- https://www.clariola.com/blog/product-page-optimization-2026-baymard-benchmark
- https://dev.to/devmelv/instagram-is-silently-killing-your-sales-and-you-probably-have-no-idea-4efd
- https://ecosire.com/blog/shopify-payment-gateways-by-country-2026
- https://codrocket.com/blog/egypt-ecommerce-statistics-trends-2026

**Storefront files these recommendations refer to** (under `/home/user/ETERNAL_E-Commerce/`)
- `components/product/Gallery.tsx`
- `components/product/BuyBox.tsx`
- `app/products/[handle]/page.tsx`
- `components/product/CollectionGrid.tsx`
- `components/product/ProductCard.tsx`
- `components/home/Sections.tsx`
- `components/home/MobileStickyBar.tsx`
- `components/motion/Loader.tsx`
- `components/motion/MotionScript.tsx`
- `components/chrome/SearchOverlay.tsx`
- `components/chrome/WhatsAppFloat.tsx`
- `app/globals.css`
- `app/layout.tsx`
