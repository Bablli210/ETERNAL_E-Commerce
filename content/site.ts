/**
 * Facts about the house. A value still in [square brackets] is a fact to
 * confirm: lib/facts.ts treats it as missing, so the element that needs it
 * renders nothing on the site, and /launch-checklist lists it. Replace the
 * whole string (brackets included) with the confirmed wording to switch it on.
 */
export const site = {
  name: "eternal",
  tagline: "Some things are never meant to fade.",
  description:
    "Fine eaux de parfum in three lines — eterna for her, eterno for him, eternal for both — composed to last on skin and in memory. Bottled in Cairo.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://eternal-storefront.vercel.app",
  currency: "EGP",
  locale: "en-EG",

  /** One confirmed offer for the bar above the header, matched to the running ads. */
  announcement: "[Two free 5 ml samples with every order]",
  /** The free-samples promise, shown in the hero, buy box and bag. */
  freeSamples: "[Two free 5 ml samples with every order]",
  /** How the 5 ml sample price comes back. Shown once 5 ml variants and credit codes exist. */
  sampleCredit: "[Its price comes off your 55 ml within 60 days]",

  /**
   * Delivery on bottles: true = included on every bottle (the playbook's
   * launch recommendation), false = charged at checkout, null = not decided
   * (nothing is said about delivery cost).
   */
  deliveryIncluded: null as boolean | null,
  /** Free-shipping threshold in EGP for bags without a bottle. null hides the bag meter. */
  freeShippingThreshold: null as number | null,
  /** e.g. "1–2 days in Cairo & Giza, 2–4 days elsewhere". */
  deliveryTime: "[Delivery time]",
  returnsPolicy: "[Returns policy]",
  returnsWindow: "[n days]",
  longevityClaim: "[Longevity on skin, from a wear test]",
  firstOrderOffer: "[First-order offer]",
  codFee: "[Cash-on-delivery fee]",

  /** e.g. "Order by 2 pm for next-day delivery in Cairo & Giza". Shown under the buy button. */
  deliveryCutoff: "[Delivery cut-off]",
  /** WhatsApp reply hours, e.g. "Every day, 10 am – 10 pm". */
  whatsappHours: "[WhatsApp hours]",
  /** Company details for the footer: legal name, commercial registration, tax id, address. */
  legalName: "[Legal company name]",
  companyRegistration: "[Commercial registration no.]",
  taxId: "[Tax id]",
  address: "[Registered address, Cairo]",

  /** International format without +, e.g. "201001234567". null hides WhatsApp buttons. */
  whatsapp: null as string | null,
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
      { label: "Bestsellers", href: "/shop/bestsellers" },
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
