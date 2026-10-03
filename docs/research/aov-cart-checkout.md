# Cart, checkout, AOV and retention research for eternal

## 0. Research limits (read first)

- **The open-web research could not be done.** The session's WebSearch budget was already used up (200 of 200) before this task started, so all 4 searches I tried returned nothing. The network proxy also blocked every WebFetch I tried: baymard.com, nngroup.com, shopify.com, help.shopify.com, developers.google.com, web.dev, klaviyo.com, cxl.com, omnisend.com, facebook.com and wikipedia.org. The brief asked for at least 8 searches and 6 full-page reads, and that target was **not met**.
- **What I did check live:** about 14 queries against Shopify's developer docs (shopify.dev) through the Shopify docs tool, plus a read of the storefront code and catalogue in `/home/user/ETERNAL_E-Commerce`. Every Shopify platform fact marked **[VERIFIED: shopify.dev]** comes from those reads.
- **Everything else is from memory.** Third-party numbers (Baymard, Google, Sumo, UPS, Omnisend and others) are labelled **UNVERIFIED** and name their source so someone can check them before quoting. I left out any number I wasn't confident had actually been published.

---

## 1. What the code does today (it shapes the recommendations)

| Fact | File | Why it matters |
|---|---|---|
| The bag lives only in `localStorage` (`eternal.bag.v1`). A Shopify cart is created only when "Checkout" is tapped. | `components/cart/CartProvider.tsx`, `app/api/checkout/route.ts` | Shopify can't see a cart until checkout starts, so there is nothing to recover before it. Storage inside Instagram's in-app browser is separate from Safari/Chrome, so a shopper who switches browsers arrives to an empty bag. Shopify automatic discounts and Functions don't show in the drawer. |
| The drawer footer says "Shipping and cash-on-delivery fee calculated at checkout". | `CartDrawer.tsx` | This is the "couldn't see total cost up-front" problem in plain words. |
| `freeShippingThreshold: null`, `codFee: "[COD fee]"`, `firstOrderOffer` unset | `content/site.ts` | The meter is hidden and the costs are unknown. |
| The drawer already has a free-shipping meter, a "sample of something you viewed" upsell and a "complete the set" (same line) upsell. | `CartDrawer.tsx` | The base is good, but two upsells is one too many on a phone, and "same line" is a weak reason to buy. |
| Prices of the 42 bottles (55 ml) in the 2026-09-18 snapshot: min 885, P25 950, **median 1,099**, P75 1,199, max 1,560, mean 1,095. **35 of 42 cost 1,199 or less.** Mystery box: EGP 250 for 3 × 5 ml. | `content/catalogue.snapshot.json` | The free-shipping threshold maths below uses these prices. |
| Signup capture exists only as an email field in the footer. | `components/chrome/Footer.tsx` | No phone or WhatsApp capture, and nothing on the quiz. |

---

## 2. Findings

### 2.1 Cart and AOV mechanics

**F1. Free-shipping threshold**
- Usual practice is a threshold 15–30% above the median order, so many shoppers are one small add-on away from it. **UNVERIFIED**: this is common Shopify and app guidance, and I found no controlled study behind it.
- The UPS / comScore *Pulse of the Online Shopper* (around 2015) found 58% of US shoppers had added items to qualify for free shipping. **UNVERIFIED**, and it is old US data.
- **For eternal:** a single bottle (median EGP 1,099) is the likely typical order. That puts the 15–30% band at about **EGP 1,265–1,430**.
- The natural add-on is the EGP 250 mystery box or a 5 ml sample. The median bottle plus the box comes to exactly 1,349.
- Three options:
  - **A. Every bottle ships free** (threshold = EGP 885). Sample-only and box-only orders pay for delivery. This removes one of the two extra costs a COD buyer sees, and AOV comes from the second-bottle offer instead.
  - **B. Free over EGP 1,350.** It pushes AOV, but 35 of 42 bottles (83%) would then show a delivery fee **plus** the COD fee. For EGP 950 bottles (the most common price, 11 of 42), the mystery box alone doesn't close the gap.
  - **C. Free over EGP 1,750** (any two bottles; the cheapest pair is 1,770). Single-bottle buyers, likely most cold Instagram traffic, always pay delivery.
