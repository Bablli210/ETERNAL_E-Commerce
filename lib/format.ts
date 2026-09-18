import type { Money } from "./shopify/types";

const fmt = new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 });

/** "EGP 1,050" — Western numerals, tabular in the UI, no decimals for whole amounts. */
export function formatMoney(money: Money | { amount: number | string; currencyCode?: string }): string {
  const amount = typeof money.amount === "string" ? parseFloat(money.amount) : money.amount;
  const code = money.currencyCode ?? "EGP";
  const whole = Number.isInteger(amount) ? fmt.format(amount) : new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  return `${code} ${whole}`;
}

export const numericId = (gid: string) => gid.split("/").pop() ?? gid;

export const joinNotes = (notes: string[]) => notes.filter(Boolean).join(", ");

export function sentenceCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
