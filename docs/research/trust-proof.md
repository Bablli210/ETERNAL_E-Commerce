# Trust, social proof and honest persuasion: CRO research for eternal

## Read this first: what this run could and could not verify

- **I could not do the live research.** WebSearch refused every query ("200 of 200 WebSearch calls" used this session). WebFetch was blocked by the network egress proxy on every domain I tried: spiegel.medill.northwestern.edu, baymard.com, ftc.gov, ec.europa.eu, nngroup.com, powerreviews.com, gov.uk and en.wikipedia.org. **None of the required 8 searches or 6 full-page reads succeeded.**
- **External facts below come from my prior knowledge** of published sources. Every one is tagged:
  - **[K]**: a well-known, widely cited fact I am confident of, but I did not re-read it in this run. Check the source URL before quoting it publicly.
  - **UNVERIFIED**: I am not sure of the exact number, date or detail. Treat it as directional only.
- **Findings about the storefront code were verified directly** by reading the repo. They are marked **[CODE]**.
- If more web budget or proxy access is granted, the six reads that matter most are: Spiegel's PDF, Baymard's perceived-security article and its cart-abandonment list, the FTC final rule on fake reviews, the EU 2023 sweep press release, and Egypt's Consumer Protection Law 181/2018.

---

## 0. Problems already in the code (fix before any ad spend)

| # | Finding [CODE] | Why it matters | Fix |
|---|---|---|---|
| 0.1 | **"Bestseller" badges would be false at launch.** `lib/catalogue.ts:80-87` and `:255` mark the top 12 results of Shopify's `sortKey: BEST_SELLING` (`lib/shopify/queries.ts:99`) as bestsellers. With zero orders that sort still returns 12 products, so 12 scents get the badge. The home section says **"Most worn this month — Bestsellers across the three lines, updated from real orders."** (`components/home/Sections.tsx:157`). `BEST_SELLING` is not a "this month" window, and `i === 0` always gets a badge (`:163`). | This breaks the brand rule "no fake proof". Calling something a bestseller when it is not is the kind of false popularity claim the FTC's 2022 dark-patterns report and the EU unfair-practices rules target. | Only show the badge when an Admin API or ShopifyQL count of real orders in the last 30 days passes a threshold, say 10 or more units of that scent. Until then, rename the section **"Where to start"** or **"House favourites"** and say it is an editorial pick, with no sales claim. |
| 0.2 | **The "Only N left" message uses real data.** It comes from Shopify `quantityAvailable` and shows when stock is 5 or fewer (`lib/catalogue.ts:296`, `BuyBox.tsx:125-129`). The page is cached for 300 s. | It is honest, as long as Shopify inventory matches physical stock and is never set artificially low. | Keep it. Write a rule into the ops doc: inventory is never reduced to trigger the message. You could soften the copy to "Few left in this batch: N." |
| 0.3 | **The cart drawer hides costs.** It says "Shipping and cash-on-delivery fee calculated at checkout" (`CartDrawer.tsx:213`). | Baymard's top reason for abandoning checkout is extra costs that are too high (about 48% of abandoners) [K]. Fees that first appear at checkout cause exactly that. | Show the real numbers in the drawer: "COD fee EGP X · Delivery EGP Y · free over EGP Z". The values come from `site.codFee` and `freeShippingThreshold`. |
| 0.4 | **There is no review component anywhere**: no stars, no empty state, no rating data. | There is nothing to fill once reviews arrive, and no honest "new scent" state today. | Build the review module described in §1.4. Read the rating from Shopify's standard `reviews.rating` and `reviews.rating_count` product metafields, which review apps fill in [K]. That keeps the review app's JavaScript off the first paint. |
| 0.5 | **Placeholder text sits in the trust spots**: `[n] days`, `[Returns policy]`, `[Delivery time]`, `[Local wallets]` (in `content/site.ts`) all show in the proof strip, buy box and FAQ. | A visible "[n] days" on an ad landing page destroys trust. | Add a launch gate: the build fails if any trust string still contains `[`. The other option is to hide each element whose value is null, which the code already supports for some fields. |
| 0.6 | **`site.url` falls back to `eternal-storefront.vercel.app`.** | A `vercel.app` address reads as unofficial to buyers arriving from Instagram ads. A custom domain is also needed to verify the domain with Meta. | Put the custom domain live before the first paid campaign. |

