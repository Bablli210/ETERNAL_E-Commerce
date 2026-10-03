# Egypt and MENA ecommerce, and what converts Egyptian shoppers: research for eternal

## 0. Read this first: what I could and could not check

- **WebSearch did not work at all.** Every query came back with "session has used its web search budget (200 of 200)". I ran none of the required 8+ searches.
- **WebFetch was blocked by the network egress proxy on every domain I tried.** That covers trade.gov, datareportal.com, baymard.com, en.wikipedia.org, help.shopify.com, shopify.com, shopify.dev (via WebFetch), bosta.co, nngroup.com, paymob.com and statista.com. A curl probe of about 80 more hosts (press, Meta, CBE, couriers, research firms) also failed. I read none of the required 6+ full pages.
- **One primary source was reachable: Shopify's developer documentation**, through the Shopify MCP doc search (14 queries). Anything marked **VERIFIED** below comes from those docs. It covers how Shopify's checkout, payment, cart and discount features work, which is what decides how the checkout and COD advice can actually be built.
- **Everything else comes from my prior knowledge and is marked UNVERIFIED**, with the source to check. I did not invent numbers. Where I don't remember a reliable figure, I say so and give a way to measure it instead.
- **Suggested follow-up:** rerun this topic with a raised search budget (`CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`) and egress allowed. Otherwise, check the "verify list" in section 6 before any number goes into copy or plans.

---

## 1. Market and shopper behaviour

