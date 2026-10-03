import { site } from "@/content/site";

/**
 * The placeholder gate. Facts the owner has not confirmed are written in
 * [square brackets] in content/site.ts; a bracketed or empty value is not a
 * fact, so it renders nothing. Components read facts from here, never the
 * raw strings, and hide the element that needs a fact until it is real.
 * /launch-checklist lists everything still waiting.
 */
const BRACKET = /\[[^\]]*\]/;

export const isConfirmed = (v: unknown): v is string => typeof v === "string" && v.trim() !== "" && !BRACKET.test(v);
export const confirmed = (v: string | null | undefined): string | null => (isConfirmed(v) ? v.trim() : null);

/** Confirmed facts, or null. */
export const facts = {
  announcement: confirmed(site.announcement),
  /** e.g. "1–2 days in Cairo & Giza, 2–4 days elsewhere". */
  deliveryTime: confirmed(site.deliveryTime),
  returnsPolicy: confirmed(site.returnsPolicy),
  returnsWindow: confirmed(site.returnsWindow),
  longevityClaim: confirmed(site.longevityClaim),
  firstOrderOffer: confirmed(site.firstOrderOffer),
  codFee: confirmed(site.codFee),
  freeSamples: confirmed(site.freeSamples),
  sampleCredit: confirmed(site.sampleCredit),
  freeShippingThreshold: site.freeShippingThreshold,
  deliveryIncluded: site.deliveryIncluded,
  whatsapp: site.whatsapp,
  paymentMethods: site.paymentMethods.filter(isConfirmed),
} as const;

export type PendingFact = { key: string; value: string; note: string };

const NOTES: Record<string, string> = {
  announcement: "The one offer in the bar above the header, matched to the ads.",
  deliveryTime: "Delivery days by zone, from the courier.",
  returnsPolicy: "One line, e.g. \"Free returns on sealed bottles\".",
  returnsWindow: "e.g. \"14 days\" (at least the legal minimum).",
  longevityClaim: "From a wear test, e.g. \"7–8 hours on skin\".",
  firstOrderOffer: "Shown in the newsletter band; null hides it.",
  codFee: "The cash-on-delivery fee, or \"No fee for cash on delivery\".",
  freeSamples: "e.g. \"Two free 5 ml samples with every bottle\".",
  sampleCredit: "e.g. \"Its price comes off your 55 ml within 60 days\".",
  paymentMethods: "Only the methods that are live at checkout.",
};

/** Every site fact still in brackets, for /launch-checklist and the build check. */
export function pendingFacts(): PendingFact[] {
  const out: PendingFact[] = [];
  for (const [key, value] of Object.entries(site)) {
    if (typeof value === "string" && BRACKET.test(value)) out.push({ key, value, note: NOTES[key] ?? "" });
    if (Array.isArray(value)) for (const v of value) if (typeof v === "string" && BRACKET.test(v)) out.push({ key, value: v, note: NOTES[key] ?? "" });
  }
  if (site.whatsapp === null) out.push({ key: "whatsapp", value: "null", note: "The WhatsApp number, international format without +. Every WhatsApp button stays hidden until it is set." });
  return out;
}