---

## 1. Reviews

### 1.1 Evidence that reviews affect conversion

| Finding | Source and year | Confidence | What eternal should do |
|---|---|---|---|
| About 95% of shoppers read reviews before buying. | Spiegel Research Center (Northwestern/Medill) with PowerReviews, *How Online Reviews Influence Sales*, 2017 | [K] | Reviews are expected. With none, the page needs an honest, deliberate empty state, not missing stars. |
| A product with **5 reviews is 270% more likely to be bought** than one with none. Most of the gain comes from the first handful. | Spiegel 2017 | [K] | Aim for 5 real reviews on the scents you advertise most, not 100 reviews on one scent. Concentrate sampling on the 8 to 10 scents the ads push. |
| Showing reviews raised conversion **380% on higher-priced items vs 190% on lower-priced items**. | Spiegel 2017 | [K] | A EGP 885 to 1,560 bottle is a considered purchase in Egypt, so reviews count for more here than for impulse goods. |
| Purchase likelihood **peaks at an average of 4.0 to 4.7 stars** and falls as it nears 5.0, which reads as fake. | Spiegel 2017 | [K] | Never filter out negative reviews. Show the rating distribution. A 4.5 with a few honest 3s converts better than a perfect 5.0. |
| Shoppers specifically look for photos and videos from customers. The share of shoppers who read reviews is in the high 90s %. | PowerReviews annual surveys (*Power of Reviews*, 2021 to 2024) | Direction [K], exact % **UNVERIFIED** | Ask for a photo in every review request (§1.3). |
| The first review gives the largest proportional lift in orders, with smaller gains as the count grows (often quoted as about +10% for the first review and +25 to 30% by around 30 reviews). | Bazaarvoice conversion data | **UNVERIFIED** | Same conclusion as Spiegel: get the first 5 per scent, quickly. |

### 1.2 How a new brand can show proof honestly (it has none on day one)

These are ordered by when they become true.

| Proof type | True from | What it looks like for eternal | Where |
|---|---|---|---|
| **Policy proof**: what you promise | Day 0 | COD, the sample credit, the first-bottle swap (§2), checking the parcel at the door if the courier supports it (**UNVERIFIED**; confirm with Bosta, Mylerz or Aramex). | Buy box, cart, proof strip |
| **Product evidence**: what you measured | Day 0 | Wear-test longevity and sillage per scent with the method shown ("worn by N testers in Cairo in [month]; median X h"), EdP concentration, the perfumer's honest note on how close the scent is. The `WearIt` section already has meters for this (`components/product/Sections.tsx:95-140`). | PDP, plus a one-line version above the fold |
| **Human proof**: who you are | Day 0 | Founder name and face (the `/house` page has a placeholder), real photos of bottling in Cairo, WhatsApp with stated hours and reply time, a physical address and commercial-register number in the footer. "Made in Cairo" or "bottled in Cairo" only if literally true. | `/house`, footer, the story line on the PDP |
| **Seeded panel proof**: disclosed and free | Weeks −2 to 4 | **Early tester panel.** Send sample trios or mystery boxes to 100 to 150 people: the waitlist, followers, Egyptian fragrance micro-creators. Ask for an honest review after 7 days whatever their opinion. Label every one "Received free samples". Collect "have you worn the original?" and a closeness rating, then publish as panel data with *n* shown ("12 testers who wear [original] rated closeness 4.1/5"). | PDP review module, ads |
| **Creator content** | Week 1 or later | Creator videos carrying Meta's "Paid partnership" label [K]. Static frames go in gallery slots 3 and 4, with the video loaded only on tap. | PDP gallery, home, ads |
| **Customer reviews and UGC** | Weeks 2 to 3 | Verified-purchase reviews with fragrance attributes (§1.4). Repost tagged Instagram posts only after asking permission (for example, the customer replies "#yeseternal"). | PDP, collection cards (stars at 5 or more reviews) |
| **Aggregate proof** | When it is true | "1,000+ bottles sent across Egypt (as of [month])". Count it automatically from Shopify orders, round down, show the date, and only show it above a threshold such as 500. Press logos only after real coverage. | Proof strip, home |

