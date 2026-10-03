import { facts } from "@/lib/facts";

export type FaqEntry = { id: string; q: string; a: string };

/** Shared by collection and product pages (metaobject faq_entry on the boards). */
export const faq: FaqEntry[] = [
  {
    id: "longevity",
    q: "Do they really last?",
    a: `Every scent is an eau de parfum, the concentration made to last.${facts.longevityClaim ? ` ${facts.longevityClaim}.` : ""} Each listing shows its own longevity and sillage once our wear tests are in.`,
  },
  {
    id: "originals",
    q: "Are these the originals?",
    a: "No — each scent is our own composition inspired by a fragrance people already love. We name the original so you know what to expect, and say how ours differs.",
  },
  {
    id: "cod",
    q: "How does cash on delivery work?",
    a: `Choose cash on delivery at checkout, we confirm your order with you, and you pay the courier when it arrives.${facts.deliveryTime ? ` Delivery: ${facts.deliveryTime}.` : ""}${facts.codFee ? ` ${facts.codFee}.` : ""}`,
  },
  {
    id: "returns",
    q: "Can I return a bottle?",
    a: facts.returnsPolicy && facts.returnsWindow ? `${facts.returnsPolicy} — sealed bottles within ${facts.returnsWindow}.` : "Message us about any order and we will make it right.",
  },
  {
    id: "wrong",
    q: "What if I choose wrong?",
    a: "Start with a 5 ml sample or the mystery box. The scent finder narrows the house to three matches in two minutes, and the tales tell you what each one feels like before you smell it.",
  },
];

export const faqByIds = (ids: string[]) => ids.map((id) => faq.find((f) => f.id === id)).filter(Boolean) as FaqEntry[];
