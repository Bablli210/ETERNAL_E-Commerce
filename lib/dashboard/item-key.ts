/** Shopify's checkout names items "Divina - 55 ml" where the shop says "Divina": both count as Divina, in any case. */
export const itemKey = (name: string) => name.replace(/\s+[-–—]\s+.*$/, "").trim().toLowerCase();