**Things not to do, even though competitors do them:** fabricated or imported reviews; "Jane in Maadi just bought…" pop-ups that are fake (and tacky for a premium brand even when real); `[n]` people viewing; screenshots of anonymous DMs; review gating (only asking happy customers); reviews that are conditional on being positive.

**Rules to know about.**
- The FTC's final rule on fake reviews was announced on 14 August 2024 and took effect 21 October 2024 [K]. It bans fake or AI reviews, buying reviews that are conditional on sentiment, undisclosed insider reviews, suppressing reviews, and fake social-media indicators.
- The FTC Endorsement Guides were revised in June 2023 [K]. Free product in exchange for a review must be disclosed.
- The EU Omnibus Directive 2019/2161 has applied since 28 May 2022 [K]. Shops must say whether and how they check that reviews come from real buyers, and fake reviews are blacklisted.
- The UK DMCC Act 2024 [K] bans fake reviews, and from April 2025 the CMA can fine up to 10% of turnover.
- Egypt's Consumer Protection Law 181/2018 prohibits misleading advertising [K for the law's existence]. The article numbers and how it is enforced against online sellers are **UNVERIFIED**.
- Even though eternal sells in Egypt, these rules are the international norm the brand's honesty rules already line up with. Put a "How we collect reviews" line under the review module.
- A house-wide rating ("4.6 from 38 reviews across the house") is fine **only if labelled as house-wide**. Never put it next to a single product's title as if it were that product's rating. The FTC rule targets "review hijacking", meaning reviews borrowed from other products [K].

### 1.3 Photo reviews

- A photo cannot show a scent. What review photos prove for an "inspired-by" brand is the **physical quality**: the bottle, the cap, the box, that nothing leaked, the delivery condition, the bottle "on my shelf". Those are the main fears about smell-alikes.
- Ask for an unboxing photo in the review request. Show photo reviews first in the module and in a horizontal strip near the gallery.
- **Timing and channel.** Send the request about 10 to 14 days after delivery: a week of wearing plus the courier time. Use WhatsApp first, because the order is already confirmed by phone or WhatsApp. Email is the fallback.
- **Incentive.** A small one, such as a 5 ml sample on the next order, offered for **any** review, positive or negative, and disclosed. That keeps it within the FTC and EU rules above.
- **Sample buyers.** The "two free 5 ml samples with every order" offer gives you a second request: "You got [A] and [B]. Which would you buy?" These are honest early reviews of scents nobody has bought yet, labelled "Wore the 5 ml sample".

### 1.4 Review attributes built for fragrance

Fragrantica's community voting has trained buyers to rate longevity and sillage [K]. Judge.me (custom forms), Okendo (attributes) and Yotpo support custom questions. The exact plan tiers are **UNVERIFIED**, so confirm the headless API before choosing one.

