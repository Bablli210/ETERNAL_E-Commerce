/**
 * Facts about the house. A value still in [square brackets] is a fact to
 * confirm: lib/facts.ts treats it as missing, so the element that needs it
 * renders nothing on the site, and /launch-checklist lists it. Replace the
 * whole string (brackets included) with the confirmed wording to switch it on.
 */
export const site = {
  name: "eternal",
  tagline: "Some things are never meant to fade.",
  /** The meta and link-preview description on every page, so it states nothing still waiting for the owner. */
  description: "Eaux de parfum in three lines: eterna for her, eterno for him, eternal unisex. A perfume house from Cairo.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://eternal-storefront.vercel.app",
  currency: "EGP",
  locale: "en-EG",

  /** One confirmed offer for the bar above the header, matched to the running ads. */
  announcement: "Free delivery on orders over EGP 2,000",
  /** The free-samples promise, shown in the hero, buy box and bag. */
  freeSamples: "[Two free 5 ml samples with every order]",
  /** How the 5 ml sample price comes back. Shown once 5 ml variants and credit codes exist. */
  sampleCredit: "[Its price comes off your 55 ml within 60 days]",

  /**
   * Delivery on bottles: true = included on every bottle, false = charged at
   * checkout below the free-delivery threshold, null = not decided (nothing
   * is said about delivery cost).
   */
  deliveryIncluded: false as boolean | null,
  /**
   * Free delivery from this bag subtotal, in EGP. It must match the free rate
   * in Shopify's shipping settings (minimum order price 2,000). null hides the
   * bag meter and every free-delivery line.
   */
  freeShippingThreshold: 2000 as number | null,
  /** Couriers deliver Sunday to Thursday; Friday and Saturday are off. */
  deliveryTime: "within 2 working days, Sunday to Thursday",
  /** Unopened bottles only, so a return can be resold. */
  returnsPolicy: "Returns on sealed bottles",
  /** Egypt's consumer protection law gives 14 days from delivery. Reads after "within". */
  returnsWindow: "14 days of delivery",
  longevityClaim: "[Longevity on skin, from a wear test]",
  /** Where the bottles are made, only if literally true (playbook 4.7). The home page's house section names it. */
  origin: "Made in Egypt",
  firstOrderOffer: "[First-order offer]",
  /** Reads after "Cash on delivery ·" on product pages, and as "… for cash on delivery" elsewhere. */
  codFee: "No extra fee",

  /** e.g. "Order by 2 pm for next-day delivery in Cairo & Giza". Shown under the buy button. */
  deliveryCutoff: "[Delivery cut-off]",
  /** WhatsApp reply hours, e.g. "Every day, 10 am – 10 pm". */
  whatsappHours: "[WhatsApp hours]",
  /** Company details for the footer: legal name, commercial registration, tax id, address. */
  legalName: "[Legal company name]",
  companyRegistration: "[Commercial registration no.]",
  taxId: "[Tax id]",
  address: "[Registered address, Cairo]",

  /** The address that answers shoppers' questions, e.g. "hello@eternal.example". /help offers it under "Talk to us" once confirmed. */
  contactEmail: "[Contact email]",
  /** International format without +, e.g. "201001234567". null hides WhatsApp buttons. */
  whatsapp: "201116766614" as string | null,
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",

  /** Only methods that are live at checkout; bracketed ones stay hidden. */
  paymentMethods: ["Visa", "Mastercard", "Meeza", "Cash on delivery", "[Local wallets]"],

  scentCount: 43,
  sampleSizeMl: 5,
  bottleSizeMl: 55,
} as const;

export const nav = [
  { label: "Shop", href: "/shop" },
  { label: "Find your scent", href: "/finder" },
  { label: "Tales", href: "/tales" },
  { label: "The house", href: "/house" },
] as const;

/** The line names differ by one letter, so each one travels with its audience. */
export const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "For her · eterna", href: "/shop/her" },
      { label: "For him · eterno", href: "/shop/him" },
      { label: "Unisex · eternal", href: "/shop/unisex" },
      { label: "Mystery box", href: "/products/mystery-box" },
      { label: "Find your scent", href: "/finder" },
      { label: "Where to start", href: "/shop/bestsellers" },
      { label: "New", href: "/shop/new" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Shipping & delivery", href: "/help#delivery" },
      { label: "Returns & exchanges", href: "/help#returns" },
      { label: "Track my order", href: "/help#track" },
      { label: "FAQ", href: "/help" },
    ],
  },
  {
    title: "The house",
    links: [
      { label: "Our story", href: "/house" },
      { label: "Tales", href: "/tales" },
    ],
  },
] as const;
