import { site } from "./site";

export type FaqEntry = { id: string; q: string; a: string };

/** Shared by collection and product pages (metaobject faq_entry on the boards). */
export const faq: FaqEntry[] = [
  {
    id: "longevity",
    q: "Do they really last?",
    a: `Eau de parfum concentration; ${site.longevityClaim} on skin. Every listing shows its own longevity score from wear tests, not a slogan.`,
  },
  {
    id: "originals",
    q: "Are these the originals?",
    a: "No — each scent is our own composition inspired by a fragrance people already love. We name the original so you know what to expect, and say how ours differs.",
  },
  {
    id: "cod",
    q: "How does cash on delivery work?",
    a: `Order, we call to confirm, pay the courier when it arrives. ${site.deliveryTime} across Egypt. ${site.codFee}.`,
  },
  {
    id: "returns",
    q: "Can I return a bottle?",
    a: `${site.returnsPolicy} — unopened bottles within ${site.returnsWindow}.`,
  },
  {
    id: "wrong",
    q: "What if I choose wrong?",
    a: "Start with a 5 ml sample or the mystery box. The scent finder narrows the house to three matches in two minutes, and the tales tell you what each one feels like before you smell it.",
  },
];

export const faqByIds = (ids: string[]) => ids.map((id) => faq.find((f) => f.id === id)).filter(Boolean) as FaqEntry[];