| Attribute | Scale (plain words) | Why |
|---|---|---|
| **How close to [original]?** | Different direction / Same family / Close / Very close / Hard to tell apart | The number one question in this category. |
| **Have you worn [original]?** | Yes, I own it / Smelled it / No | Makes the closeness ratings credible. Add a filter: "Reviews from people who've worn the original". |
| **Lasted on my skin** | Under 3 h / 3–6 h / 6–9 h / 9 h+ | Customer data next to eternal's own wear-test number. |
| **Sillage** | Close to skin / Arm's length / Fills a room | Matches `wear.projection` in the existing data model. |
| **Worn in** | Summer heat / AC office / Evening out / Winter | Cairo heat is part of the brand promise ("made for Cairo heat"). |
| **What they bought** (filled automatically) | 5 ml sample / 55 ml bottle / Mystery box | Honesty, and it shows the sample-to-bottle path. |

**Display.**
- Show distribution bars, not just an average.
- Next to the bars, put the perfumer's own closeness line (`scent.comparison`), so the two can be compared.
- Show low closeness scores too. Setting expectations honestly reduces disappointment, refunds and COD refusals.

**Empty state, used until a scent has 5 reviews.**
- Copy: *"New to the house: no reviews yet. Our wear test: X–Y h on skin, arm's-length sillage. Try the 5 ml first; its price comes off your bottle."*
- Add a quiet "Be the first to review it after a week of wear" link.
- **Never show 0 stars or five empty stars.**

---

## 2. Guarantees and risk reversal

### 2.1 What works, and the wording

- **Sample first, credited back.** This is eternal's strongest honest lever, because it removes the "can't smell it online" risk. Le Labo, Diptyque, Byredo and others all sell discovery formats [K]. Several niche houses credit the sample price against a bottle (which brands do this is **UNVERIFIED**). The US brand Snif ran a "try the sample, return the unopened bottle" model (**UNVERIFIED**).
  - **Wording:** "Try it in 5 ml for EGP X. When you buy the 55 ml within 60 days, we take EGP X off."
  - **How it works:** after the sample order is fulfilled, Shopify Flow or an app sends a single-use code worth the sample price.
- **"Love it or swap it" on the first bottle.** Fragrance is a hygiene-sensitive product, so a generic "full refund" on opened bottles is costly to run. A capped swap is a fair middle ground.
  - **Wording:** *"Not you? Swap your first bottle for another scent within 14 days, even if opened, as long as at least 80% is left. Once per customer. We collect it."*
  - **Abuse limit:** once per phone number.
  - **Cost:** the bottle's cost plus reverse courier. Check this against the actual cost of goods (**UNVERIFIED**).
- **Refunds.** Spell them out:
  - the number of days;
  - the condition (unopened, sealed);
  - who pays the return courier;
  - how to start a return (one WhatsApp message);
  - how refunds reach COD customers (InstaPay or a wallet, within N days).
  - **Check that the returns window is at least Egypt's legal minimum.** Law 181/2018 is commonly reported to give 14 days to return or exchange (**UNVERIFIED**; confirm with Egyptian counsel, including whether opened cosmetics are exempt). The current `returnsWindow: "[n] days"` must not go below that.
- **Copy rules.**
  - No "100% satisfaction guaranteed" boilerplate. Specific, conditional promises read as more credible.
  - No asterisks that hide the conditions.
  - In the house voice: *"We'd rather you wear the right one."*

### 2.2 Make the policies visible near the CTA

- **What the research says.** Baymard recommends putting shipping and returns information close to the add-to-cart button on product pages, and showing a concrete delivery date ("arrives Thu 8 Oct") instead of "3–5 business days", because users struggle to turn speeds into dates [K, qualitative]. In Baymard's abandonment research, "delivery too slow" and "returns policy not satisfactory" are recurring reasons (exact % **UNVERIFIED**).
- **The buy box already has a reassurance row** (`BuyBox.tsx:107-123`): COD, delivery time, returns policy, WhatsApp. Make each item **tappable to open a bottom sheet with the exact policy**, so nobody is sent off the PDP inside Instagram's in-app browser. Replace "Cash on delivery" and "[Returns policy]" with the three risk reversals: **COD · Sample credit · First-bottle swap**, plus the delivery date (§3).
- **Cart drawer.** Repeat the same three lines above the checkout button, next to the actual fees (fix 0.3).

