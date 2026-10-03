# Premium fragrance and beauty sites that convert on mobile: research brief for eternal

## Read this first: no live research was possible

**This brief could not be built from live web research.** I did not get the 8 searches and 6 full-page reads the brief asked for:
- **Searches:** every WebSearch call returned "session has used its web search budget (200 of 200)". Raising the limit needs the user to change `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`.
- **Page reads:** every WebFetch call was refused by the network proxy (EGRESS_BLOCKED). I tried 12 domains: dossier.co, ffern.co, byredo.com, aesop.com, diptyqueparis.com, nngroup.com, baymard.com, web.dev, shopify.com, thinkwithgoogle.com, cxl.com and en.wikipedia.org.
- **Proxy status:** I tried to read the proxy README and status page. The permission system denied it, and I did not try to work around that.

What the brief is built on instead:
- **Codebase:** every statement about eternal comes from reading `/home/user/ETERNAL_E-Commerce` directly. File paths are given.
- **Everything outside the codebase** (brand teardowns, statistics, case studies) comes from prior knowledge up to about 2025. All of it is tagged **UNVERIFIED** with a confidence level (high, med or low). Do not quote any number to the owner or in ads until it has been checked against the source URLs at the end. Brand sites change often, so treat the brand details as patterns, not current fact.
- **Case studies:** I could not find, or confirm from memory, any published luxury-fragrance site redesign with a measured conversion uplift. The only case studies with numbers below are general speed-to-conversion studies, not luxury redesigns.

---

## 1. Findings

### 1A. How the nine brands handle mobile selling (all UNVERIFIED, from prior knowledge)

| Brand | How you browse | Price, size and samples | Reviews, badges and promotions | What eternal should take | Conf. |
|---|---|---|---|---|---|
| **Aesop** | By category and need, not gender. Fragrance grouped by aroma family. Long reading lives in a separate section (*The Fabulist*), away from the buying path. | Size picker sits right above the button. Price is in or next to "Add to cart". Free samples and gift wrap are standard. Gift guides are sorted by price. | No star ratings. No discount language. | Editorial content gets its own section; the product page is a short, factual sheet. | med |
| **Byredo** | Gender-free, sorted by format (EdP, Extrait, body, home). | Size picker with price. Notes kept short. "La Sélection" travel sets (3 × 12 ml) are the trial product. | No stars. Very quiet promotions. | A trial set shown as a product in its own right, not as a cheap extra. | med |
| **Le Labo** | Classics plus City Exclusives. Gender-free. | Price shown for each size (15/50/100/500 ml) and refills. Free personalised label. | Genuine scarcity: City Exclusives sell only in their city, except every September. | Use real, explained scarcity instead of timers. Personalisation as a gift reason. | high (City Exclusives, labels) / med (the rest) |
| **Diptyque** | Seasonal campaign hero. Filter by scent family. A scent-finder tool. | Discovery set of eaux de parfum. Engraving and gift wrap. | Few promotions; reviews vary by region. | Family filters plus a discovery set. | low–med |
| **Jo Malone London** | Scent families (Citrus, Fruity, Light Floral, Floral, Woody, Spicy). "Fragrance Combining" (layering) is central. | Free samples, gift wrap and engraving shown clearly. | **Star ratings and reviews shown.** Free-delivery and gift-with-purchase banners, but no countdown timers. | The most commercial luxury model. Proof that stars and offer banners can sit inside a premium look. Layering maps to eternal's "Complete the ritual". | med |
| **Maison Francis Kurkdjian** | One hero product (Baccarat Rouge 540) dominates. | Several formats (EdP, Extrait), refills, engraving, multi-vial "wardrobe" discovery sets. | No stars. | Give a hero scent one clear spot; sell sets as a wardrobe. | low–med |
| **Glossier** | Premium-DTC hybrid. | Free-shipping threshold banner. | **Stars and review counts on product cards and pages. "Bestseller" badges.** | Social proof does not cheapen a brand if the visual system stays tight. | high (reviews) |
| **Dossier** | The closest match to eternal: an "inspired by" house. Shop by gender, family and quiz. | Low prices; samples and sets. | Stars, review counts, promo bars, bundle and discount devices. | Name the original on every card and search by the original's name, but **without** the discount devices. | med |
| **Ffern** | A seasonal edition subscription: each scent released once, with membership and a waitlist. Editorial and letter-like in tone. | One product per season. | Only genuine scarcity (real limited batches, real waitlist). | Honest scarcity and storytelling can drive demand on their own. Hold this for a later limited edition, not for launch. | med |