### 1.1 Market size and growth
| Finding | Status | What eternal should do |
|---|---|---|
| Market estimates (Statista Market Insights, Mordor Intelligence, IMARC, US trade.gov's Egypt guide) put Egyptian B2C ecommerce somewhere between single-digit and low-double-digit billions of USD, growing by double digits a year. They disagree with each other a lot. | UNVERIFIED. I don't remember one figure well enough to quote. | Don't plan from market size. Plan from unit economics: delivered revenue = orders × AOV × (1 − RTO rate), where RTO (return to origin) means orders that ship but come back undelivered. |
| On 6 March 2024 the Central Bank of Egypt let the pound float. It moved from about EGP 30.9 to roughly EGP 47–50 per USD, after a long stretch of high inflation. | UNVERIFIED (high confidence). Check against CBE. | USD figures overstate or understate growth depending on the year. Shoppers are price-aware, so the sample and credit-back mechanic is a real lever. "Six figures a month" means very different things in EGP and USD: about 80 bottles a month for EGP 100k, or about 3,500–4,000 bottles a month for USD 100k at about EGP 1,300 AOV. That gap decides whether COD confirmation is done by hand or automated. Confirm which one the owner means. |
| Digital reach (DataReportal *Digital 2024: Egypt*): about 82 million internet users (about 72% penetration) and about 45 million Facebook ad reach. I remember Instagram ad reach as roughly 18–19 million. | UNVERIFIED | Instagram is big enough to scale on, but much smaller than Facebook in Egypt. Run the same ads on Facebook placements too (Advantage+ placements). Don't run Instagram-only. |

### 1.2 Cash on delivery: share of orders, refusals and RTO
| Finding | Status | What eternal should do |
|---|---|---|
| COD is still the most common way to pay online in Egypt. Industry sources (payment companies, couriers, trade.gov) usually put it at more than half, often 60–70%+, of online orders. | UNVERIFIED. I can't name a primary source with a year. | Plan for most first orders from Instagram ads to be COD. Design the whole COD flow (section 5, item 1) before launch, not after. |
| COD refusal and RTO rates in MENA COD markets are often quoted at 10–30%. They are higher for impulse buys from social ads, for first-time buyers and for remote governorates. | UNVERIFIED. No Egyptian primary source checked. | Track RTO from day 1, split by campaign, governorate and new vs returning customer. That number decides deposits, COD caps and which ads get budget. |
| How Egyptian merchants reduce RTO: confirm every COD order by WhatsApp or a phone call before dispatch; ask for a deposit (usually the delivery fee) for risky groups by InstaPay or wallet; give a reason to pay online; let customers inspect the parcel before paying (couriers such as Bosta offer an "allow opening" option); cap COD by order value; block phone numbers that refused before. | UNVERIFIED as statistics. These are widely seen practices; I have no published uplift numbers. | Use all of them in the order shown in section 5, item 1. |

### 1.3 Payment methods
| Method | What I know | Status | Implication for eternal |
|---|---|---|---|
| **Shopify Payments** | I'm fairly sure it is **not available in Egypt**. Card payments go through third-party gateways, so there is no Shop Pay and no Apple Pay or Google Pay through Shopify. | UNVERIFIED (high confidence) | Don't design around express wallets. Shopify's app store rules also forbid payment apps from processing Apple Pay, Google Pay, Shop Pay or PayPal (VERIFIED, App Store requirements 5.2.10). |
| **Offsite gateways (Paymob, Kashier, Geidea, PayTabs, Fawry)** | Paymob is the best-known Egyptian payment company and reports a very large merchant base. Its offering covers cards, Meeza, mobile wallets and valU/BNPL. | UNVERIFIED (exact methods, fees, whether the Shopify app is live for EGP stores) | Shopify's offsite flow (VERIFIED): the buyer is **sent to the provider's hosted page, then back to Shopify**. A payment can be marked **pending** while the buyer still has to act, as with a Fawry kiosk reference code. That redirect plus a 3-D Secure one-time-password SMS is the most fragile point inside Instagram's in-app browser. Test it on iOS and Android before spending on ads. |
| **Meeza** | Egypt's national card scheme, launched about 2019 by Egyptian Banks Co. Issued at large scale, including government payroll and pension cards. | UNVERIFIED (card counts) | Show the Meeza logo only if the gateway really accepts it online. |
| **InstaPay** | The CBE-backed instant payment app, launched March 2022. Reported at well over 10 million users by 2024–25. Transfer fees (about 0.1%, capped) started in 2025. | UNVERIFIED | It is not a Shopify checkout method unless a gateway supports it. Its main use for eternal is **collecting deposits and paying for orders agreed over WhatsApp**. Don't show an InstaPay logo in the trust strip unless you can take it at checkout. |
| **Mobile wallets (Vodafone Cash and others)** | Vodafone Cash is the largest wallet. | UNVERIFIED (share) | Take it through the gateway if offered, and as a deposit rail on WhatsApp. |
| **Fawry** | Large cash-payment network: pay at kiosks or retailers with a reference code. | UNVERIFIED (network size) | Low priority for a premium, mostly card-or-COD audience. Shopify supports pending payments if you add it later (VERIFIED). |
| **valU and other BNPL (Souhoola, Sympl, etc.)** | valU (EFG Holding) offers instalment plans, usually through gateways. | UNVERIFIED | Worth adding later for orders of two bottles or more. Not a launch priority at EGP 885–1,560. |

### 1.4 Delivery expectations and couriers
| Finding | Status | What eternal should do |
|---|---|---|
| Typical courier delivery promises: Cairo and Giza in 1–2 business days, Alexandria and the Delta in 2–3, Upper Egypt, the Canal cities, the Red Sea and Sinai in 3–5. | UNVERIFIED. Get the real promise from your courier. | Show a **delivery time per governorate**, not one national range. Put it on the PDP delivery line, in the cart drawer, and in Shopify shipping-rate names. |
| Main couriers: **Bosta** (Cairo, ecommerce-focused, COD collection, API and Shopify integration, open-before-paying option), **Mylerz** (ecommerce and COD, fulfilment), **Aramex** (regional, wide reach), plus J&T Express Egypt, ShipBlu, R2S and Egypt Post. | UNVERIFIED (features, prices, how fast collected cash is paid out) | Get quotes from Bosta and Mylerz on four things: delivery fee by zone, COD collection fee, return fee for an RTO, and how often collected cash is paid to you. The RTO fee is the hidden cost that decides the COD policy. |
| Amazon.eg (launched September 2021), noon and Jumia have taught Egyptian shoppers to expect COD, fast delivery in Cairo, free-delivery thresholds and easy returns. | UNVERIFIED (current threshold amounts) | Treat those as the baseline. eternal can't beat them on speed. It can beat them on clarity (one clear total) and on talking to a real person (WhatsApp). |

### 1.5 Trust barriers and signals that matter in Egypt
| Barrier | Status | Signal eternal should use |
|---|---|---|
| Fear of fakes and "high copy" perfume. The local market has a lot of unbranded copies. | UNVERIFIED as a statistic. Widely observed. | eternal's honest "inspired by, and here is how it differs" note **is** the trust signal. Put the difference line close to the price, not deep in the PDP. Also "Bottled in Cairo · batch-coded", only if true. |
| Fear of paying before seeing the product | Same as above | Make COD visible early. Add "Check the box before you pay" **only if your courier allows opening** (sealed box, no spraying). |
| "Is this a real company?" | Same as above | Footer: legal company name, commercial registration number, tax ID, a real Cairo address, phone and WhatsApp, Instagram handle. |
| Not being able to smell it online | Logic. Fragrance-specific. | Lead with the risk reversal: **"Try the 5 ml first. Its price comes off the bottle."** This is stronger than any badge. |
| Card-data distrust. Baymard lists "didn't trust the site with my card details" among the top abandonment reasons. | UNVERIFIED (I remember about 1 in 5 to 1 in 4 US shoppers; not Egypt data) | Show the gateway brand ("Secure payment by [Paymob]") and accepted-card logos next to the checkout button. |
| Returns | Egypt's Consumer Protection Law 181 of 2018 is generally read as giving a 14-day return or exchange window. | UNVERIFIED. Check with a lawyer, especially for opened cosmetics and perfume. | Publish a plain bilingual policy. Example: "Unopened bottles: exchange or refund within 14 days." |

---

## 2. Channels and language

### 2.1 Instagram, and its in-app browser
- Instagram is where Egyptian beauty and fragrance brands get discovered. Most of the conversation happens in comments and DMs. The "بكام؟" ("how much?") comment culture means **hiding the price creates DMs instead of sales**. (UNVERIFIED as data; widely observed.)
  - **eternal:** put the price in the ad or caption and in the first screen of the landing page.
- In the in-app browser, visitors are logged into nothing, have no saved cards, autofill is weaker, and cookies are separate from Safari or Chrome. A visitor who leaves often never comes back to the same session. (UNVERIFIED in this session; well-documented behaviour.)
  - **eternal:** the bag already lives in localStorage. Add **"Send my bag to WhatsApp"** in the cart drawer: a wa.me message with the bag contents and the checkout link. That gives a hesitant visitor a way back that doesn't depend on the session, and it opens a chat you can answer.

### 2.2 WhatsApp commerce
| Use | Mechanism | Status |
|---|---|---|
| Click-to-chat on PDP and cart, with a prefilled message for context | `https://wa.me/<number>?text=…`. The BuyBox already builds this for the product. | Built. It stays hidden while `site.whatsapp` is `null`. |
| Click-to-WhatsApp (CTWA) ads as a second funnel: ad → chat → agent sends a cart link | Your `/api/checkout` already supports **cart permalinks**, so an agent can paste a ready-to-pay link. | Free-message window after a CTWA click (I remember 72 hours): UNVERIFIED, check Meta's WhatsApp pricing docs. |
| COD order confirmation | A WhatsApp Business Platform **utility** template sent through a provider, plus a confirm button on the Thank-you page. | Meta moved to per-message pricing in 2025; utility messages inside an open service window are free: UNVERIFIED. Thank-you page extensions work on **all plans except Starter**: VERIFIED. |
| Abandoned-checkout recovery on WhatsApp | Admin API `AbandonedCheckout` includes a **recovery URL** (VERIFIED). A WhatsApp provider or app sends it, **only to people who opted in**. | Opt-in rules and Egypt's Personal Data Protection Law 151/2020: UNVERIFIED. |

A useful trick: if the **customer** sends the first WhatsApp message, for example by tapping "Confirm on WhatsApp" on the Thank-you page, the conversation is customer-initiated. That opens a service window in which eternal's replies are free or cheap, and replies are much more likely than with a cold template. (Pricing details UNVERIFIED; the mechanism is standard WhatsApp Business.)

### 2.3 Arabic, English and Franco-Arabic
- The premium Cairo audience reads English, and many premium Egyptian brands are English-first. Reassurance about money and delivery lands better in Arabic, and WhatsApp is usually Egyptian colloquial Arabic. Franco-Arabic (Arabizi) is normal in DMs and comments but reads as cheap on a premium site. (UNVERIFIED; observation, no study checked.)
- **Shopify checkout language (VERIFIED as the doc reads today):** Arabic is **not** in the list of languages Shopify provides checkout and system messages for. Those strings have to be entered by hand in the Language Editor. Check this in the admin and test right-to-left layout before offering an Arabic checkout.
- **eternal:**
  - Keep the site English-first and editorial.
  - Add an **Arabic line under the key reassurances**: trust strip, cart total line, help page.
  - Write **shipping-rate and COD method names in both languages.** Those names show inside Shopify's hosted checkout on any plan, without needing Plus.
  - Test Arabic and English ad creative. The landing hero should match the ad's language.
  - Use Franco only in comment and DM replies.

---

## 3. Pricing and offers

### 3.1 Price endings
Pricing research (Wadhwa & Zhang, *Journal of Consumer Research*, 2015: round prices suit feeling-led purchases; Schindler's work on 9-endings signalling discounts) supports **round, calm prices for an emotional, premium product**. (UNVERIFIED in this session; well-known papers.)
- **eternal:** use a consistent ending such as x00 or x50 (for example 900 / 1,250 / 1,550). No .99, no 9-endings.
- Format prices as "EGP 1,250", with Western digits in Arabic lines too, to match checkout.
- Today's 885 sits a little oddly next to rounder prices. Review it when prices are confirmed.

### 3.2 Showing the COD fee honestly (a Shopify limit)
- What's VERIFIED:
  - Payment customization can **rename, reorder and hide** payment methods, including hiding COD above or below a cart total.
  - Checkout UI extensions on the information, shipping and payment steps need **Shopify Plus**.
  - Functions in **custom** apps need Plus; **public** App Store apps with functions work on any plan except Starter.
- What I did **not** find: any built-in way to **add a fee only when COD is selected**. Discounts and cart transforms run without knowing the payment method. (The claim that no native method exists is UNVERIFIED, but I'm fairly confident.)
- **Recommendation:** don't charge a separate COD fee at launch.
  - Build the COD cost into one honest delivery price and show it before checkout.
  - Reward paying online with a **non-price perk** handled at fulfilment, for example "Pay online: we add a third 5 ml sample". Tag prepaid orders automatically by payment gateway using Shopify Flow (Flow availability on your plan is UNVERIFIED) or by hand.
  - If the owner insists on a COD fee, show the exact amount on the PDP delivery line, in the cart drawer and in the COD method's name. Never let "calculated at checkout" be the first time a customer sees it.
- **Current gap in code:** the cart drawer says *"Shipping and cash-on-delivery fee calculated at checkout"* (`components/cart/CartDrawer.tsx:213`). Baymard's top abandonment reason is unexpected extra costs; I remember about 48% (UNVERIFIED). Replace that line with real numbers once confirmed.

### 3.3 Free-shipping threshold
Egyptian marketplace thresholds were not checked (UNVERIFIED). Work from eternal's own price ladder instead:
- With bottles at EGP 885–1,560, a threshold of **EGP 1,750** means **no single bottle qualifies and any two bottles always do**. A top-priced bottle plus the EGP 250 mystery box (1,810) also qualifies, so the box becomes a natural top-up.
- Message it as **"Free delivery on any two bottles"**. That's simpler than a number and fits a premium brand.
- Option to test: free delivery from 1,750 in Cairo and Giza only, with a higher threshold elsewhere. Shopify zone rates with order-price conditions handle this natively.
- Put the result in `site.freeShippingThreshold`; the cart drawer meter already reads it.

### 3.4 The sample offers (to confirm)
- **Two free 5 ml samples with every order:** let shoppers **choose them in the cart drawer** ("Pick your two samples", suggested from recently viewed items and quiz results). Store the choice as **cart attributes** (VERIFIED on Storefront `Cart`). That avoids zero-price product lines; the team packs from the order. Choosing makes the gift feel more valuable.
- **Sample price credited on a full bottle:** issue a **unique discount code** for the sample price, valid 30 days. Send it in the parcel and on WhatsApp after delivery. Shopify supports discount codes (and automatic buy-X-get-Y and free-shipping discounts, VERIFIED discount classes).
- **COD on low-value orders:** consider hiding COD when the cart is under about EGP 500 (a mystery box alone). Low-value COD refusals lose money. Hiding by cart total is a VERIFIED payment-customization use case. A/B test it, because the box is the entry product for ad traffic.

---

## 4. Egyptian and MENA DTC examples
I couldn't open any brand site this session, so funnel details below are **UNVERIFIED** and limited to what is widely known.
- **Kayali (Dubai, founded by Mona Kattan, 2018):** fragrance built on founder Instagram content, numbered scents, a layering story, discovery sets and samples, sold DTC and through Sephora. *Lesson for eternal: a clear system (three lines) plus a sample-first way in.*
- **Huda Beauty (Dubai):** the standard MENA example of an Instagram-born beauty brand built on founder-led content. *Lesson: founder voice and real application videos beat polished ads.*
- **Lattafa / Armaf (UAE):** mass Arabian perfumery whose scents are openly compared to famous designer originals. They grew through TikTok and Instagram creators doing "smells like" reviews, sold mainly through marketplaces and retail, not DTC sites. *Lesson: comparison content creates demand. eternal's honest "how it differs" note is a premium way to join that conversation. Check trademark and comparative-advertising rules with a lawyer.*
- **Okhtein (Cairo handbags):** an Egyptian brand that grew through Instagram and became internationally known (widely reported after Beyoncé was seen with one). *Lesson: Egyptian provenance told editorially can be the premium story.*
- **Egyptian body and skincare (Nefertari, Raw African):** Egyptian brands selling online and on Instagram alongside retail. I couldn't check their checkout or COD setup.
- **Gap:** I couldn't check any Egyptian **fragrance** DTC brand. Do a 30-minute manual review of 5 Egyptian perfume sellers on Instagram. Look at: is the price in the caption, COD wording, the WhatsApp flow, deposit rules, and how they ask for or show reviews.

---

## 5. Recommendations, ranked by expected impact

### 1. A COD control loop: confirm, de-risk, measure (highest impact on profit)
Where: operations, the Thank-you page, the Shopify admin, and `/help`.
1. **Thank-you page** (an extension that works on any plan except Starter, VERIFIED): add *"We'll WhatsApp you within [x] minutes to confirm. Or confirm now"* with a wa.me button prefilled with "Confirm order #{{number}}".
2. **Automatic WhatsApp utility template** within about 5 minutes for COD orders, in Egyptian Arabic and English, with buttons: Confirm / Change address / Cancel. Template below.
3. **No confirmation after [3] hours: call.** Two failed attempts: hold the order, then cancel after 24 hours. **Only confirmed orders are packed.** Use order tags `cod-unconfirmed` → `cod-confirmed`.
4. **Deposit rule** for first-time customers outside Cairo and Giza, and for any order above EGP [x]: ask for the delivery fee by InstaPay or wallet before dispatch. Say this up front on `/help` and the PDP delivery line. Test it against no deposit.
5. **COD cap and blocklist:** hide COD above an order value; tag phone numbers that refused before and hide COD for them. Cart-total hiding is a VERIFIED use case (public app). Hiding by customer tag or address is likely possible from the function input, but check.
6. **Parcel inspection:** turn on "allow opening" with the courier if it's offered. Sealed bottle; no spraying. Say exactly that.
7. **Measure every week:** confirmation rate, RTO rate by campaign, governorate and new vs returning, and cost per *delivered* order.

Template (utility, no promotional content):
> أهلاً {{1}}، شكراً لطلبك من eternal.
> طلب رقم {{2}}: {{3}}
> الإجمالي {{4}} جنيه — الدفع عند الاستلام
> العنوان: {{5}} · التوصيل المتوقع: {{6}}
> من فضلك أكّد الطلب عشان نجهّزه.
> [تأكيد الطلب] [تعديل العنوان] [إلغاء]
>
> EN: "Hello {{1}}, thank you for your eternal order #{{2}} ({{3}}). Total EGP {{4}}, paid on delivery to {{5}}, expected {{6}}. Please confirm so we can prepare it."

### 2. Show one full delivered price before checkout
Where: PDP delivery line under Add to bag, the cart drawer total, and checkout shipping-rate names.
- Replace "calculated at checkout" with real numbers, for example: "Delivery EGP [60] Cairo & Giza · EGP [85] elsewhere · free on any two bottles".
- Name the shipping rates in both languages with timing, e.g. "Cairo & Giza · 1–2 days / القاهرة والجيزة · 1–2 يوم".
- Set `freeShippingThreshold: 1750` to test, and drop the separate COD fee (section 3.2).

### 3. Payments: an online gateway plus a clearly worded COD option
Where: Shopify payment settings and checkout.
- Add an offsite gateway (Paymob first; Kashier or Geidea as alternatives) with cards, Meeza, wallets and later valU. Check which methods are actually live for EGP Shopify stores.
- **Test the redirect and the 3-D Secure one-time-password step inside Instagram's in-app browser** on iOS and Android before launch.
- Set COD up as a manual payment method with a bilingual name and details: "Cash on delivery · الدفع عند الاستلام: pay the courier the exact total; we'll confirm by WhatsApp first."
- Use a public app's payment customization to put the online option first.
- Promote the prepaid perk ("+1 sample when you pay online") on the PDP and in the cart.

### 4. Trust strip and legal footer
Where: under the PDP buy box, the cart drawer footer (replacing the current "Secure checkout / Cash on delivery available" pair), and the home proof strip. Three or four items on mobile, every one true:

| EN | AR |
|---|---|
| Try the 5 ml first; its price comes off the bottle | جرّب الـ 5 مل الأول، وسعرها بيتخصم من الزجاجة |
| Cash on delivery across Egypt, check the box before you pay [if courier allows] | الدفع عند الاستلام في كل مصر |
| Cairo & Giza in 1–2 days, elsewhere 2–5 [confirm] | توصيل 1–2 يوم في القاهرة والجيزة |
| Unopened bottles: exchange within 14 days [confirm] | استبدال خلال 14 يوم للزجاجات المغلقة |
| Questions? A real person on WhatsApp, [hours] | كلّمنا على واتساب |

- Add a row of payment logos for methods that are live at checkout only.
- The footer gets the legal name, commercial registration and tax numbers, a Cairo address and a phone number.
- **No reviews until they are real.** Ask for reviews by WhatsApp about 5 days after delivery, with a verified-buyer label.

### 5. WhatsApp as a second checkout lane
Where: `WhatsAppFloat`, the cart drawer, ads.
- Set `site.whatsapp`.
- Prefill messages with context on the PDP (already done), the cart ("Send my bag to WhatsApp" with the permalink) and the finder results.
- Keep the float button clear of the sticky Add-to-bag bar.
- Run CTWA ad sets alongside website-conversion ad sets.
- Recover abandoned checkouts on WhatsApp with the recovery URL, for opted-in buyers only, using calm copy with no discount.

### 6. The sample system as risk reversal
Where: the BuyBox "Add the sample too" option (already built), the cart drawer, the finder results.
- "Pick your two free samples" stored as cart attributes.
- A sample-credit code sent after delivery.
- Make the mystery box (EGP 250) the default first step for cold ad traffic, with clear wording on how it leads to a bottle.

### 7. Language layer
Where: hero and landing pages, the help page, checkout names.
- Arabic reassurance lines (item 4).
- An Arabic hero subline when `utm_content` shows Arabic ad creative.
- Check Arabic checkout support in the Language Editor before offering an Arabic checkout.

### 8. Optimise Meta ads for orders that are actually delivered
Where: analytics and Conversions API.
- Send a custom event at **COD confirmation**, and ideally at **delivery**, through the Conversions API.
- Use confirmed orders (not placed orders) as the optimisation event once there is enough volume.
- Otherwise Meta learns to find people who order and then refuse the parcel. (This is my reasoning, not a checked Meta guideline.)

### 9. Small checkout plumbing (quick wins in code)
Where: `lib/shopify/queries.ts` `cartCreate`.
- Pass `buyerIdentity { countryCode: EG }`, and the `phone` if it's known from WhatsApp or the finder (VERIFIED: buyer identity and preferences prefill checkout).
- In the admin, set checkout to: phone **or** email as the contact method, phone required on the shipping address, company field hidden, address line 2 optional. (Exact admin setting names are UNVERIFIED.)

### 10. Pricing hygiene
- Settle on one consistent round ending across all 43 scents before launch.
- Show "EGP 1,250" the same way everywhere: Western digits, no decimals.

---

## 6. Verify list (UNVERIFIED facts to confirm before using in copy or planning)
1. Egypt's COD share of online orders (trade.gov Egypt guide; payment-company reports).
2. Typical COD refusal and RTO rates (ask Bosta and Mylerz sales teams for their merchant averages).
3. Courier delivery promises by governorate, delivery fees, COD collection fee, RTO fee, cash payout timing.
4. Whether Shopify Payments is available in Egypt, and which gateways and methods (Meeza, wallets, valU, InstaPay) are live on Shopify for EGP.
5. InstaPay users and fees (CBE / Egyptian Banks Co.).
6. Current WhatsApp Business pricing for Egypt, and the free window after a CTWA click (Meta developer docs).
7. Baymard's current abandonment reasons and percentages.
8. DataReportal Egypt reach figures (latest edition).
9. Consumer Protection Law 181/2018 return rules for perfume; PDPL 151/2020 consent rules for WhatsApp marketing.
10. Whether Arabic checkout translation and right-to-left layout work in Shopify's hosted checkout today.

---

## 7. Sources

**Checked this session (Shopify developer docs, via the Shopify MCP doc search):**
- https://shopify.dev/docs/api/functions/2027-01/payment-customization (rename, reorder and hide payment methods; hide by cart total or country; maximum 25 active)
- https://shopify.dev/docs/apps/build/checkout/payments/create-payments-function (example: hide Cash on Delivery above a cart total)
- https://shopify.dev/docs/apps/build/functions (public apps with functions on any plan; custom apps with functions need Plus)
- https://shopify.dev/docs/api/checkout-extensions (information, shipping and payment step extensions need Plus; Thank-you and Order status pages on all plans except Starter)
- https://shopify.dev/docs/apps/build/checkout/technologies (what each checkout technology can do, by plan)
- https://shopify.dev/docs/api/checkout-ui-extensions/2026-07/targets (payment section targets for security badges and accepted-payment icons; COD shown)
- https://shopify.dev/docs/api/checkout-ui-extensions/2026-01/targets/checkout/block (one-page checkout placement rules on mobile)
- https://shopify.dev/docs/api/storefront/2026-07/objects/CartBuyerIdentity (countryCode, phone, preferences prefill checkout)
- https://shopify.dev/docs/api/storefront/2026-04/objects/Cart (cart attributes, note, checkoutUrl)
- https://shopify.dev/docs/api/admin-graphql/2026-10/objects/AbandonedCheckout (recovery URL)
- https://shopify.dev/docs/apps/build/payments/processing (offsite redirect flow; pending payments)
- https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements (5.2.10: payment apps can't process Apple Pay, Google Pay, Shop Pay, PayPal)
- https://shopify.dev/docs/storefronts/themes/architecture/locales/storefront-locale-files (checkout-message languages list; Arabic not included)
- https://shopify.dev/docs/api/functions/2026-07/delivery-customization (rename, sort and hide delivery options; add messaging to delivery option titles)
- https://shopify.dev/docs/api/admin-graphql/2026-04/enums/DiscountClass (automatic buy-X-get-Y and free-shipping discounts)

**Not reachable this session; check them for the UNVERIFIED items:**
- https://www.trade.gov/country-commercial-guides/egypt-ecommerce
- https://datareportal.com/reports/digital-2024-egypt
- https://baymard.com/lists/cart-abandonment-rate
- https://developers.facebook.com/docs/whatsapp/pricing
- https://bosta.co
- https://paymob.com
- https://www.cbe.org.eg
- https://www.statista.com/outlook/emo/ecommerce/egypt
- Wadhwa & Zhang (2015), "This Number Just Feels Right", *Journal of Consumer Research*

**Files in the storefront this research refers to:**
- /home/user/ETERNAL_E-Commerce/content/site.ts
- /home/user/ETERNAL_E-Commerce/components/cart/CartDrawer.tsx (line 213, the "calculated at checkout" copy; lines 236–239, the trust pair)
- /home/user/ETERNAL_E-Commerce/components/product/BuyBox.tsx
- /home/user/ETERNAL_E-Commerce/components/chrome/WhatsAppFloat.tsx
- /home/user/ETERNAL_E-Commerce/lib/shopify/queries.ts (`cartCreate`: no buyerIdentity yet)
- /home/user/ETERNAL_E-Commerce/app/api/checkout/route.ts