### 2.3 Payment and security badges

- **Baymard's findings.**
  - Users judge security by how a page looks, not by the technology behind it [K].
  - Card fields that are visually boxed, and security cues placed right next to the payment fields, raise perceived security [K].
  - In Baymard's US seal survey, Norton was the most trusted seal [K]. The exact percentages and the year are **UNVERIFIED**, and recognition of these seals in Egypt is **UNVERIFIED** and likely low.
  - Overall credibility is driven mostly by the look of the site. Stanford's web-credibility study found 46.1% of consumers' credibility comments were about design (Fogg et al., 2003) [K].
- **What applies to eternal.**
  - eternal's checkout is Shopify-hosted, so card-field design and security are Shopify's, and you **cannot add seals inside checkout on a non-Plus plan** [K]. Trust has to be built before that point.
  - **Do:** a small row of real payment-method logos (Visa, Mastercard, Meeza, COD, and InstaPay or Fawry only once they are live) under the CTA and in the cart. Add "Secure checkout by Shopify" with a lock icon next to the checkout button, which is already there (`CartDrawer.tsx:236`).
  - **Don't:** unlicensed Norton or McAfee seals, home-made "100% Secure" shields, or logos for methods not yet live. Remove `"[Local wallets]"` from `site.paymentMethods` until it is real.
  - **In Egypt the stronger signals are COD** (its share of Egyptian e-commerce is often quoted as a majority; **UNVERIFIED**), **a human confirmation call or WhatsApp message**, and **checking the parcel before paying**. Lead with these, not with badges.

---

## 3. Honest urgency and scarcity

### 3.1 The risks of fake urgency

- **FTC, *Bringing Dark Patterns to Light*** (staff report, September 2022) [K]. It names fake countdown timers, false low-stock messages and fake activity messages ("X people viewing", "just bought") as deceptive.
- **EU sweep, January 2023** [K]. Of 399 online shops checked, 148 used at least one manipulative practice, including **42 sites with fake countdown timers**. The other sub-counts are **UNVERIFIED**. In the EU, falsely saying a product is only available for a very limited time to rush a decision is **banned outright** (Unfair Commercial Practices Directive, Annex I point 7) [K].
- **UK.**
  - In February 2019 the CMA got Booking.com, Expedia, Hotels.com, ebookers, trivago and Agoda to stop pressure-selling and misleading scarcity claims [K].
  - The CMA opened a case against Emma Sleep in 2023 over countdown timers and urgency claims [K]. The outcome is **UNVERIFIED**.
  - The DMCC Act lets the CMA fine directly from April 2025 [K].
- **Academic evidence.**
  - Mathur et al., Princeton (CSCW 2019), crawled about 11,000 shopping sites [K]. They found 1,818 dark-pattern instances on 1,254 sites, including countdown timers that reset, and third-party scripts sold to create fake urgency.
  - Luguri and Strahilevitz (*Journal of Legal Analysis*, 2021) [K]. Mild dark patterns raised acceptance of a dubious offer from about 11% to about 26%, and aggressive ones to about 42%. Aggressive patterns caused visible backlash and anger. Mild ones did not, which is why they are risky: they work quietly until a regulator or a screenshot exposes them.
- **The specific risk for eternal.** Instagram ads collect public comments. One screenshot of a timer that resets, posted under an ad, does lasting damage to a brand whose whole proposition is "inspired by, but honest".

### 3.2 Urgency that is honest and still works

