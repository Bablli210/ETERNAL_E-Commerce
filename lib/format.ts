import type { Money } from "./shopify/types";

const fmt = new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 });

/**
 * "EGP 1,050" — Western numerals, tabular in the UI, no decimals for whole
 * amounts. A no-break space joins the code and the amount, so a narrow line
 * never leaves "EGP" at its end and "1,050" on the next.
 */
export function formatMoney(money: Money | { amount: number | string; currencyCode?: string }): string {
  const amount = typeof money.amount === "string" ? parseFloat(money.amount) : money.amount;
  const code = money.currencyCode ?? "EGP";
  const whole = Number.isInteger(amount) ? fmt.format(amount) : new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  return `${code} ${whole}`;
}

/** A variant's size as the page writes it: Shopify's "3 x 5 ml" reads "3 × 5 ml". */
export const sizeLabel = (label: string) => label.replace(/(\d)\s*[x×]\s*(\d)/gi, "$1 × $2");

export const numericId = (gid: string) => gid.split("/").pop() ?? gid;

export const joinNotes = (notes: string[]) => notes.filter(Boolean).join(", ");

export function sentenceCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