### 1B. Six ways luxury brands keep their editorial look and still sell (UNVERIFIED patterns, med–high)

1. **Pages are editorial; the buying block is plain.** Even the barest luxury product page keeps the same order: name, one-line descriptor, size picker with a price per size, add-to-bag (often with the price in the button), then a delivery and samples line.
   - eternal already puts the price in the button ("Add to bag · EGP X", `components/product/BuyBox.tsx`). Keep it.
2. **Price is always visible, never struck through.** Size in ml sits next to the price. Value comes from samples, gift wrap and credit-back, not from discounts.
3. **Samples are the norm.** Free samples with each order, and a paid discovery set as the low-risk first purchase. Several niche houses credit the set's price toward a full bottle (UNVERIFIED which ones).
4. **Navigation follows the audience.**
   - Niche houses (Byredo, Le Labo, Aesop) avoid gender.
   - Commercial premium and "inspired by" DTC brands (Dossier) lead with gender plus family plus quiz.
   - Instagram ad traffic in Egypt behaves like the second group.
5. **Long editorial lives in its own section** (Aesop's *The Fabulist*, Ffern's letters), not between the product and the buy button.
6. **Urgency comes from real dates and real limits:** holiday shipping cut-offs, City Exclusives, seasonal editions. Never timers.

### 1C. What premium brands keep and drop, compared with discount DTC brands (UNVERIFIED, med)

| Element | Luxury niche (Aesop, Byredo, Le Labo, MFK) | Premium-commercial (Jo Malone, Glossier) | Discount DTC (Dossier-style) | eternal should |
|---|---|---|---|---|
| Star ratings | Mostly absent | Present | Prominent | Collect real reviews after purchase. Show stars only once there are enough real ones. Never seed. |
| Badges | "New", "Limited" | "Bestseller" | Many, including "% off" and "selling fast" | Keep "New" (it is date-based). Rename the editorial "Bestseller" (see 1E). |
| Pop-ups | Rare, soft newsletter prompt | Email modal offering perks | Spin-to-win, discount modals | No entry pop-up for ad traffic. Capture contact details inline instead. |
| Countdown timers | None | Only factual holiday cut-offs | Common | Only real, dated delivery cut-offs (Eid, Mother's Day on 21 March, Valentine's). |
| Free-shipping message | Quiet, one line | Yes | Yes | Yes, plus the cart meter, once the threshold is confirmed. |
| Free samples | Yes | Yes | Sometimes | Yes. This is your strongest honest offer. |
| Gift wrap, engraving, notes | Yes | Yes | Rare | Gift note plus mystery box as a ready-made gift. |
| Strikethrough prices | Never | Event-only | Always | Never. |
| Quiz or finder | Some | Yes | Yes | Keep it. It is the answer to "I can't smell it online". |
| Chat or advisor | Client advisors | Chat | Chat | WhatsApp is the Egyptian equivalent. Turn it on before ads run. |
| Low-stock notice | Rare | Sometimes | Often fake | Real stock only. Already implemented (≤5, live only). |

### 1D. Published numbers (UNVERIFIED this session; check before quoting)

- **Deloitte × Google, "Milliseconds Make Millions" (2020):** a 0.1 s faster mobile site raised retail conversion by about 8.4% and order value by about 9.2%. (high)
- **Google / SOASTA (2017):** chance of a bounce rises about 32% as load time goes from 1 s to 3 s, and about 90% from 1 s to 5 s. Google/DoubleClick (2016): 53% of mobile visits are abandoned when a page takes more than 3 s. (high, but the data is old)
- **web.dev case studies** (speed work, not luxury): (med–high)
  - Vodafone: 31% better LCP (load speed) gave 8% more sales in an A/B test.
  - Swappie: mobile revenue up 42%.
  - Rakuten 24: revenue per visitor up about 53%.