| Mechanism | Rule that keeps it honest | Where |
|---|---|---|
| **Delivery cut-off**: "Order in the next 2 h 14 m — arrives tomorrow in Cairo & Giza" | Calculated from the courier's real cut-off and the customer's governorate (default Cairo, changeable). Everyone sees the same clock, and it never resets per visitor. After the cut-off it switches to "Arrives Tue 6 Oct". | Under the CTA on the PDP; cart drawer |
| **Gifting deadlines** | Real dates: Egyptian Love Day (4 Nov), White or Black Friday (late Nov), Valentine's (14 Feb), Ramadan and Eid al-Fitr 2027 (around Feb–Mar 2027; lunar dates approximate, **UNVERIFIED** to the day), Mother's Day (21 Mar), Eid al-Adha (around May 2027). Copy: "Mother's Day 21 March: order by 18 March for Cairo delivery." | Announcement bar, home hero subline, cart |
| **Real limited editions** | Le Labo's City Exclusives are a model of scheduled, real scarcity: sold only in their own city except each September [K]. eternal could do "Batch 01 · 300 numbered bottles", and show the remaining count only from real inventory. | Edition PDP, tales |
| **Real restocks** | "Back on [date]. Tell me on WhatsApp." Never "sold out" on a product that is in stock. | Sold-out PDP state, collection card |
| **Launch offer with a fixed end date** | "Two free 5 ml samples with every order until 30 Nov". It must actually end, and must not be extended again and again. | Announcement bar (`site.announcement`) |
| **Low stock** | Already real (0.2). Keep it data-driven. | Buy box |

**Banned on eternal:** timers that reset or are generated per visitor, "X people viewing" or "just bought" messages that are not real, inflated "was" prices, and any countdown attached to an offer that will come back.

---

## 4. Brand storytelling vs conversion

- **Story raises perceived value.** In Significant Objects (2009), thrift objects bought for $128.74 in total sold for $3,612.51 on eBay once each had a fictional story [K]. Glossier built its audience with the Into the Gloss blog (2010) years before launching products (2014) [K].
- **But people scan.** Nielsen's classic study found 79% of users scan and 16% read word by word [K]. On a phone, in an in-app browser, arriving from an ad, a visitor gives the first screen a few seconds. Long editorial text above the CTA costs conversion, and the same text below the buy box earns it.
- **For fragrance, words stand in for smell.** The strongest descriptor eternal has is the "inspired-by" reference to a scent the buyer already knows, followed by plain-language notes, then mood.
- **Legal guardrail.** The CJEU's *L'Oréal v Bellure* (C-487/07, 2009) [K] found that comparison lists presenting smell-alikes as imitations or replicas of trademarked perfumes take unfair advantage of the mark. Keep "inspired by / our own composition / not affiliated". Never use "dupe", "copy" or "replica". Have Egyptian counsel sign off the existing "[confirm legal wording]" line, because Egyptian trademark law on this point is **UNVERIFIED**. Meta can also take ads down after a rights-holder's IP report [K], which is another reason to keep the wording comparative and modest.

**Placement model.**
1. **PDP, first screen** (what the ad visitor sees):
   - name and line;
   - "If you love [original]", which must match the ad's message;
   - three notes in plain words;
   - a one-line mood ("salt on warm stone at golden hour");
   - the wear-test hours;
   - price, the sample option, and the CTA;
   - the risk-reversal row.
2. **PDP, below the fold:** the notes pyramid, then the full tale excerpt with a "Read the tale (2 min)" link, then ingredients and honesty facts (EdP concentration, IFRA compliance only if true), then reviews and the FAQ.
3. **Tales pages:** make them shoppable. Every tale ends with the scent's sample and bottle CTA and the sample-credit line. The `ReadingProgress` component already exists, so an end-of-tale CTA fits naturally.
4. **Home:** keep the video hero, then the proof strip with honest content, then the story. The founder note belongs in `/house`, with a one-line, linked teaser on the home page.

---

## 5. What eternal should show, and where, with zero reviews

**PDP, the main page Instagram ads land on**
- **Under the title:** "If you love [original]" plus a one-line honest closeness note, then wear-test hours ("7–8 h on skin · our wear test"). **No stars.**
- **Buy box:**
  - a size toggle with the 5 ml option showing "price credited to your bottle";
  - the CTA;
  - the delivery line with date and cut-off;
  - a row of three tappable items, **COD · Sample credit · First-bottle swap**, each opening a bottom sheet;
  - a small row of payment logos;
  - "Ask us on WhatsApp", once `site.whatsapp` is set.
