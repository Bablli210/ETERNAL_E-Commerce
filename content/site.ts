/**
 * Facts about the house that the boards mark in [square brackets].
 * Every bracketed value below is a fact to confirm before launch; the
 * components render them as written, so replacing a value here updates
 * the whole site. Set a value to null to hide the element that needs it.
 */
export const site = {
  name: "eternal",
  tagline: "Some things are never meant to fade.",
  description:
    "Fine eaux de parfum in three lines — eterna for her, eterno for him, eternal for both — composed to last on skin and in memory. Bottled in Cairo.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://eternal-storefront.vercel.app",
  currency: "EGP",
  locale: "en-EG",

  /** One generous message, never a sale. Hidden when null. */
  announcement: "Two free 5 ml samples with every order [confirm offer]",

  /** Free-shipping threshold in EGP. null hides the cart meter. */
  freeShippingThreshold: null as number | null,
  deliveryTime: "[Delivery time]",
  returnsPolicy: "[Returns policy]",
  returnsWindow: "[n] days",
  longevityClaim: "[longevity claim, e.g. 8+ hours]",
  firstOrderOffer: "[FIRST-ORDER OFFER]",
  codFee: "[COD fee]",

  /** International format without +, e.g. "201001234567". null hides WhatsApp buttons. */
  whatsapp: null as string | null,
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",

  paymentMethods: ["Visa", "Mastercard", "Meeza", "Cash on delivery", "[Local wallets]"],

  scentCount: 43,
  sampleSizeMl: 5,
  bottleSizeMl: 55,
} as const;

export const nav = [
  { label: "Shop", href: "/shop" },
  { label: "Scent finder", href: "/finder" },
  { label: "Tales", href: "/tales" },
  { label: "The house", href: "/house" },
] as const;

export const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "Her — eterna", href: "/shop/her" },
      { label: "Him — eterno", href: "/shop/him" },
      { label: "Unisex — eternal", href: "/shop/unisex" },
      { label: "Discovery set", href: "/finder" },
      { label: "Mystery box", href: "/products/mystery-box" },
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
      { label: "Scent finder", href: "/finder" },
    ],
  },
] as const;
