# Converting paid Instagram/Meta ad traffic on mobile: research for eternal

**How this was researched.** I ran 37 web searches, using domain filters to reach primary sources such as Meta, Apple/WebKit, Shopify, Google, NN/g and Baymard. **None of the full-page reads worked.** WebFetch and curl were refused by the environment's network policy for every host I tried: help.shopify.com, shopify.com, webkit.org, meta.com, facebook.com, krausefx.com, web.dev, baymard.com, frontendmasters.com and en.wikipedia.org. The session's web-search allowance (200 calls per session) also ran out. So every external claim below rests on the text the search tool pulled from those pages, not on a full read. Each claim is labelled:

- **[P]**: primary source (Meta, Apple, Shopify, Google, a brand's own case study)
- **[S]**: secondary source or press
- **[V]**: claim made by a vendor selling the fix
- **UNVERIFIED**: could not be confirmed

I also read the eternal repo (`/home/user/ETERNAL_E-Commerce`), so the fixes point at real files.

To allow full reads, add the hosts above under Allowed domains in the cloud environment's settings (environment menu in the session title bar, then Edit, then Network access). Steps: https://code.claude.com/docs/en/cloud-environments#network-access

---

## Short version

1. **Wallet payments will not help eternal inside Instagram.**
   - Apple Pay is turned off in iOS web views that inject scripts, and Instagram injects scripts.
   - Shop Pay needs Shopify Payments, which is not offered in Egypt.
   - So cash on delivery and a short card form are the real ways people will pay. Build for them.
2. **Tracking has a flaw that needs fixing before launch.** Checkout currently defaults to `eternal-10199.myshopify.com` (`lib/shopify/client.ts`). That is a different domain from the storefront, so Meta's cookies and Shopify's consent cookies will not carry over to the purchase.
3. **On the product page, the price, the "inspired by" line and the Add to bag button are all below the first screen** on a 390×844 phone. My estimate from the CSS:
   - the price sits about 790 px down
   - Add to bag sits about 1,150–1,250 px down
   - the sticky bar only appears *after* the visitor scrolls past the button.
4. **Every ad click pays the intro-curtain cost.** `components/motion/Loader.tsx` shows a 520 ms curtain on mobile once per session. Each Instagram in-app browser visit is likely a fresh session, so the curtain probably plays on every visit.
5. **Match the landing page to the ad.** A one-scent ad should go to that scent's product page, a "find yours" ad to the quiz, a "try 3" ad to the sample box. Use the same bottle image, the same words and the same offer.

---

## 1. The Instagram in-app browser

### 1.1 What it is
- **Instagram opens links in its own browser built into the app**, not Safari or Chrome. On iOS it injects its own JavaScript into every page it shows.
  - Felix Krause (2022) documented a `pcm.js` script that Meta calls an "event aggregator". It also listens to every tap on buttons, links and images. [P: Krause; S: Threatpost, The Conversation]
  - Meta says the script respects the user's consent and is used for ads measurement.
- **There is still no global "open links in my browser" setting** on iPhone or Android (as of 2026). Visitors can only use the per-page ⋯ menu and choose "Open in browser". [S: u2l.ai] This is UNVERIFIED against Meta's own documentation.

### 1.2 Autofill and saved passwords
- **Secondary and vendor sources agree that Safari/Keychain autofill, saved passwords and Apple Pay are missing or partial**, and that visitors arrive logged out. [S/V]
- One vendor claims "up to 25%" of conversions are lost this way. [V: linktw.in, sells link redirects] This number is UNVERIFIED.
- **Meta has its own autofill instead.** People can store contact and payment details in Facebook or Instagram and have them filled into forms in the in-app browser. To make this work, Meta reads "how forms and pages are built … which fields and buttons appear and what they represent (such as … 'address' or a button to place an order)". [P: Meta Pay help]

**What eternal should do:** give every field you own the standard `autocomplete` attributes. That covers the quiz email, the WhatsApp number, a back-in-stock signup and newsletter fields (`email`, `tel`, `given-name`, `address-line1`). Meta's autofill can then recognise them. Checkout is Shopify-hosted and uses standard fields. Whether Meta's autofill actually fills Shopify checkout inside Instagram is UNVERIFIED. Test it on a real phone with autofill turned on in Instagram settings.

### 1.3 Cookies and storage
- **The in-app browser shares no cookies or storage with Safari or Chrome.** If a visitor taps "Open in browser", the site sees a stranger. [S]
- **This directly affects eternal's bag.** It lives in `localStorage` (`components/cart/CartProvider.tsx`, `lib/client/storage.ts`), so it does not move to Safari.

**What eternal should do:**
- Do not tell people to leave Instagram before checkout.
- If the data later shows many iPhone shoppers abandoning at payment, add a "Continue in Safari" link that carries the bag in the URL, for example `/bag?l=<variant>:<qty>,…`. `app/api/checkout/route.ts` already builds cart permalinks in this format, so the logic is reusable.

### 1.4 Apple Pay, Shop Pay and Google Pay

| Wallet | What applies to eternal |
|---|---|
| **Apple Pay** | iOS web views have supported Apple Pay since iOS 13, but "Apple Pay cannot be used alongside script injection APIs such as WKUserScript or evaluateJavaScript … If these APIs are invoked before a webpage uses Apple Pay, Apple Pay will be disabled." [P: WebKit/Apple] Instagram injects scripts on iOS [P: Krause], so in practice **Apple Pay is unavailable inside Instagram on iPhone**. This is an inference, consistent with the secondary sources. Shopify also says customers "must use Safari" for Apple Pay on an online store. [P: Shopify blog] Apple Pay launched in Egypt in **December 2024** with NBE, Banque Misr, CIB and Meeza. [P: Mastercard newsroom; S: 9to5Mac, Daily News Egypt] Paymob's Shopify card app lists Apple Pay and Meeza. [P: Shopify App Store listing] So Apple Pay can work for eternal in Safari only. |
| **Shop Pay** | Requires Shopify Payments, which is **not available in Egypt**. [S: several; confirm in Shopify admin] Treat Shop Pay as unavailable. |
| **Google Pay** | Android web views support Google Pay since WebView 137 (2025), but **the host app has to switch it on**. [P: Google Developers Blog, Chrome docs] Whether Instagram has done so is UNVERIFIED. |

**What eternal should do:**
- Do not plan on express wallets for Instagram traffic.
- Make **cash on delivery** and the **card form (Paymob)** as short and clear as possible.
- Market reports disagree on Egypt's cash-on-delivery share: 45% (PS Market Research, 2024) up to 55–70% (other reports). Treat it as roughly half of orders or more; the sources are weak. [S, low confidence]

### 1.5 Speed inside the in-app browser
- **Facebook used to pre-load ad landing pages.** In 2016 it pre-fetched the *initial HTML* for ads it predicted would be clicked. It said this cut load times by 29% (8.5 s), and that it "considers website performance … in the ad auction and delivery". [S: Forbes, SEJ, Adweek on Facebook's announcement] Whether Instagram does this today is UNVERIFIED.
- **Only the first HTML was pre-fetched,** so the hero image URL, the title, the price and the button must be in the server-rendered HTML, not drawn in later by JavaScript.
- **Meta's injected scripts add work on the main thread.** Keep eternal's own JavaScript small.

### 1.6 Tracking: Meta Pixel, Conversions API and iOS 14+

**What Meta requires:**
- When the same event arrives from both the browser pixel and the server (Conversions API, CAPI), Meta removes the duplicate using `event_id` plus `event_name`. "If we receive the same event_id and event_name more than once, we keep only the first copy." [P: Meta for Developers]
- The click ID (`fbc`) is built from the `fbclid` in the landing URL as `fb.1.<ms>.<fbclid>`. It is stored in the `_fbc` cookie on your own domain and sent unhashed. [P: Meta for Developers]

**iOS 14+ and Apple's tracking prompt (ATT):**
- For iOS 14.5+ users, Meta's measurement is aggregated, partly modelled and can be delayed by up to 72 hours. [S]
- **June 2025 changes** [S: Jon Loomer]:
  - the 8-event priority limit is gone
  - the Aggregated Event Measurement tab is gone
  - domain verification is no longer needed to configure events
  - you no longer choose a "conversion domain"
- **Cost benefit of CAPI:** "13% better cost per result with Pixel + CAPI" (a Meta 2022 study) is widely quoted, but I could not find it on Meta's own pages. UNVERIFIED. A "17.8%, April 2026" figure is also UNVERIFIED.

**How Shopify handles it:**
- The Facebook & Instagram app's "Enhanced/Maximum" setting sends Purchase server-to-server. Pixels load on checkout, the thank-you page and the order-status page. [P: Shopify Help]
- **For a headless store, checkout must sit on a subdomain of the storefront's root domain**, for example `checkout.example.com`. Otherwise "checkout will not be able to read and respect visitor consent given on your storefront". [P: shopify.dev Hydrogen docs]

**What eternal should do:**
1. **Set a checkout subdomain** (for example `checkout.<eternal-domain>`) as Shopify's primary domain, and set `SHOPIFY_STORE_DOMAIN` to it. Today's default `eternal-10199.myshopify.com` breaks `_fbp`/`_fbc` and consent at checkout.
2. **Storefront events (`PageView`, `ViewContent`, `AddToCart`):** send them from Next.js through both the pixel and CAPI (a route handler), with the same `event_id`. Today there is no pixel or UTM code in the repo at all. Leave checkout events and Purchase to Shopify's Facebook & Instagram app on Maximum.
3. **Capture `fbclid` and UTMs in Next.js middleware.** Set `_fbc` as a first-party cookie on the root domain from the server; cookies set by server headers last longer than ones set by JavaScript under Safari's tracking protection (UNVERIFIED for Instagram's web view). Also copy `utm_*` and `fbclid` into **Shopify cart attributes** when `createCheckout` runs, so every order in Shopify admin records the ad that produced it, whatever Apple's prompt does.
4. **Load the pixel base code in `<head>`, early.** Landing page views only count when the pixel fires. A late pixel under-counts them, which looks to Meta like a slow page.
5. **Report delivered cash-on-delivery orders later (idea).** Send a custom `DeliveredPurchase` event through CAPI when a cash-on-delivery order is actually delivered. Meta can then learn from delivered orders, not refused ones. CAPI supports later and offline events. [P]

---

## 2. What happens after the click

### 2.1 Matching the page to the ad
- **The CXL principle:** the ad "needs to smell like the landing page". When that continuity breaks, people leave before the second line. [S: CXL / Peep Laja]
- **The often-quoted "message match lifts conversion 212%" (Unbounce)** has no original study I could find. UNVERIFIED; do not quote it.

**For eternal, matching means four things:**
- **Same image:** the ad's bottle shot is gallery image #1.
- **Same words:** "inspired by X", the scent name, the line (eterna, eterno or eternal).
- **Same offer:** "two free 5 ml samples" in the ad means the same words in the offer strip, and the samples visible in the bag.
- **Same mood:** the ad's colour world matches the product page's `scent.world.bg`.

### 2.2 Where to send traffic: the evidence

| Destination | Evidence | Strength |
|---|---|---|
| Product page with a top section written for cold traffic | **Zorali** (an Australian outdoor brand) tested a cold-traffic top section added to its product pages against plain product pages for paid social: **+17% revenue per visitor (96% confidence), +10% conversion rate (90%), higher order value.** Reason: product pages "assume the visitor already understands the brand". | [S: the agency's own case study] |
| Quiz | Octane AI: quiz pages 7.1% conversion vs 2.3% for product pages; 8–25% for quiz takers; Jones Road's shade quiz 16% conversion and order value up from $60 to $90. | [V: quiz vendor; quiz takers are self-selected] |
| Fragrance quiz | TheScentNest: +22% return on ad spend when sending paid traffic to a scent quiz. | [V] UNVERIFIED |
| Product page from catalog ads | Meta's catalog ads send people to product pages by default. | [P, general knowledge] |

**Where eternal should send each ad:**

| Ad | Destination |
|---|---|
| One scent ("If you love X…") | That scent's product page, ad-landing version (section 5) |
| Carousel of 3–5 scents | A collection page filtered to exactly those scents, **in the ad's order**, for example `/shop?h=a,b,c` |
| "Not sure? Find yours in 60 seconds" | `/finder` |
| "Try 3 for EGP 250" / samples | The mystery box page |
| "eterna for her" or another line | `/shop/her` (or him / unisex), filtered and with the hero swapped to match |
| Brand film / editorial | The home page or a story page. These are rarely worth sending paid traffic to except for awareness. |

### 2.3 Cold, warm and retargeting audiences

| Audience | Landing page | What changes |
|---|---|---|
| **Cold** (has never seen eternal) | Ad-landing product page **with a 2-line cold top**: what eternal is ("Cairo-made eaux de parfum, each named after the scent it's inspired by") plus the sample route | Sample/box offer near the button; tell the story through a "why eternal" block lower down |
| **Warm** (follows the account, watched 50%+ of a video, engaged) | Normal product page or the quiz | Bestsellers first; offer strip only for confirmed offers |
| **Retargeting** (viewed a product, added to bag) | **The exact product they viewed**, or `/bag` with the bag restored | Lead with the reason to finish (cash on delivery, delivery time, sample credit), not the story |

Restoring the bag for retargeting is hard in practice. The bag sits in the in-app browser's `localStorage`, and the retargeting click may open a fresh browser. A server-side cart keyed on email or WhatsApp, or the Shopify cart ID saved in a cookie, makes it survive. UNVERIFIED whether Instagram's browser keeps `localStorage` between sessions; test it.

### 2.4 Personalising the page from the ad's UTMs
I found no strong primary study; the case rests on matching the page to the ad (2.1).

**Suggested build:**
- Read `utm_content` (or a short `?a=` key) on the server.
- Look it up in a table at `content/ads.ts` holding the offer strip text, gallery order, first-line copy and default size.
- Render on the server, so nothing jumps after load.
- Only confirmed offers may appear. The current announcement, "Two free 5 ml samples with every order [confirm offer]" (`content/site.ts`), must not go to ad traffic until it is confirmed.

### 2.5 Why people leave in the first 3 seconds

**Evidence on speed and attention:**
- Google: 53% of mobile visits are abandoned when a page takes more than 3 s; bounce probability rises 32% as load time goes from 1 s to 3 s. [P: Think with Google, 2016–17]
- Facebook (2017): "as many as 40 percent of website visitors abandon a site after three seconds of delay". Facebook also began ranking links by estimated load time. [P: about.fb.com]
- NN/g: users often leave pages within 10–20 s; the value proposition has to land within 10 s. [P: NN/g]
- Baymard: when the price was hard to see, users "began to view the entire site negatively". [P: Baymard]

**Causes on eternal's site, from the code:**
- The intro curtain (`Loader.tsx`)
- The page cross-fade (`PageFade.tsx`)
- An image taller than the visible screen pushing the price below it
- An offer strip that doesn't match the ad
- Any arrival pop-up (don't add one)
- The WhatsApp button (`fixed bottom-24 right-4`) can sit over content once the sticky bar appears

### 2.6 Instagram Shopping and product tags
- **Instagram lists Egypt as a "managed partner market"** for Shopping in EMEA, unlike the markets open to "all eligible businesses". [P: Instagram Help, via search extract] Whether a small Egyptian brand can tag products without a Meta partner is UNVERIFIED. Try connecting the catalog through Shopify's Facebook & Instagram app.
- **Meta ended native checkout on Facebook and Instagram by about August 2025.** Shop listings and Shops ads now send people to the merchant's website. [S: PPC Land, Feedonomics]

So product tags are simply another way into eternal's product pages. Two consequences:
- The catalog's product URLs must point to the **Next.js product pages**, not myshopify.
- Use a redirect theme on the Shopify online store so any myshopify product URL forwards (301) to the Next.js page (as in shopify.dev's "Redirect traffic to the Hydrogen channel").

---

## 3. Fragrance-specific ad funnels

### 3.1 "Smells like X" hooks
- **Dossier** (founded 2018): its first hit was inspired by a Tom Ford scent. About **$60M US sales in 2025, +120% year on year** as of February 2026. Now the top fragrance brand at Walmart. [S: Glossy] Its ads compare products to the luxury originals. [S]
- **Oakcha:** designer-versus-dupe price comparisons; TikTok Shop sales **$6.2M in H1 2025, +125% year on year**. [S: Glossy/WWD]
- **ALT. Fragrances:** price face-offs in ads. When iOS 14 weakened Facebook and email, it moved to SMS (Yotpo claims 48× ROI). [V]

**What eternal should do:**
- Use "If you love [original], start with [eternal name]" as the hook. It leads with the scent you'd recognise and is consistent with the existing "Inspired by … our own composition" line.
- **Do not copy Dossier/Oakcha price face-offs.** They break the "not discount-driven" rule.
- **Never show the original's bottle or logo** in creative.
- **Policy risk:** Meta's counterfeit and trademark ad policies, and Egyptian trademark law, may bite when ads name the original brand. I could not check the policy text in this session (UNVERIFIED). Test one ad set naming a brand before scaling, and keep backup creative that names only the scent family.

### 3.2 Sample-first offers for cold audiences
- **Snif:** sent testers plus sealed full bottles; you pay after 7 days for what you keep. Later moved into Ulta and Target. [S: Fast Company, Retail Dive]
- **Henry Rose:** discovery sets with a rebate toward a full bottle, with "high double-digit conversion". [S] The number is UNVERIFIED.
- **A British luxury fragrance brand (agency case):** a discovery-set offer on Meta reached 3.2× return on ad spend. [V: agency]

**What eternal should do:**
- Keep the 5 ml sample with its price credited to a bottle as the **cold-traffic offer**. Show the credit as a real code in the bag and the confirmation, not only in copy.
- Consider turning the mystery box into **"your 3, picked by the quiz"** for cold traffic. A "mystery" choice removes the control that a visitor with no favourite scent most needs. Test this as an A/B.
- Follow up within the sample's wear window, about days 3–7, on WhatsApp/SMS with the credit code.
- Be careful with the maths: an EGP 250 order rarely covers the cost of acquiring the customer. Judge the box by how many box buyers later buy a bottle, not by first-order return on ad spend.

### 3.3 Quiz funnels
- **Pinrose:** 1M+ quizzes, "80%+ match". [S/V]
- **Jones Road:** shade quiz with 16% conversion. [V]

**What eternal should do:** use `/finder` as the landing page for "find yours" ads.
- 4–6 questions.
- Results show **3 scents plus "try all 3 as samples"**.
- Ask for email or WhatsApp *after* the results, optionally. Never gate the results.
- Fire a custom `QuizComplete` event to Meta.

---

## 4. The 3-second rule, page speed, ad cost and landing page views
- **Speed and conversion:**
  - Google/Deloitte "Milliseconds Make Millions" (2020, 37 brands): a **0.1 s faster mobile site lifted retail conversions 8.4% and order value 9.2%**. [P: Deloitte/Think with Google]
  - Vodafone: a **31% better LCP (time for the main image or text to appear) produced 8% more sales** in an A/B test with no visual change. [P: web.dev]
  - Google's "good" thresholds: LCP ≤ 2.5 s, INP (delay before the page responds to a tap) ≤ 200 ms, CLS (layout jumping) ≤ 0.1.
- **Speed and ad cost:** Facebook said it factors site speed into ad delivery and the auction. [S: Forbes 2016] The common claim that a slow page raises CPM through quality signals is practitioner opinion, not a published Meta mechanism.
- **Landing page view (LPV) optimisation:**
  - A landing page view counts only when the page loads and the pixel fires. [P: Meta]
  - Meta suggests LPV optimisation when an ad set gets fewer than about **50 conversions per week**, or before purchase events are set up. [P: Meta Business Help]

**What eternal should do:**
- Never optimise for link clicks.
- **Launch:** optimise sales campaigns for Purchase when the budget can reach about 50 purchases per week per ad set. Otherwise use AddToCart for a short while.
- Use LPV for creative and landing-page tests and for building retargeting pools.
- **Treat landing page views ÷ link clicks as a speed health metric.** Aim for at least 80% (a practitioner rule of thumb, UNVERIFIED). If it drops, the page is too slow in the in-app browser.

**Speed targets for the ad-landing product page** (my recommendation, not sourced):
- LCP ≤ 2.0 s on a mid-range Android over 4G
- First-party JavaScript ≤ about 150 KB gzipped
- Hero image ≤ 60 KB AVIF/WebP with `fetchpriority="high"`
- No intro curtain, no fade, no web-font flash delaying the title

---

## 5. Spec: the first screen of an ad-landing product page (390×844)

**Today** (estimated from the CSS, not a render): the 36 px offer strip, 72 px header, about 42 px breadcrumb and 24 px padding leave the 4:5 gallery (86vw ≈ 335×419) ending around y≈593. After that, all estimated:
- title at about y≈650–700
- price at about y≈790
- "Inspired by" at about y≈820–870
- Add to bag at about y≈1,150–1,250

In Instagram the visible area is smaller, roughly 390×660–710 once the status bar and Instagram's top bar are taken off. The exact chrome height is UNVERIFIED: log `innerHeight` by user agent to confirm. So **the first screen today shows the strip, the header, the breadcrumb and most of one image — no price, no "inspired by", no button.** The sticky bar (`BuyBox.tsx` IntersectionObserver: `top < 0`) appears only after the button has scrolled *above* the screen.

**Target layout, planned for a 390×640 safe area** (y in CSS px). Apply it when there is a `fbclid`/`utm_source`, or the user agent contains `Instagram`/`FBAN`:

| y | Element | Rules |
|---|---|---|
| 0–32 | Offer strip | Only a **confirmed** offer, matched to the UTM; otherwise hidden. One line, no ticker. |
| 32–88 | Compact header (56 px) | Wordmark and bag only; no mega menu or search trigger. **No breadcrumb** (move it to the footer of the page). |
| 88–388 | Hero image, 300 px tall (≈4:3.1, or 1:1 at 300 px wide, centred) | **The ad's packshot as frame 1.** Swipe dots plus "1/5". Server-rendered `<img>` with `fetchpriority=high`. No video unless its poster is this image. |
| 400–440 | Scent name (serif, 30–32 px) **and price, right-aligned on the same row** (20 px, ≥ 4.5:1 contrast) | Matches Baymard's rule that price must be immediately visible. |
| 444–486 | "Inspired by **X** · our own composition" plus one line on how eternal differs | The hook from the ad, word for word. |
| 492–522 | 3 note chips (top · heart · base), e.g. "Salt · Fig · Cedar" | Tapping a chip scrolls to the notes pyramid. |
| 530–574 | Size segmented control, 44 px: "55 ml · EGP X" / "5 ml · EGP Y, credited back" | Default to 55 ml; default to 5 ml when the ad was a sample ad. |
| 584–636 | **"Add to bag · EGP X"**, full width, 52 px | The main button stays inside the first screen. |
| just below | One line: "Cash on delivery (+EGP fee) · Delivered in N days · [returns]" | Show the cash-on-delivery fee and shipping threshold *before* checkout. Baymard: **39% abandon over unexpected extra costs**. [S, citing Baymard 2025] |

**Rules that apply across the page:**
- **Sticky Add to bag** whenever the main button is off screen, *above or below* (on ad landings, change the condition from `top < 0` to `!isIntersecting`).
- Move the WhatsApp button above the sticky bar so it never covers a button.
- **Off:** the intro curtain, the page cross-fade, pop-ups, auto-rotating carousels and the "add a sample too" checkbox. That checkbox moves below the first screen.
- **No** star ratings until real reviews exist, and no stock counts or countdowns.
- **Below the first screen, in order:** a short "Why eternal" block (cold traffic only), the notes pyramid, how it differs from the original, the FAQ (cash on delivery, longevity, returns), pairings.

---

## Recommendations ranked by expected impact

| # | Action | Where | Effort |
|---|---|---|---|
| 1 | **Fix tracking before spending on ads:** checkout on a same-root subdomain; pixel and CAPI with shared `event_id`; `fbclid` → `_fbc` set by the server; UTMs and `fbclid` copied to cart attributes; Shopify Facebook & Instagram app on Maximum; pixel in `<head>`. | `lib/shopify/client.ts`, new `middleware.ts`, `app/api/checkout/route.ts`, new `app/api/meta/route.ts`, `app/layout.tsx` | M |
| 2 | **Rebuild the ad-landing product page's first screen** to the section 5 spec, plus the sticky button from load. | `app/products/[handle]/page.tsx`, `Gallery.tsx`, `BuyBox.tsx`, `Header.tsx`, `WhatsAppFloat.tsx` | M |
| 3 | **Speed for ad traffic:** skip `Loader` and `PageFade` when ad parameters or an in-app user agent are present; prioritised hero image; check LCP in a real Instagram browser; watch landing page views ÷ clicks. | `components/motion/Loader.tsx`, `MotionScript.tsx`, `PageFade.tsx` | S |
| 4 | **Show the full cost up front:** cash-on-delivery fee, shipping threshold and delivery time on the product page and in the bag; free-shipping progress in the bag. | `BuyBox.tsx`, `CartDrawer.tsx` | S |
| 5 | **Map each ad to its destination** (table in 2.2), including filtered collection links that keep the ad's order. | `app/shop/page.tsx` (`?h=` support), ad naming plan | S |
| 6 | **Sample-first for cold traffic:** 5 ml sample with a visible credit code; test a quiz-picked "your 3" box against the mystery box; WhatsApp follow-up on days 3–7. | `BuyBox.tsx`, mystery box page, `/finder` | M |
| 7 | **UTM-driven offer strip and gallery order** from `content/ads.ts`, rendered on the server, confirmed offers only. | `Header.tsx`, product page | S |
| 8 | **Quiz as the landing page for "find yours" ads:** at most 6 questions, results not gated, 3 scents plus a samples option, `QuizComplete` event. | `/finder`, `components/finder/Finder.tsx` | S–M |
| 9 | **"If you love X" hooks** with eternal-only creative; test policy risk on one ad set first. | Ad creative | S |
| 10 | **Paymob card app with Apple Pay/Meeza** (works in Safari, not in Instagram on iPhone); consider InstaPay/Fawry later. | Shopify payments setup | S |
| 11 | **Catalog and product tags:** catalog URLs point at the Next.js pages; redirect theme on Shopify; check whether Egypt tagging needs a partner. | Shopify admin, redirect theme | S |
| 12 | **Measure in-app versus Safari** (user-agent tag on every event; log `innerHeight`). Build the "Continue in Safari" bag link only if iPhone payment drop-off justifies it. | Analytics, `CartProvider.tsx` | S, then M |

---

## Sources
(All read through search-tool extracts; full-page fetches were blocked by the environment.)

**In-app browser and wallets**
- https://webkit.org/blog/9674/new-webkit-features-in-safari-13/
- https://developer.apple.com/forums/thread/714877
- https://bugs.webkit.org/show_bug.cgi?id=197751
- https://krausefx.com/blog/ios-privacy-instagram-and-facebook-can-track-anything-you-do-on-any-website-in-their-in-app-browser
- https://threatpost.com/facebook-ios-tracks-anything/180395/
- https://theconversation.com/instagram-and-facebook-are-stalking-you-on-websites-accessed-through-their-apps-what-can-you-do-about-it-188645
- https://www.meta.com/help/meta-pay/1896636927418202/
- https://u2l.ai/blog/how-to-disable-in-app-browser
- https://linktw.in/ppc-social-ads
- https://getescapehatch.com/
- https://www.shopify.com/blog/apple-pay-for-business
- https://developers.googleblog.com/en/adding-support-for-google-pay-within-android-webview/
- https://developer.chrome.google.cn/docs/android/payments-in-webviews

**Egypt payments**
- https://newsroom.mastercard.com/news/eemea/en/newsroom/press-releases/en/2024/december/in-collaboration-with-the-central-bank-of-egypt-and-egyptian-banks-company-mastercard-brings-apple-pay-to-customers-in-egypt/
- https://9to5mac.com/2024/12/10/apple-pay-egypt/
- https://www.dailynewsegypt.com/2024/12/12/mezza-apple-pay/
- https://apps.shopify.com/paymob-debit-credit-card
- https://ecosire.com/blog/shopify-payment-gateways-by-country-2026
- https://www.psmarketresearch.com/market-analysis/egypt-e-commerce-market
- https://www.mordorintelligence.com/industry-reports/egypt-ecommerce-market

**Tracking**
- https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters
- https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
- https://developers.facebook.com/docs/marketing-api/conversions-api/dataset-quality-api/
- https://www.facebook.com/business/help/2041148702652965
- https://www.jonloomer.com/meta-announces-big-changes-to-website-conversion-campaigns/
- https://www.deptagency.com/en-dk/insight/metas-removal-of-aggregated-event-measurement-aem-and-its-implications-for-advertisers/
- https://shopify.dev/docs/storefronts/headless/hydrogen/analytics/validation
- https://shopify.dev/docs/storefronts/headless/hydrogen/analytics/consent
- https://shopify.dev/docs/storefronts/headless/hydrogen/migrate/redirect-traffic
- https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing
- https://shopify.dev/docs/api/storefront/latest/mutations/cartBuyerIdentityUpdate

**Landing page views and speed**
- https://en-gb.facebook.com/business/help/203012060587398
- https://www.facebook.com/business/help/347201839437027
- https://about.fb.com/news/2017/08/news-feed-fyi-showing-you-stories-that-link-to-faster-loading-webpages/
- https://www.forbes.com/sites/kathleenchaykowski/2016/08/31/facebook-cuts-down-loading-time-of-ad-links-factors-speed-into-ad-auction/
- https://www.searchenginejournal.com/facebook-mobile-prefetching/172180/
- https://www.thinkwithgoogle.com/_qs/documents/9757/Milliseconds_Make_Millions_report_hQYAbZJ.pdf
- https://deloitte.com/ie/en/services/consulting/research/milliseconds-make-millions.html
- https://business.google.com/ca-en/think/marketing-strategies/mobile-page-speed-new-industry-benchmarks/
- https://web.dev/case-studies/vodafone
- https://web.dev/case-studies/vitals-business-impact

**Landing-page UX**
- https://www.nngroup.com/articles/how-long-do-users-stay-on-web-pages/
- https://baymard.com/research-articles/current-state-ecommerce-product-page-ux
- https://baymard.com/lists/cart-abandonment-rate
- https://cxl.com/blog/landing-page-optimization/
- https://scalemessaging.com/landing-page-vs-product-page-the-a-b-test-that-boosted-revenue-by-17/
- https://thegood.com/insights/landing-page-vs-product-page/

**Quizzes**
- https://www.octaneai.com/blog/quiz-landing-pages-vs-product-pages
- https://www.octaneai.com/case-studies/jones-road-beauty
- https://pinrose.com/pages/find-your-scent

**Instagram Shopping**
- https://help.instagram.com/337910740093030
- https://ppc.land/meta-phases-out-facebook-and-instagram-shops-checkout-by-august-2025/
- https://feedonomics.com/blog/meta-removing-native-checkout/

**Fragrance brands**
- https://www.glossy.co/beauty/dupe-fragrance-has-hit-the-mainstream-now-what/
- https://www.clear.co/blog/finances-fragrance-ecommerce-brand-dossier-advertising-success
- https://wwd.com/beauty-industry-news/fragrance/fragrance-dupes-oakcha-jo-milano-tiktok-shop-phlur-1238032522/
- https://www.yotpo.com/case-studies/alt-fragrances-case-study/
- https://www.fastcompany.com/90562875/fragrance-startup-snif-wont-tell-you-what-their-perfumes-smell-like-you-have-to-sniff-them-for-yourself
- https://www.retaildive.com/news/snif-dtc-fragrance-brand-enters-ulta-beauty-brick-and-mortar-wholesale/689689
- https://motionapp.com/library/henry-rose
- https://pixated.agency/success-stories/luxury-british-fragrance-brand/

**Repo files cited**
- `/home/user/ETERNAL_E-Commerce/lib/shopify/client.ts`
- `/home/user/ETERNAL_E-Commerce/app/api/checkout/route.ts`
- `/home/user/ETERNAL_E-Commerce/app/products/[handle]/page.tsx`
- `/home/user/ETERNAL_E-Commerce/components/product/BuyBox.tsx`
- `/home/user/ETERNAL_E-Commerce/components/product/Gallery.tsx`
- `/home/user/ETERNAL_E-Commerce/components/motion/Loader.tsx`
- `/home/user/ETERNAL_E-Commerce/components/motion/PageFade.tsx`
- `/home/user/ETERNAL_E-Commerce/components/chrome/WhatsAppFloat.tsx`
- `/home/user/ETERNAL_E-Commerce/components/cart/CartProvider.tsx`
- `/home/user/ETERNAL_E-Commerce/content/site.ts`
- `/home/user/ETERNAL_E-Commerce/app/globals.css`