- **Gallery:** the real bottle in hand at real scale, the box, and a creator frame labelled "Paid partnership" once it exists.
- **Below the fold:** notes, the tale excerpt, `WearIt` with the method stated, then the review module showing the empty state, which becomes panel data, then attribute reviews.

**Cart drawer**
- Real fee amounts.
- A free-shipping meter, only if a threshold is confirmed.
- The delivery date.
- The three risk-reversal lines.
- Payment logos and "Secure checkout by Shopify".
- The samples gift line: "2 free 5 ml samples added".

**Home**
- **Proof strip:** EdP strength and wear-test hours; Sample first, credited back; COD with checking at the door (if confirmed); the swap promise.
- Rename the "Most worn this month" section until it is backed by data.
- Later, add a "bottles sent" figure, but only above the threshold.

**Collection pages**
- No stars until a scent has 5 reviews.
- Show the "inspired by" line and wear-test hours on each card, because these help the visitor choose.
- "Bestseller" badges only from real data.

**`/house` and footer**
- Founder face, name and voice, and real photos of Cairo bottling.
- Address, commercial-register number, WhatsApp hours and reply time.
- "How we collect reviews."

**Announcement bar**
- One real offer with an end date, or the next gifting deadline. Never a timer.

**Checkout (Shopify-hosted)**
- Use Shopify branding (logo, colours) so the handover looks continuous.
- Make sure the COD fee shown at checkout exactly matches what the PDP and cart said.

---

## 6. Recommendations ranked by expected impact