- **Do:** launch with **A** if the courier cost per order is small next to an EGP 885 bottle. My rule of thumb is about 6–8% or less, which is my own heuristic. Then test **B** against A once you have about 300–500 orders. Avoid C at launch.
- **Where:** set `site.freeShippingThreshold` (885 for A). Show the meter only when it can be reached with one add-on. In option A, that means only in sample-only or box-only bags.

**F2. Cart drawer or cart page**
- I could not reach any controlled public benchmark comparing the two (**UNVERIFIED** either way).
- What I could verify is the mechanism. Instagram ad traffic arrives with one product in mind, and a drawer keeps the shopper on that page while putting the checkout button one tap away. This storefront already auto-opens the drawer 450 ms after "Add".
- **Do:** keep the drawer as the main bag. Add a `/bag` page only as a landing target for recovery links, rebuilt from variant IDs.
- Don't put the Shopify cart ID in links. Shopify says the cart ID's secret key must never go into shareable links or public pages. **[VERIFIED: shopify.dev, Storefront cart guide]**

**F3. In-cart upsells**
- Show **one** suggestion at a time. Ranked rules:
  1. The bag is only samples or the mystery box → "Make it a bottle: your sample is credited back."
  2. The bag holds a bottle → a "pair it with" pick from the curated PDP **pairings**. This replaces the generic same-line "complete the set", which is a weaker reason to buy.
  3. A gap to the threshold exists → the cheapest real item that closes it.
- Shopify's own upsell guidance asks for full cost transparency, a clear way to decline, no exclamation marks and no misleading language. **[VERIFIED: shopify.dev, UX for post-purchase offers]** This fits eternal's honesty rules, so use it for the drawer too.

**F4. Bundles and multi-buy, without discounting**
- Price per ml: bottles average about 19.9 EGP/ml and the mystery box is 16.7 EGP/ml. Samples are already honestly priced.
- **Do:** make the second-bottle offer a value-add, not a cut: "Two bottles, one courier: a third 5 ml on us."
- Build it with Shopify's automatic Buy X Get Y discount, which exists in the Admin API. **[VERIFIED: shopify.dev]**
- Note that changing a line's price or title with Cart Transform is Plus-only (and works on dev stores). **[VERIFIED: shopify.dev, Cart Transform API]** So use discounts, not Cart Transform, on a non-Plus plan.

**F5. Gift messages and gift wrap**
- Cart attributes carry over to the order, and Shopify names "gift wrapping requests" as a common use. **[VERIFIED: shopify.dev, Attribute]**
- **Do:** add a collapsed "This is a gift" row in the drawer with:
  - a message of up to 150 characters → attribute `gift_message`
  - "Hide prices on the packing slip" → attribute `gift_hide_prices`, read in Shopify's packing-slip template (editing that template: **UNVERIFIED** detail)
- Keep it free; a premium brand shouldn't charge for a card. Push it before Ramadan/Eid, Valentine's and Egyptian Mother's Day (March 21).

**F6. Post-purchase upsells mostly won't work for this store**
- Shopify's post-purchase page **only works for Online Store channel orders**. It **isn't shown when the order was paid with anything other than a credit card** (and not for wallets such as Apple Pay or Google Pay). It is still **beta** for live stores (app access must be requested), allows up to 3 offers and skips local delivery. **[VERIFIED: shopify.dev, product offers]**
- Checkouts made through the Storefront API go through the Headless channel, so most eternal orders (headless, and many paid by COD) won't qualify.
- **Do instead:**
  - (a) A Thank-you / Order-status extension, available on all plans except Starter. Shopify lists "upsell offers … through order editing" on the Order status page as a use. **[VERIFIED: shopify.dev]**
  - (b) Use the COD confirmation call or WhatsApp you already plan ("we call to confirm"): "Add a 5 ml to this parcel? You pay the courier once." Staff then edit the unpaid order.

### 2.2 Checkout friction

