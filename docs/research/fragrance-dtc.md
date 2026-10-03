# DTC fragrance playbooks: how brands sell scent online, and what eternal should copy

*Research for eternal (Cairo), 3 October 2026. The audience is mobile visitors arriving from Instagram ads.*

## Method and limits (read first)

- **I could not read any page in full.** The environment's network policy blocked every WebFetch host I tried: shopify.com, sacra.com, fastcompany.com, wwd.com, clear.co, beautymatter.com, femfounded.org, smartrr.com, dossier.co, snif.co and en.wikipedia.org. You can allow these under Network access in the cloud environment's settings (environment menu in the session title bar → Edit → a wider access level, or Custom with the hosts added).
- **Fewer searches than planned.** I ran about 36 WebSearch queries. Then the session-wide search cap (200, shared with other agents) ran out. I did not get to Baymard, NN/g, the Meta in-app browser or Glossy's Instagram-vs-TikTok piece.
- **So every fact below comes from search-result summaries of the cited pages, not from reading them.** The task asked for at least 6 full-page reads, and that was not met.
  - Figures from trade press (WWD, Glossy, Beauty Independent, Forbes) are labelled **reported**.
  - Figures from vendor case studies are labelled **vendor claim**.
  - Third-party estimates, or anything I could only see in a low-quality source, are labelled **UNVERIFIED**.
- I checked the eternal repo so each recommendation names a real component. Existing pieces:
  - `content/scents.ts` already has `inspiredBy`, `comparison`, `longevity`, `sillage` and `wear.projection`.
  - The finder already asks about strength ("Close to the skin / An arm's length / The whole room").
  - `CartDrawer` already has a free-shipping meter and a sample upsell.
  - `BuyBox` already says "credited back [confirm]".
  - `site.returnsPolicy` and `site.codFee` are still placeholders.

---

## 1. Findings by brand

### Dossier: the "inspired by" model at scale