| Rank | Action | Impact | Effort | Page / file |
|---|---|---|---|---|
| 1 | **Remove false proof before launch**: gate Bestseller badges on real orders, rename "Most worn this month", and fail the build on `[placeholder]` trust strings. | Critical (honesty and legal) | S | `lib/catalogue.ts:80-87,255,312-316`; `components/home/Sections.tsx:157,163`; `content/site.ts` |
| 2 | **Show costs and dates up front**: COD fee and shipping amounts in the cart, a delivery date by governorate, and a real cut-off line under the CTA. | High (fixes the #1 abandonment reason) | M | `CartDrawer.tsx:213`; `BuyBox.tsx:107-123` |
| 3 | **Risk-reversal row near the CTA**: sample credit, first-bottle swap and COD, each opening a bottom sheet, repeated in the cart. Settle the policy wording and Egypt's legal minimum. | High | M (needs ops and legal input) | `BuyBox.tsx`, `CartDrawer.tsx`, `content/faq.ts`, `/help` |
| 4 | **Sampling panel to seed proof**: 100–150 disclosed sample boxes focused on the 8–10 scents in ads, collecting closeness, longevity and sillage, then publishing panel data with *n*. | High (reaches Spiegel's 5-review point fast) | M | Ops, then the PDP review module |
| 5 | **Review module with fragrance attributes**: honest empty state, verified-purchase badge, photo-first ordering, a filter for people who have worn the original, WhatsApp requests at day 10–14, ratings read from metafields. | High (grows over time) | M | New `components/product/Reviews.tsx`; Shopify `reviews.rating` and `reviews.rating_count` |
| 6 | **Message match above the fold**: the "If you love X" line plus wear-test hours under the title, with legal wording signed off. | High for ad traffic | S | PDP header, `WearIt` |
| 7 | **Custom domain and human proof**: founder, address, commercial-register number, WhatsApp hours. | Medium–High (wary Instagram visitors) | S | `site.url`, `/house`, footer |
| 8 | **Honest urgency calendar**: gifting deadlines, a launch offer with a fixed end date, numbered batches, restock notifications by WhatsApp. | Medium | S–M | Announcement bar, sold-out PDP state |
| 9 | **Payment logos (real methods only) and "Secure checkout by Shopify"**; no generic seals. | Medium–Low | S | Buy box, cart |
| 10 | **Storytelling placement**: tales become shoppable, with end-of-tale sample CTAs and a one-line mood on the PDP. | Medium | S | `/tales/*`, PDP |
| 11 | **Aggregate proof once true**: automated "bottles sent" count, real press logos. | Medium (later) | S | Proof strip |

**What to measure** (not enough traffic for A/B tests early on):
- PDP-to-add-to-bag rate;
- how often the policy bottom sheets are opened;
- how often visitors reach the review module;
- sample-to-bottle conversion (redemptions of the credit codes);
- COD refusal rate;
- swap claims per 100 first orders.

---

## 7. Sources

None of these were opened in this run, because egress and search were blocked. Re-check each one before relying on it.

- Spiegel Research Center, *How Online Reviews Influence Sales* (2017): https://spiegel.medill.northwestern.edu/how-online-reviews-influence-sales/
- PowerReviews research hub (*Power of Reviews* surveys): https://www.powerreviews.com/research/
- Bazaarvoice research (*Shopper Experience Index*): https://www.bazaarvoice.com/research/
- Baymard, perceived security of payment forms and trust seals: https://baymard.com/blog/perceived-security-of-payment-form
- Baymard, cart abandonment rate and reasons: https://baymard.com/lists/cart-abandonment-rate
- FTC, *Bringing Dark Patterns to Light* (2022): https://www.ftc.gov/reports/bringing-dark-patterns-light
- FTC final rule banning fake reviews (Aug 2024): https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials
- FTC Endorsement Guides FAQ: https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking
- European Commission sweep on dark patterns (Jan 2023): https://ec.europa.eu/commission/presscorner/detail/en/ip_23_418
- EU Omnibus Directive 2019/2161: https://eur-lex.europa.eu/eli/dir/2019/2161/oj
- CJEU *L'Oréal v Bellure* C-487/07: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62007CJ0487
- Mathur et al., *Dark Patterns at Scale* (Princeton, 2019): https://webtransparency.cs.princeton.edu/dark-patterns/
- Luguri and Strahilevitz, *Shining a Light on Dark Patterns* (2021): https://academic.oup.com/jla/article/13/1/43/6180579
- CMA, hotel booking sites commitments (2019): https://www.gov.uk/government/news/hotel-booking-sites-to-make-major-changes-after-cma-probe
- UK Digital Markets, Competition and Consumers Act 2024: https://www.legislation.gov.uk/ukpga/2024/13/contents
- NN/g, *How Users Read on the Web*: https://www.nngroup.com/articles/how-users-read-on-the-web/
- Significant Objects project: https://significantobjects.com/about/
- Shopify standard metafield definitions (`reviews.rating`): https://shopify.dev/docs/apps/build/custom-data/metafields/list-of-standard-definitions (exact path **UNVERIFIED**)
- Egypt Consumer Protection Law No. 181 of 2018: no reliable URL from memory. **UNVERIFIED**; get the official text from Egypt's Consumer Protection Agency (cpa.gov.eg) or counsel.

**Repo files referenced** (verified):
- /home/user/ETERNAL_E-Commerce/lib/catalogue.ts
- /home/user/ETERNAL_E-Commerce/lib/shopify/queries.ts
- /home/user/ETERNAL_E-Commerce/components/home/Sections.tsx
- /home/user/ETERNAL_E-Commerce/components/product/BuyBox.tsx
- /home/user/ETERNAL_E-Commerce/components/product/Sections.tsx
- /home/user/ETERNAL_E-Commerce/components/cart/CartDrawer.tsx
- /home/user/ETERNAL_E-Commerce/content/site.ts
- /home/user/ETERNAL_E-Commerce/content/faq.ts
- /home/user/ETERNAL_E-Commerce/app/house/page.tsx