**F7. Unexpected costs are the top abandonment reason**
- Baymard: about 70% average documented cart abandonment (70.19% across 49 studies). Among reasons for abandoning checkout, "extra costs too high" ranks first at about 48%. "Couldn't see or calculate the total order cost up-front" is about 21% and "too long or complicated checkout" about 22%. Account creation is about 26% and "not enough payment methods" about 13%. All **UNVERIFIED**: from Baymard's 2023–2024 survey, page blocked this session.
- **Do:**
  - Replace "calculated at checkout" with the real figures on the **PDP under Add to bag** and in the **drawer footer**.
  - Use the governorate list (Shopify lists Egypt by governorate) to show a per-zone price. The Storefront cart can return `deliveryGroups → deliveryOptions` with estimated costs before checkout once an address or country is set. **[VERIFIED: shopify.dev]**
  - For flat rates, hard-code them in `site.ts`.

**F8. The COD fee needs a deliberate build**
- Shopify Functions can **hide, rename or reorder** payment methods (for example, hide COD above a cart total). **[VERIFIED: shopify.dev, Payment Customization]**
- Delivery options can be **hidden, renamed or reordered**. **[VERIFIED: shopify.dev]**
- I found no native way to add a fee tied to a payment method.
- **Do:** state the fee everywhere as "Cash on delivery adds EGP [Z]; card, Meeza or InstaPay don't." In checkout, apply it as an honestly named delivery rate ("Delivery, pay cash on arrival (incl. EGP Z COD fee)") or through your Egyptian gateway or courier app. Which works best: **UNVERIFIED**, so test it.
- Optional: a Payment Customization function that hides COD above a value where refusals (return-to-origin) would be costly.

**F9. Express checkout: Shop Pay probably isn't available**
- Shopify claims Shop Pay lifts conversion by "up to 50%" against guest checkout (Shopify, 2023; **UNVERIFIED**).
- But Shop Pay depends on **Shopify Payments**; the docs say full Shopify Payments sign-up is required for Shop Pay Wallet. **[VERIFIED: shopify.dev]**
- Shopify Payments is not offered in Egypt (**UNVERIFIED**, high confidence; check Settings › Payments). Apple Pay and Google Pay in Shopify checkout usually depend on the gateway as well (**UNVERIFIED**).
- Instagram's in-app browser injects scripts into pages (Felix Krause, 2022; **UNVERIFIED**), which often makes Apple Pay unavailable there (**UNVERIFIED**).
- **Do:** treat "express" as **prefill + COD + local wallets**:
  - Pass `buyerIdentity.phone` (and email if you have it) plus `countryCode: EG` into the cart. Shopify uses this to prefill checkout. **[VERIFIED: shopify.dev, CartBuyerIdentity]**
  - Delivery addresses added with `cartDeliveryAddressesAdd` are prefilled too. **[VERIFIED: shopify.dev]**
  - Add InstaPay / Fawry / Paymob as soon as they're confirmed.

**F10. Form fields and phone-first checkout**
- Baymard: the average checkout has about 11 form fields and 23 form elements, against an achievable 8 fields / 12–14 elements. Better checkout design could lift conversion about 35% on large sites. All **UNVERIFIED**.
- **Do (Shopify admin › Checkout):**
  - Contact: allow **phone *or* email**.
  - Customer accounts: optional, so guests can check out.
  - Company name: hidden. Address line 2: optional.
  - Full name: last name only, if your courier accepts it.
  - Shipping phone: required, because COD couriers need it.
  - Keep one-page checkout.
- Field-level changes on the information, shipping and payment steps need **Plus** (checkout UI extensions there are Plus-only). **[VERIFIED: shopify.dev]** So put the effort into settings and prefill, not extensions.

### 2.3 Capture and recovery

**F11. Today nothing can be recovered before checkout**
- Shopify's `Abandonment` object covers browse, cart and checkout abandonment, and has an `isFromCustomStorefront` flag. **[VERIFIED: shopify.dev]**
- Headless sites feed it by sending Shopify analytics events (`PAGE_VIEW`, `ADD_TO_CART`) with the `_shopify_y` / `_shopify_s` cookies. **[VERIFIED: shopify.dev, sendShopifyAnalytics]**
- The Storefront Cart API **fires no webhooks on cart create or update**. **[VERIFIED: shopify.dev]**
- **Do:**
  - (1) Create the Shopify cart on the **first add** (`cartCreate`) and keep its ID server-side or in an httpOnly cookie.
  - (2) Send Shopify analytics events from the Next.js site.
  - (3) Capture a phone number with consent (F12) so there is someone to recover.
  - Recovery links should be **cart permalinks** (`/cart/VARIANT:QTY?attributes[...]&ref=...`). These take `discount`, `note`, `attributes` and `ref` parameters. **[VERIFIED: shopify.dev]** The current code already uses permalinks as its fallback.