- **Baymard:** average cart abandonment is about 70%. "Extra costs too high" is the top reason (about 48% of abandoners). Better checkout design alone can lift conversion about 35% on large sites. (med–high)
- **Spiegel Research Center (2017):** a product with 5 reviews is about 270% more likely to be bought than one with none, and the effect is larger for higher-priced items (about 380%). Purchase likelihood peaks below a perfect 5.0. That supports honest, uncurated reviews. (med–high)
- **Google Search Central (2016/17):** mobile pop-ups that cover content right after a visitor arrives are demoted in search. (high)
- **Luxury-specific redesigns with measured uplift: none found or verified.** Places to look once web access works: Shopify Plus customer stories, Contentful / Salesforce / Vercel customer pages for Aesop and Diptyque, and a possible web.dev Farfetch case study (no numbers recalled).

### 1E. What I found in eternal's own code (VERIFIED)

1. **Unconfirmed facts render as visible bracketed text.** These show up on live pages:
   - `site.deliveryTime "[Delivery time]"`: hero trust line and buy box.
   - `returnsPolicy`, `returnsWindow "[n] days"`, `longevityClaim`: proof strip.
   - Announcement text "…[confirm offer]".
   - "[Discovery set product to create]" and "[n] scents": home page.
   - "[Pair discount to confirm]": product page.
   - `paymentMethods "[Local wallets]"`.
   
   All of these come from `content/site.ts`, `components/home/Sections.tsx` and `app/products/[handle]/page.tsx`. They honestly mark unknowns, but to a cold ad visitor they look like a broken site. `site.ts` already supports `null` to hide an element.
2. **A loading screen covers every first visit.** It shows on the first page load of each browser session, including product pages, about 0.5 s on mobile (`components/motion/MotionScript.tsx:8`, `Loader.tsx`, `app/motion.css:66–71`, mounted in `app/layout.tsx:65`). Instagram's in-app browser is a separate browser from the phone's own, so ad visitors are likely to see the loader more often than returning direct visitors (UNVERIFIED how often its session storage resets).
3. **The product page's first screen holds no price and no add-to-bag on mobile.** Estimate from the CSS, not measured:
   - The 4:5 gallery (`Gallery.tsx:11`) is about 440 px tall on a 390 px phone.
   - Add the header, the announcement bar and the breadcrumb, and the name, price, "Inspired by" and the button fall below the first screen in Instagram's browser.
   - The sticky bar (`BuyBox.tsx`) only appears after the main button has been scrolled **past** (`top < 0`). So before then, there is no buy action on screen.
4. **The "Bestseller" badge can be editorial, not sales-based.** When there is no sales data, `isBestseller` falls back to a hand-set flag `ed.bestseller` (`lib/catalogue.ts:255`). Before launch, that labels a scent "Bestseller" with no sales behind it, which risks breaking the honesty rules.
5. **The home page puts long editorial sections ahead of the trial offer.**
   - The three line tiles are 4:5 and stack full-width below 768 px. That is roughly 1,300 px of scrolling before the bestsellers (`Sections.tsx`, `aspect-[4/5] … md:grid-cols-3`).
   - "Try before you commit" (mystery box and discovery set) is section 8 of 10.
6. **Already good:**
   - Search by the original's name ("Search by the original you love", `CollectionGrid.tsx:130`).
   - "Inspired by" on product cards and product pages, with an honest "not affiliated" note.
   - Price in the add button.
   - A 5 ml sample variant with credit-back built into the buy box (hidden until the variant exists).
   - Sample suggestions in the cart drawer, and a free-shipping meter (hidden until `freeShippingThreshold` is set).
   - Low-stock notice from real stock only.
   - Ad tracking parameters (utm, fbclid) passed through to checkout.
   - Shop-by-mood in the filter drawer, and family chips.
7. **WhatsApp is switched off** (`site.whatsapp: null`), so every WhatsApp button is hidden.

---

## 2. Recommendations, ranked by expected impact