**What they did**
- Sergio Tache founded Dossier with the venture studio Otium in 2018 and launched in 2019 ([Beauty Independent](https://www.beautyindependent.com/american-pacific-group-dossier-dupe-business-deal/)).
- It started with 20 "dupes" and now has 150+ scents at $29–50 ([Shopify blog](https://www.shopify.com/blog/dossier-affordable-luxury-accessible-perfume-pricing), [ShipBob](https://www.shipbob.com/blog/dossier/)).
- It has shipped more than 1M orders.
- The pitch is cost transparency: Dossier says it cuts "celebrity endorsements, elaborate packaging and bespoke bottles" and spends on the juice.

**How they describe scent**
- Each product name says what it smells like (family + key note): "Ambery Saffron", "Woody Oakmoss", "Fruity Honey", "Musky Musk".
- The "inspired by" line sits underneath, e.g. "Woody Oakmoss, Inspired by Chanel's Coco Mademoiselle" ([Walmart listing](https://www.walmart.com/ip/Dossier-Woody-Oakmoss-Eau-de-Parfum-Inspired-by-Chanel-s-Coco-Mademoiselle-Perfume-for-Women-1-7-oz/862716344)).
- Their terms say the named inspirations are "a reference for the consumer public" and that Dossier is not affiliated with those brands ([terms](https://dossier.co/pages/terms-conditions)).

**Pricing anchor**
- Ambery Saffron is $49 against Baccarat Rouge 540 at $335 ([WWD](https://wwd.com/beauty-industry-news/fragrance/dupe-fragrance-brand-dossier-tiktok-viral-store-new-york-1237928141/)).

**Growth numbers**
- Reported: about $60M in US sales in 2025, and +120% year on year as of February 2026. This is a YipitData estimate quoted by Glossy and Beauty Independent ([Beauty Independent](https://www.beautyindependent.com/american-pacific-group-dossier-dupe-business-deal/)).
- UNVERIFIED estimate: $100M annualised in 2025 ([Sacra](https://sacra.com/c/dossier/)).
- American Pacific Group took a majority stake in 2026.

**Acquisition**
- "Influencer marketing has been a pillar of our strategy since day one". Tache says they have worked with more than 10,000 influencers ([Shopify](https://www.shopify.com/blog/dossier-affordable-luxury-accessible-perfume-pricing)).
- Their search agency says that in 2020 it bid on the designer perfume names people were searching for, and those clicks converted well enough to be "massively profitable". It also claims that in 2021 combining search and social "doubled ROI" (vendor claim; [Primelis](https://www.primelis.com/case-studies/dossier-casestudy-signal/)).
- The headline "$400K to $100M" is an agency claim with an unclear time frame: UNVERIFIED.
- Primelis also claims $12M in Dossier's first year on Amazon ([Primelis](https://www.primelis.com/case-studies/dossiers-casestudy-amazon/)).

**From dupes to its own scents**
- "Originals" (own scents) launched in 2023 at $39 for 50 ml.
- In May 2025 they were just under 10% of direct sales but 26% of TikTok Shop sales, and Dossier launched 16 new Originals in 2025 (reported via [Sacra](https://sacra.com/c/dossier/) / search summary).
- A New York pop-up drew queues "around the block", which led to permanent stores at 242 Elizabeth St ([Shopify In Stock](https://shopify.substack.com/p/decoded-dossier), [Fashionista](https://fashionista.com/2025/07/dossier-new-york-store-opening)).

**Reviews**
- About 746 Trustpilot reviews at the time of the search ([Trustpilot](https://www.trustpilot.com/review/dossier.co)).
- Longevity is the most common complaint in independent reviews ([FashionBeans](https://www.fashionbeans.com/article/dossier-perfume-review/), [Organic Beauty Lover](https://organicbeautylover.com/skin/dossier-review/)).

**What eternal should do**
- On the PDP, keep eternal's own names. Directly under the title, add a fixed format: one "Inspired by [original]" line, then the existing `comparison` note ("how ours differs").
- Put a "for reference only, not affiliated" line in the PDP FAQ and the footer.
- Make the originals searchable in `SearchOverlay`: typing "Baccarat" or "Aventus" should return the eternal scent.
- Add a "Find by the one you know" entry on `/shop`.
- Longevity is where reviews of dupes go wrong, so publish honest, tested longevity (see tactic 4).

### Alt. Fragrances: the mystery sample as a checkout upsell

- Michael Saba started it in college, built around a "luxury tax / brand tax" message ([Alt](https://altfragrances.com/blogs/news/breaking-the-luxury-tax)).
- **Vendor claim:** they had tried BOGO, discounts and bundles "without meaningful impact" ([UpsellPlus](https://www.upsellplus.com/case-studies/alt-fragrances)).
  - They then added a one-click "Mystery Fragrance" at checkout, shown to every customer: a sample-size scent priced at **about 15% of AOV**.
  - Result: more than 60,000 conversions and "seven figures" in upsell revenue in under 12 months.
- Revenue estimates range from $10–25M to "$32M in 6 months": UNVERIFIED.

**What eternal should do:** eternal's EGP 250 mystery box is about 16–28% of one bottle (EGP 885–1,560), close to Alt's ratio.
- Show it as a one-tap add-on in `CartDrawer` to **everyone**. Today it only appears when a viewed scent has a sample variant.
- Repeat it on the Shopify checkout if the plan allows checkout upsells.

### Oakcha

- Bottles cost $35–50 and Oakcha says its scents are 30% fragrance oil. Inspirations include Delina, Santal 33 and BR540 ([Refinery29](https://www.refinery29.com/en-us/oakcha-perfume-dupes-review), [mindbodygreen](https://www.mindbodygreen.com/articles/oakcha-fragrances-beauty-editors-review-of-clean-dupes)).
- Sample sets are sold by collection at about $13 (Signature, Jewel, Oud, Discovery), and there is a bundle builder ([Oakcha sets](https://www.oakcha.com/products/oakcha-sample-discovery-set), [bundle builder](https://www.oakcha.com/pages/bundle-builder)).
- WWD lists Oakcha in the top 10 fragrance brands on TikTok Shop ([WWD](https://wwd.com/beauty-industry-news/fragrance/fragrance-dupes-oakcha-jo-milano-tiktok-shop-phlur-1238032522/)).
- I found no founder interview or revenue figures: UNVERIFIED.

**What eternal should do**
- Once confirmed with the perfumer, state the concentration as a fact on the PDP and in ad copy.
- Sell trio sets by family or mood, not only the random mystery box.

### Snif: try at home is the lever

**Mechanics**
- A kit holds three 30 ml full-size bottles plus a 2 ml sample of each.
- You wear the samples for 7 days and return the sealed bottles you don't want, free.
- Keeping all three costs $150; single bottles are $65 ([NewBeauty](https://www.newbeauty.com/view/snif-fragrance-review), [The Quality Edit](https://www.thequalityedit.com/articles/snif-review), [how it works](https://snif.co/pages/how-it-works)).
- Reported (WWD, 2021): the try-before-you-buy option was **80% of orders** ([WWD](https://wwd.com/beauty-industry-news/beauty-features/feature/makeup-fragrance-kosas-snif-mob-drive-sampling-evolution-1234821520/)).

**Founder interviews**
- Co-founder Bryan Edwards: *"The biggest lever that we have is that we convince people that there is no commitment for them. It costs nothing to try and buy our fragrances."*
- Reported: close to $40M in sales, triple-digit growth, **a repeat purchase rate above 50%** in direct sales, and direct at about 60% of sales ([Beauty Independent](https://www.beautyindependent.com/snif-talks-new-subbrand-notewrks-fragrances-toys-category-future/)).
- Raised more than $27M.

**How they describe scent**
- At launch they left notes out on purpose and put ad-lib cards in the box so customers could describe scents in their own words ([Fast Company 2020](https://www.fastcompany.com/90562875/fragrance-startup-snif-wont-tell-you-what-their-perfumes-smell-like-you-have-to-sniff-them-for-yourself)).
- A later summary says vague descriptors like "woody" "put a lot of people off". Treat this as a warning that leaving notes out has limits.

**Subscription:** a vendor claims subscription revenue grew 143% in 6 months ([Smartrr](https://smartrr.com/case-studies/snif-perfume-shopify-subscriptions)).

**What eternal should do:** the honest Egyptian version is **"Smell it before you open it."**
- Every 55 ml ships with a 5 ml of the same scent.
- If it isn't for you, return or exchange the sealed bottle within [n] days.
- This needs the owner to set `site.returnsPolicy` and `returnsWindow`.

### Phlur: emotion first, and a creator relaunch

**The relaunch and Missing Person**
- Chriselle Lim's group acquired Phlur in 2021 and relaunched it in 2022.
- Missing Person went viral after Mikayla Nogueira described it as *"a person that you love and that you miss."*
- Reports conflict on the sell-out: "sold out in 5 hours" versus "a year's inventory in 10 minutes".
- Both agree on a waitlist of about **200,000** ([Grazia](https://graziadaily.co.uk/beauty-hair/skin/phlur-missing-person-perfume/), [Bustle](https://www.bustle.com/style/phlur-missing-person-fragrance-perfume)).

**Growth**
- Reported: sales doubled from 2024 to 2025 under CEO Elizabeth Ashmun ([Forbes, June 2025](https://www.forbes.com/sites/claraludmir/2025/06/30/how-phlur-is-reshaping-the-world-of-modern-fragrance/)).
- About 1,500 stores and a projected $100–125M in 2025 revenue: UNVERIFIED ([RetailBoss](https://retailboss.co/phlur-now-in-1500-stores-as-luxury%E2%80%91viral-perfume-goes-mainstream-in-2025/)).
- Acquired by TSG Consumer Partners ([TheIndustry.beauty](https://theindustry.beauty/phlur-acquired-by-tsg-consumer-partners/)).

**Pricing**
- Price ladder: 9.5 ml travel $32 → 50 ml $99 → 100 ml $139, plus 3 oz body mists at $26 and a full + travel "duet" ([Phlur](https://phlur.com/products/missing-person-duet)).
- Forbes positions the $99 50 ml against Byredo at $280 and Le Labo Santal 33 at $235.
- On TikTok Shop, most Phlur sales come from a body-mist duo at "$66 ($76 value)" ([WWD](https://wwd.com/beauty-industry-news/fragrance/lattafa-phlur-sol-de-janeiro-dupe-tiktok-shop-fragrances-1237049601/)).

**Copy:** Lim: "I tell stories through scent… you just want people to feel something". The strategy is a "fragrance wardrobe" ([Glossy](https://www.glossy.co/beauty/chriselle-lim-is-building-the-next-era-of-phlur-on-storytelling-and-fragrance-wardrobes/)).

**What eternal should do**
- Lead each PDP and ad with the feeling: the existing `signature` line, e.g. "You can smell the ones the sea decided to give back."
- Then 3 notes, then "inspired by".
- Show set "value" only when it is the real sum of current single prices.

### Commodity: strength as the main way to browse

- The range is split by projection into Personal, Expressive and Bold "Scent Spaces".
- Each discovery kit comes with a digital code worth what you paid, to use on a full size ([Commodity FAQ](https://commodityfragrances.com/pages/faq), [kits](https://commodityfragrances.com/collections/discovery-sets)).

**What eternal should do**
- The finder already uses "Close to the skin / An arm's length / The whole room". Add the same three as **collection chips** and as a label on `ProductCard`, mapped from `sillage`.

### Byredo, Le Labo, Diptyque, Maison Margiela Replica, Glossier You

**Byredo**
- 6 × 2 ml discovery sets with a **$60 voucher** for 50 or 100 ml ([Byredo](https://www.byredo.com/uk_en/p/discovery-set-eau-de-parfum-6x2ml)).
- La Grande Découverte: 24 × 2 ml with a $235 voucher, **valid 6 months**.
- Themed sets: Florale, Boisée ([Byredo](https://www.byredo.com/us_en/p/la-grande-decouverte)).

**Le Labo**
- "City Exclusives" can only be bought in their city, except during a real annual online window (Aug–Sep). Scarcity is built into the model, not invented ([Hypebeast](https://hypebeast.com/2021/8/le-labo-city-exclusive-discovery-set-release-info)).
- Bundles of "Discovery Set + 50 ml" or "+ 100 ml" ([Le Labo](https://www.lelabofragrances.com/discovery-sets/classic-collection/discovery-set/17-50ml-8.html)).
- Personalised labels.

**Diptyque**
- Families plus illustrated "olfactory landscapes".
- Build-your-own set of 5 ([Diptyque](https://www.diptyqueparis.com/en_us/p/build-your-own-discovery-set-of-5-eaux-de-toilette-1.html)).
- Reported: each online order includes a trial dose of the fragrance bought, so you can test before opening the bottle. This comes from a strategy blog: UNVERIFIED ([Latterly](https://www.latterly.org/diptyque-marketing-strategy/)).

**Maison Margiela Replica (2012)**
- Each scent is a memory, with a place and a year on a cotton label ("Lazy Sunday Morning").
- Supported by "Memory Trip" pop-ups ([Detail Digest](https://detaildigest.substack.com/p/maison-margielas-replica-fragrance), [Moodie Davitt](https://moodiedavittreport.com/maison-margiela-fragrances-celebrates-success-of-replica-memory-trip-pop-up-with-cdfg/)).

**Glossier You (2017)**
- One idea: "smells like you". The bottle has a thumbprint indent and the launch was digital first.
- Influencer reviews: 4.7/5, 78% five-star ([Who What Wear](https://www.whowhatwear.com/glossier-perfume-review), [Influenster](https://www.influenster.com/reviews/glossier-you-eau-de-parfum)).

**What eternal should do**
- Give credit codes an **expiry** (Byredo uses 6 months; 60–90 days suits faster Instagram buyers).
- Sell **themed 3 × 5 ml trios** alongside the mystery box.
- Sell a **"bottle + its 5 ml twin"** bundle.
- eternal's `tales` and "salt, stone and golden hour" world is a natural Replica-style asset: give every scent a place and a moment on the PDP and in ads.
- Any limited edition must be a real limited batch.

### Scentbird: subscription and quiz

- Members pay about $16.95/month for 8 ml from a catalogue of around 900 scents.
- Reported: **more than 1M subscribers** across the US, UK and Canada ([WWD](https://wwd.com/business-news/business-features/scentbird-personalized-fragrance-discovery-subscription-1238929154/)).
- Raised $18.6M in 2018 ([Fast Company](https://www.fastcompany.com/40574010/scentbird-sniffs-out-18-6m-to-make-subscription-fragrance-a-thing)). This contradicts the "bootstrapped" label on Latka.
- Revenue of $43.9M (2024) is UNVERIFIED ([Latka](https://getlatka.com/companies/scentbird.com)).
- The quiz builds a profile, and members' ratings refine later recommendations ([Scentbird](https://www.scentbird.com/blog/find-your-perfect-scent-with-the-new-scentbird-quiz/)).
- It now sells "blind boxes" ([WWD](https://wwd.com/beauty-industry-news/fragrance/scentbird-society-fragrance-launch-niche-designer-1238890297/)).

**What eternal should do**
- Don't launch a subscription yet.
- Copy the profile loop instead: save finder answers and send results and a reorder nudge on WhatsApp.

### Gulf and Egypt

**Lattafa**
- Reported: TikTok Shop sales over **$63M** from August 2024 to July 2025, **+174%** on $23.1M the year before ([WWD](https://wwd.com/beauty-industry-news/fragrance/arab-fragrance-oud-lattafa-kayali-amouage-1238089130/)).
- No. 1 fragrance brand on TikTok Shop in one February at more than $4M (Charm.io via WWD).
- Growth rides on blind-buy and versus content, e.g. "Khamrah vs Kilian Angels' Share" ([Spate](https://www.spate.nyc/blog/fragrance-trends-2026-on-google-tiktok-and-instagram)).
- "$100M on Amazon in 12 months": UNVERIFIED.
- Spate data: searches for "Arabian perfume" +63% year on year; "oud perfume" +20.5%.

**Kayali**
- Reported as the No. 1 fragrance brand at Sephora in H1 2025, built on **layering** (WWD).

**Arabian Oud, Ajmal, Swiss Arabian, Rasasi**
- Merchandising is heavy on gift sets and occasions (Ramadan sets, an "Islamic gift set").
- Rasasi gives free delivery over AED 150.
- Ajmal invests in performance marketing ([Swiss Arabian](https://uae.swissarabian.com/collections/giftsets-gifts), [Arabian Oud](https://us.arabianoud.com/en/0401010260-islamic-gift-set), [Rasasi](https://rasasionline.com/)).
- Little hard data: UNVERIFIED depth.

**Egypt**
- Nspired: an "inspired by" brand from EGP 380, sold on noon ([noon](https://www.noon.com/egypt-en/beauty/fragrance/nspired/)).
- Niche Essences: about 49K Instagram followers.
- Elite Perfume: about 81K Instagram followers, est. 2016.
- Sevilla Fragrances: indie, 2018 ([Fragrantica](https://www.fragrantica.com/news/Sevilla-Fragrances-A-Small-Egyptian-Brand-From-Cairo-15211.html)).
- O2morny: since 2017.
- **No revenue figures, funding or founder interviews found for any Egyptian brand.**

**Egyptian payments (context only)**
- Reported: InstaPay had more than 16M users by June 2025 (Central Bank of Egypt, via secondary sources).
- Cash-on-delivery share estimates range from 34% to 55% depending on the source: UNVERIFIED ([xpay](https://xpay.app/blog/payment-methods-egyptian-customers-prefer), [Mordor](https://www.mordorintelligence.com/industry-reports/egypt-ecommerce-market)).

**What eternal should do**
- Plan gift-set releases around Ramadan, Eid, 21 March (Egyptian Mother's Day) and Valentine's.
- Add a short "wear it with…" layering pairing to the existing pairings section. This plays to a Gulf habit.

### Scent quizzes: weak evidence

- I found **no primary fragrance-brand figure** for how much a quiz lifts conversion.
- Vendor benchmarks:
  - Octane AI says quiz takers convert at 8–25% ([X, 2022](https://x.com/OctaneAI/status/1522303871133134855)).
  - Doe Lashes saw 11% higher AOV from quiz takers ([Octane](https://www.octaneai.com/case-studies/doe-lashes)).
- Fragrance-specific claims (Noteworthy "25% sample-to-full", Fiole) come from a low-quality blog: **UNVERIFIED** ([freeyourself](https://freeyourself.com/blogs/news/personalized-scent-quiz-conversion)).
- **Treat the finder as a test, not a proven win.** Its job is to end in a purchasable sample offer.

### Reviews

- Fragrance communities rate scent, **longevity, sillage** and bottle separately ([Parfumo](https://www.parfumo.com/Users/Ceesie/Blog/Article/longevity-sillage-performance)).
- Analysis of Black Opium reviews found longevity, packaging and sampling were the main topics ([Yogi](https://www.meetyogi.com/post/mens-and-womens-fragrances-what-consumers-are-saying)).

---

## 2. Patterns across the winners

1. **Remove the risk before asking for the money.** Snif (80% of orders took the trial), Byredo and Commodity (credit equal to what you paid), Diptyque (test before you open). Edwards calls removing commitment "the biggest lever".
2. **Use the original as a reference point, then show your own taste.** Dossier, Alt, Oakcha and Lattafa all ride "smells like X". Dossier is now moving to its own scents (26% of its TikTok Shop sales).
3. **Feeling first, notes second.** Phlur, Replica, Glossier. The words a viral creator used were about a person, not an ingredient.
4. **A cheap entry product that leads to the bottle.** Alt's mystery sample at about 15% of AOV, Phlur's $32 travel size, Oakcha's $13 sets.
5. **Creator video at volume.** Dossier works with more than 10,000 influencers; Lattafa grows on blind-buy and versus videos.
6. **Strength and longevity in plain words.** Commodity's spaces; the longevity/sillage scores fans already use.

---

## 3. The 10 tactics most transferable to eternal (ranked by expected impact, all within the honesty rules)

| # | Tactic | Where | Evidence | Owner must confirm |
|---|---|---|---|---|
| 1 | **"Smell it before you open it."** Every 55 ml ships with a 5 ml of the same scent. If it isn't right, return or exchange the **sealed** bottle within [n] days. One line under Add to bag, in the sticky bar, on the ad landing, in `CartDrawer` and in the FAQ. | `BuyBox`, `MobileStickyBar`, `CartDrawer`, `content/faq.ts`, ad copy | Snif (80% trial share, Edwards quote), Diptyque | Returns window, how cash-on-delivery refunds work, cost of the 5 ml |
| 2 | **Sample and mystery-box credit with a unique code.** The code equals what was paid, works on any 55 ml, and expires in 60–90 days. Print it on a card in the box and send it on WhatsApp. Replace "credited back [confirm]" with the real terms. | `BuyBox` size selector, mystery-box PDP, `RiskReducers`, post-purchase WhatsApp | Byredo ($60 / $235 vouchers, 6-month validity), Commodity, Kosas | Code mechanics (Shopify discount codes via Flow or an app), expiry |
| 3 | **Mystery box as a one-tap add-on for everyone.** Show it in `CartDrawer` even with no viewed sample. Add a checkout upsell if the Shopify plan allows. | `CartDrawer` upsell block | Alt: offer at about 15% of AOV gave 60K+ conversions and seven figures in 12 months (vendor claim) | — |
| 4 | **Honest strength and longevity labels.** Turn `sillage` into "Close to the skin / Arm's length / The whole room" (same words as the finder). Turn `longevity` into hours, marked "perfumer's estimate" until tested. Add these as collection chips and on `ProductCard`. | `ProductCard`, collection filters, `WearIt` | Commodity scent spaces; longevity is the top complaint about dupes | Test method; keep "[estimate]" marked until confirmed |
| 5 | **Inspired-by done Dossier-style, with eternal's honesty.** One "Inspired by X" line plus the `comparison` "how ours differs". Make originals searchable and add a "Find by the one you know" entry. Add a not-affiliated disclaimer. | PDP header, `SearchOverlay`, `/shop`, footer and FAQ | Dossier naming and disclaimer; Primelis: designer-name search clicks converted well | Legal review; Meta ad rules on naming third-party brands (not researched: UNVERIFIED) |
| 6 | **Lead with the feeling, keep the ad's words on the page.** Ad line → PDP `signature` line → 3 notes → inspired-by. The landing page should repeat the line used in the Instagram ad. | `BuyBox` top, ad landing URLs | Phlur (Missing Person), Replica, Glossier You | — |
| 7 | **Themed trios and bundles.** "After dark", "Sea air" and per-line 3 × 5 ml trios. "Bottle + 5 ml twin". "Discovery + bottle". Gift sets timed to Ramadan, Eid, 21 March and Valentine's. Show "value" only when it is the real sum of single prices. | Home `RiskReducers`, `/shop` sets collection, `CartDrawer` | Byredo themed sets, Oakcha sets, Le Labo set + 50 ml, Phlur duet / "$76 value", Gulf gift-set cadence | Set prices; real stock only |
| 8 | **Creator "first sniff" and side-by-side videos, also used on the PDP.** Paid Cairo micro-creators, clearly marked #ad: "wore it 8 hours", "next to the original". Add 9:16 clips to `Gallery`. Never script longevity claims beyond what was tested. | Instagram ads, PDP `Gallery` | Dossier (10K+ influencers), Lattafa blind-buy and versus content, Phlur creator moment | Creator budget, disclosure |
| 9 | **Reviews built for scent, collected honestly.** Ask on WhatsApp 10–14 days after delivery for: overall, longevity, projection, "reminds me of", and closer to / different from the original. Until real reviews exist, show "No reviews yet". Never seed fake ones. | PDP reviews block (new), post-purchase flow | Fragrance communities rate longevity and sillage; longevity dominates review talk | Review app choice |
| 10 | **Finder ends in a basket.** The result screen offers "Try your top 3 as 5 ml" with credit, plus a one-tap "send my results on WhatsApp". Test the finder as a cold-traffic ad destination ("your scent in 30 seconds") and measure it against PDP landing. | `Finder` result, `FinderEntry`, Instagram ads | Scentbird profile loop; quiz uplift is only vendor benchmarks (8–25% claimed): treat as a test | — |

**Second-tier moves (later)**
- **Price transparency in the house voice:** state concentration and what you don't pay for (Dossier, Oakcha), in the house's editorial tone rather than discount language.
- **Free-shipping threshold just above the average bottle price,** so the mystery box or a second bottle closes the gap. `CartDrawer` already has the meter.
- **eternal Originals** once the inspired-by base is established (Dossier: 26% of TikTok Shop sales).
- **Real small-batch seasonal editions** with true batch sizes (Le Labo's built-in scarcity, not countdowns).
- **Price ladder:** 5 ml → 55 ml → later a travel spray (Phlur's $32 / $99 / $139).

---

## 4. Sources (from search results; none read in full, see method note)

- https://www.shopify.com/blog/dossier-affordable-luxury-accessible-perfume-pricing
- https://www.beautyindependent.com/american-pacific-group-dossier-dupe-business-deal/
- https://sacra.com/c/dossier/
- https://www.shipbob.com/blog/dossier/
- https://www.primelis.com/case-studies/dossier-casestudy-signal/
- https://www.primelis.com/case-studies/dossiers-casestudy-amazon/
- https://wwd.com/beauty-industry-news/fragrance/dupe-fragrance-brand-dossier-tiktok-viral-store-new-york-1237928141/
- https://shopify.substack.com/p/decoded-dossier
- https://fashionista.com/2025/07/dossier-new-york-store-opening
- https://www.glossy.co/beauty/dupe-fragrance-has-hit-the-mainstream-now-what/
- https://dossier.co/pages/terms-conditions
- https://www.walmart.com/ip/Dossier-Woody-Oakmoss-Eau-de-Parfum-Inspired-by-Chanel-s-Coco-Mademoiselle-Perfume-for-Women-1-7-oz/862716344
- https://www.trustpilot.com/review/dossier.co
- https://www.fashionbeans.com/article/dossier-perfume-review/
- https://organicbeautylover.com/skin/dossier-review/
- https://www.upsellplus.com/case-studies/alt-fragrances
- https://altfragrances.com/blogs/news/breaking-the-luxury-tax
- https://www.refinery29.com/en-us/oakcha-perfume-dupes-review
- https://www.mindbodygreen.com/articles/oakcha-fragrances-beauty-editors-review-of-clean-dupes
- https://www.oakcha.com/products/oakcha-sample-discovery-set
- https://www.oakcha.com/pages/bundle-builder
- https://wwd.com/beauty-industry-news/fragrance/fragrance-dupes-oakcha-jo-milano-tiktok-shop-phlur-1238032522/
- https://www.beautyindependent.com/snif-talks-new-subbrand-notewrks-fragrances-toys-category-future/
- https://wwd.com/beauty-industry-news/beauty-features/feature/makeup-fragrance-kosas-snif-mob-drive-sampling-evolution-1234821520/
- https://www.fastcompany.com/90562875/fragrance-startup-snif-wont-tell-you-what-their-perfumes-smell-like-you-have-to-sniff-them-for-yourself
- https://www.newbeauty.com/view/snif-fragrance-review
- https://www.thequalityedit.com/articles/snif-review
- https://snif.co/pages/how-it-works
- https://smartrr.com/case-studies/snif-perfume-shopify-subscriptions
- https://www.forbes.com/sites/claraludmir/2025/06/30/how-phlur-is-reshaping-the-world-of-modern-fragrance/
- https://www.glossy.co/beauty/chriselle-lim-is-building-the-next-era-of-phlur-on-storytelling-and-fragrance-wardrobes/
- https://graziadaily.co.uk/beauty-hair/skin/phlur-missing-person-perfume/
- https://www.bustle.com/style/phlur-missing-person-fragrance-perfume
- https://phlur.com/products/missing-person-duet
- https://retailboss.co/phlur-now-in-1500-stores-as-luxury%E2%80%91viral-perfume-goes-mainstream-in-2025/
- https://theindustry.beauty/phlur-acquired-by-tsg-consumer-partners/
- https://wwd.com/beauty-industry-news/fragrance/lattafa-phlur-sol-de-janeiro-dupe-tiktok-shop-fragrances-1237049601/
- https://commodityfragrances.com/pages/faq
- https://commodityfragrances.com/collections/discovery-sets
- https://www.byredo.com/uk_en/p/discovery-set-eau-de-parfum-6x2ml
- https://www.byredo.com/us_en/p/la-grande-decouverte
- https://hypebeast.com/2021/8/le-labo-city-exclusive-discovery-set-release-info
- https://www.lelabofragrances.com/discovery-sets/classic-collection/discovery-set/17-50ml-8.html
- https://www.diptyqueparis.com/en_us/p/build-your-own-discovery-set-of-5-eaux-de-toilette-1.html
- https://www.latterly.org/diptyque-marketing-strategy/
- https://detaildigest.substack.com/p/maison-margielas-replica-fragrance
- https://moodiedavittreport.com/maison-margiela-fragrances-celebrates-success-of-replica-memory-trip-pop-up-with-cdfg/
- https://www.whowhatwear.com/glossier-perfume-review
- https://www.influenster.com/reviews/glossier-you-eau-de-parfum
- https://wwd.com/business-news/business-features/scentbird-personalized-fragrance-discovery-subscription-1238929154/
- https://wwd.com/beauty-industry-news/fragrance/scentbird-society-fragrance-launch-niche-designer-1238890297/
- https://www.fastcompany.com/40574010/scentbird-sniffs-out-18-6m-to-make-subscription-fragrance-a-thing
- https://getlatka.com/companies/scentbird.com
- https://www.scentbird.com/blog/find-your-perfect-scent-with-the-new-scentbird-quiz/
- https://x.com/OctaneAI/status/1522303871133134855
- https://www.octaneai.com/case-studies/doe-lashes
- https://freeyourself.com/blogs/news/personalized-scent-quiz-conversion
- https://wwd.com/beauty-industry-news/fragrance/arab-fragrance-oud-lattafa-kayali-amouage-1238089130/
- https://www.spate.nyc/blog/fragrance-trends-2026-on-google-tiktok-and-instagram
- https://uae.swissarabian.com/collections/giftsets-gifts
- https://us.arabianoud.com/en/0401010260-islamic-gift-set
- https://rasasionline.com/
- https://www.noon.com/egypt-en/beauty/fragrance/nspired/
- https://www.fragrantica.com/news/Sevilla-Fragrances-A-Small-Egyptian-Brand-From-Cairo-15211.html
- https://www.egypttoday.com/Article/6/128584/These-Local-Brands-Will-Leave-You-Smelling-Divine
- https://xpay.app/blog/payment-methods-egyptian-customers-prefer
- https://www.mordorintelligence.com/industry-reports/egypt-ecommerce-market
- https://www.parfumo.com/Users/Ceesie/Blog/Article/longevity-sillage-performance
- https://www.meetyogi.com/post/mens-and-womens-fragrances-what-consumers-are-saying

Repo files referenced: `/home/user/ETERNAL_E-Commerce/content/scents.ts`, `/home/user/ETERNAL_E-Commerce/content/finder.ts`, `/home/user/ETERNAL_E-Commerce/content/site.ts`, `/home/user/ETERNAL_E-Commerce/content/faq.ts`, `/home/user/ETERNAL_E-Commerce/components/product/BuyBox.tsx`, `/home/user/ETERNAL_E-Commerce/components/cart/CartDrawer.tsx`, `/home/user/ETERNAL_E-Commerce/components/home/Sections.tsx`