**F12. Use WhatsApp first, email second, and skip spin-to-win**
- WhatsApp is the natural channel in Egypt. Since 1 July 2025 Meta charges per template message, and utility messages inside an open 24-hour service window are free (**UNVERIFIED**).
- Egypt's Personal Data Protection Law 151/2020 and WhatsApp policy require opt-in before marketing messages (**UNVERIFIED** detail).
- **Do:**
  - **"Send this bag to my WhatsApp"** in the drawer: a `wa.me` link the shopper sends themselves, carrying a prefilled bag permalink. The customer starts the chat, which opens the service window and gives you a consented number. It also gets them out of Instagram's in-app browser.
  - **Quiz result capture:** "Send my three matches to WhatsApp or email." The quiz is the strongest capture point because it gives you their real preferences.
  - An opt-in tick box beside the phone field in checkout.
- **Recovery timing** (practice, **UNVERIFIED**):
  - WhatsApp about 1 hour after an abandoned checkout ("your bag, one tap back") with no offer.
  - A second message at about 24 hours answering an objection (longevity, "how it compares to the original", COD).
  - An optional third at about 48–72 hours, first-time customers only, offering an extra 5 ml rather than a discount, so people don't learn to abandon.
  - Shopify's own abandoned-checkout email offers send delays with about 10 hours suggested (**UNVERIFIED**). Keep it on as the email backup.

**F13. Pop-ups for phone and Instagram ad traffic**
- Google (from 10 January 2017) may rank pages lower when an interstitial covers the content after a visitor arrives from search. Banners that take a "reasonable amount of screen space" are acceptable (**UNVERIFIED** this session; Google Search Central).
- That rule is about **search** traffic. For eternal the bigger cost is covering the product the ad promised.
- NN/g advises against pop-ups shown before the user has engaged (**UNVERIFIED**).
- Sumo's analysis put the average pop-up conversion at 3.09% and the top 10% at 9.28% (around 2017; **UNVERIFIED**).
- **Do:**
  - **No entry pop-up** on ad landings.
  - After real engagement (second page view, or about 45 s plus 50% scroll), show a dismissible **bottom sheet** covering at most a third of the screen, at most once per session and never on the PDP above the buy box.
  - Make the offer honest: "Your first order: a third 5 ml on us" or "first delivery free". **No spin-to-win**: rigged "everyone wins" wheels break the brand's no-fake-mechanics rule.

### 2.4 Retention

**F14. How long 55 ml lasts (my calculation, inputs UNVERIFIED)**
- Assume about 0.1 ml per spray, giving about 550 sprays per bottle. That works out to:
  - about 6 months at 3 sprays a day
  - about 3.7 months at 5 sprays a day
  - 9–12 months or more for people who rotate scents
- **Do:** calibrate the spray volume by weighing 10 sprays from your own atomiser.
- Fragrance buyers rotate, so the main retention lever is the **next scent**, not a refill of the same one.

**F15. Flows (Klaviyo, Shopify Email or WhatsApp)**

| Day | Message | Channel |
|---|---|---|
| 0 | Order confirmation, COD confirmation and an "add to this parcel" option | WhatsApp (utility) |
| 2–3 (after delivery) | How to wear it (pulse points, layering), with a link to the scent's tale | Email or WhatsApp |
| 10–14 | Request for a **real** review, with photo optional | Email |
| 21–30 | "Your next scent": 3 picks by fragrance family and the free 5 ml they got; the 5 ml is credited back | Email or WhatsApp |
| 75–90 | Halfway point: reorder link (permalink) plus "try its sibling" | WhatsApp |
| 120–150 | Reorder reminder for heavier users | Email or WhatsApp |

- Welcome flow for subscribers who haven't bought: 3 messages over 7 days (house story, finder quiz, mystery box as the low-risk start).
- **Sample credit-back:** for every 5 ml sold, issue a single-use code worth its price, valid about 60 days, and deliver it inside the reorder permalink (`?discount=CODE`).
- Omnisend reports automated messages as about 2% of email sends and about 37% of email-driven orders (**UNVERIFIED**).

