# eternal — CRO playbook

*v1 · 3 October 2026 · Next.js headless storefront on Shopify Grow (hosted checkout) · written for phone visitors who arrive from paid Instagram and Facebook ads*

**Labels:**
- **VERIFIED**: checked against a primary source, the live store or the repo.
- **[K]**: well-known published work, not re-read for this playbook.
- **UNVERIFIED**: a direction only. Never use it in customer copy.
- **[confirm]**: a fact the owner must supply.

Numbers from vendors who sell the fix are left out.

**The short version.** In their first ten seconds, visitors from Instagram ads hit four problems:
- a loading curtain;
- a product page whose first screen shows no price and no button;
- costs that only appear at checkout;
- the fear of buying a scent they can't smell.

Remove those four and judge everything on *delivered* orders. Then the numbers below work.

---

## 1. The economics

### 1.1 What "six figures a month" takes

**Assumptions** (UNVERIFIED; replace with the owner's numbers):
- Average order value (AOV) EGP 1,400.
- Contribution before ads EGP 726 per order. This assumes prices include 14% VAT, COGS is 22%, delivery costs 80, samples 40, packaging 30 and payment fees 3%.
- 12% of placed orders are refused at the door, at about EGP 230 each.
- 80% of sessions are paid, at EGP 8 each.
- Conversion rate (CVR) 1.8%.
- EGP 49 = USD 1.

| Monthly target | Delivered orders | Placed orders | Sessions / month | Sessions / day | Ad spend | Contribution after ads |
|---|---|---|---|---|---|---|
| EGP 100k (~$2k) | 71 | 81 | 4,500 | 150 | EGP 29k | EGP 21k |
| EGP 1M | 714 | 812 | 45,000 | 1,500 | EGP 289k | EGP 208k |
| EGP 2.5M | 1,786 | 2,029 | 113,000 | 3,760 | EGP 722k | EGP 519k |
| **$100k (~EGP 4.9M)** | **3,500** | **3,977** | **221,000** | **7,400** | **EGP 1.41M (~$29k)** | **EGP 1.02M (~$21k)** |

**Which "six figures"?**
- **In EGP**, six figures is a launch-month milestone of 2–3 orders a day.
- **In USD**, it is about 50 times larger: around 130 orders and 7,400 sessions a day. At that scale, audience size and creative fatigue run out before the budget does. Egypt's Instagram ad reach is 20.1M (DataReportal 2025, UNVERIFIED).
- **The owner must say which one is meant.**

### 1.2 The levers at $100k a month

| AOV | CVR | EGP / session | Refused | Ad spend | Contribution | Delivered MER |
|---|---|---|---|---|---|---|
| 1,100 | 1.2% | 12 | 21% | 4.51M | **−2.40M** | 1.09 |
| 1,400 | 1.2% | 8 | 21% | 2.36M | **−0.04M** | 2.07 |
| 1,400 | 1.8% | 8 | 21% | 1.58M | +0.75M | 3.11 |
| 1,400 | 1.8% | 8 | 12% | 1.41M | +1.02M | 3.46 |
| 1,400 | 1.8% | 12 | 12% | 2.12M | +0.31M | 2.31 |
| 1,400 | 2.5% | 8 | 12% | 1.02M | +1.41M | 4.81 |

- **Conversion is the biggest lever.** Going from 1.2% to 1.8% turns break-even into EGP 0.75M a month of contribution. The reason: the cost to acquire a customer is the cost per session divided by CVR.
- **Refusals matter as much as AOV.** Cutting refusals from 21% to 12% is worth about EGP 0.27M a month. Confirming COD orders (5.1) is profit work.
- **Cost per session decides the rest.** Paying EGP 12 instead of 8 wipes out about 70% of contribution. Page speed and matching the page to the ad are how the site brings that cost down.
- **Break-even ROAS is 1.93** on gross revenue including VAT, or about 1.65 if VAT doesn't apply (VAT status UNVERIFIED). Meta's reported median ROAS for beauty is 1.54 (Triple Whale, UNVERIFIED), so an average result is not enough.

**Targets:**
- paid CVR ≥1.8%;
- AOV ≥EGP 1,400;
- refusals ≤12% of placed orders;
- delivered MER ≥3.

### 1.3 Funnel targets (6% × 55% × 55% ≈ 1.8%)

| Step | Benchmark (all UNVERIFIED) | Floor | Target |
|---|---|---|---|
| Session → add to bag | Shopify median ~6.5% (Littledata); beauty 8.9–10.1% | 4% | 6–7% |
| Add to bag → checkout | ~75% across 21 Shopify stores (dtcpages 2026) | 45% | 55%+ |
| Checkout → order | 65% median across 16 DTC stores | 50% | 55–60% |
| **Session → order** | Paid social 0.8–1.2% (Littledata); Meta 1.53% (Triple Whale); all mobile 2.03% (Contentsquare) | 1.0% | **1.8%** |
| Placed → delivered | COD refusals quoted at 12–30% of COD orders | 80% | ≥88% |
| Landing-page views ÷ clicks | No reliable benchmark | Week-1 baseline | Alert on a 10-point drop |

---

## 2. Twelve principles

1. **The product page is the landing page.** Most ads sell one scent, so most visitors should land on that scent's page.
   *Evidence:* Zorali added a cold-traffic top section to its product pages and saw +17% revenue per visitor (agency case study, UNVERIFIED).
2. **The first screen sells, or nothing does.** Today the price sits about 790 px down the page and "Add to bag" about 1,150 px down (estimated from the code).
   *Evidence:* Baymard found that a price that is hard to see made users distrust the whole site (search extract, UNVERIFIED).
3. **Every 100 ms costs ad money.**
   *Evidence:* in Vodafone's A/B test of visually identical pages, a 31% better LCP gave +8% sales (VERIFIED). Deloitte's "0.1 s = +8.4%" is correlational, so use it for direction only.
4. **No surprise costs.** The full delivered price must be visible before the shopper taps Checkout.
   *Evidence:* "extra costs" is Baymard's #1 reason people abandon a cart. Sources agree on the rank but not the percentage (UNVERIFIED). 64% of Baymard's test users looked for shipping cost on the product page (extract, UNVERIFIED).
5. **Remove the risk before asking for money.**
   *Evidence:* Snif's try-at-home option made up 80% of its orders (WWD, reported). Byredo and Commodity credit the discovery set's price against a full bottle.
6. **Match the ad.** Use the same image, words, offer and colour.
   *Evidence:* CXL's message-match principle. The often-quoted "212%" lift has no source.
7. **Build for COD and the in-app browser, not wallets.**
   *Evidence:* the store supports no digital wallets (VERIFIED). Shop Pay needs Shopify Payments (VERIFIED). Instagram's browser shares no cookies with Safari or Chrome.
8. **Optimise for delivered orders.** A refused parcel costs about EGP 230, and its ad spend is never recovered (1.2).
9. **Measure before you scale.** Purchase must fire exactly once, from a checkout on the storefront's root domain.
   *Evidence:* Shopify requires this so cookies and consent carry over (VERIFIED). The primary domain is still `eternal-10199.myshopify.com` (VERIFIED).
10. **Fewer choices for strangers; fast search for people who know the original.**
    *Evidence:* choice overload shows up reliably when preferences are uncertain (Chernev 2015 meta-analysis [K]). People who already know what they want prefer larger ranges (Chernev 2003 [K]).
11. **Honest proof or none.** No fake reviews, stock counts, timers or bestseller badges, and no visible `[placeholder]` text.
    *Evidence:* the FTC's fake-review rule (2024) [K]. Fake timers were found on 42 of 399 EU shops (2023) [K]. Purchase likelihood peaks at 4.0–4.7 stars, not 5.0 (Spiegel [K]).
12. **Ship the obvious; test only what the traffic can detect.**
    *Evidence:* at 1.5% CVR, detecting a +20% lift takes about 28,000 sessions per arm (VERIFIED). Below 20k sessions a month, test at the Meta ad level instead.

---

## 3. The Instagram-ad landing flow

### 3.1 Where each ad lands

| Ad | Destination | Default state |
|---|---|---|
| One scent ("If you love X, start here") | `/products/{scent}` | 55 ml selected; gallery frame 1 is the ad's packshot |
| Sample-first ad | `/products/{scent}` | 5 ml selected |
| Carousel of 3–5 scents | `/shop?h=a,b,c` | Only those scents, in the ad's order |
| Line ad | `/shop/her`, `/shop/him` or `/shop/unisex` | Hero matches the ad |
| "Not sure? Find yours" | `/finder` | First question on screen |
| "Try 3 for EGP 250" | `/products/mystery-box` | Runs as its own ad set (5.4) |
| Retargeting | The product they viewed, or `/bag` rebuilt from variant IDs | Lead with COD, delivery date and the sample credit |
| Brand film | Home page or a tale | Awareness only |

### 3.2 Message match

Four things carry over from the ad to the page:
- **Image.** The ad's packshot is gallery frame 1.
- **Words.** The hook, the scent name and the line name repeat word for word.
- **Offer.** Shown only once confirmed. Until then the offer strip is hidden, never shown as "[confirm offer]".
- **Colour.** The page background is `scent.world.bg`.

Keep each ad's settings in `content/ads.ts`, keyed on `utm_content`, and render them on the server. Detect the in-app browser on the server from the user agent (`Instagram`, `FBAN`/`FBAV`, or the `inapp-spy` npm package), so nothing flashes on load.

### 3.3 Product page: first screen on a 390 × 844 phone

Instagram's in-app browser leaves roughly 640–710 px of visible height (UNVERIFIED; log `innerHeight` by user agent to confirm). Design for 640 px.

| y (px) | Element | Rule |
|---|---|---|
| 0–32 | Offer strip | Confirmed offer that matches the ad, or hidden |
| 32–88 | Header, 56 px | Wordmark, search, bag; no breadcrumb |
| 88–388 | Gallery frame 1, 300 px tall | Rendered on the server as `<img>` with `fetchpriority="high"`; a "1/6" counter; no video |
| 400–440 | Name in serif at 30 px; price right-aligned at 20 px | |
| 444–486 | "Inspired by **X** · our own composition", plus one line on how it differs | The ad's hook, word for word |
| 492–522 | Three note chips and wear hours ("7–8 h · our wear test [confirm]") | Tapping a chip scrolls to the notes pyramid |
| 530–574 | Size control, 44 px: "55 ml · EGP X" / "5 ml · EGP Y · credited back" | Default depends on the ad type |
| 584–636 | **"Add to bag · EGP X"**, full width, 52 px | |
| Next line | "Arrives {date} · Cash on delivery · Smell it before you open it" | Each item opens a bottom sheet |

- **Sticky bar.** Show it whenever the main button is off screen, whether above or below. In `BuyBox.tsx`, change `top < 0` to `!isIntersecting`.
- **Not on this screen:** the curtain, fades, pop-ups, star ratings, or the "add the sample too" checkbox.

### 3.4 Home page: first screen

- **Hero:** 75–80svh. The poster image loads first, and the video only starts once the page is idle.
- **Copy:**
  - A positioning line: "Eaux de parfum from Cairo, each named for the scent it's inspired by" [confirm].
  - An offer line: "From EGP 885 · try any scent in 5 ml first" [confirm].
- **Buttons:** a primary **"Shop the scents"** (52 px) and a text link, **"Find yours in 60 seconds"**.
- **Below the hero:** the line tiles peek above the fold.

---

## 4. Page-by-page spec (mobile first)

### 4.1 Global elements

| Element | Decision | Spec and why |
|---|---|---|
| Announcement bar | Change | 32 px. One confirmed offer with an end date, matched to the ad, or a real gift deadline ("Mother's Day: order by 18 March for Cairo" [confirm]). Hidden otherwise |
| Header | Change | 56 px: menu, wordmark, search, bag. The bag is 44 × 44 and within thumb reach |
| Menu | Change | Audience first: "For her · eterna", "For him · eterno", "Unisex · eternal", "Samples & mystery box", "Find your scent", then Tales, House, Help. The line names differ by one letter, so never show them alone |
| Chip row | Add | Her · Him · Unisex · Samples · Find your scent, on home and `/shop`; 44 px targets |
| Search | Change | Show "Popular originals" before typing. Every inspired-by name is searchable. Add scope suggestions and a visible submit button. Input text ≥16 px. A visible search field on `/shop` |
| WhatsApp button | Change | Set `site.whatsapp` (currently `null`). 48 px, above the sticky bar, hidden while the drawer or keyboard is open. Message prefilled with the scent name. A plain `wa.me` link, no SDK |
| Footer | Add | Legal name, registration number, tax ID, address, WhatsApp hours [confirm]. A not-affiliated line. "How we collect reviews". Logos only for payment methods that are live |
| Loading curtain | Cut for ads | Skip it when the URL has `utm_*` or `fbclid`, on any page but home, and in in-app browsers; ideally on all mobile (`MotionScript.tsx`). It adds about 500 ms to every first visit |
| Viewport | Fix | `viewportFit: "cover"`, safe-area padding on fixed bars, and `scroll-padding-bottom` equal to the bar height (WCAG 2.4.11) |
| Type and tap targets | Fix | Body 16 px, captions ≥12 px, inputs ≥16 px (iOS zooms in below 16 px). Tap targets ≥44 px; main buttons 48–52 px. Fix contrast: ash on sand 4.06, stone placeholder 2.63, gold numerals 3.11 |

### 4.2 Home page, in order

1. Hero (3.4).
2. Proof strip: one row, confirmed facts only.
3. Line tiles: three 3:4 tiles side by side with scent counts, each linking to the full line. Today's stacked tiles take about 1,250 px of scrolling.
4. "Where to start", renamed from "Most worn this month": a 2 × 2 grid plus "See all", labelled as an editorial pick.
5. Try before you commit, moved up from 8th place.
6. Finder entry.
7. Shop by mood.
8. Featured tale.
9. House film, which loads only on tap.
10. Tales teaser.

Home variants used as ad landings drop the last two sections. No autorotating carousels.

### 4.3 Collection pages

- **Grid.**
  - Two columns: show 24 first, then "Show all {n} more".
  - Support `?h=` for carousel ads.
  - The first row loads immediately and fully visible. Preload 2 cards, not 4.
- **Chips, in order.**
  1. Line.
  2. Family, with counts.
  3. Strength: "Close to the skin / Arm's length / Fills the room", mapped from `sillage` and using the finder's words.
- **Filters.**
  - The filter button stays visible while scrolling.
  - The bottom sheet ends with "Show {n} scents".
  - Applied filters show as removable chips.
- **Cards.**
  - Order: line, name, "Inspired by X", three notes, price, then review count (from 5 reviews).
  - A full-width **"Add"** button (44 px) with a **"Try 5 ml"** text link.
- **For shoppers who don't know what they want.** Pin 4–6 "Start here" picks per line. Put a "Find by the one you know" search field above the grid.

### 4.4 Product page, below the first screen

1. **Sticky bar.** 64 px plus the safe-area inset. It holds the name, the size toggle and "Add to bag · EGP X" (48 px). It shows from page load whenever the main button is off screen.
2. **Gallery, 6–8 frames:**
   - packshot;
   - a spray loop (still until tapped);
   - the bottle in a hand;
   - the 55 ml beside the 5 ml;
   - a flat-lay of the notes;
   - the box;
   - a lifestyle shot;
   - later, customer photos used with permission.

   Add thumbnails, a "+N" tile and pinch zoom. Use source images of at least 2,048 px. Never show the original's bottle or logo.
3. **Promise block.** 13–14 px in the body colour. Each line opens a bottom sheet:
   - delivery date and cut-off;
   - delivery cost;
   - payment methods;
   - "Smell it before you open it";
   - returns.
4. **"How it differs from {original}".** Expanded.
5. **Notes pyramid.** Expanded, in plain words.
6. **"Wear it".** Hours, projection and season, labelled "perfumer's estimate" until tested.
7. **Reviews.** An honest empty state for now (5.6).
8. **FAQ.** An accordion, no tabs: longevity, "is this the original?", COD, returns, sample credit.
9. **One curated pairing.** Give the reason the two go together.
10. **Tale excerpt.** Four lines, then "Read the tale (2 min)".
11. **Recently viewed.**

Also:
- On mobile, hide the visible breadcrumb but keep the `BreadcrumbList` JSON-LD.
- Add no review markup until real reviews exist.
- The "Add the sample too" checkbox becomes the 5 ml size option. No product has a second variant yet (VERIFIED).
- Low-stock messages come from live inventory only: "Few left in this batch: {n}".

### 4.5 Cart drawer

A bottom sheet that opens automatically after an add and shows one suggestion at a time.

1. **Header.** "Your bag ({n})".
2. **Delivery row.**
   - With a bottle in the bag: "Delivery included".
   - With samples or the box only: "Add any bottle and delivery is included", plus a meter.
3. **Free samples [confirm].** "Your two 5 ml samples: your bottle's twin, plus one matched to it, or choose." Stored in the `free_samples` attribute.
4. **Line items.** Sample lines say "EGP {Y} comes back as credit on its 55 ml".
5. **Suggestion slot.** One item, picked in this order:
   1. "Make it a bottle", for bags with only samples or the box.
   2. The paired scent as a 5 ml.
   3. The mystery box.

   Show the price, "Add" and "Not now".
6. **Gift (collapsed).** A message of up to 150 characters, plus "Hide prices on the slip".
7. **Pinned footer.**
   - Subtotal, delivery, and "Cash on delivery: no extra fee" [confirm].
   - **Estimated total.**
   - **"Checkout · EGP {total}"**, 52 px.
   - Logos of the live payment methods.
   - "Arrives {date}".
   - "Send this bag to my WhatsApp".

Delete "Shipping and cash-on-delivery fee calculated at checkout" (`CartDrawer.tsx:213`, 11 px grey). Never use timers, reservation clocks or pre-ticked add-ons.

### 4.6 Checkout handoff

- **Create the cart early.** Run `cartCreate` on the first add and keep the cart ID in an httpOnly cookie.
  - Checkout then becomes a direct link to `checkoutUrl`.
  - Preconnect to the checkout domain when the drawer opens.
  - Today nothing before checkout can be recovered.
- **Domains and prefill.** The storefront runs on the custom domain and checkout on `checkout.{domain}`. Pass `buyerIdentity { countryCode: EG, phone }` when the phone number is already known (VERIFIED: this prefills checkout).
- **Checkout settings.**
  - Guest checkout; contact by phone *or* email.
  - Shipping phone required.
  - Company field hidden; address line 2 optional.
  - A marketing opt-in.
- **Bilingual labels.** Give the shipping rates and the COD method bilingual names with Western digits ("Cairo & Giza · 1–2 days / القاهرة والجيزة · 1–2 يوم"). These show in the hosted checkout on Grow (VERIFIED).
  - A fully Arabic checkout would mean translating every string by hand, because Shopify doesn't provide Arabic for checkout, plus right-to-left testing.
  - Field-level checkout extensions need the Plus plan (VERIFIED).
- **Launch tests.** Cover iOS and Android, in both the Instagram and Facebook in-app browsers, paying by card (the Paymob redirect plus 3-D Secure) and by COD.
  - Switching to the SMS app for the 3-D Secure code may reload the in-app browser (UNVERIFIED).
  - COD and the `recoveryUrl` are the fallbacks.

### 4.7 Finder, tales, house, help, 404

- **Finder.**
  - 4–6 questions, one per screen, with 48 px answer tiles.
  - Results show 3 scents with buy boxes inline and **"Try all 3 as 5 ml · EGP {sum}"**. Never put results behind a sign-up.
  - After the results, offer "Send my matches to WhatsApp" as an option. Save `quiz_profile` to the cart.
  - Judge the finder as an ad destination by its delivered acquisition cost.
- **Tales.** End each tale with buttons for that scent's 5 ml and bottle. Tales are for awareness only.
- **House.**
  - The founder, with a face [confirm].
  - Real photos of the making.
  - "Bottled in Cairo" only if literally true.
  - What "inspired by" means, and how reviews are collected.
- **Help.** One page with anchors that the bottom sheets link to:
  - delivery by governorate;
  - COD confirmation;
  - payments;
  - returns;
  - credit terms;
  - tracking;
  - WhatsApp hours.

  Put an Arabic line under each reassurance.
- **404.** Search by the original, links to the three lines, the mystery box and WhatsApp. Log `not_found` with the path to catch broken ad links.

---

## 5. Offer and trust architecture for Egypt

### 5.1 Cash on delivery

- **Plan for 60–75% COD** among first orders from cold traffic. Sources range from 34% to 70% (UNVERIFIED), so measure it in week 1.
- **No separate COD fee at launch.** Shopify can't attach a fee to a payment method; it can only rename, reorder or hide methods (VERIFIED).
  - Build the COD cost into delivery.
  - Reward paying online with something other than a discount: "Pay online and we add a third 5 ml".
  - If the owner insists on a fee, the same number must appear on the product page, in the drawer, in the COD method's name and in the WhatsApp message.
- **Confirmation loop.** Thank-you page extensions work on Grow (VERIFIED).
  1. The thank-you page shows a "Confirm on WhatsApp" button with the message prefilled.
  2. Within about 5 minutes, a WhatsApp utility template restates the exact total, address and date, with buttons: Confirm / Change address / Cancel.
  3. No reply in 3 hours: call. No answer in 24 hours: cancel.
  4. **Pack confirmed orders only.**

  Staff can add a 5 ml to an unpaid COD order through order editing (VERIFIED), so post-order add-ons happen here.
- **Risk controls.**
  - Hide COD above an order cap, and for numbers that have refused before. Hiding by cart total through a public app is VERIFIED.
  - Test asking first-time buyers outside Cairo and Giza for a delivery-fee deposit by InstaPay.
  - Turn on the courier's "allow opening" option if it offers one.
- **Track weekly:**
  - confirmation rate;
  - refusals by campaign, governorate, and new vs returning customer;
  - cost per delivered order.

### 5.2 Delivery promise

Promise a date, not a speed: "Arrives Thu 8 Oct in Cairo & Giza". Work it out from the courier's real cut-off and the visitor's governorate (Cairo by default). It rolls over at the cut-off and never resets per visitor. This is eternal's only countdown.

### 5.3 Returns: "Smell it before you open it"

- **At launch.** One of the two free samples is the 5 ml twin of the bottle bought. If the scent isn't right, the sealed bottle can be returned or exchanged within {n} days.
  - {n} must be at least the legal minimum. Law 181/2018 is commonly read as 14 days (UNVERIFIED).
  - One WhatsApp message starts a return, and eternal collects the bottle.
  - COD refunds go back by InstaPay or wallet within {n} days [confirm].
- **Phase 2, once COGS is known.** Test "first-bottle swap, even if opened, ≥80% left, once per phone number".
- **Wording.** No "100% satisfaction", no asterisks.

### 5.4 Samples, mystery box, discovery set

- **5 ml of every scent** at EGP {Y} each [confirm].
  - Each comes with a unique single-use credit code worth its price, valid for **60 days**, sent in the parcel and on WhatsApp.
  - Only say "credited back" once the codes actually work.
- **Mystery box (EGP 250).**
  - Margin before ads is about EGP 123 if the buyer pays delivery, or about EGP 43 if delivery is free.
  - Against an acquisition cost of EGP 400–800, the box is **not** the default offer for cold traffic.
  - Run it as its own ad set. Judge it on delivered acquisition cost plus the share of box buyers who buy a bottle within 60 days.
  - Test a trio picked by the quiz against the random box.
- **Themed trios and a discovery set come later.** Show a "value" figure only when it is the real sum of the individual prices.

### 5.5 Free delivery

**What the prices show** (VERIFIED from the snapshot):
- The median bottle is EGP 1,099.
- 35 of the 42 bottles cost 1,199 or less.
- 950 is the most common price.

**Why a threshold doesn't work at launch:**
- At a 1,750 threshold, adding the box closes the gap for only 2 bottles.
- At 1,350, a 950 bottle plus the box still falls short.

**Recommendation:**
- **Launch with delivery included on every bottle.** The EGP 80 is already in the margin model.
- Orders of only samples or only the box pay delivery, and only those bags show the meter.
- After 300–500 orders, test "free over EGP 1,350", judged on delivered revenue per session.

### 5.6 Proof with zero reviews

- **From day 0.**
  - Policies: COD, the twin sample, returns, the credit.
  - Measured facts: wear-test hours with the method, and concentration [confirm].
  - The people behind the brand: founder, address, registration number, WhatsApp hours.
- **Weeks −2 to 4: a disclosed tester panel.**
  - Send 100–150 sample boxes covering the 8–10 scents used in ads.
  - Label every review from the panel "Received free samples".
  - Publish closeness ratings with the number of testers, for example "12 testers who wear {original} rated closeness 4.1/5".
- **From week 2: customer reviews.** Ask on WhatsApp 10–14 days after delivery. Questions:
  - how close it is to the original;
  - "have you worn the original?";
  - hours it lasted;
  - projection;
  - where they wore it;
  - what they bought.

  Show the rating distribution, and put photo reviews first. Never filter out negative reviews. Offer a disclosed incentive for any review.
- **Stars.** Show them only once a scent has 5 or more real reviews. A house-wide rating must be labelled as house-wide. Until then, the empty state reads: "New to the house: no reviews yet. Our wear test: {X–Y} h on skin. Try the 5 ml first; its price comes off your bottle."
- **Badges.**
  - "Bestseller" only for scents with 10 or more real units sold in the last 30 days. Today the badge comes from a best-selling sort or a hand-set flag (`lib/catalogue.ts:80-87, 255`).
  - Totals like "1,000+ bottles sent" only above a threshold, rounded down and dated.
- **Placeholder gate.**
  - Unknown facts stay `[confirm]` in the source and render nothing on the site.
  - The build fails if a bracket reaches anything a customer sees.
  - The snapshot holds 42 bottles plus the box, so confirm the count before claiming "43 eaux de parfum" (VERIFIED).

### 5.7 "Inspired by" guardrails

- **Where the original's name may appear.** Only in the page body ("Inspired by X · our own composition · not affiliated").
  - Never in product titles, handles, catalog titles, JSON-LD `name`, or text on ad images.
  - Titles sync to Meta's catalog, where IP complaints get ads removed [K].
- **Words.** Never "dupe", "copy", "replica", "تقليد" or "هاي كوبي". In Arabic, use "مستوحى من". Never show the original's bottle or logo.
- **Legal risk.** *L'Oréal v Bellure* (CJEU 2009 [K]) is the cautionary case; the position under Egyptian law is UNVERIFIED.
  - Counsel signs off the English and Arabic wording.
  - Test one ad set that names a brand before scaling.

---

## 6. AOV and retention mechanics

- **Ladder.** 5 ml → mystery box → 55 ml → second bottle. Each step credits the one before.
- **Second bottle.** "Two bottles, one courier: a third 5 ml on us".
  - Use an automatic Buy X Get Y discount, which works on Grow. Cart Transform would need Plus (VERIFIED).
  - Add a curated gift pair: eterna + eterno.
- **Mystery box.** The default one-tap suggestion in the drawer when no other rule applies. Alt Fragrances' reported results for this pattern are a vendor claim.
- **After the order.** Shopify's post-purchase page skips COD and headless orders (VERIFIED). Upsell in the confirmation chat or call instead.
- **Capture contacts without an entry pop-up.**
  - Send finder results to WhatsApp.
  - "Send this bag to my WhatsApp": the customer starts the chat, which gives consent and a way out of the in-app browser.
  - An opt-in at checkout.
  - A delayed bottom sheet is acceptable: no more than a third of the screen, from the second page on. Never over the product page's first screen, and never spin-to-win.
- **Recovery** (opted-in customers only, no discounts).
  - About 1 hour after abandonment: WhatsApp with the `recoveryUrl`.
  - About 24 hours: answer one objection.
  - Optional, at 48–72 hours: an extra 5 ml for first-time buyers.
  - Shopify's abandoned-checkout email stays on as a backup.

| When | Message | Channel |
|---|---|---|
| Day 0 | Order / COD confirmation | WhatsApp utility template |
| 2–3 days after delivery | How to wear it, plus its tale | WhatsApp or email |
| Days 10–14 | Review request | WhatsApp, email as fallback |
| Days 21–30 | "Your next scent": 3 picks plus a credit reminder | WhatsApp or email |
| Days 50–55 | "Your credit expires {date}" | WhatsApp |
| Days 75–90 and 120–150 | Reorder link plus "try its sibling" | WhatsApp |

- **Loyalty, later.**
  - Now: a "give a box, get a box" referral.
  - After a second order: "the house" status, with free delivery always and a 5 ml of each launch.
  - No points and no subscription. Opt-in rules under Law 151/2020 are UNVERIFIED.
- **Real deadlines only.** Lunar dates are approximate:
  - Egyptian Love Day: 4 Nov
  - White Friday: late Nov
  - Valentine's Day: 14 Feb
  - Ramadan and Eid al-Fitr: around Feb–Mar 2027
  - Mother's Day: 21 Mar
  - Eid al-Adha: around May 2027

---

## 7. Speed and measurement

### 7.1 Budgets (p75, mobile, Egypt, pages that ads land on)

| Metric | Budget |
|---|---|
| LCP | ≤2.0 s. Google's "good" is 2.5 s; web.dev's Renault case shows gains continuing below 2 s |
| INP | ≤150 ms for add to bag, size choice, filters and the quiz |
| CLS | ≤0.05. The sticky bar, toast and meter never shift the layout |
| JavaScript | First-party ≤150 KB gzipped on the product page; third-party ≤100 KB, enforced in CI (my rule of thumb) |
| Main image | ≤60 KB AVIF or WebP; exactly one preloaded image per page |
| Curtain or fade on ad landings | 0 ms |

**Code fixes:**
- Skip the curtain (`MotionScript.tsx`).
- No `img-fade` or `data-reveal` above the fold (`ProductImage.tsx`). Paints at opacity 0 don't count as LCP, so LCP waits for hydration.
- Replace `priority` with `preload`.
- Add AVIF to `images.formats`, set a long `minimumCacheTTL`, and keep source JPGs ≤2,560 px.
- No video on product or box pages. On the home page, use `preload="none"` until idle, and keep the mobile MP4 ≤400 KB.
- Run functions in `fra1`.
- Load Pixel and GA4 `afterInteractive` and Clarity `lazyOnload`. No chat SDK. Render reviews on the server.
- Test every release inside Instagram on a mid-range Android phone over 4G.

### 7.2 Meta Pixel, Conversions API (CAPI) and Shopify

1. **Domains.** Put the custom domain live and make `checkout.{domain}` the primary domain. Update `SHOPIFY_STORE_DOMAIN`. To test, land with `?fbclid=test` and check that `_fbc`, `_fbp` and `_ga` have the same values at checkout.
2. **Purchase events.** Shopify's Facebook & Instagram app (data sharing set to "Maximum") and its Google & YouTube app own checkout and Purchase events. The storefront never fires Purchase.
3. **Avoid double-counting.** Rename the site's `InitiateCheckout` (`lib/client/analytics.ts:82`) to a custom `CheckoutClick`. Shopify probably fires its own InitiateCheckout (UNVERIFIED; check in Test Events).
4. **Server-side events.** A new `/api/meta` route sends ViewContent and AddToCart server-side with the browser's `eventID`, so Meta deduplicates on `event_name` + `event_id`. Include `fbp`, `fbc`, IP and user agent, built with `capi-param-builder`.
5. **Click ID cookie.** Middleware sets `_fbc` (`fb.1.{ms}.{fbclid}`) as a first-party cookie from the server. Today it is stored only in localStorage.
6. **Delivery signals.** Send `CODConfirmed` and `OrderDelivered` through CAPI. Optimise on them once each ad set gets about 50 a week (threshold UNVERIFIED).
7. **Shopify analytics.** `_shopify_y` and `_shopify_s` were deprecated on 30 April 2026 (VERIFIED). Add the Storefront API proxy and `useShopifyCookies`, or Shopify's reports won't see the storefront.

### 7.3 Events

| Event (GA4 / Meta) | Key parameters | Status |
|---|---|---|
| page_view / PageView | page_type, line, in_app | Add parameters |
| view_item / ViewContent | items, value, ad_key | Exists |
| select_item | list_name, index | New |
| add_to_cart / AddToCart | source (pdp, sticky, card, pairing, finder, drawer), size | Add parameters |
| sample_attach / SampleAttach | sample_type, scents | New |
| checkout_click / CheckoutClick | value, items | Rename |
| purchase / Purchase | transaction_id, payment_type | Fired by Shopify's apps |
| finder_start, finder_step, finder_complete, finder_result_click | q_index, answer, matches | finder_step and finder_result_click are new |
| sheet_open, differs_view, faq_open, gallery_swipe | id | New |
| generate_lead / Lead (WhatsApp) | context | Exists |
| wa_bag_send, checkout_error, not_found | message, path | New |
| LCP, INP, CLS | value, page_type, in_app | New |
| CODConfirmed, OrderDelivered (CAPI) | order_id, value | New |

### 7.4 UTM passthrough

- **Naming.**
  - `utm_source=instagram|facebook`
  - `utm_medium=paid_social`
  - `utm_campaign={objective}_{audience}_{offer}`
  - `utm_content={ad_key}`, matching `content/ads.ts`
- **Storage.** Middleware stores the UTMs, `fbclid` and the landing page in a 30-day first-party cookie.
- **Order attributes.** Add `_fbp`, `_fbc`, `ga_cid`, `in_app`, `quiz_profile` and `exp_{id}` to the cart-attribute allow-list in `app/api/checkout/route.ts`. Every order then records its ad and test arm, independent of Meta's modelled attribution.

### 7.5 Reporting and testing

- **Weekly sheet:**
  - spend, landing-page views ÷ clicks, in-app sessions;
  - add-to-bag, checkout and order rates, and AOV;
  - COD share, confirmation rate and refusal rate;
  - **delivered revenue ÷ spend**;
  - sample attach rate, and the share of sample and box buyers who buy a bottle within 60 days;
  - p75 Web Vitals.
- **Qualitative.** Watch 20 Clarity recordings of ad sessions a week. Ask one question after purchase: "What almost stopped you?" Turn frequent WhatsApp questions into FAQ entries.
- **Testing by traffic level.**
  - Under 20k sessions a month: split tests of ad plus landing page in Meta only.
  - 20k–100k: on-site tests of add to bag, for effects of 30% or more.
  - 250k and up: tests judged on purchases.
- **Testing method.** Assign variants on the server (Vercel Flags). Run whole weeks; the Egyptian weekend is Friday–Saturday. Run an A/A test first.
- **First tests:**
  1. Free samples vs "delivery included".
  2. Sample-first vs bottle-first buy box.
  3. Product page vs finder vs box as the landing page for cold traffic.

---

## 8. Prioritised backlog (ICE = impact × confidence × ease, each scored 1–10)

| # | Item | Page / file | Impact | Effort | Needs owner fact? | ICE |
|---|---|---|---|---|---|---|
| 1 | Skip the curtain on ad landings and on mobile | `MotionScript.tsx` | H | S | No | 640 |
| 2 | Sticky add-to-bag from load; safe area; price in the button | `BuyBox.tsx`, viewport | H | S | No | 576 |
| 3 | Placeholder gate; hide unconfirmed elements | `site.ts`, CI | H | S | Yes | 576 |
| 4 | Bestseller badge only from real sales; rename the home section | `catalogue.ts`, `Sections.tsx` | H | S | No | 567 |
| 5 | Facebook & Instagram app set to "Maximum"; rename to CheckoutClick; Purchase fires once | Channels, `analytics.ts` | H | S | No | 512 |
| 6 | Delivered total in the product promise block and drawer footer | `BuyBox`, `CartDrawer` | H | S | Yes | 504 |
| 7 | Custom domain and `checkout.{domain}` | DNS, Shopify, `client.ts` | H | M | Yes | 486 |
| 8 | Above-the-fold images that don't wait for hydration | `ProductImage`, `CollectionGrid` | H | S | No | 448 |
| 9 | Delivery included on every bottle | `site.ts`, drawer, rates | H | S | Yes | 448 |
| 10 | Checkout settings; bilingual names for rates and COD | Shopify admin | M | S | Partly | 441 |
| 11 | WhatsApp switched on; button placed above the sticky bar | `site.ts`, `WhatsAppFloat` | M | S | Yes | 420 |
| 12 | Middleware for the `_fbc` and UTM cookie; cart attributes | `middleware.ts`, checkout route | H | S | No | 392 |
| 13 | Rebuild the product page's first screen (3.3) | `page.tsx`, `Gallery`, `BuyBox` | H | M | No | 378 |
| 14 | COD confirmation loop | Thank-you extension, ops | H | M | Yes | 378 |
| 15 | Twin 5 ml plus sealed-bottle returns | `BuyBox`, drawer, help | H | M | Yes | 336 |
| 16 | Rebuild the cart drawer (4.5) | `CartDrawer.tsx` | H | M | Partly | 336 |
| 17 | Paymob cards and Meeza; 3-D Secure tests in the in-app browser | Payments | H | M | Yes | 336 |
| 18 | Sweep type sizes, tap targets and contrast | `globals.css` | M | S | No | 320 |
| 19 | 5 ml variants and 60-day credit codes | Shopify, Flow | H | M | Yes | 315 |
| 20 | Speed pack: AVIF, preload, fonts, `fra1`, video | `next.config.ts`, `layout.tsx` | M | S | No | 294 |
| 21 | Footer legal block, founder, review policy | Footer, `/house` | M | S | Yes | 288 |
| 22 | Ad-to-page map, `content/ads.ts`, `?h=` | Ads, `/shop` | M | M | No | 252 |
| 23 | Cart on first add; preconnect; buyer identity | `CartProvider`, `queries.ts` | M | M | No | 252 |
| 24 | Event additions, real-user Web Vitals, `in_app` | `analytics.ts` | M | M | No | 252 |
| 25 | Collection: 24 items, chips, sticky filter, card order | `CollectionGrid`, `ProductCard` | M | S | No | 240 |
| 26 | Product page section order | `page.tsx` | M | S | No | 240 |
| 27 | Search by the original | `SearchOverlay.tsx` | M | M | No | 216 |
| 28 | Disclosed tester panel | Ops | H | M | Yes | 210 |
| 29 | Shopify analytics cookie migration | Middleware | M | M | No | 200 |
| 30 | Mystery box suggestion in the drawer | `CartDrawer.tsx` | M | S | No | 200 |
| 31 | Reorder the home page (4.2) | `page.tsx`, `Sections.tsx` | M | M | Partly | 180 |
| 32 | Finder: 3 results plus "Try all 3", no sign-up gate | `Finder.tsx` | M | M | No | 180 |
| 33 | CAPI route and delivery events | `/api/meta` | M | M | No | 180 |
| 34 | Send bag to WhatsApp; recovery at 1 h and 24 h | Drawer, WhatsApp provider | M | M | Yes | 180 |
| 35 | Second bottle earns a third 5 ml | Discounts | M | S | Yes | 175 |
| 36 | Review module with fragrance attributes | New `Reviews.tsx` | H | L | Yes | 168 |
| 37 | Gallery: thumbnails, zoom, 6–8 frames | `Gallery.tsx`, photo shoot | M | L | No | 168 |
| 38 | Arabic reassurance lines (Markazi Text or IBM Plex Sans Arabic, `ar-EG-u-nu-latn`, `<bdi>`, `lang`/`dir`) | Help, drawer, product page | M | M | Yes | 150 |
| 39 | Retention flows and referral | WhatsApp, email | M | M | Yes | 125 |
| 40 | Gift message; packing slip without prices | Drawer | L | S | No | 120 |

---

## 9. Facts and decisions the owner must provide

1. **Target.** EGP 100k or USD 100k a month, and by when.
2. **Costs.** COGS for the bottle, the 5 ml and the box; packaging; VAT registration, and whether prices include VAT.
3. **Ad budget.** The test budget and the rule for scaling up (suggested: delivered MER ≥3 for two weeks).
4. **Courier:**
   - fees by zone;
   - delivery days by governorate;
   - daily cut-off;
   - COD and return fees;
   - payout timing;
   - whether "allow opening" is offered.
5. **COD.** A fee or none (recommended: none); an order cap; a deposit rule.
6. **WhatsApp.** Number, hours, promised reply time, provider, and who confirms orders.
7. **Free samples.** Yes or no, end date, and the twin rule.
8. **5 ml samples.** Price per scent, credit amount, expiry (recommended: 60 days), and how codes are issued.
9. **Delivery.** Included on every bottle (recommended) or a threshold; the perk for paying online.
10. **Mystery box.** Random or picked by the quiz; credit terms.
11. **Second bottle and gift sets.** The gift for a second bottle; gift sets at real prices.
12. **Returns:**
    - the window (at least the legal minimum);
    - sealed only, or opened too;
    - who pays the courier;
    - COD refund method and timing;
    - whether to run the phase-2 swap.
13. **Counsel:**
    - "inspired by" wording in English and Arabic;
    - which originals ads may name;
    - SEO titles;
    - returns under Law 181/2018;
    - WhatsApp consent under Law 151/2020.
14. **Legal details.** Company name, registration number, tax ID, address.
15. **Product facts:**
    - scent count (the snapshot has 42);
    - concentration;
    - wear-test method and hours;
    - whether "made in Cairo" or "bottled in Cairo" is true;
    - IFRA compliance.
16. **Price endings.** Keep today's 1,099 / 1,199 / 1,499, or move to round x00 / x50. I recommend round prices, decided before launch.
17. **Payments.** The gateway, and which methods are live in EGP: cards, Meeza, wallets, InstaPay, Fawry, valU.
18. **Domains.** The custom domain and the checkout subdomain.
19. **Reviews.** The review app, the star threshold (recommended: 5), and the tester-panel budget.
20. **House and gifting.** Founder name and photo; gift card and wrapping.

---

## 10. Sources

**Speed**
- https://web.dev/case-studies/vodafone
- https://web.dev/case-studies/renault
- https://web.dev/case-studies/milliseconds-make-millions
- https://web.dev/articles/optimize-lcp
- https://almanac.httparchive.org/en/2024/performance

**Shopify: headless storefront**
- https://shopify.dev/docs/api/customer-privacy
- https://shopify.dev/docs/storefronts/headless/hydrogen/migrate/cookies-custom-setup
- https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage
- https://shopify.dev/docs/api/storefront/2026-07/objects/CartBuyerIdentity
- https://shopify.dev/docs/api/admin-graphql/2026-10/objects/AbandonedCheckout

**Shopify: checkout and payments**
- https://shopify.dev/docs/apps/build/checkout/product-offers
- https://shopify.dev/docs/api/functions/2027-01/payment-customization
- https://shopify.dev/docs/api/checkout-extensions
- https://shopify.dev/docs/api/functions/2026-10/cart-transform
- https://shopify.dev/docs/storefronts/themes/architecture/locales/storefront-locale-files

**Meta**
- https://developers.facebook.com/docs/marketing-api/conversions-api/parameters
- https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events
- https://github.com/facebookincubator/capi-param-builder

**UX research**
- https://baymard.com/lists/cart-abandonment-rate
- https://baymard.com/blog/show-shipping-costs-on-product-pages
- https://baymard.com/blog/current-state-ecommerce-product-page-ux
- https://growthrock.co/sticky-add-to-cart-button-example/

**Accessibility and in-app browsers**
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- https://developer.apple.com/design/human-interface-guidelines/accessibility
- https://www.npmjs.com/package/inapp-spy

**Fragrance**
- https://wwd.com/beauty-industry-news/beauty-features/feature/makeup-fragrance-kosas-snif-mob-drive-sampling-evolution-1234821520/
- https://www.byredo.com/uk_en/p/discovery-set-eau-de-parfum-6x2ml
- https://commodityfragrances.com/pages/faq
- https://www.glossy.co/beauty/dtc-brands-are-using-sampling-to-unlock-online-fragrance-sales/

**Honesty and legal**
- https://spiegel.medill.northwestern.edu/how-online-reviews-influence-sales/
- https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials
- https://ec.europa.eu/commission/presscorner/detail/en/ip_23_418
- https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62007CJ0487

**Benchmarks (UNVERIFIED)**
- https://datareportal.com/reports/digital-2025-egypt
- https://www.triplewhale.com/blog/facebook-ads-benchmarks
- https://www.littledata.io/average-website-performance
- https://contentsquare.com/guides/digital-experience-benchmark/conversions/

**Repo files** (under `/home/user/ETERNAL_E-Commerce/`)
- `components/motion/MotionScript.tsx`
- `components/product/{BuyBox,Gallery,ProductImage,CollectionGrid}.tsx`
- `components/cart/{CartDrawer,CartProvider}.tsx`
- `components/chrome/{WhatsAppFloat,SearchOverlay}.tsx`
- `components/home/Sections.tsx`
- `app/products/[handle]/page.tsx`
- `app/api/checkout/route.ts`
- `app/layout.tsx`
- `app/globals.css`
- `lib/catalogue.ts`
- `lib/client/analytics.ts`
- `lib/shopify/{client,queries}.ts`
- `content/site.ts`
- `next.config.ts`