| # | What to do | Where | Why | Impact |
|---|---|---|---|---|
| 1 | **Do not run ads until every bracketed fact is confirmed or set to `null`.** For delivery time, COD fee and returns, confirm rather than hide, because they answer the top questions before a purchase. | `content/site.ts`; home `RiskReducers`; product page pair block | Visible brackets read as an unfinished, untrustworthy site. Costs that only show up at checkout are Baymard's top abandonment reason (1D). | Very high |
| 2 | **Skip the loading screen for ad visits.** At minimum, skip it when the URL has `utm_*` or `fbclid`, or the page is not `/`. Ideally, skip it on mobile entirely. | `MotionScript.tsx` (add a check on `location.search` and `pathname`), `Loader.tsx` | About 0.5 s added before the first view on paid clicks. Speed studies (1D) tie each 0.1 s to conversion. | High |
| 3 | **Put the buy action on the product page's first screen.** Two changes: (a) show the sticky add-to-bag bar whenever the main button is not visible, above or below; (b) on mobile, make gallery frame 1 about 1:1 and hide or shorten the breadcrumb, so name, price and "Inspired by" sit within about 700 px. | `BuyBox.tsx` (change the `top < 0` condition), `Gallery.tsx`, `app/products/[handle]/page.tsx` | Most ad clicks land on product pages. Currently the price and button are below the first screen (estimate, 1E-3). A/B test against the current version. | High |
| 4 | **Make the trial ladder the offer for first-time visitors.** Three steps: the 5 ml sample with credit-back on every product page; "Try 3 × 5 ml for EGP 250" in the hero trust line and the home sticky bar; then the discovery set once the product exists. | Shopify sample variants; hero `<ul>`; `MobileStickyBar.tsx`; product page note under the buy box (already there for the mystery box) | Every luxury house in 1A uses samples or sets as the first purchase. Fragrance is a "can't smell it online" category. | High |
| 5 | **Show all costs in the cart drawer before Shopify checkout:** delivery fee and time, COD fee, free-shipping meter, payment logos (Meeza, cards, COD, plus InstaPay/Paymob once confirmed). Offer a prepaid perk such as "no COD fee", not a discount. | `CartDrawer.tsx`, `site.ts` (`freeShippingThreshold`, `codFee`, `paymentMethods`) | Shopify's hosted checkout is hard to customise below Plus (UNVERIFIED for the current plan rules), so the reassurance has to come before it. | High |
| 6 | **Send each ad to the page that matches it.** A single-scent ad goes to that product page. A line ad goes to `/shop/her`, `/shop/him` or `/shop/unisex`. A trial ad goes to `/products/mystery-box`. Add an "Inspired by" A–Z index page and a search icon in the mobile header that opens search-by-original. | Meta ad URLs; a new `app/shop/inspired-by` page | The ad's "inspired by" promise should carry straight through (the Dossier pattern). Sending ad traffic to the home page adds a step. | High |
| 7 | **Build honest proof.** <br>(a) Change the hand-set "Bestseller" label to "House pick" until there is real sales data. <br>(b) Start collecting reviews after purchase, and show stars only once a product has a set minimum of real reviews. <br>(c) Repost real Instagram customer posts, with permission. <br>(d) Keep and raise the "how it differs" note. | `lib/catalogue.ts:255`, `ProductCard.tsx:17`, product page | Reviews matter more for higher prices (Spiegel, 1D). The brand rules forbid fakes. Jo Malone and Glossier show stars without hurting their premium look. | Med-high |
| 8 | **Reorder the home page for mobile** (table below). | `app/page.tsx`, `Sections.tsx` | Gets ad visitors who land on the home page to products and the trial offer in about 2 screens, not 5 or more. | Medium |
| 9 | **Reorder the product page:** buy box, then "How it differs", then a compact notes pyramid, then FAQ (longevity, originals, COD, returns), then pairing, then related scents. Move the tale excerpt and "Wear it" below those. | `app/products/[handle]/page.tsx` | Answer objections before telling the story. The editorial still stays on the page. | Medium |
| 10 | **Lead every label with the audience:** "For her · eterna", never "eterna" alone. Make gender the first chip row on `/shop`; keep family chips; keep mood in the filter drawer. | `MobileMenu.tsx`, `LineTiles`, `CollectionGrid.tsx` | The three line names differ by one letter, so a cold visitor will not tell them apart. Egyptian ad audiences shop by gender. | Medium |
| 11 | **No entry pop-up.** Capture contact details inline instead: on finder results ("send my matches to WhatsApp") and in the cart drawer ("save my bag"). Turn on `site.whatsapp`. | `Finder.tsx`, `CartDrawer.tsx`, `site.ts` | Luxury brands avoid pop-ups, and Google demotes them. Instagram's in-app browser can lose the cart when the visitor switches to their phone's browser. | Medium |
| 12 | **Use real-date gifting and urgency.** Occasion collections with real delivery cut-off dates; a gift note at checkout; the mystery box presented as a gift. | Collections, announcement bar | Replaces timers with true deadlines (the Jo Malone and Aesop pattern). | Medium (seasonal) |
| 13 | **Later: genuine limited editions.** Numbered batches with the actual quantity stated, Le Labo / Ffern style. | New product type | Builds desire honestly. | Low-med |