**F16. Loyalty: build it later, keep it simple**
- Klaviyo's predictive "next order date" needs about 500 customers with orders and 180 days or more of history (**UNVERIFIED**).
- **Do:**
  - Until then: a referral (give a mystery-box credit, get one) on the Thank-you page and in the day-21 message.
  - After a second order: "the house" status, meaning free delivery on every order and a 5 ml of each new launch.
  - No points currency.
- A note on the owner's goal: "six figures a month" means about 77 orders at about EGP 1,300 if counted in EGP, or several thousand orders if counted in USD. Agree which one before setting targets.

---

## 3. Benchmarks at a glance

| Metric | Value | Source | Status |
|---|---|---|---|
| Average cart abandonment | ~70% (70.19%, 49 studies) | Baymard | UNVERIFIED |
| #1 checkout abandonment reason: extra costs | ~48% | Baymard survey 2023–24 | UNVERIFIED |
| Total cost not visible up-front | ~21% | Baymard | UNVERIFIED |
| Average checkout form fields | ~11 fields / ~23 elements | Baymard | UNVERIFIED |
| Conversion gain from better checkout design | ~35% | Baymard | UNVERIFIED |
| Shop Pay lift vs guest checkout | "up to 50%" | Shopify 2023 | UNVERIFIED, and likely not available in Egypt |
| Added items to qualify for free shipping | 58% | UPS/comScore ~2015 | UNVERIFIED |
| Pop-up conversion, average / top 10% | 3.09% / 9.28% | Sumo ~2017 | UNVERIFIED |
| Post-purchase page limits | Online Store channel only; credit card only; beta; up to 3 offers | Shopify | **VERIFIED** |
| Storefront cart webhooks | None for cart create/update | Shopify | **VERIFIED** |
| Cart line price override (Cart Transform `lineUpdate`) | Plus or dev stores only | Shopify | **VERIFIED** |

---

## 4. Cart drawer spec for eternal

Bottom sheet on phones (`max-h: 92dvh`), right panel on desktop. The footer stays pinned and must fit within about 280 px. Only one suggestion shows at a time.

1. **Header**: "Your bag (n)" and close button (as now).
2. **Delivery row** (replaces the generic meter):
   - Option A in place, bag holds a bottle: "Delivery across Egypt: **free** with any bottle." No meter.
   - Bag holds only samples or the box: "EGP {gap} from free delivery", the meter, and the gap-closing item.
3. **Free samples row** (once the offer is confirmed): "Two 5 ml samples, on us. We'll match them to your bag, or choose:" with 3 chips drawn from the pairings → cart attribute `free_samples`.
4. **Lines** (as now). Sample lines get a sub-label: "Credited back as EGP {price} off its 55 ml."
5. **One suggestion slot**, using the F3 rules in order. Shows the price, an "Add" button and a "Not now" dismiss; adding is silent (no toast, no jump).
6. **Gift** (collapsed): toggle, then message (150 characters) and "Hide prices on the slip" → `gift_message`, `gift_hide_prices`.
7. **Footer, pinned**:
   - Subtotal
   - Delivery: "Free" or "EGP X" (per governorate if zoned)
   - "Cash on delivery: +EGP Z · card, Meeza, InstaPay: no fee"
   - **Estimated total**
   - Button: **"Checkout · EGP {total}"**, full width, at least 52 px tall
   - Payment marks
   - "Delivered in {n} days across Egypt"
   - Text link: "Send this bag to my WhatsApp"
8. **Data**:
   - `cartCreate` on first add, with attributes (UTMs, as the route already does), `buyerIdentity.countryCode = EG`, and the phone when known.
   - Events: drawer_open, suggestion_view, suggestion_add, gift_toggle, wa_bag_send, checkout_click (Meta `InitiateCheckout`).
9. **Never**: countdown timers, "reserved for 10:00", stock counts, or pre-ticked paid add-ons.

---

## 5. Recommendations ranked by expected impact

