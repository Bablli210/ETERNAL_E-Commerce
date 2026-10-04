import { facts } from "@/lib/facts";

export type FaqLink = { label: string; href: string };
export type FaqEntry = { id: string; q: string; a: string; links?: FaqLink[] };

/** An owner's line as one sentence, whether or not it was written with a full stop. */
const sentence = (s: string) => `${s.replace(/[.\s]+$/, "")}.`;

const codLive = facts.paymentMethods.some((m) => /cash/i.test(m));
const returns = facts.returnsPolicy && facts.returnsWindow ? sentence(`${facts.returnsPolicy}, within ${facts.returnsWindow}`) : null;

const finder: FaqLink = { label: "Take the scent finder", href: "/finder" };
const box: FaqLink = { label: "The mystery box", href: "/products/mystery-box" };
const returnsHelp: FaqLink = { label: "Returns and exchanges", href: "/help#returns" };

/**
 * The questions a first order hangs on, answered from confirmed facts only,
 * with an honest answer while a fact is missing. Pass `samples` once 5 ml
 * variants exist: until then the way to try before a bottle is the mystery
 * box, whose three scents the house chooses, and the finder.
 */
export function faqEntries({ samples }: { samples: boolean }): FaqEntry[] {
  return [
    {
      id: "originals",
      q: "Is this the original?",
      a: "No. Every eternal scent is our own composition. Where one was inspired by a fragrance you may know, its page names the original so you know what to expect. We are not affiliated with the houses behind the originals.",
    },
    {
      id: "longevity",
      q: "How long does it last?",
      a: [
        "Every scent is an eau de parfum.",
        facts.longevityClaim && sentence(facts.longevityClaim),
        `How long it lasts ${facts.longevityClaim ? "also " : ""}depends on your skin, the weather and how much you spray, so the surest test is your own skin.`,
        samples ? "Try the 5 ml before the bottle." : "The mystery box lets you wear three scents before you choose a bottle.",
      ]
        .filter(Boolean)
        .join(" "),
      links: samples ? undefined : [box],
    },
    {
      id: "cod",
      q: "How does cash on delivery work?",
      a: [
        codLive ? "Choose cash on delivery at checkout and pay the courier in cash when your order arrives." : "The ways to pay for your order are shown at checkout.",
        codLive && facts.codLine ? sentence(facts.codLine) : "Everything you pay, including delivery, is shown at checkout before you place the order.",
        facts.deliveryIncluded !== true && facts.freeDeliveryOver && `Delivery is free on orders over ${facts.freeDeliveryOver}.`,
        facts.deliveryTime && sentence(`Delivery: ${facts.deliveryTime}`),
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      id: "wrong",
      q: "What if I don’t like it?",
      a: [
        samples
          ? ["Try it in 5 ml before you buy the bottle.", facts.sampleCredit && sentence(facts.sampleCredit), "Not sure which to try? The scent finder narrows the house to three matches in five questions."]
          : ["Start small. The mystery box holds three 5 ml scents chosen by the house, so you can wear eternal before you choose a bottle. The scent finder narrows the house to three matches in five questions."],
        // These answers also show on /help itself, so they point to the section by name, not to "our help page".
        returns ?? "If a bottle you ordered isn’t right, see Returns and exchanges.",
      ]
        .flat()
        .filter(Boolean)
        .join(" "),
      links: samples ? [finder, ...(returns ? [] : [returnsHelp])] : [box, finder, ...(returns ? [] : [returnsHelp])],
    },
    {
      id: "returns",
      q: "Can I return a bottle?",
      a: returns ? `${returns} The details, and how to start one, are under Returns and exchanges.` : "Returns and exchanges follow our refund policy. The details, and how to start one, are under Returns and exchanges.",
      links: [returnsHelp],
    },
    {
      id: "choose",
      q: "How do I choose?",
      a: "If you know a fragrance you love, search for it by name: if one of ours was inspired by it, it shows first. If not, the scent finder asks five questions and gives you three matches. Each line is made for someone: eterna for her, eterno for him, eternal unisex.",
      links: [finder, { label: "Search the scents", href: "/shop" }],
    },
  ];
}

/** The answers while no scent has a 5 ml variant. */
export const faq = faqEntries({ samples: false });