**Measurement:** treat these as primary metrics:
- conversion rate for ad sessions (by `utm_campaign`);
- add-to-bag rate on product pages;
- sample and mystery-box attach rate;
- cart-to-checkout rate.

Ship items 1, 2 and 5 together. Then test items 3, 4 and 8 one at a time, because early traffic will be too small for parallel A/B tests.

### Home page: keep, move lower, or cut for ad traffic

| Current order | Proposed (mobile) | Decision |
|---|---|---|
| 1 Hero (100svh film) | 1 Hero: poster image loads first; the trust line adds "Try 3 for EGP 250"; confirmed facts only | **Keep** |
| 2 Proof strip | 2 Proof strip: one compact row, confirmed facts only | **Keep, compress** |
| 3 Line tiles (3 × 4:5 stacked) | 3 Line tiles: a 3-up row or swipe row of 3:4 tiles, audience-first labels | **Keep, much smaller** |
| 4 Bestsellers | 4 "House picks" (rename until there is sales data) | **Keep, move up in effect** |
| 8 Try before you commit | 5 Mystery box and discovery set | **Move up** (from 8th to 5th) |
| 5 Finder entry | 6 Finder entry | Keep |
| 7 Shop by mood | 7 Shop by mood | **Move lower** |
| 6 Featured tale | 8 Featured tale | **Move lower** |
| 9 House film | 9 House film (no autoload) | **Move lower**; cut on ad landing variants |
| 10 Tales teaser | 10 Tales teaser | **Move lower**; cut on ad landing variants (link to `/tales` instead) |

The "salt, stone and golden hour" identity stays in the photography, type, colours and copy voice throughout. What moves is long-form story, which goes below the buying path or into `/tales` and `/house`, as Aesop does with *The Fabulist*.

---

## 3. Sources

None of these could be opened in this session; they are the pages to check each UNVERIFIED claim against.

- https://www.thinkwithgoogle.com/_qs/documents/9757/Milliseconds_Make_Millions_report_hQYAbZJ.pdf
- https://www.thinkwithgoogle.com/marketing-strategies/app-and-mobile/page-load-time-statistics/
- https://www.thinkwithgoogle.com/consumer-insights/consumer-trends/mobile-site-load-time-statistics/
- https://web.dev/case-studies/vitals-business-impact
- https://web.dev/case-studies/vodafone
- https://web.dev/case-studies/swappie
- https://web.dev/case-studies/rakuten
- https://baymard.com/lists/cart-abandonment-rate
- https://baymard.com/research/checkout-usability
- https://spiegel.medill.northwestern.edu/online-reviews/
- https://developers.google.com/search/blog/2016/08/helping-users-easily-access-content-on
- https://www.nngroup.com/articles/popups/
- https://shopify.dev/docs/apps/build/checkout
- Brand sites to audit on a phone:
  - https://www.aesop.com
  - https://www.byredo.com
  - https://www.lelabofragrances.com
  - https://www.diptyqueparis.com
  - https://www.jomalone.com
  - https://www.franciskurkdjian.com
  - https://www.glossier.com
  - https://dossier.co
  - https://www.ffern.co

Codebase files read (verified):
- /home/user/ETERNAL_E-Commerce/app/page.tsx
- /home/user/ETERNAL_E-Commerce/app/products/[handle]/page.tsx
- /home/user/ETERNAL_E-Commerce/components/home/Sections.tsx
- /home/user/ETERNAL_E-Commerce/components/home/MobileStickyBar.tsx
- /home/user/ETERNAL_E-Commerce/components/product/BuyBox.tsx
- /home/user/ETERNAL_E-Commerce/components/product/Gallery.tsx
- /home/user/ETERNAL_E-Commerce/components/product/CollectionGrid.tsx
- /home/user/ETERNAL_E-Commerce/components/product/ProductCard.tsx
- /home/user/ETERNAL_E-Commerce/components/cart/CartDrawer.tsx
- /home/user/ETERNAL_E-Commerce/components/motion/Loader.tsx
- /home/user/ETERNAL_E-Commerce/components/motion/MotionScript.tsx
- /home/user/ETERNAL_E-Commerce/app/motion.css
- /home/user/ETERNAL_E-Commerce/content/site.ts
- /home/user/ETERNAL_E-Commerce/lib/catalogue.ts