1. **Show the full cost early** (drawer footer, PDP under Add to bag, FAQ "cod"). Confirm and fill `codFee`, `deliveryTime` and the delivery rates. This addresses the #1 and #6 abandonment reasons. Low effort.
2. **Decide free-delivery policy A or B** (F1) and set `freeShippingThreshold`. Start with A if courier costs allow, and test B at EGP 1,350 later.
3. **Create the Shopify cart on first add, prefill buyer identity, and set phone-first checkout options** (F9, F10).
4. **WhatsApp capture and recovery**: drawer link, quiz capture, checkout opt-in, and 1 h / 24 h / 72 h recovery without discounts (F11, F12).
5. **Sample engine**: two free 5 ml with every order (chosen or matched), sample credit-back codes, and "make it a bottle" in the drawer (F3, F15).
6. **One-slot pairing upsell and a value-add second-bottle offer** using automatic Buy X Get Y (F3, F4).
7. **Post-order add-on through the COD confirmation call and a Thank-you / Order-status extension**, instead of a post-purchase app (F6).
8. **Retention flows**: day 3 / 14 / 21–30 / 75–90 / 120–150 (F15).
9. **Gift message and hidden-price slip** (F5).
10. **Delayed bottom-sheet capture with an honest first-order offer**, no entry pop-up and no spin-to-win (F13).
11. **Referral now, "the house" status after about 500 customers** (F16).

---

## 6. Sources

**Read live this session (shopify.dev, via the Shopify docs tool):**
- https://shopify.dev/docs/apps/build/checkout/product-offers
- https://shopify.dev/docs/apps/build/checkout/product-offers/ux-for-post-purchase-product-offers
- https://shopify.dev/docs/api/checkout-extensions
- https://shopify.dev/docs/apps/build/checkout/thank-you-order-status
- https://shopify.dev/docs/api/checkout-ui-extensions/2026-07/targets/thank-you/header
- https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/migrate-to-cart-api
- https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/migrate-to-cart-api/migrate-your-app
- https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage
- https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/defer
- https://shopify.dev/docs/api/storefront/2026-07/objects/CartBuyerIdentity
- https://shopify.dev/docs/api/storefront/2026-07/objects/Attribute
- https://shopify.dev/docs/apps/build/checkout/create-cart-permalinks
- https://shopify.dev/docs/api/functions/2026-10/cart-transform
- https://shopify.dev/docs/api/functions/unstable/payment-customization
- https://shopify.dev/docs/apps/build/checkout/payments
- https://shopify.dev/docs/apps/build/checkout/delivery-shipping
- https://shopify.dev/docs/api/admin-graphql/2026-04/objects/Abandonment
- https://shopify.dev/docs/api/admin-graphql/2027-01/enums/DiscountClass
- https://shopify.dev/docs/api/commerce-components/pay/shop-configuration
- https://shopify.dev/docs/api/hydrogen-react/2026-01/utilities/sendshopifyanalytics
- https://shopify.dev/docs/storefronts/headless/hydrogen/analytics/validation
- https://shopify.dev/docs/api/admin-rest/2026-10/resources/province

**Cited from memory, blocked this session (check before quoting):**
- https://baymard.com/lists/cart-abandonment-rate
- https://baymard.com/blog/checkout-flow-average-form-fields
- https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials
- https://www.nngroup.com/articles/popups/
- https://www.shopify.com/blog/shop-pay-checkout
- https://sumo.com/stories/pop-up-statistics
- https://developers.facebook.com/docs/whatsapp/pricing
- https://krausefx.com/blog/ios-privacy-instagram-and-facebook-can-track-anything-you-do-on-any-website-in-their-in-app-browser
- UPS/comScore *Pulse of the Online Shopper* (~2015); Omnisend email benchmark report; Klaviyo predictive analytics requirements; Egypt Law 151/2020 (no URLs confirmed)

**Codebase files read:** `/home/user/ETERNAL_E-Commerce/components/cart/CartDrawer.tsx`, `/home/user/ETERNAL_E-Commerce/components/cart/CartProvider.tsx`, `/home/user/ETERNAL_E-Commerce/app/api/checkout/route.ts`, `/home/user/ETERNAL_E-Commerce/content/site.ts`, `/home/user/ETERNAL_E-Commerce/components/product/BuyBox.tsx`, `/home/user/ETERNAL_E-Commerce/content/catalogue.snapshot.json`
